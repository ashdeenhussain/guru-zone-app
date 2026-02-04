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
const MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost:27017/guru-zone";

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

// --- Define SystemSetting Schema (Minimal) ---
const systemSettingSchema = new mongoose.Schema({
    bannerImages: {
        type: [{
            url: { type: String, required: true },
            location: { type: String, enum: ['home', 'shop', 'both'], default: 'both' }
        }],
        default: []
    }
}, { strict: false });

const SystemSetting = mongoose.models.SystemSetting || mongoose.model("SystemSetting", systemSettingSchema);


// --- Seed Data ---
const seedProducts = [
    // --- Special Deals (Banners) ---
    {
        title: "Weekly Membership",
        category: "SpecialDeal",
        priceCoins: 3500,
        costPrice: 500, // PKR estimated
        bonusDescription: "Get 450 Diamonds + Daily perks for 7 days!",
        infoDescription: "Weekly Membership gives you 60 diamonds daily for 7 days, plus a special icon.",
        imageType: "Upload",
        imageUrl: "/shop/weekly.svg",
        isActive: true,
    },
    {
        title: "Monthly Membership",
        category: "SpecialDeal",
        priceCoins: 15000,
        costPrice: 2000, // PKR estimated
        bonusDescription: "Get 2600 Diamonds + Exclusive icon for 30 days!",
        infoDescription: "Monthly Membership gives you 70 diamonds daily for 30 days, plus 500 instant diamonds.",
        imageType: "Upload",
        imageUrl: "/shop/monthly.svg",
        isActive: true,
    },

    // --- Top-Up Packs (Standard) ---
    {
        title: "13 Diamonds",
        category: "TopUp",
        priceCoins: 200,
        costPrice: 20,
        imageType: "Emoji",
        emoji: "💎",
        isActive: true,
    },
    {
        title: "35 Diamonds",
        category: "TopUp",
        priceCoins: 500,
        costPrice: 50,
        imageType: "Emoji",
        emoji: "💎",
        isActive: true,
    },
    {
        title: "70 Diamonds",
        category: "TopUp",
        priceCoins: 950,
        costPrice: 100,
        imageType: "Emoji",
        emoji: "💎",
        isActive: true,
    },
    {
        title: "140 Diamonds",
        category: "TopUp",
        priceCoins: 1800,
        costPrice: 200,
        imageType: "Emoji",
        emoji: "💎",
        isActive: true,
    },
    {
        title: "355 Diamonds",
        category: "TopUp",
        priceCoins: 4500,
        costPrice: 500,
        imageType: "Emoji",
        emoji: "💎",
        isActive: true,
    },
    {
        title: "710 Diamonds",
        category: "TopUp",
        priceCoins: 8500,
        costPrice: 1000,
        imageType: "Emoji",
        emoji: "💎",
        isActive: true,
    },
];

async function seedShop() {
    try {
        console.log("Connecting to MongoDB...");
        await mongoose.connect(MONGODB_URI);
        console.log("✅ Connected.");

        console.log("Clearing existing products...");
        await StoreProduct.deleteMany({});
        console.log("Cleared.");

        console.log("Inserting seed products...");
        await StoreProduct.insertMany(seedProducts);
        console.log("✅ Shop products seeded successfully!");

        console.log("Seeding Banner Images in SystemSettings...");
        await SystemSetting.findOneAndUpdate({}, {
            $set: {
                bannerImages: [
                    { url: "/shop/event.svg", location: "both" },
                    { url: "/shop/weekly.svg", location: "shop" },
                    { url: "/shop/monthly.svg", location: "shop" },
                    { url: "/shop/special.svg", location: "home" }
                ]
            }
        }, { upsert: true, new: true });
        console.log("✅ Banners updated with location info.");

        console.log(`Included ${seedProducts.length} items.`);
    } catch (error) {
        console.error("❌ Seed failed:", error);
    } finally {
        await mongoose.disconnect();
        console.log("Disconnected.");
        process.exit(0);
    }
}

seedShop();
