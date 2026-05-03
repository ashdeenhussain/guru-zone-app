import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/db';
import Tournament from '@/models/Tournament';
import BattleMatch from '@/models/BattleMatch';
import User from '@/models/User';
import Transaction from '@/models/Transaction';
import Notification from '@/models/Notification';
import Escrow from '@/models/Escrow';
import { sendPushNotification } from '@/lib/webpush';
import mongoose from 'mongoose';
import { runExpiredMatchesCleanup } from '@/lib/battle-zone-cleanup';

export async function GET(req: Request) {
    try {
        await connectToDatabase();

        // 30 minutes threshold
        const thirtyMinutesAgo = new Date(Date.now() - 30 * 60 * 1000);

        // Find tournaments and battle matches in pending_verification for more than 30 minutes
        const [pendingTournaments, pendingBattleMatches] = await Promise.all([
            Tournament.find({
                status: 'pending_verification',
                verificationStartedAt: { $lte: thirtyMinutesAgo }
            }),
            BattleMatch.find({
                status: 'pending_verification',
                verificationStartedAt: { $lte: thirtyMinutesAgo }
            })
        ]);

        const allMatches = [...pendingTournaments, ...pendingBattleMatches];
        const results = [];

        for (const match of allMatches) {
            const declaredWinnerId = (match as any).winners?.rank1;
            
            if (!declaredWinnerId) {
                console.warn(`[CRON] Match ${match._id} has no winner declared. Marking as disputed for manual review.`);
                match.status = 'disputed';
                (match as any).disputeReason = 'Auto-resolve failed: No winner declared by host.';
                await match.save();
                continue;
            }

            try {
                // Process Payout (Exactly mirroring result route logic)
                const winnerIdStr = declaredWinnerId._id?.toString() || declaredWinnerId.toString();
                const winner = await User.findById(winnerIdStr);
                
                if (winner) {
                    const grossPrize = (match as any).prizeDistribution?.first || match.prizePool;
                    const PLATFORM_FEE_PCT = 0.10; // 10% platform rake
                    const platformFee = Math.floor(grossPrize * PLATFORM_FEE_PCT);
                    const netPrize = grossPrize - platformFee;

                    // Create Transaction
                    await Transaction.create({
                        user: winnerIdStr,
                        amount: netPrize,
                        type: 'prize_winnings',
                        description: `Won Battle Zone (Auto-Resolved): ${match.title} (10% platform fee applied)`,
                        status: 'completed',
                        referenceId: match._id
                    });

                    // Update Winner Balance
                    winner.walletBalance += netPrize;
                    winner.totalWins = (winner.totalWins || 0) + 1;
                    winner.netEarnings = (winner.netEarnings || 0) + netPrize;
                    winner.battleZoneWins = (winner.battleZoneWins || 0) + 1;
                    winner.battleZoneEarnings = (winner.battleZoneEarnings || 0) + netPrize;
                    winner.trustScore = Math.min(100, (winner.trustScore || 100) + 2);
                    await winner.save();

                    // Notify Winner
                    await Notification.create({
                        userId: winnerIdStr,
                        title: 'Match Auto-Resolved',
                        message: `Your win in "${match.title}" has been auto-confirmed. ${netPrize} coins added to wallet.`,
                        type: 'success'
                    });

                    // Update Match
                    match.status = 'Completed';
                    match.verificationStatus = 'Confirmed';
                    await match.save();

                    // ── Push Notification (To Winner) ──
                    await sendPushNotification(winnerIdStr, {
                        title: '⚡ Match Auto-Resolved',
                        body: `Your win in "${match.title}" was auto-confirmed after 30 mins. ${netPrize} coins added.`,
                        url: (match as any).isOfficial ? `/tournaments/${match._id}` : `/battle-zone/${match._id}`
                    });

                    // ── Push Notification (To Opponents who didn't respond) ──
                    try {
                        const opponentIds = match.participants
                            .map((p: any) => p.userId?._id?.toString() || p.userId?.toString())
                            .filter((pId: string) => pId && pId !== winnerIdStr);

                        await Promise.all(opponentIds.map((pId: string) => 
                            sendPushNotification(pId, {
                                title: '⚡ Match Auto-Resolved',
                                body: `The result for "${match.title}" was auto-confirmed as you did not respond within 30 minutes.`,
                                url: (match as any).isOfficial ? `/tournaments/${match._id}` : `/battle-zone/${match._id}`
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
                                        message: `Match auto-confirmed for "${match.title}" due to your inactivity. -10 Trust Score penalty.`,
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

                    results.push({ id: match._id, status: 'auto-payout-success', winner: winnerIdStr });
                    console.log(`[CRON] Auto-payout completed for Match ${match._id}`);
                } else {
                    throw new Error(`Winner user ${winnerIdStr} not found`);
                }

            } catch (err: any) {
                console.error(`[CRON ERROR] Failed to auto-resolve ${match._id}:`, err);
                results.push({ id: match._id, status: 'error', error: err.message });
            }
        }

        // --- HOST AFK CHECK FOR ACTIVE MATCHES (15 MINS NO ROOM ID) ---
        const fifteenMinutesAgo = new Date(Date.now() - 15 * 60 * 1000);
        const afkMatches = await BattleMatch.find({
            status: 'active',
            activatedAt: { $lte: fifteenMinutesAgo },
            roomID: { $exists: false }
        });

        for (const match of afkMatches) {
            try {
                // 1. Cancel Match
                match.status = 'cancelled';
                await match.save();

                // 2. Refund All Participants
                for (const participant of match.participants) {
                    const userId = (participant.userId as any)?.toString();
                    if (!userId) continue;

                    const user = await User.findById(userId);
                    if (user) {
                        user.walletBalance += match.entryFee;
                        
                        // Penalty for Host
                        const isHost = userId === (match.createdBy as any)?.toString();
                        if (isHost) {
                            user.trustScore = Math.max(0, (user.trustScore || 100) - 10);
                            
                            await Notification.create({
                                userId,
                                title: '🛑 Host AFK Penalty',
                                message: `Match "${match.title}" cancelled because you didn't provide Room ID in time. -10 Trust Score.`,
                                type: 'error'
                            });
                        } else {
                            await Notification.create({
                                userId,
                                title: 'Match Cancelled',
                                message: `Match "${match.title}" cancelled (Host AFK). Entry fee refunded.`,
                                type: 'info'
                            });
                        }
                        
                        await user.save();

                        await Transaction.create({
                            user: userId,
                            amount: match.entryFee,
                            type: 'refund',
                            description: `Refund (Host AFK): ${match.title}`,
                            status: 'completed',
                            referenceId: match._id
                        });
                    }
                }

                // 3. Update Escrow
                const escrow = await Escrow.findOne({ matchId: match._id });
                if (escrow) {
                    escrow.status = 'refunded';
                    await escrow.save();
                }

                results.push({ id: match._id, status: 'host-afk-cancelled' });
                console.log(`[CRON] Host AFK cancellation for Match ${match._id}`);
            } catch (err: any) {
                console.error(`[CRON ERROR] Failed to handle host AFK for ${match._id}:`, err);
            }
        }

        // --- EXPIRY CHECK FOR OPEN MATCHES ---
        const processedExpired = await runExpiredMatchesCleanup();

        return NextResponse.json({ 
            success: true, 
            processedCount: results.length + processedExpired, 
            details: results 
        });

    } catch (error: any) {
        console.error("[CRON CRITICAL ERROR]:", error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
