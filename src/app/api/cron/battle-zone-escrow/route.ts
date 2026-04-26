import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/db';
import Tournament from '@/models/Tournament';
import User from '@/models/User';
import Transaction from '@/models/Transaction';
import Notification from '@/models/Notification';
import { sendPushNotification } from '@/lib/webpush';

export async function GET(req: Request) {
    try {
        await connectToDatabase();

        // 30 minutes threshold
        const thirtyMinutesAgo = new Date(Date.now() - 30 * 60 * 1000);

        // Find tournaments in pending_verification for more than 30 minutes
        const pendingTournaments = await Tournament.find({
            status: 'pending_verification',
            verificationStartedAt: { $lte: thirtyMinutesAgo }
        });

        const results = [];

        for (const tournament of pendingTournaments) {
            const declaredWinnerId = tournament.winners?.rank1;
            
            if (!declaredWinnerId) {
                console.warn(`[CRON] Tournament ${tournament._id} has no winner declared. Marking as disputed for manual review.`);
                tournament.status = 'disputed';
                tournament.disputeReason = 'Auto-resolve failed: No winner declared by host.';
                await tournament.save();
                continue;
            }

            try {
                // Process Payout (Exactly mirroring result route logic)
                const winnerIdStr = declaredWinnerId._id?.toString() || declaredWinnerId.toString();
                const winner = await User.findById(winnerIdStr);
                
                if (winner) {
                    const grossPrize = tournament.prizeDistribution?.first || tournament.prizePool;
                    const PLATFORM_FEE_PCT = 0.10; // 10% platform rake
                    const platformFee = Math.floor(grossPrize * PLATFORM_FEE_PCT);
                    const netPrize = grossPrize - platformFee;

                    // Create Transaction
                    await Transaction.create({
                        user: winnerIdStr,
                        amount: netPrize,
                        type: 'prize_winnings',
                        description: `Won Battle Zone (Auto-Resolved): ${tournament.title} (10% platform fee applied)`,
                        status: 'completed',
                        referenceId: tournament._id
                    });

                    // Update Winner Balance
                    winner.walletBalance += netPrize;
                    winner.totalWins = (winner.totalWins || 0) + 1;
                    winner.netEarnings = (winner.netEarnings || 0) + netPrize;
                    await winner.save();

                    // Notify Winner
                    await Notification.create({
                        userId: winnerIdStr,
                        title: 'Match Auto-Resolved',
                        message: `Your win in "${tournament.title}" has been auto-confirmed. ${netPrize} coins added to wallet.`,
                        type: 'success'
                    });

                    // Update Tournament
                    tournament.status = 'Completed';
                    tournament.verificationStatus = 'Confirmed';
                    await tournament.save();

                    // ── Push Notification (To Winner) ──
                    await sendPushNotification(winnerIdStr, {
                        title: '⚡ Match Auto-Resolved',
                        body: `Your win in "${tournament.title}" was auto-confirmed after 30 mins. ${netPrize} coins added.`,
                        url: tournament.isOfficial ? `/tournaments/${tournament._id}` : `/battle-zone/${tournament._id}`
                    });

                    // ── Push Notification (To Opponents who didn't respond) ──
                    try {
                        const opponentIds = tournament.participants
                            .map((p: any) => p.userId?._id?.toString() || p.userId?.toString())
                            .filter((pId: string) => pId && pId !== winnerIdStr);

                        await Promise.all(opponentIds.map((pId: string) => 
                            sendPushNotification(pId, {
                                title: '⚡ Match Auto-Resolved',
                                body: `The result for "${tournament.title}" was auto-confirmed as you did not respond within 30 minutes.`,
                                url: tournament.isOfficial ? `/tournaments/${tournament._id}` : `/battle-zone/${tournament._id}`
                            })
                        ));

                        // ── 🛑 PENALTY: Joiner AFK after loss (-10) ──
                        await Promise.all(opponentIds.map(async (pId: string) => {
                            try {
                                const joiner = await User.findById(pId);
                                if (joiner) {
                                    joiner.trustScore = Math.max(0, (joiner.trustScore || 100) - 10);
                                    await joiner.save();

                                    await Notification.create({
                                        userId: pId,
                                        title: '🛑 Trust Score Penalty',
                                        message: `Match auto-confirmed for "${tournament.title}" due to your inactivity. -10 Trust Score penalty.`,
                                        type: 'error'
                                    });
                                }
                            } catch (pErr) {
                                console.error('[CRON] Trust score update failed for joiner:', pId, pErr);
                            }
                        }));
                    } catch (pErr) {
                        console.error('[CRON] Auto-payout push/penalty for opponents failed:', pErr);
                    }

                    results.push({ id: tournament._id, status: 'auto-payout-success', winner: winnerIdStr });
                    console.log(`[CRON] Auto-payout completed for Tournament ${tournament._id}`);
                } else {
                    throw new Error(`Winner user ${winnerIdStr} not found`);
                }

            } catch (err: any) {
                console.error(`[CRON ERROR] Failed to auto-resolve ${tournament._id}:`, err);
                results.push({ id: tournament._id, status: 'error', error: err.message });
            }
        }

        return NextResponse.json({ 
            success: true, 
            processedCount: results.length, 
            details: results 
        });

    } catch (error: any) {
        console.error("[CRON CRITICAL ERROR]:", error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
