const mongoose = require('mongoose');

async function debug() {
    await mongoose.connect('mongodb://guru-mdb:QxJXLjXJBkVl7u1h@ac-b7suvb1-shard-00-00.5c5hedd.mongodb.net:27017,ac-b7suvb1-shard-00-01.5c5hedd.mongodb.net:27017,ac-b7suvb1-shard-00-02.5c5hedd.mongodb.net:27017/guru-zone?ssl=true&authSource=admin&retryWrites=true&w=majority');

    const TournamentSchema = new mongoose.Schema({
        title: String,
        participants: [
            {
                userId: mongoose.Schema.Types.ObjectId,
                kills: Number
            }
        ]
    }, { collection: 'tournaments' });

    const Tournament = mongoose.models.Tournament || mongoose.model('Tournament', TournamentSchema);

    const tournament = await Tournament.findById('6a21d26fefb38be23e14949b'); // Elite Cup from second screenshot
    if (!tournament) {
        console.log("Tournament not found!");
        process.exit(1);
    }

    console.log("Tournament title:", tournament.title);
    console.log("Participants:");
    tournament.participants.forEach((p, i) => {
        console.log(`[${i}] userId:`, p.userId, "typeof:", typeof p.userId, "instanceof ObjectId:", p.userId instanceof mongoose.Types.ObjectId, "kills:", p.kills);
        if (p.userId) {
            console.log(`    toString():`, p.userId.toString());
            console.log(`    _id:`, p.userId._id);
        }
    });

    process.exit(0);
}

debug().catch(console.error);
