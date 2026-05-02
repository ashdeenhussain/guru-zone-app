const mongoose = require('mongoose');
const dotenv = require('dotenv');

dotenv.config({ path: '.env.local' });

const MONGODB_URI = process.env.MONGODB_URI;

async function listTournaments() {
    await mongoose.connect(MONGODB_URI);
    const Tournament = mongoose.connection.collection('tournaments');
    const tournaments = await Tournament.find({ status: { $ne: 'Completed' } }).toArray();
    console.log(JSON.stringify(tournaments.map(t => ({ id: t._id, title: t.title, status: t.status })), null, 2));
    await mongoose.connection.close();
}

listTournaments();
