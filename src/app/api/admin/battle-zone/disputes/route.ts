import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/db';
import BattleMatch from '@/models/BattleMatch';
import User from '@/models/User';
import Transaction from '@/models/Transaction';
import Notification from '@/models/Notification';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { sendPushNotification } from '@/lib/webpush';

// GET: Fetch all disputed tournaments
export async function GET() {
    try {
        const session = await getServerSession(authOptions);
        if (!session || (session.user as any).role !== 'admin') {
            return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
        }

        await connectToDatabase();
        const disputes = await BattleMatch.find({ status: 'disputed' })
            .populate({
                path: 'createdBy',
                select: 'username name'
            })
            .populate({
                path: 'winners.rank1',
                select: 'username name inGameName freeFireUid'
            })
            .populate({
                path: 'participants.userId',
                select: 'username name inGameName freeFireUid'
            })
            .sort({ updatedAt: -1 });

        return NextResponse.json({ success: true, data: disputes });
    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}

// POST: Resolve a dispute
export async function POST(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || (session.user as any).role !== 'admin') {
            return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
        }

        const { tournamentId, action } = await req.json();
        
        await connectToDatabase();
        const tournament = await BattleMatch.findById(tournamentId);

        if (!tournament) return NextResponse.json({ success: false, error: 'Tournament not found' }, { status: 404 });
        if (tournament.status !== 'disputed') {
            return NextResponse.json({ success: false, error: 'Tournament is not in disputed state' }, { status: 400 });
        }

        if (action === 'force_win_host') {
            const declaredWinnerId = tournament.winners?.rank1;
            if (!declaredWinnerId) {
                return NextResponse.json({ success: false, error: 'No winner declared to award prize' }, { status: 400 });
            }

            const winnerIdStr = declaredWinnerId._id?.toString() || declaredWinnerId.toString();
            const winner = await User.findById(winnerIdStr);
            
            if (winner) {
                const grossPrize = tournament.prizePool;
                const PLATFORM_FEE_PCT = 0.10;
                const platformFee = Math.floor(grossPrize * PLATFORM_FEE_PCT);
                const netPrize = grossPrize - platformFee;

                await Transaction.create({
                    user: winnerIdStr,
                    amount: netPrize,
                    type: 'prize_winnings',
                    description: `Won Battle Zone (Admin Resolved): ${tournament.title}`,
                    status: 'completed',
                    referenceId: tournament._id
                });

                winner.walletBalance += netPrize;
                winner.totalWins = (winner.totalWins || 0) + 1;
                winner.netEarnings = (winner.netEarnings || 0) + netPrize;
                winner.battleZoneWins = (winner.battleZoneWins || 0) + 1;
                winner.battleZoneEarnings = (winner.battleZoneEarnings || 0) + netPrize;
                await winner.save();

                await Notification.create({
                    userId: winnerIdStr,
                    title: 'Dispute Resolved - Victory',
                    message: `Admin has resolved the dispute in your favor for "${tournament.title}". ${netPrize} coins awarded.`,
                    type: 'success'
                });

                // ── Push (To Winner) ──
                await sendPushNotification(winnerIdStr, {
                    title: '✅ Dispute Resolved!',
                    body: `Admin resolved the dispute for "${tournament.title}" in your favor. ${netPrize} coins awarded.`,
                    url: tournament.isOfficial ? `/tournaments/${tournament._id}` : `/battle-zone/${tournament._id}`
                });
                
                // Also update trust score for host (+5 for being right)
                const host = await User.findById(tournament.createdBy);
                if (host) {
                    host.trustScore = Math.min(100, (host.trustScore || 100) + 5);
                    await host.save();

                    // ── Push (To Host) ──
                    await sendPushNotification(tournament.createdBy.toString(), {
                        title: '📈 Trust Score Increased',
                        body: `Your trust score increased to ${host.trustScore}% for a valid result in "${tournament.title}".`,
                    });
                }

                // --- 🛑 PENALTY: Lying Joiner (-10) ---
                const lyingJoinerId = tournament.participants.find((p: any) => 
                    (p.userId._id || p.userId).toString() !== winnerIdStr
                )?.userId;

                if (lyingJoinerId) {
                    const joiner = await User.findById(lyingJoinerId);
                    if (joiner) {
                        joiner.trustScore = Math.max(0, (joiner.trustScore || 100) - 10);
                        await joiner.save();

                        await Notification.create({
                            userId: lyingJoinerId as any,
                            title: '🛑 Trust Score Penalty',
                            message: `Admin determined your dispute for "${tournament.title}" was invalid. -10 Trust Score penalty.`,
                            type: 'error'
                        });

                        await sendPushNotification(lyingJoinerId.toString(), {
                            title: '🛑 Trust Score Penalty',
                            body: `Your trust score dropped to ${joiner.trustScore}% due to an invalid dispute in "${tournament.title}".`,
                        });
                    }
                }
            }

            tournament.status = 'completed';
            tournament.verificationStatus = 'Confirmed';
            await tournament.save();

            return NextResponse.json({ success: true, message: 'Prize awarded to Host\'s declared winner' });

        } else if (action === 'force_refund') {
            // Refund entry fees to all participants
            const participants = tournament.participants;
            const entryFee = tournament.entryFee;

            if (entryFee > 0) {
                for (const p of participants) {
                    const pId = p.userId?._id || p.userId;
                    const user = await User.findById(pId);
                    if (user) {
                        user.walletBalance += entryFee;
                        await user.save();

                        await Transaction.create({
                            user: pId as any,
                            amount: entryFee,
                            type: 'refund',
                            description: `Refund for Battle Zone (Admin Resolved): ${tournament.title}`,
                            status: 'completed',
                            referenceId: tournament._id
                        });

                        await Notification.create({
                            userId: pId as any,
                            title: 'Tournament Refunded',
                            message: `The dispute for "${tournament.title}" was resolved with a refund. ${entryFee} coins returned to wallet.`,
                            type: 'info'
                        });

                        // ── Push (To Participant) ──
                        await sendPushNotification(pId.toString(), {
                            title: '🛑 Tournament Refunded',
                            body: `The dispute for "${tournament.title}" was resolved with a refund. ${entryFee} coins returned.`,
                        });
                    }
                }
            }

            // Lower trust score for host if they were wrong/disputed unfairly? 
            // Better to just mark as cancelled.
            const host = await User.findById(tournament.createdBy);
            if (host) {
                host.trustScore = Math.max(0, (host.trustScore || 100) - 10);
                await host.save();

                // ── Push (To Host Penalty) ──
                await sendPushNotification(tournament.createdBy.toString(), {
                    title: '🛑 Penalty Applied',
                    body: `You lost 10 Trust Score points due to a rule violation in "${tournament.title}".`,
                });
            }

            tournament.status = 'cancelled';
            tournament.verificationStatus = 'Rejected';
            await tournament.save();

            return NextResponse.json({ success: true, message: 'All participants refunded and match cancelled' });
        }

        return NextResponse.json({ success: false, error: 'Invalid action' }, { status: 400 });

    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
