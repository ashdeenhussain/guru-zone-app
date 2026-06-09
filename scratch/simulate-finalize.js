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

    const tournament = await Tournament.findById('6a21d26fefb38be23e14949b');

    // Simulate the kills object sent by the admin panel
    // The keys are the user IDs as they would be sent from the frontend
    const body = {
        kills: {
            "69722d25e1d7d7749dc7629c": 1, // FF.TopUp.PK
            "696f5fab36c1b6e7d2bd5310": 1, // ashi
            "697652530cba711880fc7f62": 1  // test1
        }
    };

    console.log("Simulating kills mapping logic:");
    const kills = body.kills || {};
    
    for (const participant of tournament.participants) {
        const pUserId = participant.userId?._id?.toString() || participant.userId?.toString();
        const hasKey = kills[pUserId] !== undefined;
        console.log(`- Participant User ID: ${pUserId}`);
        console.log(`  Is key in kills payload? ${hasKey}`);
        if (hasKey) {
            participant.kills = Number(kills[pUserId]) || 0;
            console.log(`  Updated participant.kills to: ${participant.kills}`);
        } else {
            console.log(`  Skipped! kills[pUserId] is undefined`);
        }
    }

    process.exit(0);
}

main().catch(console.error);
