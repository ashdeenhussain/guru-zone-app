const mongoose = require('mongoose');

const uri = 'mongodb://guru-mdb:QxJXLjXJBkVl7u1h@ac-b7suvb1-shard-00-00.5c5hedd.mongodb.net:27017,ac-b7suvb1-shard-00-01.5c5hedd.mongodb.net:27017,ac-b7suvb1-shard-00-02.5c5hedd.mongodb.net:27017/guru-zone?ssl=true&authSource=admin&retryWrites=true&w=majority';

async function main() {
    await mongoose.connect(uri);
    console.log("Connected to MongoDB.");

    const AdminActivitySchema = new mongoose.Schema({}, { strict: false, collection: 'adminactivities' });
    const AdminActivity = mongoose.models.AdminActivity || mongoose.model('AdminActivity', AdminActivitySchema);

    const activities = await AdminActivity.find({ targetId: '6a21d26fefb38be23e14949b' }).lean();
    console.log("Activity logs for this tournament:", JSON.stringify(activities, null, 2));

    process.exit(0);
}

main().catch(console.error);
