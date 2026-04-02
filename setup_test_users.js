const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const { Schema, model, models } = mongoose;

const UserSchema = new Schema({
    name: String,
    email: { type: String, unique: true },
    password: { type: String, select: false },
    role: { type: String, default: 'user' },
    walletBalance: { type: Number, default: 0 },
    trustScore: { type: Number, default: 100 },
    hasCompletedOnboarding: { type: Boolean, default: true }
}, { timestamps: true });

const User = models.User || model('User', UserSchema);

const MONGODB_URI = "mongodb://guru-mdb:QxJXLjXJBkVl7u1h@ac-b7suvb1-shard-00-00.5c5hedd.mongodb.net:27017,ac-b7suvb1-shard-00-01.5c5hedd.mongodb.net:27017,ac-b7suvb1-shard-00-02.5c5hedd.mongodb.net:27017/guru-zone?ssl=true&authSource=admin&retryWrites=true&w=majority";

async function setup() {
    try {
        await mongoose.connect(MONGODB_URI);
        const hashed = await bcrypt.hash('password123', 10);

        const u1 = await User.findOneAndUpdate(
            { email: 'test_user1@test.com' },
            {
                name: 'Test User 1',
                email: 'test_user1@test.com',
                password: hashed,
                walletBalance: 1000,
                trustScore: 100,
                role: 'user',
                hasCompletedOnboarding: true
            },
            { upsert: true, new: true }
        );

        const u2 = await User.findOneAndUpdate(
            { email: 'test_user2@test.com' },
            {
                name: 'Test User 2',
                email: 'test_user2@test.com',
                password: hashed,
                walletBalance: 1000,
                trustScore: 100,
                role: 'user',
                hasCompletedOnboarding: true
            },
            { upsert: true, new: true }
        );

        console.log('USERS_SETUP_SUCCESS');
        console.log('User 1:', u1._id, u1.email);
        console.log('User 2:', u2._id, u2.email);

        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

setup();
