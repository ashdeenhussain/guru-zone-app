const mongoose = require('mongoose');
const path = require('path');
const fs = require('fs');

// Load env
const envPath = path.resolve(__dirname, '../.env.local');
if (fs.existsSync(envPath)) {
    require('dotenv').config({ path: envPath });
}

// Connect to MongoDB
const MONGODB_URI = process.env.MONGODB_URI;
if (!MONGODB_URI) {
    console.error('Please define the MONGODB_URI environment variable');
    process.exit(1);
}

const TournamentSchema = new mongoose.Schema({
    title: String,
    format: String,
    createdBy: { type: mongoose.Schema.Types.ObjectId, default: null }
}, { strict: false });

const Tournament = mongoose.model('Tournament', TournamentSchema);
const User = mongoose.model('User', new mongoose.Schema({ email: String, role: String }));

async function fixTournaments() {
    try {
        await mongoose.connect(MONGODB_URI);
        console.log('Connected to MongoDB');

        // 1. Find the Admin User
        const admin = await User.findOne({ role: 'admin' });
        if (!admin) {
            console.error('No admin user found!');
            process.exit(1);
        }
        console.log(`Found Admin: ${admin.email} (${admin._id})`);

        // 2. Find "Official" tournaments (createdBy: null) that should be "Community" (1v1, 2v2, 4v4)
        const targetFormats = ['1v1', '2v2', '4v4'];
        const tournamentsToFix = await Tournament.find({
            createdBy: null,
            format: { $in: targetFormats }
        });

        console.log(`Found ${tournamentsToFix.length} tournaments to fix.`);

        // 3. Update them
        for (const t of tournamentsToFix) {
            console.log(`Fixing: ${t.title} (${t.format})`);
            t.createdBy = admin._id;
            await t.save();
        }

        console.log('Migration complete.');
        process.exit(0);
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
}

fixTournaments();
