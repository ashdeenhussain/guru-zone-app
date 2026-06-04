const mongoose = require('mongoose');

const MONGODB_URI = 'mongodb://guru-mdb:QxJXLjXJBkVl7u1h@ac-b7suvb1-shard-00-00.5c5hedd.mongodb.net:27017,ac-b7suvb1-shard-00-01.5c5hedd.mongodb.net:27017,ac-b7suvb1-shard-00-02.5c5hedd.mongodb.net:27017/guru-zone?ssl=true&authSource=admin&retryWrites=true&w=majority';

async function test() {
    await mongoose.connect(MONGODB_URI);
    const TournamentSchema = new mongoose.Schema({}, { strict: false, collection: 'tournaments' });
    const Tournament = mongoose.models.Tournament || mongoose.model('Tournament', TournamentSchema);

    const doc = await Tournament.findOne({ status: { $in: ['completed', 'Completed'] } });
    console.log("Sample completed tournament keys and values:", JSON.stringify(doc, null, 2));

    process.exit(0);
}

test().catch(console.error);
