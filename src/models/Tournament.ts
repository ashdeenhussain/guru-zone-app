import { Schema, model, models } from 'mongoose';

const TournamentSchema = new Schema(
    {
        title: {
            type: String,
            required: [true, 'Please provide a tournament title'],
        },
        createdBy: {
            type: Schema.Types.ObjectId,
            ref: 'User',
            default: null, // Null means created by Admin
        },
        banner: {
            type: String,
            required: false,
        },
        format: {
            type: String,
            enum: ['1v1', '2v2', '4v4', 'Solo', 'Duo', 'Squad'],
            default: 'Solo',
            required: true,
        },
        gameType: {
            type: String,
            enum: ['BR', 'CS'], // Battle Royale, Clash Squad
            required: true,
        },
        teamSize: {
            type: Number,
            default: 1, // 1=Solo, 2=Duo, 4=Squad
        },
        map: {
            type: String,
            default: 'Bermuda',
        },
        entryFee: {
            type: Number,
            required: true,
            default: 0,
        },
        prizePool: {
            type: Number,
            required: true,
        },
        prizeType: {
            type: String,
            enum: ['TOP 3', 'TOP 5', 'TOP 10'],
            default: 'TOP 3',
        },
        prizeDistribution: {
            first: { type: Number, default: 0 },
            second: { type: Number, default: 0 },
            third: { type: Number, default: 0 },
            fourth: { type: Number, default: 0 },
            fifth: { type: Number, default: 0 },
            sixth: { type: Number, default: 0 },
            seventh: { type: Number, default: 0 },
            eighth: { type: Number, default: 0 },
            ninth: { type: Number, default: 0 },
            tenth: { type: Number, default: 0 },
        },
        maxSlots: {
            type: Number,
            required: true,
        },
        joinedCount: {
            type: Number,
            default: 0,
        },
        startTime: {
            type: Date,
            required: true,
        },
        participants: [
            {
                userId: { type: Schema.Types.ObjectId, ref: 'User' },
                inGameName: String,
                uid: String,
                teamName: String, // Added for Duo/Squad
                teammates: [
                    {
                        name: String,
                        uid: String,
                    },
                ],
                kills: { type: Number, default: 0 },
            },
        ],
        roomID: {
            type: String,
            select: false, // Hidden from default queries
        },
        roomPassword: {
            type: String,
            select: false, // Hidden from default queries
        },
        autoReleaseTime: {
            type: Date,
        },
        winnerScreenshot: {
            type: String,
            required: false,
        },
        verificationStartedAt: {
            type: Date,
            required: false,
        },
        verificationStatus: {
            type: String,
            enum: ['Pending', 'Confirmed', 'Rejected'],
            default: 'Pending',
        },
        disputeReason: {
            type: String,
            required: false,
        },
        disputeProof: {
            type: String,
            required: false,
        },
        status: {
            type: String,
            enum: [
                'upcoming', 'full', 'active', 'completed', 'cancelled', 'disputed', 
                'Open', 'Live', 'Completed', 'Cancelled', 'pending_verification'
            ], 
            default: 'Open',
        },
        cancellationReason: {
            type: String,
            required: false,
        },
        isVisible: {
            type: Boolean,
            default: true,
        },
        winners: {
            rank1: { type: Schema.Types.ObjectId, ref: 'User', set: (v: string) => v === '' ? undefined : v },
            rank2: { type: Schema.Types.ObjectId, ref: 'User', set: (v: string) => v === '' ? undefined : v },
            rank3: { type: Schema.Types.ObjectId, ref: 'User', set: (v: string) => v === '' ? undefined : v },
            rank4: { type: Schema.Types.ObjectId, ref: 'User', set: (v: string) => v === '' ? undefined : v },
            rank5: { type: Schema.Types.ObjectId, ref: 'User', set: (v: string) => v === '' ? undefined : v },
            rank6: { type: Schema.Types.ObjectId, ref: 'User', set: (v: string) => v === '' ? undefined : v },
            rank7: { type: Schema.Types.ObjectId, ref: 'User', set: (v: string) => v === '' ? undefined : v },
            rank8: { type: Schema.Types.ObjectId, ref: 'User', set: (v: string) => v === '' ? undefined : v },
            rank9: { type: Schema.Types.ObjectId, ref: 'User', set: (v: string) => v === '' ? undefined : v },
            rank10: { type: Schema.Types.ObjectId, ref: 'User', set: (v: string) => v === '' ? undefined : v },
        },
        advancedRules: {
            gameMode: { 
                type: String, 
                enum: ['Clash Squad', 'Lone Wolf'], 
                default: 'Clash Squad' 
            },
            mapName: { 
                type: String, 
                default: 'Bermuda' 
            },
            rounds: { 
                type: Number, 
                default: 7 
            },
            limitedAmmo: { 
                type: Boolean, 
                default: true 
            },
            headshotOnly: { 
                type: Boolean, 
                default: false 
            },
        },
        isOfficial: {
            type: Boolean,
            default: false,
        },
        isPerKill: {
            type: Boolean,
            default: false,
        },
        perKillAmount: {
            type: Number,
            default: 0,
        },
        rules: {
            type: String,
            default: '',
        },
        prizeDistributed: {
            type: Boolean,
            default: false,
        },
    },
    { timestamps: true }
);

if (models.Tournament) {
    const hasKills = models.Tournament.schema.path('participants.kills');
    if (!hasKills) {
        console.log("Mongoose model 'Tournament' is stale (missing participants.kills). Recompiling...");
        delete models.Tournament;
        const mongoose = require('mongoose');
        if (mongoose.connection && mongoose.connection.models.Tournament) {
            delete mongoose.connection.models.Tournament;
        }
    }
}

const Tournament = models.Tournament || model('Tournament', TournamentSchema);

export default Tournament;
