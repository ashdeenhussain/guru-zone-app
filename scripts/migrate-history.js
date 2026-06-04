const mongoose = require('mongoose');
const path = require('path');
const dotenv = require('dotenv');

// Load environment variables from .env.local
dotenv.config({ path: path.join(__dirname, '../.env.local') });

const MONGODB_URI = process.env.MONGODB_URI;
if (!MONGODB_URI) {
    console.error("MONGODB_URI not found in .env.local");
    process.exit(1);
}

// Inline schemas to prevent import conflicts
const TransactionSchema = new mongoose.Schema({}, { strict: false });
const FinancialLogSchema = new mongoose.Schema({
    type: String,
    amount: Number,
    currency: String,
    userId: mongoose.Schema.Types.ObjectId,
    referenceId: mongoose.Schema.Types.Mixed,
    description: String,
    timestamp: Date
}, { timestamps: true });

const Transaction = mongoose.models.Transaction || mongoose.model('Transaction', TransactionSchema, 'transactions');
const FinancialLog = mongoose.models.FinancialLog || mongoose.model('FinancialLog', FinancialLogSchema, 'financiallogs');

async function migrate() {
    try {
        console.log("Connecting to MongoDB...");
        await mongoose.connect(MONGODB_URI);
        console.log("Connected successfully!");

        console.log("Fetching transactions...");
        const transactions = await Transaction.find({});
        console.log(`Found ${transactions.length} total transactions in DB.`);

        let migratedCount = 0;
        let skippedCount = 0;
        let commissionCount = 0;

        for (const tx of transactions) {
            let logType = null;
            let logCurrency = 'Coins';
            let logAmount = Math.abs(tx.amount);

            const txType = tx.type;
            const txStatus = tx.status?.toLowerCase();

            // Mapping rules
            if (txType === 'deposit') {
                if (txStatus === 'approved' || txStatus === 'completed') {
                    logType = 'deposit';
                    logCurrency = 'PKR';
                }
            } else if (txType === 'withdrawal') {
                if (txStatus === 'approved' || txStatus === 'completed') {
                    logType = 'withdrawal';
                    logCurrency = 'PKR';
                }
            } else if (txType === 'shop_purchase') {
                logType = 'shop_purchase';
            } else if (txType === 'daily_free_coins') {
                logType = 'daily_collect';
            } else if (txType === 'daily_reward_spin' || txType === 'spin_win' || txType === 'daily_reward_spin') {
                logType = 'free_spin';
            } else if (txType === 'prize_winnings') {
                logType = 'prize_winnings';
            }

            if (!logType) {
                // Skip pending deposits, withdrawals, entry fees, refunds, etc.
                skippedCount++;
                continue;
            }

            // Check if log already exists (Idempotency)
            const existingLog = await FinancialLog.findOne({
                referenceId: tx._id,
                type: logType
            });

            if (existingLog) {
                skippedCount++;
            } else {
                await FinancialLog.create({
                    type: logType,
                    amount: logAmount,
                    currency: logCurrency,
                    userId: tx.user,
                    referenceId: tx._id,
                    description: tx.description || `Migrated transaction: ${txType}`,
                    timestamp: tx.createdAt || tx.updatedAt || new Date()
                });
                migratedCount++;
            }

            // Check for tournament commissions in prize_winnings
            if (txType === 'prize_winnings') {
                const desc = tx.description || '';
                const isTournament = desc.includes('Tournament') || desc.includes('Battle Zone') || desc.includes('Prize for');
                
                if (isTournament) {
                    let platformFee = 0;
                    
                    // Try parsing from description e.g. "fee: 10" or "fee:10"
                    const feeMatch = desc.match(/fee:\s*(\d+)/i);
                    if (feeMatch) {
                        platformFee = parseInt(feeMatch[1], 10);
                    } else {
                        // Fallback: estimate 10% rake
                        platformFee = Math.round(logAmount * 0.10);
                    }

                    if (platformFee > 0) {
                        const existingCommission = await FinancialLog.findOne({
                            referenceId: tx._id,
                            type: 'tournament_commission'
                        });

                        if (!existingCommission) {
                            await FinancialLog.create({
                                type: 'tournament_commission',
                                amount: platformFee,
                                currency: 'Coins',
                                userId: tx.user,
                                referenceId: tx._id,
                                description: `Platform fee commission parsed/calculated from tournament payout: ${desc}`,
                                timestamp: tx.createdAt || tx.updatedAt || new Date()
                            });
                            commissionCount++;
                        } else {
                            skippedCount++;
                        }
                    }
                }
            }
        }

        console.log("\n--- Migration Complete ---");
        console.log(`Migrated logs: ${migratedCount}`);
        console.log(`Tournament commission logs created: ${commissionCount}`);
        console.log(`Skipped (already exists or skipped types): ${skippedCount}`);
        console.log(`Total FinancialLog count in DB: ${await FinancialLog.countDocuments()}`);

    } catch (error) {
        console.error("Migration failed with error:", error);
    } finally {
        await mongoose.disconnect();
        console.log("Disconnected from MongoDB.");
    }
}

migrate();
