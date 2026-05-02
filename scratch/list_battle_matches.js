const mongoose = require('mongoose');
const dotenv = require('dotenv');

dotenv.config({ path: '.env.local' });

const MONGODB_URI = process.env.MONGODB_URI;

async function listBattleMatches() {
    await mongoose.connect(MONGODB_URI);
    const BattleMatch = mongoose.connection.collection('battlematches');
    const matches = await BattleMatch.find({ status: { $in: ['active', 'disputed', 'open', 'full'] } }).toArray();
    console.log(JSON.stringify(matches.map(m => ({ id: m._id, title: m.title, status: m.status, host: m.createdBy })), null, 2));
    await mongoose.connection.close();
}

listBattleMatches();
