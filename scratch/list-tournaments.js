const mongoose = require('mongoose');

async function list() {
    await mongoose.connect('mongodb://guru-mdb:QxJXLjXJBkVl7u1h@ac-b7suvb1-shard-00-00.5c5hedd.mongodb.net:27017,ac-b7suvb1-shard-00-01.5c5hedd.mongodb.net:27017,ac-b7suvb1-shard-00-02.5c5hedd.mongodb.net:27017/guru-zone?ssl=true&authSource=admin&retryWrites=true&w=majority');

    const TournamentSchema = new mongoose.Schema({
        title: String,
        status: String,
        prizeDistributed: Boolean,
    }, { collection: 'tournaments' });

    const Tournament = mongoose.models.Tournament || mongoose.model('Tournament', TournamentSchema);

    const tournaments = await Tournament.find({});
    console.log("All Tournaments:");
    tournaments.forEach(t => {
        console.log(`- ID: ${t._id}, Title: ${t.title}, Status: ${t.status}, PrizeDistributed: ${t.prizeDistributed}`);
    });

    process.exit(0);
}

list().catch(console.error);
