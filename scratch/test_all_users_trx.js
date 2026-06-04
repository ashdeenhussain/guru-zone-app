const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../.env.local') });

const TransactionSchema = new mongoose.Schema({
    type: String,
    amount: Number,
    status: String,
    user: mongoose.Schema.Types.ObjectId,
    details: mongoose.Schema.Types.Mixed
}, { collection: 'transactions' });

const UserSchema = new mongoose.Schema({
    name: String,
    email: String,
    walletBalance: Number,
}, { collection: 'users' });

const Transaction = mongoose.models.Transaction || mongoose.model('Transaction', TransactionSchema);
const User = mongoose.models.User || mongoose.model('User', UserSchema);

async function run() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        const users = await User.find({ status: { $ne: 'banned' } });
        console.log(`Checking ${users.length} users against Transaction table...`);

        let matchCount = 0;
        let mismatchCount = 0;

        for (const user of users) {
            const transactions = await Transaction.find({ user: user._id });
            
            let ledgerSum = 0;
            transactions.forEach(trx => {
                const status = trx.status?.toLowerCase() || 'pending';
                const type = trx.type;
                const amount = Math.abs(trx.amount || 0);

                if (['rejected', 'failed', 'cancelled'].includes(status)) return;
                if (type === 'deposit' && status === 'pending') return;

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
                            diff = trx.amount; 
                        }
                        break;
                }
                ledgerSum += diff;
            });

            const diff = Math.abs(ledgerSum - user.walletBalance);
            if (diff <= 0.01) {
                matchCount++;
            } else {
                mismatchCount++;
                console.log(`Mismatch - User: ${user.name} (${user.email}), Wallet: ${user.walletBalance}, Transaction Ledger: ${ledgerSum}, Diff: ${ledgerSum - user.walletBalance}`);
            }
        }

        console.log(`\nResults:`);
        console.log(`Total users: ${users.length}`);
        console.log(`Synced with Transaction ledger: ${matchCount}`);
        console.log(`Mismatched: ${mismatchCount}`);

        await mongoose.disconnect();
    } catch (err) {
        console.error(err);
    }
}

run();
