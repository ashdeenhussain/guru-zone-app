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
        console.log(`Analyzing ${users.length} users...`);

        let mismatchedUsers = [];

        for (const user of users) {
            const transactions = await Transaction.find({ user: user._id });
            
            // Standard calculated sum
            let ledgerSum = 0;
            
            // Group transactions by type and status for diagnostic info
            const trxsSummary = [];

            transactions.forEach(trx => {
                const status = trx.status?.toLowerCase() || 'pending';
                const type = trx.type;
                const origAmt = trx.amount || 0;
                const amount = Math.abs(origAmt);

                let diff = 0;
                let isCalculated = true;

                if (['rejected', 'failed', 'cancelled'].includes(status)) {
                    isCalculated = false;
                } else if (type === 'deposit' && status === 'pending') {
                    isCalculated = false;
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
                                diff = origAmt; 
                            }
                            break;
                        default:
                            diff = 0;
                    }
                    ledgerSum += diff;
                }

                trxsSummary.push({
                    type,
                    amount: origAmt,
                    status,
                    isCalculated,
                    calculatedDiff: diff,
                    desc: trx.description
                });
            });

            const diff = Math.abs(ledgerSum - user.walletBalance);
            if (diff > 0.01) {
                mismatchedUsers.push({
                    name: user.name,
                    email: user.email,
                    walletBalance: user.walletBalance,
                    ledgerSum,
                    difference: user.walletBalance - ledgerSum,
                    trxs: trxsSummary
                });
            }
        }

        console.log(`\nFound ${mismatchedUsers.length} mismatched users.`);
        
        mismatchedUsers.forEach((mu, index) => {
            console.log(`\n${index + 1}. Mismatch - User: ${mu.name} (${mu.email})`);
            console.log(`   Wallet Balance: ${mu.walletBalance}, Calculated: ${mu.ledgerSum}, Diff (Wallet - Calc): ${mu.difference}`);
            
            // Summarize transactions
            const typeCounts = {};
            const skippedTrxs = [];
            
            mu.trxs.forEach(t => {
                const key = `${t.type} (${t.status})`;
                typeCounts[key] = (typeCounts[key] || 0) + 1;
                if (!t.isCalculated) {
                    skippedTrxs.push(t);
                }
            });

            console.log(`   Transactions Summary:`, typeCounts);
            if (skippedTrxs.length > 0) {
                console.log(`   Skipped Transactions details (first 10):`);
                skippedTrxs.slice(0, 10).forEach((st, i) => {
                    console.log(`     - Skipped #${i+1}: Type: ${st.type}, Amount: ${st.amount}, Status: ${st.status}, Desc: "${st.desc}"`);
                });
            }
        });

        await mongoose.disconnect();
    } catch (err) {
        console.error(err);
    }
}

run();
