const mongoose = require('mongoose');
require('dotenv').config({ path: '.env.local' });

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
    console.error('Please define the MONGODB_URI environment variable inside .env.local');
    process.exit(1);
}

const userSchema = new mongoose.Schema({
    name: String,
    email: String,
    role: String
}, { strict: false }); // Strict false to read whatever is there

const User = mongoose.models.User || mongoose.model('User', userSchema);

async function checkUser() {
    try {
        await mongoose.connect(MONGODB_URI, {
            family: 4,
        });
        console.log('Connected to DB');

        const userId = '6986fe1359ccba2bb2e2f483'; // ID from screenshot
        console.log(`Checking for User ID: ${userId}`);

        // Try finding by ID
        const user = await User.findById(userId);

        if (user) {
            console.log('✅ User FOUND:', user._id, user.name, user.email);
        } else {
            console.log('❌ User NOT FOUND by ID');

            // List last 5 users to see format
            const users = await User.find().sort({ createdAt: -1 }).limit(5);
            console.log('Last 5 Users in DB:', users.map(u => ({ id: u._id.toString(), name: u.name })));
        }

    } catch (error) {
        console.error('Error:', error);
    } finally {
        await mongoose.disconnect();
    }
}

checkUser();
