const mongoose = require('mongoose');

const MONGODB_URI = 'mongodb://guru-mdb:QxJXLjXJBkVl7u1h@ac-b7suvb1-shard-00-00.5c5hedd.mongodb.net:27017,ac-b7suvb1-shard-00-01.5c5hedd.mongodb.net:27017,ac-b7suvb1-shard-00-02.5c5hedd.mongodb.net:27017/guru-zone?ssl=true&authSource=admin&retryWrites=true&w=majority';

async function verify() {
    console.log("Connecting to database...");
    await mongoose.connect(MONGODB_URI);
    console.log("Connected!");

    const FinancialLogSchema = new mongoose.Schema({
        type: String,
        amount: Number,
        purchaseCost: Number,
        calculatedProfit: Number,
        referenceId: mongoose.Schema.Types.Mixed,
        description: String,
        timestamp: Date
    }, { collection: 'financiallogs' });

    const TournamentSchema = new mongoose.Schema({
        status: String,
        isOfficial: Boolean,
        createdBy: mongoose.Schema.Types.ObjectId,
        entryFee: Number,
        joinedCount: Number,
        prizePool: Number,
        updatedAt: Date,
        createdAt: Date,
        isTestData: Boolean,
        prizeDistributed: Boolean,
        prizePayoutAmount: Number
    }, { collection: 'tournaments' });

    const FinancialLog = mongoose.models.FinancialLog || mongoose.model('FinancialLog', FinancialLogSchema);
    const Tournament = mongoose.models.Tournament || mongoose.model('Tournament', TournamentSchema);

    // Calculate Platform Tournament profits directly from the Database (same as GET route)
    const officialTournaments = await Tournament.find({
        status: 'completed',
        isTestData: { $ne: true },
        $and: [
            {
                $or: [
                    { isOfficial: true },
                    { createdBy: null }
                ]
            },
            {
                $or: [
                    { prizeDistributed: true },
                    { prizePayoutAmount: { $gt: 0 } }
                ]
            }
        ]
    });

    console.log(`Matched ${officialTournaments.length} sanitized official tournaments.`);

    let platformTournamentsNetProfit = 0;
    officialTournaments.forEach(t => {
        const revenue = (t.entryFee || 0) * (t.joinedCount || 0);
        const expenses = t.prizePayoutAmount > 0 ? t.prizePayoutAmount : (t.prizePool || 0);
        const net = revenue - expenses;
        platformTournamentsNetProfit += net;
        console.log(`- Tourney: ${t._id} | Revenue: ${revenue} | Expenses: ${expenses} | Net: ${net}`);
    });

    // Subcategory pipeline
    const basePipeline = [
        {
            $lookup: {
                from: 'tournaments',
                localField: 'referenceId',
                foreignField: '_id',
                as: 'tournament'
            }
        },
        {
            $unwind: {
                path: '$tournament',
                preserveNullAndEmptyArrays: true
            }
        },
        {
            $addFields: {
                subCategory: {
                    $cond: [
                        { $regexMatch: { input: { $ifNull: ['$description', ''] }, regex: 'Lucky', options: 'i' } },
                        'lucky_spin',
                        {
                            $cond: [
                                { $regexMatch: { input: { $ifNull: ['$description', ''] }, regex: 'Daily.*Spin', options: 'i' } },
                                'free_spin_1k',
                                {
                                    $cond: [
                                        { $eq: ['$type', 'deposit'] }, 'deposit',
                                        { $cond: [
                                            { $eq: ['$type', 'withdrawal'] }, 'withdrawal',
                                            { $cond: [
                                                { $eq: ['$type', 'shop_purchase'] }, 'shop_purchase',
                                                { $cond: [
                                                    { $eq: ['$type', 'prize_winnings'] }, 'prize_winnings',
                                                    { $cond: [
                                                        { $eq: ['$type', 'daily_collect'] }, 'daily_collect',
                                                        { $cond: [
                                                            { $eq: ['$type', 'free_spin'] }, 'free_spin_1k',
                                                            { $cond: [
                                                                { $eq: ['$type', 'tournament_commission'] },
                                                                {
                                                                    $cond: [
                                                                        { $eq: ['$tournament.isOfficial', true] },
                                                                        'tournament_commission_platform',
                                                                        'tournament_commission_user'
                                                                    ]
                                                                },
                                                                '$type'
                                                            ]}
                                                        ]}
                                                    ]}
                                                ]}
                                            ]}
                                        ]}
                                    ]
                                }
                            ]
                        }
                    ]
                }
            }
        }
    ];

    const summaryStats = await FinancialLog.aggregate([
        ...basePipeline,
        {
            $group: {
                _id: '$subCategory',
                totalAmount: { $sum: '$amount' },
                totalProfit: { $sum: { $ifNull: [ '$calculatedProfit', 0 ] } },
                totalCost: { $sum: { $ifNull: [ '$purchaseCost', 0 ] } }
            }
        }
    ]);

    const totals = {
        deposit: 0,
        withdrawal: 0,
        shop_purchase: 0,
        tournament_commission_platform: 0,
        tournament_commission_user: 0,
        free_spin_1k: 0,
        daily_collect: 0,
        lucky_spin: 0,
        prize_winnings: 0
    };
    const profits = { shop_purchase: 0 };
    const costs = { shop_purchase: 0 };

    summaryStats.forEach(stat => {
        if (stat._id in totals) {
            totals[stat._id] = stat.totalAmount;
        }
        if (stat._id === 'shop_purchase') {
            profits.shop_purchase = stat.totalProfit || 0;
            costs.shop_purchase = stat.totalCost || 0;
        }
    });

    const totalDeposits = totals.deposit;
    const totalWithdrawals = totals.withdrawal;
    const totalShopSales = totals.shop_purchase;
    const totalShopProfit = profits.shop_purchase;
    const totalShopExpenses = costs.shop_purchase;

    const totalCommissionsPlatform = platformTournamentsNetProfit;
    const totalCommissionsUser = totals.tournament_commission_user;
    const totalCommissions = totalCommissionsPlatform + totalCommissionsUser;

    const totalFreebies = totals.free_spin_1k + totals.daily_collect + totals.lucky_spin;

    const actualProfit = totalShopProfit + totalCommissions - totalFreebies;
    const cashOnHand = totalDeposits - totalWithdrawals - totalShopExpenses;

    console.log("\n---------------- SANITIZED VERIFICATION REPORT ----------------");
    console.log(`Total Deposits (PKR): Rs ${totalDeposits}`);
    console.log(`Total Withdrawals (PKR): Rs ${totalWithdrawals}`);
    console.log(`Total Shop Sales (Coins): ${totalShopSales}`);
    console.log(`Total Shop Expenses (PKR/Coins): ${totalShopExpenses}`);
    console.log(`Total Shop Profit (Coins): ${totalShopProfit}`);
    console.log(`Sanitized Tournament Commissions (Coins): ${totalCommissions} (Platform: ${totalCommissionsPlatform}, User: ${totalCommissionsUser})`);
    console.log(`Total Freebies Given (Coins): ${totalFreebies}`);
    console.log("\n----- FORMULA CALCULATIONS -----");
    console.log(`Actual Profit Formula: (Shop Profit ${totalShopProfit}) + (Commissions ${totalCommissions}) - (Freebies ${totalFreebies})`);
    console.log(`Actual Profit: ${actualProfit} Coins`);
    console.log(`Cash on Hand Formula: (Deposits ${totalDeposits}) - (Withdrawals ${totalWithdrawals}) - (Shop Expenses ${totalShopExpenses})`);
    console.log(`Cash on Hand: Rs ${cashOnHand}`);
    console.log("---------------------------------------------------------------");

    process.exit(0);
}

verify().catch(console.error);
