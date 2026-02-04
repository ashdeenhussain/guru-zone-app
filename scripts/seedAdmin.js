const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config({ path: '.env.local' });

const seedAdmin = async () => {
    try {
        if (!process.env.MONGODB_URI) {
            throw new Error('MONGODB_URI is not defined in .env.local');
        }

        console.log('Connecting to MongoDB...');
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected.');

        // Define a schema locally to avoid Typescript issues in this JS script
        // We only need enough to create the user with the right fields
        const UserSchema = new mongoose.Schema({
            name: { type: String, required: true },
            email: { type: String, required: true, unique: true },
            password: { type: String },
            role: { type: String, default: 'user', enum: ['user', 'admin'] },
            image: String,
            walletBalance: Number,
        }, { timestamps: true });

        // Use 'User' model if already compiled (unlikely in standalone script) or compile it
        const User = mongoose.models.User || mongoose.model('User', UserSchema);

        const email = 'admin@zp.com';
        const rawPassword = 'admin123';

        const existingUser = await User.findOne({ email });

        if (existingUser) {
            console.log(`User with email ${email} already exists.`);
            // You could choose to update the role here if you wanted:
            if (existingUser.role !== 'admin') {
                console.log('Updating existing user to admin role...');
                existingUser.role = 'admin';
                await existingUser.save();
                console.log('User promoted to admin.');
            } else {
                console.log('User is already an admin.');
            }
            return;
        }

        console.log('Creating admin user...');
        const hashedPassword = await bcrypt.hash(rawPassword, 10);

        await User.create({
            name: 'Super Admin',
            email,
            password: hashedPassword,
            role: 'admin',
            walletBalance: 10000,
            image: `https://ui-avatars.com/api/?name=Super+Admin&background=random`,
        });

        console.log('Admin user created successfully!');
        console.log(`Email: ${email}`);
        console.log(`Password: ${rawPassword}`);

    } catch (error) {
        console.error('Seeding failed:', error);
    } finally {
        await mongoose.disconnect();
        console.log('Disconnected');
        process.exit();
    }
};

seedAdmin();
