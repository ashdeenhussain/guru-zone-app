const mongoose = require('mongoose');

const uri = "mongodb://guru-mdb:QxJXLjXJBkVl7u1h@ac-b7suvb1-shard-00-00.5c5hedd.mongodb.net:27017,ac-b7suvb1-shard-00-01.5c5hedd.mongodb.net:27017,ac-b7suvb1-shard-00-02.5c5hedd.mongodb.net:27017/guru-zone?ssl=true&authSource=admin&retryWrites=true&w=majority";

async function main() {
    await mongoose.connect(uri);
    console.log("Connected to MongoDB.");

    const UserSchema = new mongoose.Schema({ email: String, walletBalance: Number }, { strict: false });
    const User = mongoose.models.User || mongoose.model('User', UserSchema, 'users');

    const TransactionSchema = new mongoose.Schema({ user: mongoose.Schema.Types.ObjectId, amount: Number, type: String, description: String, referenceId: String }, { strict: false });
    const Transaction = mongoose.models.Transaction || mongoose.model('Transaction', TransactionSchema, 'transactions');

    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    // Find refunds today
    const refunds = await Transaction.find({
        type: 'refund',
        createdAt: { $gte: startOfToday }
    }).sort({ createdAt: 1 });

    console.log(`Found ${refunds.length} total refund transactions today.`);

    // Group by user and description
    const grouped = {};
    for (const r of refunds) {
        const key = `${r.user.toString()}_${r.description}`;
        if (!grouped[key]) {
            grouped[key] = [];
        }
        grouped[key].push(r);
    }

    for (const [key, txs] of Object.entries(grouped)) {
        if (txs.length > 1) {
            const userId = key.split('_')[0];
            const desc = key.split('_')[1];
            console.log(`User ${userId} has ${txs.length} duplicate refunds for: ${desc}`);

            const [firstTx, ...duplicateTxs] = txs;

            for (const dupTx of duplicateTxs) {
                console.log(`  Deleting duplicate TX: ${dupTx._id} (Amount: ${dupTx.amount})`);
                await Transaction.findByIdAndDelete(dupTx._id);

                // Deduct from user
                const u = await User.findById(userId);
                if (u) {
                    const oldBalance = u.walletBalance;
                    u.walletBalance -= dupTx.amount;
                    await u.save();
                    console.log(`  Adjusted balance for ${u.email}: ${oldBalance} -> ${u.walletBalance}`);
                }
            }
        }
    }

    await mongoose.disconnect();
}

main().catch(console.error);
