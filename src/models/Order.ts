import { Schema, model, models } from 'mongoose';

const OrderSchema = new Schema(
    {
        userId: {
            type: Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
        productId: {
            type: Schema.Types.ObjectId,
            ref: 'StoreProduct',
            required: true,
        },
        pricePaid: {
            type: Number,
            required: true,
            min: 0,
        },
        status: {
            type: String,
            enum: ['Pending', 'Approved', 'Rejected'],
            default: 'Pending',
        },
        source: {
            type: String,
            enum: ['shop', 'spin'],
            default: 'shop',
        },
        userDetails: {
            inGameName: {
                type: String,
                required: true,
            },
            uid: {
                type: String, // Free Fire UID is usually a string of numbers
                required: true,
            },
        },
        adminComment: {
            type: String,
            // Optional
        },
    },
    { timestamps: true }
);

const Order = models.Order || model('Order', OrderSchema);

export default Order;
