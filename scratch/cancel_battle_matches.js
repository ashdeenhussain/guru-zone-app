const mongoose = require('mongoose');
const dotenv = require('dotenv');

dotenv.config({ path: '.env.local' });

const MONGODB_URI = process.env.MONGODB_URI;

// Define Schemas (simplified)
const TournamentSchema = new mongoose.Schema({
    title: String,
    status: String,
    entryFee: Number,
    participants: [{ userId: mongoose.Schema.Types.ObjectId }],
    cancellationReason: String
}, { timestamps: true });

const UserSchema = new mongoose.Schema({
    walletBalance: { type: Number, default: 0 },
    transactions: [mongoose.Schema.Types.ObjectId]
});

const TransactionSchema = new mongoose.Schema({
    user: mongoose.Schema.Types.ObjectId,
    amount: Number,
    type: String,
    description: String,
    referenceId: mongoose.Schema.Types.ObjectId,
    status: String
}, { timestamps: true });

const NotificationSchema = new mongoose.Schema({
    userId: mongoose.Schema.Types.ObjectId,
    title: String,
    message: String,
    type: String,
    data: mongoose.Schema.Types.Mixed
}, { timestamps: true });

const Tournament = mongoose.models.Tournament || mongoose.model('Tournament', TournamentSchema);
const User = mongoose.models.User || mongoose.model('User', UserSchema);
const Transaction = mongoose.models.Transaction || mongoose.model('Transaction', TransactionSchema);
const Notification = mongoose.models.Notification || mongoose.model('Notification', NotificationSchema);

async function cancelMatch(matchId, reason) {
    console.log(`Cancelling match ${matchId}...`);
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        const match = await Tournament.findById(matchId).session(session);
        if (!match) {
            console.error(`Match ${matchId} not found`);
            await session.abortTransaction();
            return;
        }

        console.log(`Found: ${match.title}, Status: ${match.status}, Fee: ${match.entryFee}`);

        if (['cancelled', 'completed'].includes(match.status.toLowerCase())) {
            console.log(`Match ${matchId} is already ${match.status}`);
            await session.abortTransaction();
            return;
        }

        // Refund participants
        if (match.entryFee > 0 && match.participants && match.participants.length > 0) {
            for (const p of match.participants) {
                const user = await User.findById(p.userId).session(session);
                if (user) {
                    user.walletBalance += match.entryFee;
                    
                    const [trx] = await Transaction.create([{
                        user: user._id,
                        amount: match.entryFee,
                        type: 'refund',
                        description: `Refund for cancelled match: ${match.title}`,
                        referenceId: match._id,
                        status: 'completed'
                    }], { session });
                    
                    user.transactions.push(trx._id);
                    await user.save({ session });

                    await Notification.create([{
                        userId: user._id,
                        type: 'Tournament',
                        title: 'Match Cancelled',
                        message: `The match "${match.title}" has been cancelled. ${match.entryFee} coins have been refunded to your wallet.`,
                        data: { matchId: match._id }
                    }], { session });
                    
                    console.log(`Refunded ${match.entryFee} to User ${user._id}`);
                }
            }
        }

        match.status = 'cancelled';
        match.cancellationReason = reason;
        await match.save({ session });

        await session.commitTransaction();
        console.log(`Match ${matchId} cancelled successfully.`);

    } catch (err) {
        await session.abortTransaction();
        console.error(`Error cancelling match ${matchId}:`, err);
    } finally {
        session.endSession();
    }
}

async function main() {
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to DB');

    const matches = [
        { id: '69ef0f08b83eb4f514e946e1', reason: 'Admin Force Cancelled (P2P Battle Zone)' },
        { id: '69ecdc60c0d6fbc44c421c8e', reason: 'Admin Force Cancelled (Disputed Battle Zone)' }
    ];

    for (const m of matches) {
        await cancelMatch(m.id, m.reason);
    }

    await mongoose.connection.close();
    console.log('Done');
}

main();
