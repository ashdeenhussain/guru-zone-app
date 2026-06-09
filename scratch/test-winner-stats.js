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
        ],
        winners: {
            rank1: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
            rank2: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
            rank3: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
            rank4: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
            rank5: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
            rank6: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
            rank7: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
            rank8: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
            rank9: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
            rank10: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        },
        isPerKill: { type: Boolean, default: false },
        perKillAmount: { type: Number, default: 0 },
        prizeDistribution: {
            first: Number,
            second: Number,
            third: Number,
        }
    }, { strict: false, collection: 'tournaments' });

    const Tournament = mongoose.models.Tournament || mongoose.model('Tournament', TournamentSchema);

    const UserSchema = new mongoose.Schema({}, { strict: false, collection: 'users' });
    const User = mongoose.models.User || mongoose.model('User', UserSchema);

    const tournament = await Tournament.findById('6a21d26fefb38be23e14949b')
        .populate('participants.userId', 'username name email inGameName uid avatarId image')
        .populate('winners.rank1 winners.rank2 winners.rank3 winners.rank4 winners.rank5 winners.rank6 winners.rank7 winners.rank8 winners.rank9 winners.rank10', 'username name inGameName freeFireUid avatarId image')
        .lean();

    const getWinnerStats = (winnerUser) => {
        if (!winnerUser) {
            console.log("winnerUser is null/undefined");
            return { kills: 0, prize: 0 };
        }
        
        const userIdStr = winnerUser._id?.toString() || winnerUser.toString();
        console.log("\nwinnerUser details:");
        console.log("- winnerUser._id:", winnerUser._id, "typeof:", typeof winnerUser._id);
        console.log("- userIdStr:", userIdStr);
        
        const participant = tournament.participants?.find((p) => {
            const pIdStr = p.userId?._id?.toString() || p.userId?.toString() || p.userId;
            const match = pIdStr === userIdStr;
            console.log(`  Comparing participant userId: ${pIdStr} with winner: ${userIdStr} -> Match: ${match}`);
            return match;
        });
        
        if (!participant) {
            console.log("-> Participant NOT found in tournament.participants!");
            return { kills: 0, prize: 0 };
        }
        
        const kills = participant.kills || 0;
        const prize = tournament.isPerKill 
            ? kills * (tournament.perKillAmount || 0)
            : 0;
        console.log(`-> Found! kills: ${kills}, prize: ${prize}`);
        return { kills, prize };
    };

    console.log("Testing rank1 (FF.TopUp.PK):");
    getWinnerStats(tournament.winners?.rank1);

    console.log("Testing rank2 (ashi):");
    getWinnerStats(tournament.winners?.rank2);

    console.log("Testing rank3 (test1):");
    getWinnerStats(tournament.winners?.rank3);

    process.exit(0);
}

main().catch(console.error);
