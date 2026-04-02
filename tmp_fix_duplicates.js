const mongoose = require('mongoose');

const uri = "mongodb://guru-mdb:QxJXLjXJBkVl7u1h@ac-b7suvb1-shard-00-00.5c5hedd.mongodb.net:27017,ac-b7suvb1-shard-00-01.5c5hedd.mongodb.net:27017,ac-b7suvb1-shard-00-02.5c5hedd.mongodb.net:27017/guru-zone?ssl=true&authSource=admin&retryWrites=true&w=majority";

async function main() {
    await mongoose.connect(uri);
    console.log("Connected to MongoDB.");

    const UserSchema = new mongoose.Schema({ email: String, walletBalance: Number }, { strict: false });
    const User = mongoose.models.User || mongoose.model('User', UserSchema, 'users');

    const TransactionSchema = new mongoose.Schema({ user: mongoose.Schema.Types.ObjectId, amount: Number, type: String, description: String, referenceId: String }, { strict: false });
    const Transaction = mongoose.models.Transaction || mongoose.model('Transaction', TransactionSchema, 'transactions');

    const tournamentId = "69a55edb81cf13c6f76fce3e";

    // Find all refunds for this tournament
    const refunds = await Transaction.find({
        type: 'refund',
        referenceId: tournamentId
    }).sort({ createdAt: 1 });

    console.log(`Found ${refunds.length} refund transactions for this tournament.`);

    // Group by user
    const refundsByUser = {};
    for (const r of refunds) {
        if (!refundsByUser[r.user.toString()]) {
            refundsByUser[r.user.toString()] = [];
        }
        refundsByUser[r.user.toString()].push(r);
    }

    for (const [userId, txs] of Object.entries(refundsByUser)) {
        console.log(`User ${userId} has ${txs.length} refund transactions.`);

        if (txs.length > 1) {
            // Found duplicates
            // Keep the first one, delete the rest, and adjust balance
            const [firstTx, ...duplicateTxs] = txs;

            console.log(`Keeping TX: ${firstTx._id}`);

            for (const dupTx of duplicateTxs) {
                console.log(`Deleting duplicate TX: ${dupTx._id} (Amount: ${dupTx.amount})`);
                await Transaction.findByIdAndDelete(dupTx._id);

                // Deduct from user
                const u = await User.findById(userId);
                if (u) {
                    const oldBalance = u.walletBalance;
                    u.walletBalance -= dupTx.amount;
                    await u.save();
                    console.log(`Adjusted balance for ${u.email}: ${oldBalance} -> ${u.walletBalance}`);
                }
            }
        }
    }

    await mongoose.disconnect();
}

main().catch(console.error);
