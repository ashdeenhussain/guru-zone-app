import { Schema, model, models } from 'mongoose';

const StoreProductSchema = new Schema(
    {
        title: {
            type: String,
            required: [true, 'Please provide a product title'],
        },
        category: {
            type: String,
            enum: ['TopUp', 'SpecialDeal'],
            required: [true, 'Please provide a category'],
        },
        priceCoins: {
            type: Number,
            required: [true, 'Please provide a price in coins'],
            min: 0,
        },
        bonusDescription: {
            type: String,
            // Optional
        },
        infoDescription: {
            type: String,
            // Text for the popup details
        },
        costPrice: {
            type: Number,
            required: [true, 'Please provide a cost price in PKR'],
            default: 0,
        },
        imageType: {
            type: String,
            enum: ['Emoji', 'Upload'],
            default: 'Emoji',
        },
        imageUrl: {
            type: String,
            // Required if imageType is Upload, but handling validation in logic or frontend is often easier
        },
        emoji: {
            type: String,
            // default: '💎',
        },
        isActive: {
            type: Boolean,
            default: true,
        },
    },
    { timestamps: true }
);

const StoreProduct = models.StoreProduct || model('StoreProduct', StoreProductSchema);

export default StoreProduct;
