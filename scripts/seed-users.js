
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config({ path: '.env.local' });

async function seedUsers() {
    try {
        if (!process.env.MONGODB_URI) {
            throw new Error('MONGODB_URI is missing in .env.local');
        }

        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to DB');

        // Mongoose Schema (Simplified)
        const UserSchema = new mongoose.Schema({
            name: { type: String, required: true },
            email: { type: String, required: true, unique: true },
            password: { type: String, select: false },
            role: { type: String, enum: ['user', 'admin'], default: 'user' },
            walletBalance: { type: Number, default: 0 },
            inGameName: String,
            uid: String,
            status: { type: String, default: 'active' },
            notifications: { email: { type: Boolean, default: true }, tournaments: { type: Boolean, default: true } },
        }, { timestamps: true });

        const User = mongoose.models.User || mongoose.model('User', UserSchema);

        const hashedPassword = await bcrypt.hash('Password123!', 10);

        // 1. Create/Update Admin
        const adminEmail = 'testadmin@example.com';
        await User.findOneAndUpdate(
            { email: adminEmail },
            {
                name: 'Test Admin',
                email: adminEmail,
                password: hashedPassword,
                role: 'admin',
                walletBalance: 1000,
                inGameName: 'AdminBoss',
                uid: 'ADMIN001'
            },
            { upsert: true, new: true }
        );
        console.log('Admin seeded:', adminEmail);

        // 2. Create/Update User
        const userEmail = 'testuser@example.com';
        await User.findOneAndUpdate(
            { email: userEmail },
            {
                name: 'Test User',
                email: userEmail,
                password: hashedPassword,
                role: 'user',
                walletBalance: 100,
                inGameName: 'PlayerOne',
                uid: 'PLAYER001'
            },
            { upsert: true, new: true }
        );
        console.log('User seeded:', userEmail);

        console.log('Seeding Complete');
        process.exit(0);
    } catch (error) {
        console.error('Seeding failed:', error);
        process.exit(1);
    }
}

seedUsers();
