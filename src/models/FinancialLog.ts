import { Schema, model, models } from 'mongoose';

const FinancialLogSchema = new Schema(
    {
        type: {
            type: String,
            enum: [
                'deposit',
                'withdrawal',
                'shop_purchase',
                'tournament_commission',
                'free_spin',
                'daily_collect',
                'prize_winnings',
                'admin_adjustment',
                'rank_reward',
                'manual_order'
            ],
            required: true,
        },
        amount: {
            type: Number,
            required: true,
        },
        currency: {
            type: String,
            required: true,
            default: 'PKR',
        },
        userId: {
            type: Schema.Types.ObjectId,
            ref: 'User',
            required: false,
        },
        adminId: {
            type: Schema.Types.ObjectId,
            ref: 'User',
            required: false,
        },
        referenceId: {
            type: Schema.Types.Mixed,
            required: false,
        },
        description: {
            type: String,
            required: false,
        },
        purchaseCost: {
            type: Number,
            required: false,
        },
        calculatedProfit: {
            type: Number,
            required: false,
        },
        timestamp: {
            type: Date,
            default: Date.now,
            required: true,
        }
    },
    { timestamps: true }
);

if (models.FinancialLog) {
    delete models.FinancialLog;
}

const FinancialLog = model('FinancialLog', FinancialLogSchema);

export default FinancialLog;
