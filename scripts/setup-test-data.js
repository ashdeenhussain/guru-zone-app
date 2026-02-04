
const mongoose = require('mongoose');
const { Schema } = mongoose;

// Mongoose Schemas (Simplified for setup)
const UserSchema = new Schema({
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

const TournamentSchema = new Schema({
    title: String,
    format: String,
    gameType: String,
    entryFee: Number,
    prizePool: Number,
    maxSlots: Number,
    joinedCount: { type: Number, default: 0 },
    startTime: Date,
    participants: [{ userId: { type: Schema.Types.ObjectId, ref: 'User' }, inGameName: String, uid: String }],
    status: { type: String, default: 'Open' }
}, { timestamps: true });

const User = mongoose.models.User || mongoose.model('User', UserSchema);
const Tournament = mongoose.models.Tournament || mongoose.model('Tournament', TournamentSchema);

async function setupTestData() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to DB');

        const bcrypt = require('bcryptjs');

        // ... schemas ...

        async function setupTestData() {
            try {
                const uri = 'mongodb://guru-mdb:QxJXLjXJBkVl7u1h@ac-b7suvb1-shard-00-00.5c5hedd.mongodb.net:27017,ac-b7suvb1-shard-00-01.5c5hedd.mongodb.net:27017,ac-b7suvb1-shard-00-02.5c5hedd.mongodb.net:27017/guru-zone?ssl=true&authSource=admin&retryWrites=true&w=majority';
                await mongoose.connect(uri);
                console.log('Connected to DB');

                const hashedPassword = await bcrypt.hash('password123', 10);

                // 1. Create/Reset Admin
                const adminEmail = 'admin_test@example.com';
                await User.deleteOne({ email: adminEmail });
                const admin = await User.create({
                    name: 'Test Admin',
                    email: adminEmail,
                    password: hashedPassword,
                    role: 'admin',
                    walletBalance: 1000,
                    inGameName: 'Admin',
                    uid: 'ADMIN001'
                });
                console.log('Admin created:', adminEmail);

                // 2. Create/Reset Test User
                const userEmail = 'user_test@example.com';
                await User.deleteOne({ email: userEmail });
                const user = await User.create({
                    name: 'Test User',
                    email: userEmail,
                    password: hashedPassword,
                    role: 'user',
                    walletBalance: 100, // Sufficient for entry fee
                    inGameName: 'PlayerOne',
                    uid: 'PLAYER001'
                });
                console.log('User created:', userEmail);

                // 3. Create Test Tournament
                const tournamentTitle = 'Refund Test Tournament';
                await Tournament.deleteMany({ title: tournamentTitle });
                const tournament = await Tournament.create({
                    title: tournamentTitle,
                    format: 'Solo',
                    gameType: 'BR',
                    entryFee: 10,
                    prizePool: 100,
                    maxSlots: 10,
                    startTime: new Date(Date.now() + 3600000), // 1 hour from now
                    status: 'Open'
                });
                console.log('Tournament created:', tournamentTitle);

                console.log('Setup Complete');
                process.exit(0);
            } catch (error) {
                console.error('Setup failed:', error);
                process.exit(1);
            }
        }

        setupTestData();
