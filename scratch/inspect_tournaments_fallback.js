const mongoose = require('mongoose');

const MONGODB_URI = 'mongodb://guru-mdb:QxJXLjXJBkVl7u1h@ac-b7suvb1-shard-00-00.5c5hedd.mongodb.net:27017,ac-b7suvb1-shard-00-01.5c5hedd.mongodb.net:27017,ac-b7suvb1-shard-00-02.5c5hedd.mongodb.net:27017/guru-zone?ssl=true&authSource=admin&retryWrites=true&w=majority';

async function verify() {
    console.log("Connecting...");
    await mongoose.connect(MONGODB_URI);
    console.log("Connected!");

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

    // Month range
    const now = new Date();
    const start = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const end = new Date(now);

    const officialTournaments = await Tournament.find({
        status: { $in: ['completed', 'Completed'] },
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
                    { prizePayoutAmount: { $gt: 0 } },
                    { prizeDistributed: { $exists: false }, prizePayoutAmount: { $exists: false } }
                ]
            }
        ],
        updatedAt: { $gte: start, $lte: end }
    });

    console.log(`Matched ${officialTournaments.length} official tournaments.`);
    let profit = 0;
    officialTournaments.forEach(t => {
        const rev = (t.entryFee || 0) * (t.joinedCount || 0);
        const exp = t.prizePayoutAmount > 0 ? t.prizePayoutAmount : (t.prizePool || 0);
        const net = rev - exp;
        profit += net;
        console.log(`- Tourney: ${t._id} | Rev: ${rev} | Exp: ${exp} | Net: ${net}`);
    });
    console.log(`Total net profit: ${profit} Coins`);

    process.exit(0);
}

verify().catch(console.error);
