import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/db';
import Tournament from '@/models/Tournament';
import Transaction from '@/models/Transaction';
import Notification from '@/models/Notification';
import { sendPushNotification } from '@/lib/webpush';

/**
 * Cron Job Endpoint - Automated Task Scheduler
 * This endpoint is triggered every minute by Vercel Cron
 * Handles: Tournament Auto-Start, Transaction Cleanup
 */
export async function GET(req: Request) {
    try {
        // Verify cron secret for security
        const authHeader = req.headers.get('authorization');
        const cronSecret = process.env.CRON_SECRET;

        if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            );
        }

        await connectToDatabase();

        const results = {
            tournamentAutoStart: { success: 0, failed: 0, errors: [] as string[] },
            transactionCleanup: { success: 0, failed: 0, errors: [] as string[] },
        };

        const currentTime = new Date();

        // ===========================
        // TASK 1: Auto-Start Tournament
        // ===========================
        try {
            // Find all tournaments that should start
            const tournamentsToStart = await Tournament.find({
                status: 'Open',
                startTime: { $lte: currentTime },
            });

            for (const tournament of tournamentsToStart) {
                try {
                    // Update tournament status to Live
                    tournament.status = 'Live';
                    await tournament.save();

                    // Create notifications for all participants
                    const notificationPromises = tournament.participants.map((participant: any) => {
                        const notification = new Notification({
                            userId: participant.userId,
                            title: 'Match Started! Check Room ID.',
                            message: `${tournament.title} has started! Check the room credentials and join now.`,
                            type: 'info',
                            link: tournament.createdBy ? `/battle-zone/${tournament._id}` : `/tournaments/${tournament._id}`,
                        });
                        return notification.save();
                    });

                    await Promise.all(notificationPromises);

                    // ── Push Notification (To Participants) ──
                    try {
                        const pushPromises = tournament.participants.map((participant: any) => 
                            sendPushNotification((participant.userId._id || participant.userId).toString(), {
                                title: '🎮 Match Started!',
                                body: `${tournament.title} has started! Join the room now.`,
                                url: tournament.createdBy ? `/battle-zone/${tournament._id}` : `/tournaments/${tournament._id}`
                            })
                        );
                        await Promise.all(pushPromises);
                    } catch (pushErr) {
                        console.error('[Cron] Match start push notification failed:', pushErr);
                    }

                    results.tournamentAutoStart.success++;
                } catch (error: any) {
                    results.tournamentAutoStart.failed++;
                    results.tournamentAutoStart.errors.push(
                        `Tournament ${tournament._id}: ${error.message}`
                    );
                }
            }
        } catch (error: any) {
            results.tournamentAutoStart.errors.push(`Query error: ${error.message}`);
        }

        // ===========================
        // TASK 2: Auto-Reveal Credentials
        // ===========================
        try {
            // Find tournaments starting in the next 15 minutes that haven't had credentials revealed
            const fifteenMinutesFromNow = new Date(currentTime.getTime() + 15 * 60 * 1000);

            const tournamentsToReveal = await Tournament.find({
                status: 'Open',
                startTime: { $lte: fifteenMinutesFromNow },
                autoReleaseTime: { $exists: false }, // Only update if not already set
            });

            for (const tournament of tournamentsToReveal) {
                try {
                    // Set autoReleaseTime to 15 minutes before start
                    const releaseTime = new Date(tournament.startTime.getTime() - 15 * 60 * 1000);
                    tournament.autoReleaseTime = releaseTime;
                    await tournament.save();

                    results.tournamentAutoStart.success++; // Count as part of tournament management
                } catch (error: any) {
                    results.tournamentAutoStart.failed++;
                    results.tournamentAutoStart.errors.push(
                        `Credential reveal for ${tournament._id}: ${error.message}`
                    );
                }
            }
        } catch (error: any) {
            results.tournamentAutoStart.errors.push(`Credential reveal query error: ${error.message}`);
        }

        // ===========================
        // TASK 3: Transaction Cleanup (Stuck Payments)
        // ===========================
        try {
            // Find transactions pending for more than 30 minutes
            const thirtyMinutesAgo = new Date(currentTime.getTime() - 30 * 60 * 1000);

            const stuckTransactions = await Transaction.find({
                status: { $in: ['pending', 'Pending'] },
                createdAt: { $lt: thirtyMinutesAgo },
                type: { $in: ['deposit', 'withdrawal'] }, // Only cleanup deposits/withdrawals
            });

            for (const transaction of stuckTransactions) {
                try {
                    transaction.status = 'failed';
                    transaction.rejectionReason = 'Transaction timeout - no response after 30 minutes';
                    await transaction.save();

                    // Create notification for user
                    const notification = new Notification({
                        userId: transaction.user,
                        title: 'Transaction Failed',
                        message: `Your ${transaction.type} transaction of ₹${Math.abs(transaction.amount)} has failed due to timeout. Please try again.`,
                        type: 'error',
                        link: '/dashboard/finance',
                    });
                    await notification.save();

                    // ── Push Notification (To User) ──
                    try {
                        await sendPushNotification(transaction.user.toString(), {
                            title: '❌ Transaction Failed',
                            body: `Your ${transaction.type} of ₹${Math.abs(transaction.amount)} failed due to timeout.`,
                            url: '/dashboard/finance'
                        });
                    } catch (pushErr) {
                        console.error('[Cron] Transaction cleanup push notification failed:', pushErr);
                    }

                    results.transactionCleanup.success++;
                } catch (error: any) {
                    results.transactionCleanup.failed++;
                    results.transactionCleanup.errors.push(
                        `Transaction ${transaction._id}: ${error.message}`
                    );
                }
            }
        } catch (error: any) {
            results.transactionCleanup.errors.push(`Query error: ${error.message}`);
        }

        // ===========================
        // TASK 4: Battle Zone Host AFK Penalty (-10)
        // ===========================
        try {
            const twentyMinutesAgo = new Date(currentTime.getTime() - 20 * 60 * 1000);
            
            // Find community matches that are 'Full' for > 20 mins but have no roomID
            const afkTournaments = await Tournament.find({
                status: 'Full',
                updatedAt: { $lt: twentyMinutesAgo },
                createdBy: { $ne: null }
            }).select('+roomID');

            for (const tournament of afkTournaments) {
                if (!tournament.roomID) {
                    // Refund Joiners
                    if (tournament.entryFee > 0) {
                        for (const p of tournament.participants) {
                            const pId = p.userId?._id || p.userId;
                            const user = await User.findById(pId);
                            if (user) {
                                user.walletBalance += tournament.entryFee;
                                await user.save();
                                
                                await Transaction.create({
                                    user: pId,
                                    amount: tournament.entryFee,
                                    type: 'refund',
                                    description: `Refund (Host AFK): ${tournament.title}`,
                                    status: 'completed',
                                    referenceId: tournament._id
                                });
                            }
                        }
                    }

                    // Penalty for Host (-10)
                    const host = await User.findById(tournament.createdBy);
                    if (host) {
                        host.trustScore = Math.max(0, (host.trustScore || 100) - 10);
                        await host.save();

                        await Notification.create({
                            userId: tournament.createdBy,
                            title: '🛑 Trust Score Penalty (AFK)',
                            message: `Tournament "${tournament.title}" was cancelled because you failed to provide Room ID within 20 mins. -10 Trust Score penalty.`,
                            type: 'error'
                        });

                        try {
                            await sendPushNotification(tournament.createdBy.toString(), {
                                title: '🛑 Penalty: Match Cancelled',
                                body: `-10 Trust Score. You failed to provide Room IDs for "${tournament.title}" in time.`,
                            });
                        } catch (pErr) {}
                    }

                    // Cancel Tournament
                    tournament.status = 'Cancelled';
                    tournament.cancellationReason = 'Host AFK (No Room ID provided within 20 minutes)';
                    await tournament.save();
                }
            }
        } catch (error: any) {
            console.error('[CRON] Host AFK task failed:', error);
        }

        // ===========================
        // Return Results Summary
        // ===========================
        return NextResponse.json({
            success: true,
            timestamp: currentTime.toISOString(),
            results: {
                tournamentAutoStart: {
                    processed: results.tournamentAutoStart.success + results.tournamentAutoStart.failed,
                    successful: results.tournamentAutoStart.success,
                    failed: results.tournamentAutoStart.failed,
                    errors: results.tournamentAutoStart.errors,
                },
                transactionCleanup: {
                    processed: results.transactionCleanup.success + results.transactionCleanup.failed,
                    successful: results.transactionCleanup.success,
                    failed: results.transactionCleanup.failed,
                    errors: results.transactionCleanup.errors,
                },
            },
        });
    } catch (error: any) {
        console.error('Cron job error:', error);
        return NextResponse.json(
            {
                success: false,
                error: error.message || 'Internal server error',
            },
            { status: 500 }
        );
    }
}
