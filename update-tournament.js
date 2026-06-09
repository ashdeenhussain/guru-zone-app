const mongoose = require('mongoose');

const uri = 'mongodb://guru-mdb:QxJXLjXJBkVl7u1h@ac-b7suvb1-shard-00-00.5c5hedd.mongodb.net:27017,ac-b7suvb1-shard-00-01.5c5hedd.mongodb.net:27017,ac-b7suvb1-shard-00-02.5c5hedd.mongodb.net:27017/guru-zone?ssl=true&authSource=admin&retryWrites=true&w=majority';

async function main() {
    await mongoose.connect(uri);
    console.log("Connected to MongoDB.");

    const TournamentSchema = new mongoose.Schema({}, { strict: false, collection: 'tournaments' });
    const Tournament = mongoose.models.Tournament || mongoose.model('Tournament', TournamentSchema);

    const tournamentId = '6a21b4fb53d4125ccdb016c2';
    const result = await Tournament.findByIdAndUpdate(tournamentId, {
        $set: {
            isPerKill: true,
            perKillAmount: 15,
            rules: "1. Hacking, script usage, or cheating of any form is strictly prohibited.\n2. Respawn or revive mechanics are disabled/not allowed.\n3. Coin rewards will be credited directly to your wallet after match results verification."
        }
    }, { new: true });

    if (result) {
        console.log(`Successfully updated tournament "${result.get('title')}" (ID: ${tournamentId}):`);
        console.log(`- isPerKill: ${result.get('isPerKill')}`);
        console.log(`- perKillAmount: ${result.get('perKillAmount')}`);
    } else {
        console.log(`Tournament with ID ${tournamentId} not found.`);
    }

    process.exit(0);
}

main().catch(console.error);
