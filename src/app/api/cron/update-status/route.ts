import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/db';
import Tournament from '@/models/Tournament';
import Transaction from '@/models/Transaction';
import Notification from '@/models/Notification';
import User from '@/models/User';
import { sendPushNotification } from '@/lib/webpush';

export const dynamic = 'force-dynamic';

/**
 * Cron Job Endpoint - Handles:
 * 1. Tournament Auto-Start (Open -> Live)
 * 2. Unlocking Room IDs (15 mins before start)
 * 3. Stuck Transaction Cleanup (30 mins timeout)
 * 4. Battle Zone AFK Penalty (No Room ID within 20 mins)
 */
export async function GET(req: Request) {
    try {
        // Security Check
        const authHeader = req.headers.get('authorization');
        const cronSecret = process.env.CRON_SECRET;

        if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        await connectToDatabase();

        const results = {
            autoStart: { processed: 0, errors: [] as string[] },
            cleanup: { processed: 0, errors: [] as string[] },
            afkPenalty: { processed: 0, errors: [] as string[] }
        };

        const now = new Date();

        // --- TASK 1: Auto-Start & Credentials Reveal ---
        try {
            const tournaments = await Tournament.find({
                status: 'Open',
                startTime: { $lte: new Date(now.getTime() + 15 * 60 * 1000) } // Check next 15 mins
            });

            for (const t of tournaments) {
                try {
                    // 1. Auto-Start (If time is reached)
                    if (t.startTime <= now && t.status === 'Open') {
                        t.status = 'Live';
                        await t.save();

                        // Notify participants
                        const notifyArr = t.participants.map((p: any) => {
                            const pId = p.userId?._id || p.userId;
                            return Notification.create({
                                userId: pId,
                                title: 'Match Started!',
                                message: `${t.title} has started! Join the room now.`,
                                type: 'info',
                                link: t.isOfficial ? `/tournaments/${t._id}` : `/battle-zone/${t._id}`
                            });
                        });
                        await Promise.all(notifyArr);

                        // Push Notifications
                        for (const p of t.participants) {
                            try {
                                const pId = p.userId?._id || p.userId;
                                await sendPushNotification(pId.toString(), {
                                    title: '🎮 Match Started!',
                                    body: `${t.title} has started! Join now.`,
                                    url: t.isOfficial ? `/tournaments/${t._id}` : `/battle-zone/${t._id}`
                                });
                            } catch (e) {}
                        }
                    }

                    // 2. Set Reveal time (15 mins before)
                    if (!t.autoReleaseTime) {
                        t.autoReleaseTime = new Date(t.startTime.getTime() - 15 * 60 * 1000);
                        await t.save();
                    }
                    results.autoStart.processed++;
                } catch (err: any) {
                    results.autoStart.errors.push(`${t._id}: ${err.message}`);
                }
            }
        } catch (e) { console.error("AutoStart Error:", e); }

        // --- TASK 2: Transaction Cleanup ---
        try {
            const timeoutThreshold = new Date(now.getTime() - 30 * 60 * 1000);
            const stuckTrxs = await Transaction.find({
                status: { $in: ['pending', 'Pending'] },
                createdAt: { $lt: timeoutThreshold },
                type: { $in: ['deposit', 'withdrawal'] }
            });

            for (const trx of stuckTrxs) {
                try {
                    trx.status = 'failed';
                    trx.rejectionReason = 'Timeout (30 mins)';
                    await trx.save();
                    results.cleanup.processed++;
                } catch (e) {}
            }
        } catch (e) {}

        // --- TASK 3: Battle Zone AFK Penalty ---
        try {
            const afkThreshold = new Date(now.getTime() - 20 * 60 * 1000);
            const afkTourneys = await Tournament.find({
                status: { $in: ['full', 'Full'] }, // Handle both just in case
                updatedAt: { $lt: afkThreshold },
                createdBy: { $ne: null }
            }).select('+roomID');

            for (const t of afkTourneys) {
                if (!t.roomID) {
                    // Refund Players
                    for (const p of t.participants) {
                        try {
                            const pId = p.userId?._id || p.userId;
                            const pUser = await User.findById(pId);
                            if (pUser) {
                                pUser.walletBalance += t.entryFee;
                                await pUser.save();
                                
                                await Transaction.create({
                                    user: pId,
                                    amount: t.entryFee,
                                    type: 'refund',
                                    description: `Refund (Host AFK): ${t.title}`,
                                    status: 'completed',
                                    referenceId: t._id
                                });
                            }
                        } catch (e) {}
                    }

                    // Penalize Host
                    const host = await User.findById(t.createdBy);
                    if (host) {
                        host.trustScore = Math.max(0, (host.trustScore || 100) - 10);
                        await host.save();
                        
                        await Notification.create({
                            userId: t.createdBy,
                            title: '🛑 Trust Score Penalty',
                            message: `Tournament "${t.title}" was cancelled (No Room ID). -10 trust score.`,
                            type: 'error'
                        });
                    }

                    t.status = 'Cancelled';
                    t.cancellationReason = 'Host AFK (No Room ID provided within 20 minutes)';
                    await t.save();
                    results.afkPenalty.processed++;
                }
            }
        } catch (e) {}

        return NextResponse.json({ success: true, results });
    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
