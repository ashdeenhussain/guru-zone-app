const mongoose = require('mongoose');

async function printRaw() {
    await mongoose.connect('mongodb://guru-mdb:QxJXLjXJBkVl7u1h@ac-b7suvb1-shard-00-00.5c5hedd.mongodb.net:27017,ac-b7suvb1-shard-00-01.5c5hedd.mongodb.net:27017,ac-b7suvb1-shard-00-02.5c5hedd.mongodb.net:27017/guru-zone?ssl=true&authSource=admin&retryWrites=true&w=majority');

    const db = mongoose.connection.db;
    const tournament = await db.collection('tournaments').findOne({ _id: new mongoose.Types.ObjectId('6a21cb22efb38be23e1408d8') });
    console.log("Raw doc:\n", JSON.stringify(tournament, null, 2));
    process.exit(0);
}

printRaw().catch(console.error);
