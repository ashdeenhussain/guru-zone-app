const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

// Load env
dotenv.config({ path: path.join(__dirname, '../.env.local') });

const MONGODB_URI = process.env.MONGODB_URI;

async function checkTournament() {
    try {
        await mongoose.connect(MONGODB_URI);
        console.log('Connected to DB');

        // Define schemas manually for the script to avoid import issues
        const TournamentSchema = new mongoose.Schema({
            title: String,
            status: String,
            participants: Array,
            entryFee: Number
        }, { strict: false });

        const Tournament = mongoose.models.Tournament || mongoose.model('Tournament', TournamentSchema);

        const id = '69994585770d3a589eaeabd5';
        const tournament = await Tournament.findById(id);

        if (!tournament) {
            console.log(`Tournament with ID ${id} NOT FOUND.`);
            // List all tournaments to see if there's a similar ID
            const all = await Tournament.find({ title: /Fire Zone/i });
            console.log('Similar tournaments:', all.map(t => ({ id: t._id, title: t.title, status: t.status })));
            return;
        }

        console.log('tournament Found:');
        console.log('Title:', tournament.title);
        console.log('Status:', tournament.status);
        console.log('Participants:', tournament.participants?.length);
        console.log('Full ID:', tournament._id);

    } catch (err) {
        console.error('Error:', err);
    } finally {
        await mongoose.disconnect();
    }
}

checkTournament();
