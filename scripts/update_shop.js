const mongoose = require("mongoose");
const path = require("path");
const fs = require("fs");

const envLocalPath = path.join(__dirname, "../.env.local");
const envPath = path.join(__dirname, "../.env");

if (fs.existsSync(envLocalPath)) {
    require("dotenv").config({ path: envLocalPath });
    console.log("Loaded .env.local");
} else {
    require("dotenv").config({ path: envPath });
    console.log("Loaded .env");
}

// --- Connect to MongoDB ---
const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
    console.error("❌ MONGODB_URI is not defined in .env");
    process.exit(1);
}

// --- Define Product Schema (Must match src/models/StoreProduct.ts) ---
const productSchema = new mongoose.Schema(
    {
        title: { type: String, required: true },
        category: {
            type: String,
            enum: ["TopUp", "SpecialDeal"],
            required: true,
        },
        priceCoins: { type: Number, required: true },
        bonusDescription: { type: String },
        infoDescription: { type: String },
        costPrice: { type: Number, default: 0 },
        imageType: {
            type: String,
            enum: ["Emoji", "Upload"],
            default: "Emoji",
        },
        imageUrl: { type: String },
        emoji: { type: String },
        isActive: { type: Boolean, default: true },
    },
    { timestamps: true }
);

// Avoid OverwriteModelError
const StoreProduct =
    mongoose.models.StoreProduct || mongoose.model("StoreProduct", productSchema);

// --- New Shop Data ---
const newProducts = [
    {
        title: "13 Diamonds",
        category: "TopUp",
        priceCoins: 200,
        costPrice: 0,
        imageType: "Upload",
        imageUrl: "/shop_items/diamond_1.png",
        isActive: true,
    },
    {
        title: "35 Diamonds",
        category: "TopUp",
        priceCoins: 500,
        costPrice: 0,
        imageType: "Upload",
        imageUrl: "/shop_items/diamond_1.png",
        isActive: true,
    },
    {
        title: "70 Diamonds",
        category: "TopUp",
        priceCoins: 1000,
        costPrice: 0,
        imageType: "Upload",
        imageUrl: "/shop_items/diamond_2.png",
        isActive: true,
    },
    {
        title: "140 Diamonds",
        category: "TopUp",
        priceCoins: 2000,
        costPrice: 0,
        imageType: "Upload",
        imageUrl: "/shop_items/diamond_2.png",
        isActive: true,
    },
    {
        title: "355 Diamonds",
        category: "TopUp",
        priceCoins: 5300,
        costPrice: 0,
        imageType: "Upload",
        imageUrl: "/shop_items/diamond_3.png", // Briefcase
        isActive: true,
    },
    {
        title: "713 Diamonds",
        category: "TopUp",
        priceCoins: 10700,
        costPrice: 0,
        imageType: "Upload",
        imageUrl: "/shop_items/diamond_3.png", // Briefcase
        isActive: true,
    },
    {
        title: "1426 Diamonds",
        category: "TopUp",
        priceCoins: 21400,
        costPrice: 0,
        imageType: "Upload",
        imageUrl: "/shop_items/diamond_4.png", // Chest
        isActive: true,
    },
    {
        title: "3565 Diamonds",
        category: "TopUp",
        priceCoins: 53500,
        costPrice: 0,
        imageType: "Upload",
        imageUrl: "/shop_items/diamond_4.png", // Chest
        isActive: true,
    },
    {
        title: "7130 Diamonds",
        category: "TopUp",
        priceCoins: 107000,
        costPrice: 0,
        imageType: "Upload",
        imageUrl: "/shop_items/diamond_5.png", // Safe
        isActive: true,
    },
    {
        title: "14260 Diamonds",
        category: "TopUp",
        priceCoins: 214000,
        costPrice: 0,
        imageType: "Upload",
        imageUrl: "/shop_items/diamond_5.png", // Safe
        isActive: true,
    },
];

async function updateShop() {
    try {
        console.log("Connecting to MongoDB...");
        await mongoose.connect(MONGODB_URI);
        console.log("✅ Connected.");

        console.log("Clearing existing products...");
        await StoreProduct.deleteMany({});
        console.log("Cleared.");

        console.log("Inserting new products...");
        console.log("Items to insert:", JSON.stringify(newProducts, null, 2));

        await StoreProduct.insertMany(newProducts);
        console.log("✅ Shop updated successfully with 10 new packages!");

    } catch (error) {
        console.error("❌ Update failed:", error);
    } finally {
        await mongoose.disconnect();
        console.log("Disconnected.");
        process.exit(0);
    }
}

updateShop();
