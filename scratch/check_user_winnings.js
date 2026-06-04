const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../.env.local') });

// Define Schemas
const TournamentSchema = new mongoose.Schema({
    title: String,
    status: String,
    createdBy: mongoose.Schema.Types.ObjectId,
    entryFee: Number,
    joinedCount: Number,
    prizePool: Number,
    winners: mongoose.Schema.Types.Mixed,
    participants: [
        {
            userId: mongoose.Schema.Types.ObjectId,
            joinedAt: Date
        }
    ]
}, { collection: 'tournaments' });

const BattleMatchSchema = new mongoose.Schema({
    title: String,
    status: String,
    entryFee: Number,
    prizePool: Number,
    hostId: mongoose.Schema.Types.ObjectId,
    joinerId: mongoose.Schema.Types.ObjectId,
    winnerId: mongoose.Schema.Types.ObjectId,
}, { collection: 'battlematches' });

const UserSchema = new mongoose.Schema({
    name: String,
    email: String,
    walletBalance: Number,
}, { collection: 'users' });

const Tournament = mongoose.models.Tournament || mongoose.model('Tournament', TournamentSchema);
// Try to get battle matches, bypass if not exists
let BattleMatch;
try {
    BattleMatch = mongoose.models.BattleMatch || mongoose.model('BattleMatch', BattleMatchSchema);
} catch (e) {
    BattleMatch = mongoose.model('BattleMatch', BattleMatchSchema);
}
const User = mongoose.models.User || mongoose.model('User', UserSchema);

async function run() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        
        const email = 'za3005033@gmail.com';
        const user = await User.findOne({ email });
        if (!user) {
            console.log("User not found!");
            await mongoose.disconnect();
            return;
        }

        console.log(`\nUser: ${user.name} (${user._id})`);
        console.log(`Stored walletBalance: ${user.walletBalance}`);

        // Search in completed tournaments where user was a winner
        // We look at all tournaments where user was a winner
        const wonTournaments = await Tournament.find({
            status: 'Completed',
            $or: [
                { 'winners.rank1': user._id },
                { 'winners.rank2': user._id },
                { 'winners.rank3': user._id },
                { 'winners.rank4': user._id },
                { 'winners.rank5': user._id },
                { 'winners.rank6': user._id },
                { 'winners.rank7': user._id },
                { 'winners.rank8': user._id },
                { 'winners.rank9': user._id },
                { 'winners.rank10': user._id }
            ]
        });

        console.log(`\nWon Tournaments count: ${wonTournaments.length}`);
        wonTournaments.forEach(t => {
            console.log(`- Tournament: ${t.title} (${t._id}), PrizePool: ${t.prizePool}, EntryFee: ${t.entryFee}`);
            console.log(`  Winners: ${JSON.stringify(t.winners)}`);
        });

        // Search in joined tournaments
        const joinedTournaments = await Tournament.find({
            'participants.userId': user._id
        });
        console.log(`\nJoined Tournaments count: ${joinedTournaments.length}`);
        joinedTournaments.forEach(t => {
            console.log(`- Tournament: ${t.title} (${t._id}), Status: ${t.status}, EntryFee: ${t.entryFee}`);
        });

        // Search in Battle Matches
        let wonBattles = [];
        let joinedBattles = [];
        try {
            wonBattles = await BattleMatch.find({ winnerId: user._id });
            joinedBattles = await BattleMatch.find({
                $or: [
                    { hostId: user._id },
                    { joinerId: user._id }
                ]
            });
            console.log(`\nWon Battles count: ${wonBattles.length}`);
            wonBattles.forEach(b => {
                console.log(`- Battle: ${b.title || 'N/A'} (${b._id}), Status: ${b.status}, PrizePool: ${b.prizePool}`);
            });
            console.log(`\nJoined Battles count: ${joinedBattles.length}`);
            joinedBattles.forEach(b => {
                console.log(`- Battle: ${b.title || 'N/A'} (${b._id}), Status: ${b.status}, EntryFee: ${b.entryFee}`);
            });
        } catch (e) {
            console.log("No BattleMatch collection or query error:", e.message);
        }

        await mongoose.disconnect();
    } catch (err) {
        console.error(err);
    }
}

run();
