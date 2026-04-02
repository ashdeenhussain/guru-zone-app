const mongoose = require('mongoose');
const path = require('path');
const dotenv = require('dotenv');

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });
if (!process.env.MONGODB_URI) { dotenv.config(); }

const MONGO_URI = process.env.MONGODB_URI;

const TournamentSchema = new mongoose.Schema({
    title: String,
    entryFee: Number,
    participants: [{
        userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    }]
}, { timestamps: true });

const UserSchema = new mongoose.Schema({
    name: String,
    walletBalance: Number,
    transactions: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Transaction' }]
});

const TransactionSchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    amount: Number,
    type: String,
    description: String,
    referenceId: mongoose.Schema.Types.Mixed,
    status: String
}, { timestamps: true });

const Tournament = mongoose.models.Tournament || mongoose.model('Tournament', TournamentSchema);
const User = mongoose.models.User || mongoose.model('User', UserSchema);
const Transaction = mongoose.models.Transaction || mongoose.model('Transaction', TransactionSchema);

const TOURNAMENT_ID = '6991496291743c4b06e71cda';

async function main() {
    try {
        await mongoose.connect(MONGO_URI);
        console.log(`Connected to DB. Processing refund for Tournament ID: ${TOURNAMENT_ID}`);

        const session = await mongoose.startSession();
        session.startTransaction();

        try {
            const tournament = await Tournament.findById(TOURNAMENT_ID).session(session);
            if (!tournament) {
                throw new Error('Tournament not found');
            }

            console.log(`Tournament: ${tournament.title}, Entry Fee: ${tournament.entryFee}, Participants: ${tournament.participants.length}`);

            if (tournament.participants.length === 0) {
                console.log('No participants to refund.');
                await session.abortTransaction();
                return;
            }

            for (const p of tournament.participants) {
                if (!p.userId) continue;

                const user = await User.findById(p.userId).session(session);
                if (!user) {
                    console.log(`User ${p.userId} not found.`);
                    continue;
                }

                // Check for existing refund
                const existingRefund = await Transaction.findOne({
                    user: user._id,
                    type: 'refund',
                    referenceId: tournament._id
                }).session(session);

                if (existingRefund) {
                    console.log(`User ${user.name} already refunded. Skipping.`);
                    continue;
                }

                // Refund
                const refundAmount = tournament.entryFee;
                console.log(`Refunding ${user.name} (${user._id}) amount: ${refundAmount}`);

                const [transaction] = await Transaction.create([{
                    user: user._id,
                    amount: refundAmount,
                    type: 'refund',
                    description: `Refund for tournament cancellation: ${tournament.title}`,
                    referenceId: tournament._id,
                    status: 'completed'
                }], { session });

                user.walletBalance += refundAmount;
                user.transactions.push(transaction._id);
                await user.save({ session });

                console.log(`  -> Refunded. New Balance: ${user.walletBalance}`);
            }

            await session.commitTransaction();
            console.log('Refund process completed successfully.');

        } catch (err) {
            console.error('Transaction failed, aborting:', err);
            await session.abortTransaction();
        } finally {
            session.endSession();
        }

    } catch (error) {
        console.error(error);
    } finally {
        await mongoose.disconnect();
    }
}

main();
