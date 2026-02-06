const mongoose = require('mongoose');

// Schema definition (simplified)
const TournamentSchema = new mongoose.Schema({
    title: String,
    startTime: Date,
    status: String
});

const Tournament = mongoose.models.Tournament || mongoose.model('Tournament', TournamentSchema);

async function fixLatestTournament() {
    try {
        if (!process.env.MONGODB_URI) {
            throw new Error('MONGODB_URI is not defined');
        }
        await mongoose.connect(process.env.MONGODB_URI);

        const latestTournament = await Tournament.find().sort({ _id: -1 }).limit(1);

        if (latestTournament.length > 0) {
            const t = latestTournament[0];
            console.log("Found Tournament:", t.title);
            console.log("Original Time (UTC):", t.startTime.toISOString());

            // Subtract 5 hours
            const newTime = new Date(t.startTime.getTime() - (5 * 60 * 60 * 1000));
            t.startTime = newTime;
            await t.save();

            console.log("Fixed Time (UTC):", newTime.toISOString());
            console.log("Successfully updated tournament time.");
        } else {
            console.log("No tournaments found.");
        }
    } catch (error) {
        console.error("Error:", error);
    } finally {
        await mongoose.disconnect();
    }
}

fixLatestTournament();
