const mongoose = require('mongoose');

const uri = 'mongodb://guru-mdb:QxJXLjXJBkVl7u1h@ac-b7suvb1-shard-00-00.5c5hedd.mongodb.net:27017,ac-b7suvb1-shard-00-01.5c5hedd.mongodb.net:27017,ac-b7suvb1-shard-00-02.5c5hedd.mongodb.net:27017/guru-zone?ssl=true&authSource=admin&retryWrites=true&w=majority';

async function main() {
    await mongoose.connect(uri);
    console.log("Connected to MongoDB.");

    const TournamentSchema = new mongoose.Schema({
        participants: [
            {
                userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
                kills: { type: Number, default: 0 }
            }
        ]
    }, { strict: false, collection: 'tournaments' });

    const Tournament = mongoose.models.Tournament || mongoose.model('Tournament', TournamentSchema);

    const tournament = await Tournament.findById('6a21da98efb38be23e152125');
    if (!tournament) {
        console.error("Tournament not found!");
        process.exit(1);
    }

    for (const participant of tournament.participants) {
        participant.kills = 1;
    }
    
    tournament.markModified('participants');
    await tournament.save();
    console.log("Kills successfully set to 1 for all participants!");

    process.exit(0);
}

main().catch(console.error);
