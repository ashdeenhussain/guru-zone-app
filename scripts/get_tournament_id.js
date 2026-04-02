const mongoose = require('mongoose');
const path = require('path');
const dotenv = require('dotenv');

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });
if (!process.env.MONGODB_URI) { dotenv.config(); }

const MONGO_URI = process.env.MONGODB_URI;

const TournamentSchema = new mongoose.Schema({
    title: String,
    format: String,
    participants: [{}],
    createdAt: Date
}, { timestamps: true });

const Tournament = mongoose.models.Tournament || mongoose.model('Tournament', TournamentSchema);

async function main() {
    try {
        await mongoose.connect(MONGO_URI);

        const tournaments = await Tournament.find({
            format: 'Squad',
        }).sort({ createdAt: -1 }).limit(5);

        for (const t of tournaments) {
            if (t.participants.length === 3) {
                console.log(`TARGET_ID:${t._id}`);
                console.log(`CREATED_AT:${t.createdAt}`);
            }
        }

    } catch (error) {
        console.error(error);
    } finally {
        await mongoose.disconnect();
    }
}

main();
