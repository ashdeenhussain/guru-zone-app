const mongoose = require('mongoose');

const uri = "mongodb://guru-mdb:QxJXLjXJBkVl7u1h@ac-b7suvb1-shard-00-00.5c5hedd.mongodb.net:27017,ac-b7suvb1-shard-00-01.5c5hedd.mongodb.net:27017,ac-b7suvb1-shard-00-02.5c5hedd.mongodb.net:27017/guru-zone?ssl=true&authSource=admin&retryWrites=true&w=majority";

async function main() {
    await mongoose.connect(uri);
    console.log("Connected to MongoDB.");

    const UserSchema = new mongoose.Schema({ email: String, walletBalance: Number }, { strict: false });
    const User = mongoose.models.User || mongoose.model('User', UserSchema, 'users');

    const TournamentSchema = new mongoose.Schema({ title: String, participants: Array, entryFee: Number }, { strict: false });
    const Tournament = mongoose.models.Tournament || mongoose.model('Tournament', TournamentSchema, 'tournaments');

    const TransactionSchema = new mongoose.Schema({ user: mongoose.Schema.Types.ObjectId, amount: Number, type: String, description: String, referenceId: String }, { strict: false });
    const Transaction = mongoose.models.Transaction || mongoose.model('Transaction', TransactionSchema, 'transactions');

    const tournamentId = "69a55edb81cf13c6f76fce3e";
    const t = await Tournament.findById(tournamentId);

    if (t) {
        console.log(`Processing refunds for: ${t.title}`);

        for (const p of t.participants) {
            const uid = p.userId;

            // Check if already refunded
            const existingRefund = await Transaction.findOne({
                user: uid,
                type: 'refund',
                referenceId: tournamentId
            });

            if (existingRefund) {
                console.log(`User ${uid} was already refunded! Skipping...`);
                continue;
            }

            const u = await User.findById(uid);
            if (u) {
                u.walletBalance += (t.entryFee || 100);
                await u.save();

                await Transaction.create({
                    user: u._id,
                    amount: t.entryFee || 100,
                    type: 'refund',
                    description: `Refund for Cancelled Match: ${t.title}`,
                    status: 'completed',
                    referenceId: t._id
                });
                console.log(`Successfully refunded ${t.entryFee || 100} to User ${uid} (${u.email})`);
            } else {
                console.log(`User ${uid} not found in DB!`);
            }
        }
    } else {
        console.log("Tournament not found!");
    }

    await mongoose.disconnect();
}

main().catch(console.error);
