import mongoose from "mongoose";

async function main() {
    await mongoose.connect("mongodb://localhost:27017/guru-zone", {
        useNewUrlParser: true,
        useUnifiedTopology: true
    }).catch(() => mongoose.connect(process.env.MONGODB_URI || "mongodb+srv://test:test@cluster0.mongodb.net/test")); // fallback or just let it fail if env not loaded

    const matches = await mongoose.connection.collection("battlematches").find({}).sort({ createdAt: -1 }).limit(5).toArray();
    console.log(JSON.stringify(matches, null, 2));
    process.exit(0);
}
main();
