const mongoose = require('mongoose');

async function check() {
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

    const tournament = await Tournament.findById('6a21cb22efb38be23e1408d8');
    if (!tournament) {
        console.log("Tournament not found!");
        process.exit(1);
    }

    console.log("Tournament Title:", tournament.title);
    tournament.participants.forEach((p, i) => {
        console.log(`[${i}] userId: ${p.userId}, kills: ${p.kills}`);
    });

    process.exit(0);
}

check().catch(console.error);
