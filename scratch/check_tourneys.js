const mongoose = require('d:/Users/ashde/Downloads/ashi/clon of zp/guru-zone/node_modules/mongoose');

const MONGODB_URI = "mongodb://guru-mdb:QxJXLjXJBkVl7u1h@ac-b7suvb1-shard-00-00.5c5hedd.mongodb.net:27017,ac-b7suvb1-shard-00-01.5c5hedd.mongodb.net:27017,ac-b7suvb1-shard-00-02.5c5hedd.mongodb.net:27017/guru-zone?ssl=true&authSource=admin&retryWrites=true&w=majority";

async function main() {
    console.log("Connecting to database...");
    await mongoose.connect(MONGODB_URI);
    console.log("Connected!");

    const db = mongoose.connection.db;

    console.log("\n--- Completed Tournaments in DB ---");
    const completedTourneys = await db.collection('tournaments').find({
        status: { $in: ['completed', 'Completed'] }
    }).toArray();
    console.log(`Found ${completedTourneys.length} completed tournaments:`);
    console.log(JSON.stringify(completedTourneys.map(t => ({
        _id: t._id,
        title: t.title,
        isOfficial: t.isOfficial,
        entryFee: t.entryFee,
        joinedCount: t.joinedCount,
        prizePool: t.prizePool,
        createdBy: t.createdBy,
        status: t.status
    })), null, 2));

    console.log("\n--- FinancialLog Tournament Commission Entries ---");
    const commissionLogs = await db.collection('financiallogs').find({
        type: 'tournament_commission'
    }).toArray();
    console.log(`Found ${commissionLogs.length} commission logs:`);
    console.log(JSON.stringify(commissionLogs, null, 2));

    console.log("\n--- Checking FinancialLogs referencing any of the completed tournaments ---");
    // We can also see if there are other log types like deposit, shop_purchase etc. that reference the tournaments.
    for (const t of completedTourneys) {
        const logs = await db.collection('financiallogs').find({
            referenceId: t._id
        }).toArray();
        console.log(`Tournament ${t.title} (${t._id}) has ${logs.length} logs:`, logs);
    }

    await mongoose.disconnect();
    console.log("Disconnected!");
}

main().catch(console.error);
