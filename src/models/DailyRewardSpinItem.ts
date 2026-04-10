import { Schema, model, models } from 'mongoose';

const DailyRewardSpinItemSchema = new Schema(
    {
        label: {
            type: String,
            required: [true, 'Please provide a label'],
        },
        value: {
            type: Number,
            required: true,
            default: 0,
        },
        probability: {
            type: Number,
            required: true,
            min: 0,
            max: 100,
        },
        color: {
            type: String,
            default: '#9333ea',
        },
        isActive: {
            type: Boolean,
            default: true,
        }
    },
    { timestamps: true }
);

const DailyRewardSpinItem = models.DailyRewardSpinItem || model('DailyRewardSpinItem', DailyRewardSpinItemSchema);

export default DailyRewardSpinItem;
