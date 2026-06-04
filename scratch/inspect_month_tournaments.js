const mongoose = require('mongoose');

const MONGODB_URI = 'mongodb://guru-mdb:QxJXLjXJBkVl7u1h@ac-b7suvb1-shard-00-00.5c5hedd.mongodb.net:27017,ac-b7suvb1-shard-00-01.5c5hedd.mongodb.net:27017,ac-b7suvb1-shard-00-02.5c5hedd.mongodb.net:27017/guru-zone?ssl=true&authSource=admin&retryWrites=true&w=majority';

async function test() {
    await mongoose.connect(MONGODB_URI);
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

    const Tournament = mongoose.models.Tournament || mongoose.model('Tournament', TournamentSchema);

    // 30 days ago range
    const now = new Date();
    const start = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const end = new Date(now);

    const tourneys = await Tournament.find({
        status: { $in: ['completed', 'Completed'] },
        $or: [{ isOfficial: true }, { createdBy: null }],
        updatedAt: { $gte: start, $lte: end }
    });

    console.log(`Found ${tourneys.length} completed official tournaments:`);
    let profit = 0;
    tourneys.forEach(t => {
        const rev = (t.entryFee || 0) * (t.joinedCount || 0);
        const exp = t.prizePool || 0;
        const net = rev - exp;
        profit += net;
        console.log(`- ID: ${t._id}, Title: "${t.title}", Status: ${t.status}, Rev: ${rev}, Exp: ${exp}, Net: ${net}`);
    });
    console.log(`Total profit: ${profit}`);

    process.exit(0);
}

test().catch(console.error);
