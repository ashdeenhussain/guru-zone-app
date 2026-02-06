const mongoose = require('mongoose');

// Schema definition (simplified)
const TournamentSchema = new mongoose.Schema({
    title: String,
    startTime: Date,
    status: String
});

const Tournament = mongoose.models.Tournament || mongoose.model('Tournament', TournamentSchema);

async function inspectLatestTournament() {
    try {
        if (!process.env.MONGODB_URI) {
            throw new Error('MONGODB_URI is not defined');
        }
        await mongoose.connect(process.env.MONGODB_URI);

        const latestTournament = await Tournament.find().sort({ _id: -1 }).limit(1);

        if (latestTournament.length > 0) {
            const t = latestTournament[0];
            console.log("Latest Tournament:");
            console.log(`ID: ${t._id}`);
            console.log(`Title: ${t.title}`);
            console.log(`Status: ${t.status}`);
            console.log(`Stored StartTime (UTC): ${t.startTime.toISOString()}`);
            console.log(`Stored StartTime (Local Server): ${t.startTime.toString()}`);
        } else {
            console.log("No tournaments found.");
        }
    } catch (error) {
        console.error("Error:", error);
    } finally {
        await mongoose.disconnect();
    }
}

inspectLatestTournament();
