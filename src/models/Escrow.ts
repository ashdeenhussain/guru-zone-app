import { Schema, model, models } from 'mongoose';

const EscrowSchema = new Schema(
    {
        matchId: {
            type: Schema.Types.ObjectId,
            ref: 'BattleMatch',
            required: true,
        },
        totalAmount: {
            type: Number,
            required: true, // entryFee * 2
        },
        platformFee: {
            type: Number,
            required: true, // e.g., 10%
        },
        netPrize: {
            type: Number,
            required: true, // totalAmount - platformFee
        },
        status: {
            type: String,
            enum: ['held', 'released', 'refunded'],
            default: 'held',
        },
        releasedTo: {
            type: Schema.Types.ObjectId,
            ref: 'User',
            default: null,
        },
        heldAt: {
            type: Date,
            default: Date.now,
        },
        releasedAt: {
            type: Date,
        },
    },
    { timestamps: true }
);

const Escrow = models.Escrow || model('Escrow', EscrowSchema);

export default Escrow;
