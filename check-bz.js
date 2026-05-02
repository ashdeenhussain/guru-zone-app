require('dotenv').config({ path: '.env.local' });
const mongoose = require('mongoose');

async function check() {
    await mongoose.connect(process.env.MONGODB_URI);
    const db = mongoose.connection.db;
    const users = await db.collection('users')
        .find({ battleZoneEarnings: { $gt: 0 } })
        .sort({ battleZoneWins: -1, battleZoneEarnings: -1 })
        .limit(10)
        .toArray();
    console.log(JSON.stringify(users, null, 2));
    process.exit(0);
}

check().catch(console.error);
