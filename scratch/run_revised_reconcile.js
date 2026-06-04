const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../.env.local') });

const TransactionSchema = new mongoose.Schema({
    type: String,
    amount: Number,
    status: String,
    user: mongoose.Schema.Types.ObjectId,
    description: String,
    createdAt: Date,
    details: mongoose.Schema.Types.Mixed
}, { collection: 'transactions' });

const UserSchema = new mongoose.Schema({
    name: String,
    email: String,
    walletBalance: Number,
    walletStatus: { type: String, default: 'Synced' },
    suspiciousFlag: { type: Boolean, default: false },
    walletFlagReason: { type: String, default: '' },
    walletLedgerSum: { type: Number, default: 0 }
}, { collection: 'users' });

const Transaction = mongoose.models.Transaction || mongoose.model('Transaction', TransactionSchema);
const User = mongoose.models.User || mongoose.model('User', UserSchema);

async function run() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        const users = await User.find({ status: { $ne: 'banned' } });
        console.log(`Reconciling and saving flags for ${users.length} users...`);

        let mismatchCount = 0;
        let syncedCount = 0;

        for (const user of users) {
            const transactions = await Transaction.find({ user: user._id });
            
            let calculatedBalance = 0;
            transactions.forEach(trx => {
                const status = trx.status?.toLowerCase() || 'pending';
                const type = trx.type;
                const origAmt = trx.amount || 0;
                const amount = Math.abs(origAmt);

                // Revised rules:
                if (['rejected', 'failed', 'cancelled'].includes(status)) {
                    if (type !== 'shop_purchase') {
                        return;
                    }
                }
                if (type === 'deposit' && status === 'pending') {
                    return;
                }

                let diff = 0;
                switch (type) {
                    case 'deposit':
                    case 'prize_winnings':
                    case 'spin_win':
                    case 'daily_reward_spin':
                    case 'free_spin':
                    case 'refund':
                    case 'daily_free_coins':
                    case 'daily_collect':
                    case 'rank_reward':
                    case 'CREDIT':
                        diff = amount;
                        break;
                    case 'withdrawal':
                    case 'entry_fee':
                    case 'shop_purchase':
                    case 'DEBIT':
                        diff = -amount;
                        break;
                    case 'ADMIN_ADJUSTMENT':
                        if (trx.details?.adjustmentType === 'CREDIT') {
                            diff = amount;
                        } else if (trx.details?.adjustmentType === 'DEBIT') {
                            diff = -amount;
                        } else {
                            diff = origAmt; 
                        }
                        break;
                }
                calculatedBalance += diff;
            });

            // Suspicious Check
            const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
            const recentTxs = await Transaction.find({
                user: user._id,
                createdAt: { $gte: oneDayAgo },
                type: { $in: ['ADMIN_ADJUSTMENT', 'daily_free_coins'] }
            });

            const suspicious = recentTxs.length > 5;
            const currentBalance = user.walletBalance || 0;
            const mismatch = Math.abs(calculatedBalance - currentBalance) > 0.01;

            let walletStatus = 'Synced';
            let suspiciousFlag = false;
            const reasons = [];

            if (mismatch) {
                walletStatus = 'Mismatch';
                reasons.push(`Balance mismatch: calculated ${calculatedBalance} but wallet has ${currentBalance}`);
            }
            if (suspicious) {
                suspiciousFlag = true;
                reasons.push(`Suspicious activity: ${recentTxs.length} admin adjustments/daily free coins in 24 hours`);
                walletStatus = 'Mismatch';
            }

            user.walletStatus = walletStatus;
            user.suspiciousFlag = suspiciousFlag;
            user.walletFlagReason = reasons.join('; ');
            user.walletLedgerSum = calculatedBalance;
            await user.save();

            if (walletStatus === 'Mismatch') {
                mismatchCount++;
            } else {
                syncedCount++;
            }
        }

        console.log(`\nReconciliation save complete!`);
        console.log(`Total active users: ${users.length}`);
        console.log(`Synced: ${syncedCount}`);
        console.log(`Mismatched: ${mismatchCount}`);

        await mongoose.disconnect();
    } catch (err) {
        console.error(err);
    }
}

run();
