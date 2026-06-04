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

// Define inline schemas to avoid dependency importing issues
const FinancialLogSchema = new mongoose.Schema({
    type: String,
    amount: Number,
    currency: String,
    userId: mongoose.Schema.Types.ObjectId,
    referenceId: mongoose.Schema.Types.Mixed,
    description: String,
    timestamp: { type: Date, default: Date.now }
});

const FinancialLog = mongoose.models.FinancialLog || mongoose.model('FinancialLog', FinancialLogSchema);

async function run() {
    console.log("Connecting to MongoDB...");
    await mongoose.connect(MONGODB_URI);
    console.log("Connected successfully!");

    const testUserId = new mongoose.Types.ObjectId();
    const tempLogs = [
        { type: 'deposit', amount: 5000, currency: 'PKR', userId: testUserId, description: 'Test Deposit', timestamp: new Date() },
        { type: 'withdrawal', amount: 1500, currency: 'PKR', userId: testUserId, description: 'Test Withdrawal', timestamp: new Date() },
        { type: 'shop_purchase', amount: 800, currency: 'Coins', userId: testUserId, description: 'Test Shop Purchase', timestamp: new Date() },
        { type: 'tournament_commission', amount: 350, currency: 'Coins', userId: testUserId, description: 'Test Tournament Rake', timestamp: new Date() },
        { type: 'prize_winnings', amount: 2000, currency: 'Coins', userId: testUserId, description: 'Test Winner Payout', timestamp: new Date() },
        { type: 'free_spin', amount: 150, currency: 'Coins', userId: testUserId, description: 'Test Spin Reward', timestamp: new Date() },
        { type: 'daily_collect', amount: 50, currency: 'Coins', userId: testUserId, description: 'Test Daily Coins', timestamp: new Date() }
    ];

    console.log("Inserting temporary financial logs for verification...");
    const createdLogs = await FinancialLog.insertMany(tempLogs);
    console.log(`Inserted ${createdLogs.length} test records.`);

    try {
        const start = new Date();
        start.setHours(0, 0, 0, 0);
        const end = new Date();
        end.setHours(23, 59, 59, 999);

        // Run Summary Aggregation
        console.log("\n--- Executing Summary Aggregation Query ---");
        const summaryStats = await FinancialLog.aggregate([
            {
                $match: {
                    timestamp: { $gte: start, $lte: end }
                }
            },
            {
                $group: {
                    _id: '$type',
                    totalAmount: { $sum: '$amount' }
                }
            }
        ]);

        const totals = {
            deposit: 0,
            withdrawal: 0,
            shop_purchase: 0,
            tournament_commission: 0,
            free_spin: 0,
            daily_collect: 0,
            prize_winnings: 0
        };

        summaryStats.forEach(stat => {
            if (stat._id in totals) {
                totals[stat._id] = stat.totalAmount;
            }
        });

        console.log("Aggregated Totals from DB:", totals);

        const totalDeposits = totals.deposit;
        const totalWithdrawals = totals.withdrawal;
        const totalCommissions = totals.tournament_commission;
        const totalPrizesPaid = totals.prize_winnings;
        const totalFreebies = totals.daily_collect + totals.free_spin;

        // Formula: (Deposits + Commissions) - (Withdrawals + Prizes Paid + Costs)
        const actualProfit = (totalDeposits + totalCommissions) - (totalWithdrawals + totalPrizesPaid + totalFreebies);

        console.log("\n--- Verification Results ---");
        console.log(`Total Deposits: ${totalDeposits}`);
        console.log(`Total Withdrawals: ${totalWithdrawals}`);
        console.log(`Total Commissions: ${totalCommissions}`);
        console.log(`Total Prizes Paid: ${totalPrizesPaid}`);
        console.log(`Total Freebies Given: ${totalFreebies}`);
        console.log(`Calculated Actual Profit: ${actualProfit}`);

        // Math check
        const expectedProfit = (5000 + 350) - (1500 + 2000 + (50 + 150));
        console.log(`Expected Profit from Formula: ${expectedProfit}`);

        if (actualProfit === expectedProfit) {
            console.log("\n✅ SUCCESS: Calculation is mathematically correct!");
        } else {
            console.error("\n❌ FAILURE: Calculation mismatch!");
        }

        // Run Chart Aggregation
        console.log("\n--- Executing Chart Aggregation Query ---");
        const chartStats = await FinancialLog.aggregate([
            {
                $match: {
                    timestamp: { $gte: start, $lte: end },
                    type: { $in: ['deposit', 'withdrawal', 'shop_purchase'] }
                }
            },
            {
                $group: {
                    _id: {
                        date: { $dateToString: { format: '%Y-%m-%d', date: '$timestamp', timezone: '+05:00' } },
                        type: '$type'
                    },
                    totalAmount: { $sum: '$amount' }
                }
            },
            {
                $group: {
                    _id: '$_id.date',
                    deposits: {
                        $sum: {
                            $cond: [{ $eq: ['$_id.type', 'deposit'] }, '$totalAmount', 0]
                        }
                    },
                    withdrawals: {
                        $sum: {
                            $cond: [{ $eq: ['$_id.type', 'withdrawal'] }, '$totalAmount', 0]
                        }
                    },
                    shopSales: {
                        $sum: {
                            $cond: [{ $eq: ['$_id.type', 'shop_purchase'] }, '$totalAmount', 0]
                        }
                    }
                }
            }
        ]);

        console.log("Chart Data aggregated:", chartStats);

    } catch (err) {
        console.error("Verification failed with error:", err);
    } finally {
        console.log("\nCleaning up test records...");
        const deleteRes = await FinancialLog.deleteMany({ userId: testUserId });
        console.log(`Deleted ${deleteRes.deletedCount} test records.`);
        await mongoose.disconnect();
        console.log("Disconnected from MongoDB.");
    }
}

run();
