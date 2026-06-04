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
        const users = await User.find({ status: { $ne: 'banned' } });
        console.log(`Checking ${users.length} users with revised logic...`);

        let matchCount = 0;
        let mismatchCount = 0;
        let mismatchedDetails = [];

        for (const user of users) {
            const transactions = await Transaction.find({ user: user._id });
            
            let ledgerSum = 0;
            transactions.forEach(trx => {
                const status = trx.status?.toLowerCase() || 'pending';
                const type = trx.type;
                const origAmt = trx.amount || 0;
                const amount = Math.abs(origAmt);

                // Revised rules:
                // 1. If transaction is rejected/failed/cancelled:
                //    - If it is shop_purchase, we must INCLUDE it as a debit (-amount) because a separate approved 'refund' transaction was created.
                //    - Otherwise, we skip it.
                if (['rejected', 'failed', 'cancelled'].includes(status)) {
                    if (type !== 'shop_purchase') {
                        return;
                    }
                }

                // 2. Pending deposits are skipped since they haven't credited the user yet.
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
                ledgerSum += diff;
            });

            // Note: We exclude legacy auto-fix corrections from the calculations to see if users are clean on their core transactions
            // BUT wait! If the user actually had legacy adjustments made to their wallet Balance in MongoDB without transaction records,
            // then those users WILL have a mismatch unless we keep their manual corrections.
            // Let's check how many users match WITH their legacy corrections and adjustments included.
            
            const diff = Math.abs(ledgerSum - user.walletBalance);
            if (diff <= 0.01) {
                matchCount++;
            } else {
                mismatchCount++;
                mismatchedDetails.push({
                    name: user.name,
                    email: user.email,
                    walletBalance: user.walletBalance,
                    ledgerSum,
                    diff: user.walletBalance - ledgerSum
                });
            }
        }

        console.log(`\nRevised Logic Results:`);
        console.log(`Total users: ${users.length}`);
        console.log(`Matched: ${matchCount}`);
        console.log(`Mismatched: ${mismatchCount}`);

        if (mismatchCount > 0) {
            console.log("\nMismatched Users list:");
            mismatchedDetails.forEach((md, i) => {
                console.log(`${i+1}. ${md.name} (${md.email}) - Wallet: ${md.walletBalance}, Ledger: ${md.ledgerSum}, Diff: ${md.diff}`);
            });
        }

        await mongoose.disconnect();
    } catch (err) {
        console.error(err);
    }
}

run();
