const mongoose = require('mongoose');

async function testSave() {
    await mongoose.connect('mongodb://guru-mdb:QxJXLjXJBkVl7u1h@ac-b7suvb1-shard-00-00.5c5hedd.mongodb.net:27017,ac-b7suvb1-shard-00-01.5c5hedd.mongodb.net:27017,ac-b7suvb1-shard-00-02.5c5hedd.mongodb.net:27017/guru-zone?ssl=true&authSource=admin&retryWrites=true&w=majority');

    const TournamentSchema = new mongoose.Schema({
        title: String,
        participants: [
            {
                userId: mongoose.Schema.Types.ObjectId,
                inGameName: String,
                uid: String,
                teamName: String,
                teammates: Array,
                kills: { type: Number, default: 0 }
            }
        ]
    }, { collection: 'tournaments' });

    const Tournament = mongoose.models.Tournament || mongoose.model('Tournament', TournamentSchema);

    const tournament = await Tournament.findById('6a21cb22efb38be23e1408d8');
    if (!tournament) {
        console.log("Tournament not found!");
        process.exit(1);
    }

    console.log("Before saving:");
    tournament.participants.forEach(p => {
        console.log(`- ${p.inGameName}: kills = ${p.kills}`);
    });

    // Update kills
    tournament.participants[0].kills = 1;
    tournament.participants[1].kills = 1;
    tournament.participants[2].kills = 2;
    tournament.markModified('participants');

    await tournament.save();

    const updated = await Tournament.findById('6a21cb22efb38be23e1408d8');
    console.log("After saving:");
    updated.participants.forEach(p => {
        console.log(`- ${p.inGameName}: kills = ${p.kills}`);
    });

    process.exit(0);
}

testSave().catch(console.error);
