const mongoose = require('mongoose');

const uri = "mongodb://guru-mdb:QxJXLjXJBkVl7u1h@ac-b7suvb1-shard-00-00.5c5hedd.mongodb.net:27017,ac-b7suvb1-shard-00-01.5c5hedd.mongodb.net:27017,ac-b7suvb1-shard-00-02.5c5hedd.mongodb.net:27017/guru-zone?ssl=true&authSource=admin&retryWrites=true&w=majority";

async function main() {
    await mongoose.connect(uri);
    console.log("Connected to MongoDB.");

    const TournamentSchema = new mongoose.Schema({
        title: String,
        status: String,
        cancellationReason: String,
        participants: [{ userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' } }],
        entryFee: Number
    }, { strict: false });
    const Tournament = mongoose.models.Tournament || mongoose.model('Tournament', TournamentSchema, 'tournaments');

    const UserSchema = new mongoose.Schema({ walletBalance: Number }, { strict: false });
    const User = mongoose.models.User || mongoose.model('User', UserSchema, 'users');

    const TransactionSchema = new mongoose.Schema({}, { strict: false });
    const Transaction = mongoose.models.Transaction || mongoose.model('Transaction', TransactionSchema, 'transactions');

    // Find the tournament
    const t = await Tournament.findById("69a55edb81cf13c6f76fce3e"); // The ID we found earlier
    if (t) {
        console.log(`Found tournament: ${t.title}`);
        if (t.status === 'Cancelled') {
            console.log("Tournament already cancelled.");
        } else {
            const session = await mongoose.startSession();
            session.startTransaction();

            try {
                t.status = 'Cancelled';
                t.cancellationReason = "Due to technical issues, we are unable to start this match on time. We apologize for the inconvenience and your coins have been fully refunded.";
                t.isVisible = false;
                await t.save({ session });

                for (const p of t.participants) {
                    const u = await User.findById(p.userId);
                    if (u) {
                        u.walletBalance += t.entryFee;
                        await u.save({ session });

                        await Transaction.create([{
                            user: u._id,
                            amount: t.entryFee,
                            type: 'refund',
                            description: `Refund for Cancelled Match: ${t.title}`,
                            status: 'completed',
                            referenceId: t._id
                        }], { session });
                        console.log(`Refunded ${t.entryFee} to ${u._id}`);
                    }
                }
                await session.commitTransaction();
                console.log("Successfully cancelled and refunded.");
            } catch (e) {
                await session.abortTransaction();
                console.error("Error during cancellation:", e);
            } finally {
                session.endSession();
            }
        }
    } else {
        console.log("Tournament not found!");
    }

    await mongoose.disconnect();
}

main().catch(console.error);
