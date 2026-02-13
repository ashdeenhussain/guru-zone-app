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

// --- Define Schemas (Minimal) ---

const userSchema = new mongoose.Schema({
    name: String,
    email: String,
    walletBalance: { type: Number, default: 0 },
    transactions: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Transaction' }]
}, { timestamps: true });

const transactionSchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    amount: { type: Number, required: true },
    type: { type: String, required: true },
    description: { type: String, required: true },
    referenceId: { type: mongoose.Schema.Types.Mixed },
    status: { type: String, default: 'completed' }
}, { timestamps: true });

// Avoid OverwriteModelError
const User = mongoose.models.User || mongoose.model("User", userSchema);
const Transaction = mongoose.models.Transaction || mongoose.model("Transaction", transactionSchema);

const tournamentSchema = new mongoose.Schema({
    title: String,
    entryFee: Number,
    participants: [{
        userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        inGameName: String
    }],
    status: String,
    cancellationReason: String
}, { timestamps: true });

const Tournament = mongoose.models.Tournament || mongoose.model("Tournament", tournamentSchema);

async function cancelAndRefund() {
    const TOURNAMENT_ID = "698d662b9e0afbea2bdc52c5";

    try {
        console.log("Connecting to MongoDB...");
        await mongoose.connect(MONGODB_URI);
        console.log("✅ Connected.");

        const tournament = await Tournament.findById(TOURNAMENT_ID);
        if (!tournament) {
            console.error(`❌ Tournament ${TOURNAMENT_ID} not found.`);
            return;
        }

        console.log(`Found Tournament: ${tournament.title}, Status: ${tournament.status}, EntryFee: ${tournament.entryFee}`);
        console.log(`Participants: ${tournament.participants.length}`);

        if (tournament.entryFee <= 0) {
            console.log("Entry fee is 0, no refunds needed.");
            return;
        }

        for (const participant of tournament.participants) {
            const userId = participant.userId;

            // Check if already refunded
            const existingRefund = await Transaction.findOne({
                user: userId,
                type: 'refund',
                referenceId: tournament._id
            });

            if (existingRefund) {
                console.log(`- User ${userId} already refunded.`);
                continue;
            }

            const user = await User.findById(userId);
            if (!user) {
                console.log(`- User ${userId} not found!`);
                continue;
            }

            console.log(`- Refunding User ${user.name} (${userId})...`);

            // Apply Refund
            user.walletBalance += tournament.entryFee;

            const transaction = await Transaction.create({
                user: userId,
                amount: tournament.entryFee,
                type: 'refund',
                description: `Refund for tournament cancellation: ${tournament.title}`,
                referenceId: tournament._id,
                status: 'completed'
            });

            user.transactions.push(transaction._id);
            await user.save();
            console.log(`  ✅ Refunded ${tournament.entryFee} coins. New Balance: ${user.walletBalance}`);
        }

        // Update Tournament Status
        if (tournament.status !== 'Cancelled') {
            tournament.status = 'Cancelled';
            tournament.cancellationReason = tournament.cancellationReason || "Administrative Decision (Script)";
            await tournament.save();
            console.log("✅ Tournament status updated to Cancelled.");
        } else {
            console.log("Tournament already Cancelled.");
        }

    } catch (error) {
        console.error("❌ Error:", error);
    } finally {
        await mongoose.disconnect();
        console.log("Disconnected.");
        process.exit(0);
    }
}

cancelAndRefund();
