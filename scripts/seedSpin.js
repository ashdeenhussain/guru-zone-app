const mongoose = require('mongoose');
require('dotenv').config({ path: '.env.local' });

const seedSpin = async () => {
    try {
        if (!process.env.MONGODB_URI) {
            throw new Error('MONGODB_URI is not defined in .env.local');
        }

        console.log('Connecting to MongoDB...');
        await mongoose.connect(process.env.MONGODB_URI);

        const SpinItemSchema = new mongoose.Schema({
            label: String,
            type: { type: String, enum: ['coins', 'product'] },
            value: mongoose.Schema.Types.Mixed,
            probability: Number,
            color: String,
            isActive: Boolean
        });

        const SpinItem = mongoose.models.SpinItem || mongoose.model('SpinItem', SpinItemSchema);

        // Mix of Coins and "Shop Items" (Text only as requested)
        const items = [
            { label: "100 Coins", type: "coins", value: 100, probability: 30, color: "#e74c3c", isActive: true },      // Red
            { label: "Weekly Lite", type: "product", value: "weekly_lite_id", probability: 5, color: "#3498db", isActive: true },     // Blue
            { label: "50 Diamonds", type: "product", value: "50_diamonds_id", probability: 10, color: "#9b59b6", isActive: true },      // Purple
            { label: "500 Coins", type: "coins", value: 500, probability: 15, color: "#f39c12", isActive: true },       // Orange
            { label: "Monthly Pass", type: "product", value: "monthly_pass_id", probability: 1, color: "#16a085", isActive: true },     // Teal (Jackpot)
            { label: "200 Coins", type: "coins", value: 200, probability: 20, color: "#2c3e50", isActive: true },     // Dark Blue
            { label: "100 Diamonds", type: "product", value: "100_diamonds_id", probability: 4, color: "#8e44ad", isActive: true },      // Dark Purple
            { label: "50 Coins", type: "coins", value: 50, probability: 15, color: "#f1c40f", isActive: true },    // Yellow
        ];

        console.log('Clearing spin items...');
        await SpinItem.deleteMany({});

        console.log('Seeding spin items...');
        await SpinItem.insertMany(items);

        console.log('Spin Wheel seeded successfully!');

    } catch (error) {
        console.error('Seeding failed:', error);
    } finally {
        await mongoose.disconnect();
        process.exit();
    }
};

seedSpin();
