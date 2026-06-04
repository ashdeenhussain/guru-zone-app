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
        createdAt: Date
    }, { collection: 'tournaments' });

    const Tournament = mongoose.models.Tournament || mongoose.model('Tournament', TournamentSchema);

    const presets = ['today', 'week', 'month', '3m', 'year', 'lifetime'];
    const now = new Date();

    for (const preset of presets) {
        let start;
        switch (preset) {
            case "today":
                start = new Date();
                start.setHours(0, 0, 0, 0);
                break;
            case "week":
                start = new Date();
                start.setDate(now.getDate() - 7);
                break;
            case "month":
                start = new Date();
                start.setMonth(now.getMonth() - 1);
                break;
            case "3m":
                start = new Date();
                start.setMonth(now.getMonth() - 3);
                break;
            case "year":
                start = new Date();
                start.setFullYear(now.getFullYear() - 1);
                break;
            case "lifetime":
                start = new Date(0);
                break;
        }

        const tourneys = await Tournament.find({
            status: { $in: ['completed', 'Completed'] },
            $or: [{ isOfficial: true }, { createdBy: null }],
            updatedAt: { $gte: start, $lte: now }
        });

        let profit = 0;
        tourneys.forEach(t => {
            const rev = (t.entryFee || 0) * (t.joinedCount || 0);
            const exp = t.prizePool || 0;
            const net = rev - exp;
            profit += net;
        });

        console.log(`Preset: ${preset} | Tourneys Count: ${tourneys.length} | Net Profit: ${profit}`);
    }

    process.exit(0);
}

test().catch(console.error);
