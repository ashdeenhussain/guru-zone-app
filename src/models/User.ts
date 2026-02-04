import { Schema, model, models } from 'mongoose';

const UserSchema = new Schema(
    {
        name: {
            type: String,
            required: [true, 'Please provide a name'],
        },
        email: {
            type: String,
            required: [true, 'Please provide an email'],
            unique: true,
            match: [
                /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                'Please provide a valid email address',
            ],
        },
        password: {
            type: String,
            required: false, // Not required if signing up via Google
            select: false,
        },
        image: {
            type: String,
        },
        provider: {
            type: String,
            default: 'credentials',
        },
        resetPasswordToken: String,
        resetPasswordExpire: Date,
        role: {
            type: String,
            enum: ['user', 'admin'],
            default: 'user',
        },
        // Role-Based Access Control
        permissions: [{
            type: String,
            enum: [
                'manage_finance',    // Can approve deposits/withdrawals, manage wallet
                'manage_tournaments', // Can create/edit tournaments, results
                'manage_store',      // Can add products, view orders, manage lucky spin
                'manage_support',    // Can reply to tickets, view users
                'manage_system'      // Super Admin: settings, manage staff
            ]
        }],
        walletBalance: {
            type: Number,
            default: 0,
        },
        totalWins: {
            type: Number,
            default: 0,
        },
        netEarnings: {
            type: Number,
            default: 0,
        },
        tournamentsPlayed: [{
            type: Schema.Types.ObjectId,
            ref: 'Tournament',
        }],
        transactions: [{
            type: Schema.Types.ObjectId,
            ref: 'Transaction',
        }],
        inGameName: {
            type: String,
            default: "",
        },
        freeFireUid: {
            type: String,
            default: "",
        },
        avatarId: {
            type: Number,
            default: 1,
        },
        bio: {
            type: String,
            default: "",
            maxLength: 100,
        },
        status: {
            type: String,
            enum: ['active', 'banned'],
            default: 'active',
        },
        banReason: {
            type: String,
        },
        lastLogin: {
            type: Date,
        },
        fakeDepositStrikes: {
            type: Number,
            default: 0,
        },
        notifications: {
            email: { type: Boolean, default: true },
            tournaments: { type: Boolean, default: true },
        },
        loyaltyProgress: {
            type: Number,
            default: 0,
        },
        spinsAvailable: {
            type: Number,
            default: 0,
        },
        rankPoints: {
            type: Number,
            default: 0,
        },
        claimedRankRewards: [{
            type: String, // will store strings like 'Silver-1', 'Gold-1' etc. basically rank tier+division keys
        }],
        hasCompletedOnboarding: {
            type: Boolean,
            default: false,
        },
    },
    { timestamps: true }
);

const User = models.User || model('User', UserSchema);

export default User;
