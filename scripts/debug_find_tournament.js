const mongoose = require('mongoose');
const path = require('path');
const dotenv = require('dotenv');

// Load env
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });
if (!process.env.MONGODB_URI) {
    dotenv.config();
}

const MONGO_URI = process.env.MONGODB_URI;

if (!MONGO_URI) {
    console.error('MONGODB_URI not found in env');
    process.exit(1);
}

// Define Minimal Schema manually
const TournamentSchema = new mongoose.Schema({
    title: String,
    format: String,
    status: String,
    startTime: Date,
    entryFee: Number,
    participants: [{
        userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        inGameName: String,
        teamName: String
    }]
}, { timestamps: true });

const UserSchema = new mongoose.Schema({
    name: String,
    email: String,
    walletBalance: Number,
});

const Tournament = mongoose.models.Tournament || mongoose.model('Tournament', TournamentSchema);
const User = mongoose.models.User || mongoose.model('User', UserSchema);

async function main() {
    try {
        await mongoose.connect(MONGO_URI);

        // Date filter: Yesterday (Feb 15, 2026) around 10:20 PM
        // Let's look for anything created after Feb 15, 12:00 PM
        const queryDate = new Date('2026-02-15T12:00:00.000Z'); // UTC or local? Assuming local is +5, so -5h for UTC.
        // Actually, let's just grab last 10 created and print their dates.

        const tournaments = await Tournament.find({
            format: 'Squad',
        })
            .sort({ createdAt: -1 })
            .limit(5)
            .populate('participants.userId');

        console.log(`Found ${tournaments.length} Squad tournaments (newest first).`);

        for (const t of tournaments) {
            console.log('--------------------------------------------------');
            console.log(`ID: ${t._id}`);
            console.log(`Title: ${t.title}`);
            console.log(`Status: ${t.status}`);
            console.log(`Entry Fee: ${t.entryFee}`);
            console.log(`Created At: ${t.createdAt.toLocaleString()}`); // Local time string
            console.log(`Start Time: ${t.startTime.toLocaleString()}`);
            console.log(`Participants: ${t.participants.length}`);

            t.participants.forEach((p, index) => {
                const user = p.userId;
                const name = user ? `${user.name} (${user.email})` : 'UNKNOWN USER';
                const id = user ? user._id : 'N/A';
                console.log(`  ${index + 1}. ${name} [${id}] - Team: ${p.teamName}`);
            });
        }

    } catch (error) {
        console.error('Error:', error);
    } finally {
        await mongoose.disconnect();
    }
}

main();
