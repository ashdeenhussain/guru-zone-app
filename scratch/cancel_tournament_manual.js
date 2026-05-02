const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables
dotenv.config({ path: '.env.local' });

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
    console.error('MONGODB_URI is not defined in .env.local');
    process.exit(1);
}

// Define Schemas (simplified for script)
const TournamentSchema = new mongoose.Schema({
    title: String,
    status: String,
    entryFee: Number,
    participants: [{
        userId: mongoose.Schema.Types.ObjectId,
        joinedAt: Date
    }],
    cancellationReason: String,
    createdBy: mongoose.Schema.Types.ObjectId
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
    isRead: { type: Boolean, default: false },
    type: String,
    data: mongoose.Schema.Types.Mixed
}, { timestamps: true });

const Tournament = mongoose.models.Tournament || mongoose.model('Tournament', TournamentSchema);
const User = mongoose.models.User || mongoose.model('User', UserSchema);
const Transaction = mongoose.models.Transaction || mongoose.model('Transaction', TransactionSchema);
const Notification = mongoose.models.Notification || mongoose.model('Notification', NotificationSchema);

async function cancelTournament(tournamentId, reason) {
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to DB');

    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        const tournament = await Tournament.findById(tournamentId).session(session);
        if (!tournament) {
            throw new Error('Tournament not found');
        }

        console.log(`Found tournament: ${tournament.title}, Status: ${tournament.status}`);
        console.log(`Entry Fee: ${tournament.entryFee}, Participants: ${tournament.participants.length}`);

        if (tournament.status === 'Cancelled') {
            console.log('Tournament is already cancelled.');
            await session.abortTransaction();
            return;
        }

        // Refund Logic
        if (tournament.entryFee > 0 && tournament.participants && tournament.participants.length > 0) {
            console.log(`Processing refunds for ${tournament.participants.length} participants...`);
            for (const participant of tournament.participants) {
                const user = await User.findById(participant.userId).session(session);
                if (user) {
                    // Create Transaction Record
                    const [transaction] = await Transaction.create([{
                        user: user._id,
                        amount: tournament.entryFee,
                        type: 'refund',
                        description: `Refund for tournament cancellation: ${tournament.title}`,
                        referenceId: tournament._id,
                        status: 'completed'
                    }], { session });

                    // Update User Balance
                    user.walletBalance += tournament.entryFee;
                    user.transactions.push(transaction._id);
                    await user.save({ session });

                    // Send Notification
                    await Notification.create([{
                        userId: user._id,
                        type: 'Tournament',
                        title: 'Tournament Cancelled',
                        message: `Tournament "${tournament.title}" has been cancelled. ${tournament.entryFee} coins have been refunded to your wallet.`,
                        data: { tournamentId: tournament._id }
                    }], { session });
                    
                    console.log(`Refunded ${tournament.entryFee} to User ${user._id}`);
                } else {
                    console.warn(`User ${participant.userId} not found, skipping refund.`);
                }
            }
        }

        // Update Status
        tournament.status = 'Cancelled';
        tournament.cancellationReason = reason;
        await tournament.save({ session });

        await session.commitTransaction();
        console.log('Tournament cancelled and refunds processed successfully.');

    } catch (error) {
        await session.abortTransaction();
        console.error('Error cancelling tournament:', error);
    } finally {
        session.endSession();
        await mongoose.connection.close();
    }
}

const TOURNAMENT_ID = '69edf83a2976b724620bb0ab';
const REASON = 'no enough player to start tournament';

cancelTournament(TOURNAMENT_ID, REASON);
