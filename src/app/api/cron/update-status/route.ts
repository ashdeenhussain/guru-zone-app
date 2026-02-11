import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/db';
import Tournament from '@/models/Tournament';
import Transaction from '@/models/Transaction';
import Notification from '@/models/Notification';

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
                            link: `/dashboard/tournaments/${tournament._id}`,
                        });
                        return notification.save();
                    });

                    await Promise.all(notificationPromises);

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
