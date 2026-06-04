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
        const email = process.argv[2] || 'za3005033@gmail.com';
        const user = await User.findOne({ email });
        if (!user) {
            console.log(`User ${email} not found!`);
            await mongoose.disconnect();
            return;
        }

        const transactions = await Transaction.find({ user: user._id });
        // Sort transactions safely by date
        transactions.sort((a, b) => {
            const dateA = a.createdAt || new Date(0);
            const dateB = b.createdAt || new Date(0);
            return dateA - dateB;
        });

        console.log(`\n=== User: ${user.name} (${user.email}) ===`);
        console.log(`Stored Wallet Balance: ${user.walletBalance}`);

        let ledgerSum = 0;
        console.log("\nChronological Transactions:");
        transactions.forEach((trx, idx) => {
            const status = trx.status?.toLowerCase() || 'pending';
            const type = trx.type;
            const originalAmount = trx.amount || 0;
            const amount = Math.abs(originalAmount);

            let diff = 0;
            let included = true;

            // Skip rejected/failed/cancelled for normal calculation
            if (['rejected', 'failed', 'cancelled'].includes(status)) {
                included = false;
            } else if (type === 'deposit' && status === 'pending') {
                included = false;
            } else {
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
                            diff = originalAmount; 
                        }
                        break;
                }
                ledgerSum += diff;
            }

            console.log(`${idx + 1}. [${trx.createdAt || 'N/A'}] Type: ${type}, Amount: ${originalAmount}, Status: ${trx.status}, Inc: ${included}, Diff: ${diff}, Running: ${ledgerSum}, Desc: "${trx.description}"`);
        });

        console.log(`\nCalculated Ledger Sum: ${ledgerSum}`);
        console.log(`Mismatch Difference: ${user.walletBalance - ledgerSum}`);

        await mongoose.disconnect();
    } catch (err) {
        console.error(err);
    }
}

run();
