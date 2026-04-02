import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/db';
import Tournament from '@/models/Tournament';
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
            return NextResponse.json({ success: false, error: 'Tournament ID required' }, { status: 400 });
        }

        // Fetch full tournament with all relevant fields
        const tournament = await Tournament.findById(tournamentId)
            .select('+roomID +roomPassword');

        if (!tournament) {
            return NextResponse.json({ success: false, error: 'Tournament not found' }, { status: 404 });
        }

        if (!['Disputed', 'Verifying'].includes(tournament.status)) {
            return NextResponse.json({
                success: false,
                error: `Match is not in a disputable state (current: ${tournament.status})`
            }, { status: 400 });
        }

        // Identify the two players
        const hostId = tournament.createdBy?.toString();
        const joinerParticipant = tournament.participants.find((p: any) => {
            const pId = (p.userId._id || p.userId).toString();
            return pId !== hostId;
        });
        const joinerId = joinerParticipant
            ? (joinerParticipant.userId._id || joinerParticipant.userId).toString()
            : null;

        const grossPrize = tournament.prizeDistribution?.first || tournament.prizePool;
        const platformFee = Math.floor(grossPrize * PLATFORM_FEE_PCT);
        const netPrize = grossPrize - platformFee;

        // --- Helper for Trust Score Updates ---
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

        // ── ACTION: FORCE WIN (Host OR Joiner) ────────────────────────────────────
        if (action === 'force_win_host' || action === 'force_win_joiner') {
            const winnerId = action === 'force_win_host' ? hostId : joinerId;
            const loserId = action === 'force_win_host' ? joinerId : hostId;
            const winnerLabel = action === 'force_win_host' ? 'Host' : 'Joiner';
            const loserLabel = action === 'force_win_host' ? 'Joiner' : 'Host';

            if (!winnerId) {
                return NextResponse.json({ success: false, error: `${winnerLabel} not identified in match` }, { status: 400 });
            }

            // --- Atomic-style: update tournament first, then users ---
            tournament.winners = { rank1: winnerId };
            tournament.status = 'Completed';
            tournament.verificationStatus = 'Confirmed';
            tournament.adminNote = adminNote || `Admin force-resolved: ${winnerLabel} wins.`;
            tournament.resolvedAt = new Date();
            await tournament.save();

            // Pay Winner
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
                    description: `Admin Resolved (${winnerLabel} wins): ${tournament.title} — gross: ${grossPrize}, 10% fee: ${platformFee}, net payout: ${netPrize}`,
                    status: 'completed',
                    referenceId: tournament._id
                });
            }

            // Trust Score Updates
            await updateTrustScore(winnerId, 5, 'Won an admin-resolved dispute');
            if (loserId) {
                await updateTrustScore(loserId, -10, 'Lost an admin-resolved dispute');
            }

            return NextResponse.json({
                success: true,
                message: `${winnerLabel} declared winner. Trust Scores updated (+5 winner, -10 loser).`
            });
        }

        // ── ACTION: CANCEL & REFUND BOTH (Draw / Invalid) ──────────────────────────
        if (action === 'cancel_refund_both') {
            const entryFee = tournament.entryFee || 0;

            tournament.status = 'Cancelled';
            tournament.verificationStatus = 'Rejected';
            tournament.adminNote = adminNote || 'Admin cancelled: full refund issued to both players.';
            tournament.resolvedAt = new Date();
            await tournament.save();

            const refundIds: string[] = [];
            if (hostId) refundIds.push(hostId);
            if (joinerId) refundIds.push(joinerId);

            // Refund each player their exact entry fee (no rake on cancellations)
            await Promise.all(refundIds.map(async (uid) => {
                const user = await User.findById(uid);
                if (user && entryFee > 0) {
                    user.walletBalance += entryFee;
                    await user.save();

                    await Transaction.create({
                        user: uid,
                        amount: entryFee,
                        type: 'refund',
                        description: `Admin Cancelled & Refunded: ${tournament.title} (Draw/Invalid — full refund, no fee)`,
                        status: 'completed',
                        referenceId: tournament._id
                    });

                    sendPushNotification(uid.toString(), {
                        title: 'Match Cancelled by Admin',
                        body: `The match "${tournament.title}" was cancelled by an admin. Your entry fee has been refunded.`,
                        url: '/dashboard'
                    }).catch(console.error);
                }
            }));

            return NextResponse.json({
                success: true,
                message: `Match cancelled. ${entryFee} coins refunded to each player (no fee on cancellations).`
            });
        }

        return NextResponse.json({ success: false, error: 'Invalid action. Use force_win_host, force_win_joiner, or cancel_refund_both.' }, { status: 400 });

    } catch (error: any) {
        console.error('Admin resolve error:', error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
