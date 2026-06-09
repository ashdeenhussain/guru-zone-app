const mongoose = require('mongoose');

async function fix() {
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

    const tournament = await Tournament.findById('6a21d26fefb38be23e14949b');
    if (!tournament) {
        console.log("Tournament not found!");
        process.exit(1);
    }

    console.log("Tournament title:", tournament.title);
    tournament.participants.forEach(p => {
        p.kills = 1;
    });
    tournament.markModified('participants');

    await tournament.save();
    console.log("Elite Cup participants kills updated to 1!");
    process.exit(0);
}

fix().catch(console.error);
