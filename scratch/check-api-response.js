const mongoose = require('mongoose');

const uri = 'mongodb://guru-mdb:QxJXLjXJBkVl7u1h@ac-b7suvb1-shard-00-00.5c5hedd.mongodb.net:27017,ac-b7suvb1-shard-00-01.5c5hedd.mongodb.net:27017,ac-b7suvb1-shard-00-02.5c5hedd.mongodb.net:27017/guru-zone?ssl=true&authSource=admin&retryWrites=true&w=majority';

async function main() {
    await mongoose.connect(uri);
    console.log("Connected to MongoDB.");

    // Mongoose might already register the models from Tournament.ts
    // Let's import the actual models if possible or define them.
    const TournamentSchema = new mongoose.Schema({
        participants: [
            {
                userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
                inGameName: String,
                uid: String,
                teamName: String,
                teammates: [
                    {
                        name: String,
                        uid: String
                    }
                ],
                kills: { type: Number, default: 0 }
            }
        ]
    }, { strict: false, collection: 'tournaments' });

    const Tournament = mongoose.models.Tournament || mongoose.model('Tournament', TournamentSchema);

    const UserSchema = new mongoose.Schema({}, { strict: false, collection: 'users' });
    const User = mongoose.models.User || mongoose.model('User', UserSchema);

    const tournament = await Tournament.findById('6a21d26fefb38be23e14949b')
        .select('+roomID +roomPassword')
        .populate('participants.userId', 'username name email inGameName uid avatarId image')
        .lean();

    console.log("Populated Tournament Participants:");
    console.log(JSON.stringify(tournament.participants, null, 2));

    process.exit(0);
}

main().catch(console.error);
