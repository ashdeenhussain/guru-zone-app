const mongoose = require('mongoose');

const uri = 'mongodb://guru-mdb:QxJXLjXJBkVl7u1h@ac-b7suvb1-shard-00-00.5c5hedd.mongodb.net:27017,ac-b7suvb1-shard-00-01.5c5hedd.mongodb.net:27017,ac-b7suvb1-shard-00-02.5c5hedd.mongodb.net:27017/guru-zone?ssl=true&authSource=admin&retryWrites=true&w=majority';

async function main() {
    await mongoose.connect(uri);
    console.log("Connected to MongoDB.");

    const TournamentSchema = new mongoose.Schema({}, { strict: false, collection: 'tournaments' });
    const Tournament = mongoose.models.Tournament || mongoose.model('Tournament', TournamentSchema);

    const tournament = await Tournament.findById('6a21b4fb53d4125ccdb016c2');
    if (!tournament) {
        console.error("Tournament not found");
        process.exit(1);
    }

    const participants = tournament.get('participants') || [];
    console.log("Original participants:", JSON.stringify(participants, null, 2));

    // Update kills based on transaction records:
    // ashi (696f5fab36c1b6e7d2bd5310) -> 2 kills
    // FF.TopUp.PK (69722d25e1d7d7749dc7629c) -> 1 kill
    // test1 (697652530cba711880fc7f62) -> 1 kill
    participants.forEach(p => {
        const uidStr = p.userId ? p.userId.toString() : '';
        if (uidStr === '696f5fab36c1b6e7d2bd5310') {
            p.kills = 2;
        } else if (uidStr === '69722d25e1d7d7749dc7629c') {
            p.kills = 1;
        } else if (uidStr === '697652530cba711880fc7f62') {
            p.kills = 1;
        }
    });

    tournament.set('participants', participants);
    tournament.markModified('participants');

    await tournament.save();
    console.log("Successfully updated participants kills in the database!");

    process.exit(0);
}

main().catch(console.error);
