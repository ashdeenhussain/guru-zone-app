const mongoose = require('mongoose');

const uri = 'mongodb://guru-mdb:QxJXLjXJBkVl7u1h@ac-b7suvb1-shard-00-00.5c5hedd.mongodb.net:27017,ac-b7suvb1-shard-00-01.5c5hedd.mongodb.net:27017,ac-b7suvb1-shard-00-02.5c5hedd.mongodb.net:27017/guru-zone?ssl=true&authSource=admin&retryWrites=true&w=majority';

async function main() {
    await mongoose.connect(uri);
    console.log("Connected to MongoDB.");

    const TournamentSchema = new mongoose.Schema({}, { strict: false, collection: 'tournaments' });
    const Tournament = mongoose.models.Tournament || mongoose.model('Tournament', TournamentSchema);

    const tournaments = await Tournament.find({}).sort({ createdAt: -1 }).limit(10);
    console.log("Last 10 tournaments in database:");
    tournaments.forEach(t => {
        console.log(`- Title: "${t.get('title')}" | isPerKill: ${t.get('isPerKill')} | perKillAmount: ${t.get('perKillAmount')} | status: ${t.get('status')} | ID: ${t._id}`);
    });

    process.exit(0);
}

main().catch(console.error);
