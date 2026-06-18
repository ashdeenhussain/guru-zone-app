const mongoose = require('mongoose');
const path = require('path');
const fs = require('fs');

const envLocalPath = path.join(__dirname, "../.env.local");
const envPath = path.join(__dirname, "../.env");

if (fs.existsSync(envLocalPath)) {
    require("dotenv").config({ path: envLocalPath });
    console.log("Loaded .env.local");
} else {
    require("dotenv").config({ path: envPath });
    console.log("Loaded .env");
}

const uri = process.env.MONGODB_URI || 'mongodb://guru-mdb:QxJXLjXJBkVl7u1h@ac-b7suvb1-shard-00-00.5c5hedd.mongodb.net:27017,ac-b7suvb1-shard-00-01.5c5hedd.mongodb.net:27017,ac-b7suvb1-shard-00-02.5c5hedd.mongodb.net:27017/guru-zone?ssl=true&authSource=admin&retryWrites=true&w=majority';

async function main() {
    await mongoose.connect(uri);
    console.log("Connected to MongoDB successfully!");

    const UserSchema = new mongoose.Schema({
        loyaltyProgress: { type: Number, default: 0 }
    }, { collection: 'users' });

    const User = mongoose.models.User || mongoose.model('User', UserSchema);

    // Update all users setting loyaltyProgress to 0
    const result = await User.updateMany({}, { $set: { loyaltyProgress: 0 } });
    console.log(`Successfully reset loyaltyProgress for all users in database.`);
    console.log(`Matched count: ${result.matchedCount}, Modified count: ${result.modifiedCount}`);

    process.exit(0);
}

main().catch(err => {
    console.error("Migration failed:", err);
    process.exit(1);
});
