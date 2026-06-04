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
        if (!user) {
            console.log("User not found!");
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

        console.log(`User Wallet Balance: ${user.walletBalance}`);

        // We want to test different combinations of including/excluding certain transactions.
        // Let's run a calculation where we EXCLUDE the legacy correction transaction:
        // Description: "System Correction for past manual adjustment"
        
        let calculatedNoLegacy = 0;
        let runningList = [];

        transactions.forEach((trx) => {
            const status = trx.status?.toLowerCase() || 'pending';
            const type = trx.type;
            const originalAmount = trx.amount || 0;
            const amount = Math.abs(originalAmount);

            // Skip legacy auto-fix
            const isLegacyAutoFix = trx.description === 'System Correction for past manual adjustment' || trx.details?.isLegacy;

            if (isLegacyAutoFix) {
                return;
            }

            // Exclude rejected/failed/cancelled
            if (['rejected', 'failed', 'cancelled'].includes(status)) {
                return;
            }
            // Exclude pending deposits
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
                        diff = originalAmount; 
                    }
                    break;
                default:
                    console.log(`Unknown transaction type: ${type}`);
            }

            calculatedNoLegacy += diff;
            runningList.push({
                date: trx.createdAt || 'N/A',
                type: type,
                originalAmount: originalAmount,
                diff: diff,
                status: status,
                running: calculatedNoLegacy,
                desc: trx.description
            });
        });

        console.log(`\nCalculated Ledger (Excluding Legacy Auto-Fixes): ${calculatedNoLegacy}`);
        console.log(`Difference (Wallet - Calc): ${user.walletBalance - calculatedNoLegacy}`);

        console.log("\nLast 20 transactions:");
        runningList.slice(-20).forEach(item => {
            console.log(`[${item.date}] Type: ${item.type}, OrigAmt: ${item.originalAmount}, Diff: ${item.diff}, Running: ${item.running}, Desc: "${item.desc}"`);
        });

        await mongoose.disconnect();
    } catch (err) {
        console.error(err);
    }
}

run();
