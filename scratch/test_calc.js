const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../.env.local') });

const TransactionSchema = new mongoose.Schema({
    type: String,
    amount: Number,
    status: String,
    user: mongoose.Schema.Types.ObjectId,
    createdAt: Date,
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
        const user = await User.findOne({ email: 'admin@zp.com' });
        
        const transactions = await Transaction.find({ user: user._id });
        
        let ledgerSum = 0;
        let breakdown = {};

        transactions.forEach((trx) => {
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
                        // Fallback to signed value if available
                        diff = trx.amount; 
                    }
                    break;
                default:
                    // Log unknown types
                    console.log(`Unknown type: ${type}`);
            }

            ledgerSum += diff;
            breakdown[type] = (breakdown[type] || 0) + diff;
        });

        console.log(`User Wallet Balance: ${user.walletBalance}`);
        console.log(`Calculated Ledger Sum: ${ledgerSum}`);
        console.log("Breakdown:", breakdown);

        await mongoose.disconnect();
    } catch (err) {
        console.error(err);
    }
}

run();
