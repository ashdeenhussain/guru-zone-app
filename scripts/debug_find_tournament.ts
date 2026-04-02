import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';

// Load env
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });
dotenv.config(); // fallback to .env if .env.local missing

const MONGO_URI = process.env.MONGODB_URI;

if (!MONGO_URI) {
    console.error('MONGODB_URI not found in env');
    process.exit(1);
}

// Define Minimal Schema manually to avoid import issues
const TournamentSchema = new mongoose.Schema({
    title: String,
    format: String,
    status: String,
    startTime: Date,
    entryFee: Number,
    participants: [{
        userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        teamName: String,
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
        console.log('Connecting to DB...');
        await mongoose.connect(MONGO_URI!);
        console.log('Connected.');

        // Search for relevant tournaments
        // User said: "Squad", yesterday 10:20 (PM likely), 3 participants
        const tournaments = await Tournament.find({
            format: 'Squad',
        })
            .sort({ createdAt: -1 }) // Newest first
            .limit(10)
            .populate('participants.userId');

        console.log(`Found ${tournaments.length} Squad tournaments.`);

        for (const t of tournaments) {
            console.log('--------------------------------------------------');
            console.log(`ID: ${t._id}`);
            console.log(`Title: ${t.title}`);
            console.log(`Format: ${t.format}`);
            console.log(`Status: ${t.status}`);
            console.log(`Entry Fee: ${t.entryFee}`);
            console.log(`Start Time: ${t.startTime}`);
            console.log(`Created At: ${t.createdAt}`);
            console.log(`Participants Count: ${t.participants.length}`);

            t.participants.forEach((p: any, index: number) => {
                const user = p.userId;
                if (!user) {
                    console.log(`  ${index + 1}. User: NULL (Deleted?)`);
                } else {
                    console.log(`  ${index + 1}. User: ${user.name} (${user._id}) - Wallet: ${user.walletBalance}`);
                }
                console.log(`     Team Name: ${p.teamName}`);
            });
        }

    } catch (error) {
        console.error('Error:', error);
    } finally {
        await mongoose.disconnect();
        console.log('Disconnected.');
    }
}

main();
