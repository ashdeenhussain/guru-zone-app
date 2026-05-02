require('dotenv').config({ path: '.env.local' });
const mongoose = require('mongoose');

async function migrate() {
    console.log("Connecting to", process.env.MONGODB_URI);
    await mongoose.connect(process.env.MONGODB_URI);
    const db = mongoose.connection.db;
    
    const usersCollection = db.collection('users');
    
    const result = await usersCollection.updateMany(
        {},
        [
            { 
                $set: { 
                    officialWins: { $ifNull: ["$totalWins", 0] }, 
                    officialEarnings: { $ifNull: ["$netEarnings", 0] },
                    battleZoneWins: 0,
                    battleZoneEarnings: 0
                } 
            }
        ]
    );
    
    console.log(`Updated ${result.modifiedCount} users.`);
    process.exit(0);
}

migrate().catch(console.error);
