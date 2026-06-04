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
}, { collection: 'users' });

const Transaction = mongoose.models.Transaction || mongoose.model('Transaction', TransactionSchema);
const User = mongoose.models.User || mongoose.model('User', UserSchema);

async function run() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        const user = await User.findOne({ email: 'admin@zp.com' });
        
        // Fetch all transactions, sorted by Date ascending
        // Note: Some transactions have undefined Date in the list because createdAt was missing, we handle that by sorting with fallback.
        const transactions = await Transaction.find({ user: user._id });
        
        // Sort transactions safely by date
        transactions.sort((a, b) => {
            const dateA = a.createdAt || new Date(0);
            const dateB = b.createdAt || new Date(0);
            return dateA - dateB;
        });

        console.log(`Initial Wallet Balance: ${user.walletBalance}`);
        console.log("\nChronological Transaction Log with Running Balance:");
        
        let runningBalance = 0;
        
        transactions.forEach((trx, idx) => {
            const status = trx.status?.toLowerCase() || 'pending';
            const type = trx.type;
            const amount = Math.abs(trx.amount || 0);
            
            // Skip rejected/failed/cancelled
            if (['rejected', 'failed', 'cancelled'].includes(status)) {
                console.log(`[SKIP] #${idx + 1} Date: ${trx.createdAt || 'N/A'}, Type: ${type}, Amount: ${trx.amount}, Status: ${trx.status}, Desc: "${trx.description}"`);
                return;
            }
            if (type === 'deposit' && status === 'pending') {
                console.log(`[SKIP] #${idx + 1} Date: ${trx.createdAt || 'N/A'}, Type: ${type}, Amount: ${trx.amount}, Status: ${trx.status}, Desc: "${trx.description}"`);
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
                        diff = trx.amount; 
                    }
                    break;
            }

            runningBalance += diff;
            console.log(`[CALC] #${idx + 1} Date: ${trx.createdAt || 'N/A'}, Type: ${type}, Amount: ${trx.amount}, Status: ${status}, Running Balance: ${runningBalance}, Desc: "${trx.description}"`);
        });

        console.log(`\nFinal Calculated Balance: ${runningBalance}`);
        console.log(`Actual Database Balance: ${user.walletBalance}`);

        await mongoose.disconnect();
    } catch (err) {
        console.error(err);
    }
}

run();
