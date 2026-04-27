import { Schema, model, models } from 'mongoose';

const BattleMatchSchema = new Schema(
    {
        title: {
            type: String,
            required: [true, 'Match title is required'],
        },
        createdBy: {
            type: Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
        format: {
            type: String,
            enum: ['1v1', '2v2', '4v4'],
            default: '1v1',
        },
        gameMode: {
            type: String,
            enum: ['Clash Squad', 'Lone Wolf'],
            default: 'Clash Squad',
        },
        mapName: {
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
        maxSlots: {
            type: Number,
            default: 2,
        },
        joinedCount: {
            type: Number,
            default: 1,
        },
        status: {
            type: String,
            enum: ['open', 'full', 'active', 'pending_verification', 'completed', 'cancelled', 'disputed'],
            default: 'open',
        },
        participants: [
            {
                userId: { type: Schema.Types.ObjectId, ref: 'User' },
                inGameName: String,
                uid: String,
            },
        ],
        roomID: {
            type: String,
            select: false,
        },
        roomPassword: {
            type: String,
            select: false,
        },
        winnerScreenshot: {
            type: String,
        },
        verificationStartedAt: {
            type: Date,
        },
        verificationStatus: {
            type: String,
            enum: ['Pending', 'Confirmed', 'Rejected'],
            default: 'Pending',
        },
        disputeReason: {
            type: String,
        },
        disputeProof: {
            type: String,
        },
        adminNote: {
            type: String,
        },
        winners: {
            rank1: { type: Schema.Types.ObjectId, ref: 'User' },
        },
        advancedRules: {
            rounds: { type: Number, default: 7 },
            limitedAmmo: { type: Boolean, default: true },
            headshotOnly: { type: Boolean, default: false },
        },
        isOfficial: {
            type: Boolean,
            default: false, // BattleMatch is always community-based/P2P
        }
    },
    { timestamps: true }
);

const BattleMatch = models.BattleMatch || model('BattleMatch', BattleMatchSchema);

export default BattleMatch;
