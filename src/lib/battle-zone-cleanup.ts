import mongoose from 'mongoose';
import BattleMatch from '@/models/BattleMatch';
import User from '@/models/User';
import Transaction from '@/models/Transaction';
import Notification from '@/models/Notification';
import Escrow from '@/models/Escrow';
import { sendPushNotification } from '@/lib/webpush';

let lastCleanupRun = 0;

export async function runExpiredMatchesCleanup() {
    const nowTime = Date.now();
    if (nowTime - lastCleanupRun < 60000) {
        return 0;
    }
    lastCleanupRun = nowTime;
    
    const now = new Date();
    
    // Find expired open matches
    const expiredMatches = await BattleMatch.find({
        status: 'open',
        expiresAt: { $lt: now }
    });

    if (expiredMatches.length === 0) return 0;

    console.log(`[CLEANUP] Found ${expiredMatches.length} expired matches. Starting atomic refunds...`);

    let processedCount = 0;

    for (const match of expiredMatches) {
        const dbSession = await mongoose.startSession();
        dbSession.startTransaction();
        try {
            // 1. Mark match as cancelled
            match.status = 'cancelled';
            await match.save({ session: dbSession });

            const hostId = match.createdBy?.toString();
            if (hostId && match.entryFee > 0) {
                const host = await User.findById(hostId).session(dbSession);
                if (host) {
                    // 2. Refund host balance
                    host.walletBalance += match.entryFee;
                    await host.save({ session: dbSession });

                    // 3. Record refund transaction
                    await Transaction.create([{
                        user: hostId,
                        amount: match.entryFee,
                        type: 'refund',
                        description: `Auto-Refund for expired match: ${match.title}`,
                        status: 'completed',
                        referenceId: match._id
                    }], { session: dbSession });

                    // 4. Create Notification
                    await Notification.create([{
                        userId: hostId,
                        title: '❌ Match Cancelled',
                        message: `Match Cancelled. Your entry fee of ${match.entryFee} coins has been refunded to your wallet.`,
                        type: 'error',
                        link: `/battle-zone/${match._id}`
                    }], { session: dbSession });
                    
                    // 5. Update Escrow status
                    const escrow = await Escrow.findOne({ matchId: match._id }).session(dbSession);
                    if (escrow) {
                        escrow.status = 'refunded';
                        await escrow.save({ session: dbSession });
                    }

                    await dbSession.commitTransaction();

                    // 6. Push Notification (outside transaction)
                    sendPushNotification(hostId, {
                        title: '⌛ Match Expired',
                        body: `Your match "${match.title}" expired. ${match.entryFee} coins have been refunded.`,
                        url: `/battle-zone/${match._id}`
                    }).catch(err => console.error('[CLEANUP] Push notify failed:', err));
                    
                    processedCount++;
                } else {
                    console.error(`[CLEANUP] Host ${hostId} not found for match ${match._id}`);
                    await dbSession.abortTransaction();
                }
            } else {
                // Free match
                await dbSession.commitTransaction();
                processedCount++;
            }
        } catch (err) {
            await dbSession.abortTransaction();
            console.error(`[CLEANUP ERROR] Match ${match._id}:`, err);
        } finally {
            dbSession.endSession();
        }
    }

    return processedCount;
}
