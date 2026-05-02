import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/db';
import BattleMatch from '@/models/BattleMatch';
import User from '@/models/User';
import Transaction from '@/models/Transaction';
import Notification from '@/models/Notification';
import Escrow from '@/models/Escrow';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { sendPushNotification } from '@/lib/webpush';
import mongoose from 'mongoose';

export async function POST(req: Request) {
    let dbSession: mongoose.ClientSession | null = null;
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

        dbSession = await mongoose.startSession();
        dbSession.startTransaction();

        // 1. Fetch Match WITHIN session for atomicity
        const match = await BattleMatch.findById(tournamentId).session(dbSession).select('+roomID +roomPassword');
        if (!match) {
            await dbSession.abortTransaction();
            return NextResponse.json({ success: false, error: 'Match not found' }, { status: 404 });
        }

        if (!['disputed', 'pending_verification', 'active'].includes(match.status)) {
            await dbSession.abortTransaction();
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

        // The prizePool already has the 10% platform fee deducted during creation
        const netPrize = match.prizePool;

        // Helper to update Trust Score within session
        const updateTrustScoreInternal = async (userId: string, change: number, reason: string, session: any) => {
            const user = await User.findById(userId).session(session);
            if (user) {
                const oldScore = user.trustScore || 100;
                user.trustScore = Math.max(0, Math.min(100, oldScore + change));
                await user.save({ session });

                await Notification.create([{
                    userId,
                    title: change > 0 ? 'Trust Score Increased' : 'Trust Score Decreased',
                    message: `${change > 0 ? '+' : ''}${change} Trust Score: ${reason}. Current: ${user.trustScore}%`,
                    type: change > 0 ? 'success' : 'error'
                }], { session });
            }
        };

        // ACTION: FORCE WIN
        if (action === 'force_win_host' || action === 'force_win_joiner') {
            const winnerId = action === 'force_win_host' ? hostId : joinerId;
            const loserId = action === 'force_win_host' ? joinerId : hostId;
            const winnerLabel = action === 'force_win_host' ? 'Host' : 'Joiner';

            if (!winnerId) {
                await dbSession.abortTransaction();
                return NextResponse.json({ success: false, error: `${winnerLabel} not identified` }, { status: 400 });
            }

            // A) Update Match
            match.winners = { rank1: winnerId };
            match.status = 'completed';
            match.verificationStatus = 'Confirmed';
            match.adminNote = adminNote || `Admin force-resolved: ${winnerLabel} wins.`;
            match.resolutionComment = adminNote || `Admin declared ${winnerLabel} as the winner.`;
            match.resolvedAt = new Date();
            await match.save({ session: dbSession });

            // B) Pay Winner
            const winner = await User.findById(winnerId).session(dbSession);
            if (winner) {
                winner.walletBalance += netPrize;
                winner.totalWins = (winner.totalWins || 0) + 1;
                winner.netEarnings = (winner.netEarnings || 0) + netPrize;
                winner.battleZoneWins = (winner.battleZoneWins || 0) + 1;
                winner.battleZoneEarnings = (winner.battleZoneEarnings || 0) + netPrize;
                await winner.save({ session: dbSession });

                await Transaction.create([{
                    user: winnerId,
                    amount: netPrize,
                    type: 'prize_winnings',
                    description: `Admin Resolved: ${match.title} (${winnerLabel} wins)`,
                    status: 'completed',
                    referenceId: match._id
                }], { session: dbSession });
            }

            // C) Update Trust Scores
            await updateTrustScoreInternal(winnerId, 5, 'Won an admin-resolved dispute', dbSession);
            if (loserId) {
                await updateTrustScoreInternal(loserId, -15, 'Lost an admin-resolved dispute (Penalty)', dbSession);
            }

            // D) Update Escrow Record
            const escrow = await Escrow.findOne({ matchId: tournamentId }).session(dbSession);
            if (escrow) {
                escrow.status = 'released';
                escrow.releasedTo = winnerId;
                escrow.releasedAt = new Date();
                await escrow.save({ session: dbSession });
            }

            await dbSession.commitTransaction();

            // ── TRIGGER PUSH NOTIFICATIONS ──
            try {
                const players = [hostId, joinerId].filter(Boolean);
                const winnerName = winner?.inGameName || winner?.name || winnerLabel;

                await Promise.all(players.map(pId => 
                    sendPushNotification(pId!.toString(), {
                        title: '🏁 Match Resolved by Admin',
                        body: `Final Result: ${winnerName} won "${match.title}". Reason: ${match.resolutionComment}`,
                        url: `/battle-zone/${match._id}`
                    }).catch(console.error)
                ));
            } catch (notifyErr) {
                console.error('[AdminResolveNotify] Failed:', notifyErr);
            }

            return NextResponse.json({ success: true, message: `${winnerLabel} declared winner.` });
        }

        // ACTION: CANCEL & REFUND
        if (action === 'cancel_refund_both') {
            const entryFee = match.entryFee || 0;

            match.status = 'cancelled';
            match.adminNote = adminNote || 'Admin cancelled: full refund issued.';
            match.resolutionComment = adminNote || 'Admin cancelled the match and issued full refunds.';
            match.resolvedAt = new Date();
            await match.save({ session: dbSession });

            const refundIds: string[] = [];
            if (hostId) refundIds.push(hostId);
            if (joinerId) refundIds.push(joinerId);

            await Promise.all(refundIds.map(async (uid) => {
                const user = await User.findById(uid).session(dbSession);
                if (user && entryFee > 0) {
                    user.walletBalance += entryFee;
                    await user.save({ session: dbSession });

                    await Transaction.create([{
                        user: uid,
                        amount: entryFee,
                        type: 'refund',
                        description: `Admin Cancelled: ${match.title}`,
                        status: 'completed',
                        referenceId: match._id
                    }], { session: dbSession });
                }
            }));

            const escrow = await Escrow.findOne({ matchId: tournamentId }).session(dbSession);
            if (escrow) {
                escrow.status = 'refunded';
                await escrow.save({ session: dbSession });
            }

            await dbSession.commitTransaction();

            // ── TRIGGER PUSH NOTIFICATIONS ──
            try {
                const players = [hostId, joinerId].filter(Boolean);
                await Promise.all(players.map(pId => 
                    sendPushNotification(pId!.toString(), {
                        title: '❌ Match Cancelled by Admin',
                        body: `Match "${match.title}" was cancelled and entry fees refunded.`,
                        url: `/battle-zone/${match._id}`
                    }).catch(console.error)
                ));
            } catch (notifyErr) {
                console.error('[AdminCancelNotify] Failed:', notifyErr);
            }

            return NextResponse.json({ success: true, message: `Match cancelled and refunded.` });
        }

        await dbSession.abortTransaction();
        return NextResponse.json({ success: false, error: 'Invalid action.' }, { status: 400 });

    } catch (error: any) {
        if (dbSession) await dbSession.abortTransaction();
        console.error('Admin resolve error:', error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    } finally {
        if (dbSession) dbSession.endSession();
    }
}
