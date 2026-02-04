
import { Schema, model, models } from 'mongoose';

const SpinItemSchema = new Schema(
    {
        label: {
            type: String,
            required: [true, 'Please provide a label'],
        },
        type: {
            type: String,
            enum: ['Coin', 'Product'],
            required: true,
        },
        value: {
            type: Number, // For coins: amount. For Product: meaningless? Or we can use it for visual value.
            required: false,
        },
        product: {
            type: Schema.Types.ObjectId,
            ref: 'StoreProduct',
            required: false, // Required if type is Product
        },
        probability: {
            type: Number,
            required: true,
            min: 0,
            max: 100,
        },
        color: {
            type: String,
            default: '#FFFFFF',
        },
        imageUrl: {
            type: String,
            required: [true, 'Please provide an image URL'],
        },
        isActive: {
            type: Boolean,
            default: true,
        }
    },
    { timestamps: true }
);

const SpinItem = models.SpinItem || model('SpinItem', SpinItemSchema);

export default SpinItem;
