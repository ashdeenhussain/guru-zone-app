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
            enum: ['pending', 'approved', 'rejected', 'Pending', 'Approved', 'Rejected'],
            default: 'pending',
        },
        source: {
            type: String,
            enum: ['shop', 'spin', 'manual'],
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
        purchaseCost: {
            type: Number,
            required: false,
        },
        calculatedProfit: {
            type: Number,
            required: false,
        },
    },
    { timestamps: true }
);

if (models.Order) {
    delete models.Order;
}

const Order = model('Order', OrderSchema);

export default Order;
