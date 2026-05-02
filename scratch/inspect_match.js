const mongoose = require('mongoose');
const dotenv = require('dotenv');

dotenv.config({ path: '.env.local' });

const MONGODB_URI = process.env.MONGODB_URI;

async function inspectTournament(id) {
    await mongoose.connect(MONGODB_URI);
    const Tournament = mongoose.connection.collection('tournaments');
    const t = await Tournament.findOne({ _id: new mongoose.Types.ObjectId(id) });
    console.log(JSON.stringify(t, null, 2));
    await mongoose.connection.close();
}

inspectTournament('69ef0f08b83eb4f514e946e1');
