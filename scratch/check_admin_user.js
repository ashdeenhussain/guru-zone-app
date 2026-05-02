const mongoose = require('mongoose');

async function checkUser() {
    try {
        const mongoUri = 'mongodb://guru-mdb:QxJXLjXJBkVl7u1h@ac-b7suvb1-shard-00-00.5c5hedd.mongodb.net:27017,ac-b7suvb1-shard-00-01.5c5hedd.mongodb.net:27017,ac-b7suvb1-shard-00-02.5c5hedd.mongodb.net:27017/guru-zone?ssl=true&authSource=admin&retryWrites=true&w=majority';
        await mongoose.connect(mongoUri);
        
        const UserSchema = new mongoose.Schema({
            email: String,
            role: String,
            name: String
        });
        const User = mongoose.models.User || mongoose.model('User', UserSchema);

        const user = await User.findOne({ email: 'admin@zp.com' }).lean();
        console.log("Admin User ID:", user?._id);
        console.log("Admin User Email:", user?.email);

        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

checkUser();
