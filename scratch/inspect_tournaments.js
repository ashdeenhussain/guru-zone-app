const mongoose = require('mongoose');

const MONGODB_URI = 'mongodb://guru-mdb:QxJXLjXJBkVl7u1h@ac-b7suvb1-shard-00-00.5c5hedd.mongodb.net:27017,ac-b7suvb1-shard-00-01.5c5hedd.mongodb.net:27017,ac-b7suvb1-shard-00-02.5c5hedd.mongodb.net:27017/guru-zone?ssl=true&authSource=admin&retryWrites=true&w=majority';

async function test() {
    await mongoose.connect(MONGODB_URI);
    
    // We use a completely dynamic schema to inspect whatever is in the DB
    const TournamentSchema = new mongoose.Schema({}, { strict: false, collection: 'tournaments' });
    const Tournament = mongoose.models.Tournament || mongoose.model('Tournament', TournamentSchema);

    const total = await Tournament.countDocuments({});
    const completed = await Tournament.countDocuments({ status: { $in: ['completed', 'Completed'] } });
    const isTestDataTrue = await Tournament.countDocuments({ isTestData: true });
    const isTestDataFalse = await Tournament.countDocuments({ isTestData: false });
    const prizeDistributedTrue = await Tournament.countDocuments({ prizeDistributed: true });
    const prizePayoutAmountGtZero = await Tournament.countDocuments({ prizePayoutAmount: { $gt: 0 } });
    const combinedFilter = await Tournament.countDocuments({
        status: 'completed',
        $or: [{ prizeDistributed: true }, { prizePayoutAmount: { $gt: 0 } }],
        isTestData: { $ne: true }
    });

    console.log(`Tournaments Info:`);
    console.log(`- Total: ${total}`);
    console.log(`- Completed: ${completed}`);
    console.log(`- isTestData = true: ${isTestDataTrue}`);
    console.log(`- isTestData = false: ${isTestDataFalse}`);
    console.log(`- prizeDistributed = true: ${prizeDistributedTrue}`);
    console.log(`- prizePayoutAmount > 0: ${prizePayoutAmountGtZero}`);
    console.log(`- Combined sanitized filter count: ${combinedFilter}`);

    const samples = await Tournament.find({
        $or: [
            { isTestData: { $exists: true } },
            { prizeDistributed: { $exists: true } },
            { prizePayoutAmount: { $exists: true } }
        ]
    }).limit(3);
    console.log("Sample tournaments with fields:", JSON.stringify(samples, null, 2));

    process.exit(0);
}

test().catch(console.error);
