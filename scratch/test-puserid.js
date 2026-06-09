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
    console.log("Loaded tournament participants:");
    
    for (const participant of tournament.participants) {
        console.log("participant.userId:", participant.userId, "typeof:", typeof participant.userId);
        console.log("participant.userId.constructor.name:", participant.userId?.constructor?.name);
        
        const pUserIdOpt1 = participant.userId?._id?.toString();
        const pUserIdOpt2 = participant.userId?.toString();
        const pUserId = (participant.userId && (participant.userId._id ? participant.userId._id.toString() : participant.userId.toString()));
        
        console.log("pUserIdOpt1 (._id?.toString()):", pUserIdOpt1);
        console.log("pUserIdOpt2 (.toString()):", pUserIdOpt2);
        console.log("pUserId logic in finalize route:", (participant.userId)?._id?.toString() || participant.userId?.toString());
    }

    process.exit(0);
}

main().catch(console.error);
