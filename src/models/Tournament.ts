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
        prizeDistribution: {
            first: { type: Number, default: 0 },
            second: { type: Number, default: 0 },
            third: { type: Number, default: 0 },
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
        status: {
            type: String,
            enum: ['Open', 'Live', 'Completed', 'Cancelled'],
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
            rank1: { type: Schema.Types.ObjectId, ref: 'User' },
            rank2: { type: Schema.Types.ObjectId, ref: 'User' },
            rank3: { type: Schema.Types.ObjectId, ref: 'User' },
        },
    },
    { timestamps: true }
);

const Tournament = models.Tournament || model('Tournament', TournamentSchema);

export default Tournament;
