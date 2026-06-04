const mongoose = require('d:/Users/ashde/Downloads/ashi/clon of zp/guru-zone/node_modules/mongoose');

const MONGODB_URI = "mongodb://guru-mdb:QxJXLjXJBkVl7u1h@ac-b7suvb1-shard-00-00.5c5hedd.mongodb.net:27017,ac-b7suvb1-shard-00-01.5c5hedd.mongodb.net:27017,ac-b7suvb1-shard-00-02.5c5hedd.mongodb.net:27017/guru-zone?ssl=true&authSource=admin&retryWrites=true&w=majority";

async function main() {
    console.log("Connecting to database...");
    await mongoose.connect(MONGODB_URI);
    console.log("Connected!");

    const start = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000); // 30 days ago
    const end = new Date();

    console.log(`Date range: ${start.toISOString()} to ${end.toISOString()}`);

    const db = mongoose.connection.db;

    // Fetch official tournaments in this range
    const officialTournaments = await db.collection('tournaments').find({
        status: { $in: ['completed', 'Completed'] },
        $or: [{ isOfficial: true }, { createdBy: null }],
        updatedAt: { $gte: start, $lte: end }
    }).toArray();

    console.log(`\nFound ${officialTournaments.length} completed official tournaments in the last 30 days.`);

    let platformTournamentsNetProfit = 0;
    const dailyPlatformProfit = {};

    officialTournaments.forEach(t => {
        const revenue = (t.entryFee || 0) * (t.joinedCount || 0);
        const expenses = t.prizePool || 0;
        const net = revenue - expenses;
        platformTournamentsNetProfit += net;

        // Group by date in local +05:00 timezone
        const updatedDate = t.updatedAt || t.createdAt || new Date();
        const dateStr = new Date(updatedDate.getTime() + 5 * 60 * 60 * 1000).toISOString().split('T')[0];
        dailyPlatformProfit[dateStr] = (dailyPlatformProfit[dateStr] || 0) + net;

        console.log(`- ${t.title}: Fee=${t.entryFee}, Joined=${t.joinedCount}, Prize=${t.prizePool}, Net=${net}, Date=${dateStr}`);
    });

    console.log(`\nPlatform Tournaments Net Profit in last 30 days: ${platformTournamentsNetProfit} Coins`);
    console.log(`Daily Breakdown:`, dailyPlatformProfit);

    // Let's do a wider query to see all-time
    const allOfficialTournaments = await db.collection('tournaments').find({
        status: { $in: ['completed', 'Completed'] },
        $or: [{ isOfficial: true }, { createdBy: null }]
    }).toArray();

    let allTimeNet = 0;
    allOfficialTournaments.forEach(t => {
        const revenue = (t.entryFee || 0) * (t.joinedCount || 0);
        const expenses = t.prizePool || 0;
        allTimeNet += (revenue - expenses);
    });
    console.log(`\nAll-Time Completed Official Tournaments: ${allOfficialTournaments.length}`);
    console.log(`All-Time Net Profit: ${allTimeNet} Coins`);

    await mongoose.disconnect();
    console.log("Disconnected!");
}

main().catch(console.error);
