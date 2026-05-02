const mongoose = require('mongoose');
const dotenv = require('dotenv');

dotenv.config({ path: '.env.local' });

const MONGODB_URI = process.env.MONGODB_URI;

async function findMatches() {
    await mongoose.connect(MONGODB_URI);
    const BattleMatch = mongoose.connection.collection('battlematches');
    
    // Find by partial ID (case insensitive regex)
    const matches = await BattleMatch.find({ 
        $or: [
            { _id: { $regex: /e946e1$/ } },
            { _id: { $regex: /421c8e$/ } }
        ]
    }).toArray();
    
    // Try converting to string for regex if they are ObjectIds
    if (matches.length === 0) {
        console.log('No matches found by regex, trying string conversion...');
        const allMatches = await BattleMatch.find({}).toArray();
        const filtered = allMatches.filter(m => {
            const idStr = m._id.toString();
            return idStr.endsWith('e946e1') || idStr.endsWith('421c8e');
        });
        console.log(JSON.stringify(filtered.map(m => ({ id: m._id, title: m.title, status: m.status })), null, 2));
    } else {
        console.log(JSON.stringify(matches.map(m => ({ id: m._id, title: m.title, status: m.status })), null, 2));
    }
    
    await mongoose.connection.close();
}

findMatches();
