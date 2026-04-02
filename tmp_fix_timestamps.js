const mongoose = require('mongoose');

const uri = "mongodb://guru-mdb:QxJXLjXJBkVl7u1h@ac-b7suvb1-shard-00-00.5c5hedd.mongodb.net:27017,ac-b7suvb1-shard-00-01.5c5hedd.mongodb.net:27017,ac-b7suvb1-shard-00-02.5c5hedd.mongodb.net:27017/guru-zone?ssl=true&authSource=admin&retryWrites=true&w=majority";

async function main() {
    await mongoose.connect(uri);

    // We update all recent refund transactions that are missing createdAt
    const db = mongoose.connection.db;

    const res = await db.collection('transactions').updateMany(
        { type: 'refund', createdAt: { $exists: false } },
        {
            $set: {
                createdAt: new Date(),
                updatedAt: new Date()
            }
        }
    );

    console.log(`Updated ${res.modifiedCount} refund transactions without timestamps.`);
    await mongoose.disconnect();
}

main().catch(console.error);
