require('dotenv').config({ path: '.env.local' });
const mongoose = require('mongoose');

async function fixStats() {
    console.log("Connecting to DB...");
    await mongoose.connect(process.env.MONGODB_URI);
    const db = mongoose.connection.db;
    
    console.log("Finding completed Battle Matches...");
    const matches = await db.collection('battlematches').find({ status: 'completed' }).toArray();
    console.log(`Found ${matches.length} completed Battle Matches.`);
    
    for (const match of matches) {
        const winnerId = match.winners?.rank1;
        if (!winnerId) continue;
        
        const winnerOid = new mongoose.Types.ObjectId(winnerId);
        const prize = match.prizePool || 0;
        
        console.log(`Processing winner ${winnerId} for match ${match._id} (Prize: ${prize})`);
        
        // 1. Increment Battle Zone stats
        // 2. Decrement Official stats (since they were likely migrated there incorrectly)
        // 3. Ensure official stats don't go below 0
        
        const winner = await db.collection('users').findOne({ _id: winnerOid });
        if (winner) {
            const newOfficialWins = Math.max(0, (winner.officialWins || 0) - 1);
            const newOfficialEarnings = Math.max(0, (winner.officialEarnings || 0) - prize);
            
            await db.collection('users').updateOne(
                { _id: winnerOid },
                {
                    $inc: {
                        battleZoneWins: 1,
                        battleZoneEarnings: prize
                    },
                    $set: {
                        officialWins: newOfficialWins,
                        officialEarnings: newOfficialEarnings
                    }
                }
            );
            console.log(`Updated stats for user ${winner.name}`);
        }
    }
    
    console.log("Done.");
    process.exit(0);
}

fixStats().catch(console.error);
