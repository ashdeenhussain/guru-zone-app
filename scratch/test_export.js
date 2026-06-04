const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');
const { Parser } = require('json2csv');

// Load environment variables
dotenv.config({ path: path.join(__dirname, '..', '.env.local') });

const MONGODB_URI = process.env.MONGODB_URI;
if (!MONGODB_URI) {
    console.error("MONGODB_URI is not set in env variables.");
    process.exit(1);
}

// Define schemas manually or import them
const UserSchema = new mongoose.Schema({}, { strict: false });
const User = mongoose.models.User || mongoose.model('User', UserSchema);

const TournamentSchema = new mongoose.Schema({}, { strict: false });
const Tournament = mongoose.models.Tournament || mongoose.model('Tournament', TournamentSchema);

const FinancialLogSchema = new mongoose.Schema({}, { strict: false });
const FinancialLog = mongoose.models.FinancialLog || mongoose.model('FinancialLog', FinancialLogSchema);

async function run() {
    try {
        console.log("Connecting to database...");
        await mongoose.connect(MONGODB_URI);
        console.log("Connected successfully!");

        // Set up dates (last 30 days)
        const now = new Date();
        const start = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        const end = new Date(now);

        const matchStage = {
            timestamp: { $gte: start, $lte: end }
        };

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
                                                                    { $cond: [
                                                                        { $eq: ['$type', 'admin_adjustment'] },
                                                                        'admin_adjustment',
                                                                        '$type'
                                                                    ]}
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

        const exportPipeline = [
            {
                $match: matchStage
            },
            ...basePipeline,
            { $sort: { timestamp: -1 } },
            { $limit: 10 }, // Limit to 10 for test output
            {
                $lookup: {
                    from: 'users',
                    localField: 'userId',
                    foreignField: '_id',
                    as: 'user'
                }
            },
            {
                $unwind: {
                    path: '$user',
                    preserveNullAndEmptyArrays: true
                }
            },
            {
                $project: {
                    _id: 1,
                    type: 1,
                    subCategory: 1,
                    amount: 1,
                    currency: 1,
                    description: 1,
                    timestamp: 1,
                    purchaseCost: 1,
                    calculatedProfit: 1,
                    userId: {
                        _id: '$user._id',
                        name: '$user.name',
                        email: '$user.email',
                        inGameName: '$user.inGameName'
                    }
                }
            }
        ];

        console.log("Querying logs...");
        const logs = await FinancialLog.aggregate(exportPipeline);
        console.log(`Fetched ${logs.length} logs for verification.`);

        const formattedData = logs.map(log => {
            const date = new Date(log.timestamp).toISOString();
            const userId = log.userId?._id ? log.userId._id.toString() : 'System';
            const userName = log.userId?.name || '';
            const userEmail = log.userId?.email || '';
            const category = log.subCategory || log.type;
            const amount = log.amount || 0;
            const purchaseCost = log.purchaseCost !== undefined && log.purchaseCost !== null ? log.purchaseCost : '';
            
            let actualProfit = 0;
            if (category === 'shop_purchase') {
                actualProfit = log.calculatedProfit !== undefined && log.calculatedProfit !== null 
                    ? log.calculatedProfit 
                    : (amount - (Number(purchaseCost) || 0));
            } else if (category === 'tournament_commission' || category === 'tournament_commission_platform' || category === 'tournament_commission_user') {
                actualProfit = amount;
            } else if (['free_spin', 'free_spin_1k', 'daily_collect', 'lucky_spin'].includes(category)) {
                actualProfit = -amount;
            } else if (category === 'admin_adjustment') {
                actualProfit = -amount;
            } else {
                actualProfit = log.calculatedProfit ?? 0;
            }

            return {
                date,
                userId,
                userName,
                userEmail,
                category,
                amount,
                purchaseCost,
                actualProfit,
                description: log.description || ''
            };
        });

        console.log("First formatted item:", formattedData[0]);

        const fields = [
            { label: 'Date', value: 'date' },
            { label: 'User ID', value: 'userId' },
            { label: 'User Name', value: 'userName' },
            { label: 'User Email', value: 'userEmail' },
            { label: 'Category', value: 'category' },
            { label: 'Amount', value: 'amount' },
            { label: 'Purchase Cost', value: 'purchaseCost' },
            { label: 'Actual Profit', value: 'actualProfit' },
            { label: 'Description', value: 'description' }
        ];

        console.log("Generating CSV...");
        const json2csvParser = new Parser({ fields });
        const csv = json2csvParser.parse(formattedData);
        
        console.log("CSV Header & Sample Data:\n");
        console.log(csv.split('\n').slice(0, 4).join('\n'));
        console.log("\nSuccess!");

    } catch (err) {
        console.error("Test failed:", err);
    } finally {
        await mongoose.disconnect();
        console.log("Disconnected from DB.");
    }
}

run();
