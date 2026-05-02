const mongoose = require('mongoose');
const dotenv = require('dotenv');

dotenv.config({ path: '.env.local' });

const MONGODB_URI = process.env.MONGODB_URI;

async function findInTournaments() {
    await mongoose.connect(MONGODB_URI);
    const Tournament = mongoose.connection.collection('tournaments');
    
    console.log('Searching in tournaments collection...');
    const all = await Tournament.find({}).toArray();
    const filtered = all.filter(m => {
        const idStr = m._id.toString();
        return idStr.endsWith('e946e1') || idStr.endsWith('421c8e');
    });
    console.log(JSON.stringify(filtered.map(m => ({ id: m._id, title: m.title, status: m.status })), null, 2));
    
    await mongoose.connection.close();
}

findInTournaments();
