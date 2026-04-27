import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/db';
import BattleMatch from '@/models/BattleMatch';
import User from '@/models/User';
import Transaction from '@/models/Transaction';
import Notification from '@/models/Notification';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { sendPushNotification } from '@/lib/webpush';

const PLATFORM_FEE_PCT = 0.10; // 10% rake

export async function POST(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || (session.user as any).role !== 'admin') {
            return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
        }

        await connectToDatabase();
        const { tournamentId, action, adminNote } = await req.json();

        if (!tournamentId) {
            return NextResponse.json({ success: false, error: 'Match ID required' }, { status: 400 });
        }

        const match = await BattleMatch.findById(tournamentId)
            .select('+roomID +roomPassword');

        if (!match) {
            return NextResponse.json({ success: false, error: 'Match not found' }, { status: 404 });
        }

        if (!['disputed', 'pending_verification', 'active'].includes(match.status)) {
            return NextResponse.json({
                success: false,
                error: `Match is not in a resolvable state (current: ${match.status})`
            }, { status: 400 });
        }

        // Identify the two players
        const hostId = match.createdBy?.toString();
        const joinerParticipant = match.participants.find((p: any) => {
            const pId = (p.userId._id || p.userId).toString();
            return pId !== hostId;
        });
        const joinerId = joinerParticipant
            ? (joinerParticipant.userId._id || joinerParticipant.userId).toString()
            : null;

        const grossPrize = match.prizePool;
        const platformFee = Math.floor(grossPrize * PLATFORM_FEE_PCT);
        const netPrize = grossPrize - platformFee;

        // Trust Score Helper
        const updateTrustScore = async (userId: string, change: number, reason: string) => {
            const user = await User.findById(userId);
            if (user) {
                const oldScore = user.trustScore || 100;
                user.trustScore = Math.max(0, Math.min(100, oldScore + change));
                await user.save();

                await Notification.create({
                    userId,
                    title: change > 0 ? 'Trust Score Increased' : 'Trust Score Decreased',
                    message: `${change > 0 ? '+' : ''}${change} Trust Score: ${reason}. Current: ${user.trustScore}%`,
                    type: change > 0 ? 'success' : 'error'
                });

                sendPushNotification(userId.toString(), {
                    title: change > 0 ? 'Trust Score Increased' : 'Trust Score Decreased',
                    body: `${change > 0 ? '+' : ''}${change} Trust Score: ${reason}. Current: ${user.trustScore}%`,
                    url: '/dashboard'
                }).catch(console.error);
            }
        };

        // ACTION: FORCE WIN
        if (action === 'force_win_host' || action === 'force_win_joiner') {
            const winnerId = action === 'force_win_host' ? hostId : joinerId;
            const loserId = action === 'force_win_host' ? joinerId : hostId;
            const winnerLabel = action === 'force_win_host' ? 'Host' : 'Joiner';

            if (!winnerId) {
                return NextResponse.json({ success: false, error: `${winnerLabel} not identified` }, { status: 400 });
            }

            match.winners = { rank1: winnerId };
            match.status = 'completed';
            match.verificationStatus = 'Confirmed';
            match.adminNote = adminNote || `Admin force-resolved: ${winnerLabel} wins.`;
            match.resolvedAt = new Date();
            await match.save();

            const winner = await User.findById(winnerId);
            if (winner) {
                winner.walletBalance += netPrize;
                winner.totalWins = (winner.totalWins || 0) + 1;
                winner.netEarnings = (winner.netEarnings || 0) + netPrize;
                await winner.save();

                await Transaction.create({
                    user: winnerId,
                    amount: netPrize,
                    type: 'winning',
                    description: `Admin Resolved: ${match.title} (${winnerLabel} wins)`,
                    status: 'completed',
                    referenceId: match._id
                });
            }

            await updateTrustScore(winnerId, 5, 'Won an admin-resolved dispute');
            if (loserId) {
                await updateTrustScore(loserId, -10, 'Lost an admin-resolved dispute');
            }

            return NextResponse.json({ success: true, message: `${winnerLabel} declared winner.` });
        }

        // ACTION: CANCEL & REFUND
        if (action === 'cancel_refund_both') {
            const entryFee = match.entryFee || 0;

            match.status = 'cancelled';
            match.adminNote = adminNote || 'Admin cancelled: full refund issued.';
            match.resolvedAt = new Date();
            await match.save();

            const refundIds: string[] = [];
            if (hostId) refundIds.push(hostId);
            if (joinerId) refundIds.push(joinerId);

            await Promise.all(refundIds.map(async (uid) => {
                const user = await User.findById(uid);
                if (user && entryFee > 0) {
                    user.walletBalance += entryFee;
                    await user.save();

                    await Transaction.create({
                        user: uid,
                        amount: entryFee,
                        type: 'refund',
                        description: `Admin Cancelled: ${match.title}`,
                        status: 'completed',
                        referenceId: match._id
                    });
                }
            }));

            return NextResponse.json({ success: true, message: `Match cancelled and refunded.` });
        }

        return NextResponse.json({ success: false, error: 'Invalid action.' }, { status: 400 });

    } catch (error: any) {
        console.error('Admin resolve error:', error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
