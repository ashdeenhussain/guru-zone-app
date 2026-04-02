const mongoose = require('mongoose');

// --- Configuration ---
const MONGODB_URI = "mongodb://guru-mdb:QxJXLjXJBkVl7u1h@ac-b7suvb1-shard-00-00.5c5hedd.mongodb.net:27017,ac-b7suvb1-shard-00-01.5c5hedd.mongodb.net:27017,ac-b7suvb1-shard-00-02.5c5hedd.mongodb.net:27017/guru-zone?ssl=true&authSource=admin&retryWrites=true&w=majority";
const TOURNAMENT_ID = '6992c7388cf132fd8402dd49';
const CANCELLATION_REASON = 'Tournament cancelled due to technical difficulties. Apologies for the inconvenience.';

// --- Schemas (Minimal with strict: false to avoid data loss on save if we were using save(), but we will use update) ---
const UserSchema = new mongoose.Schema({}, { strict: false });
const TransactionSchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    amount: Number,
    type: String,
    description: String,
    referenceId: mongoose.Schema.Types.Mixed,
    status: { type: String, default: 'completed' },
}, { timestamps: true });

const TournamentSchema = new mongoose.Schema({
    title: String,
    entryFee: Number,
    status: String,
    participants: [{
        userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        // other fields we don't need to manipulate
    }],
    cancellationReason: String,
}, { timestamps: true, strict: false });

const NotificationSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    title: String,
    message: String,
    type: { type: String, default: 'info' },
    link: String,
}, { timestamps: true });

// --- Models ---
const User = mongoose.models.User || mongoose.model('User', UserSchema);
const Transaction = mongoose.models.Transaction || mongoose.model('Transaction', TransactionSchema);
const Tournament = mongoose.models.Tournament || mongoose.model('Tournament', TournamentSchema);
const Notification = mongoose.models.Notification || mongoose.model('Notification', NotificationSchema);

async function main() {
    try {
        console.log('Connecting to MongoDB...');
        await mongoose.connect(MONGODB_URI);
        console.log('Connected.');

        const tournament = await Tournament.findById(TOURNAMENT_ID);
        if (!tournament) {
            console.error('Tournament not found!');
            return;
        }

        console.log(`Found tournament: ${tournament.title}`);
        console.log(`Status: ${tournament.status}`);
        console.log(`Entry Fee: ${tournament.entryFee}`);
        const participants = tournament.participants || [];
        console.log(`Participants: ${participants.length}`);

        if (tournament.status === 'Cancelled') {
            console.log('Tournament is already marked as Cancelled.');
            // We should still verify refunds if implicit
        }

        const fee = tournament.entryFee;
        if (fee <= 0) {
            console.log('Free tournament, no refunds needed.');
        } else {
            console.log(`Processing refunds for ${participants.length} participants...`);

            for (const p of participants) {
                const userId = p.userId;

                // Check for existing refund transaction
                const existingRefund = await Transaction.findOne({
                    user: userId,
                    type: 'refund',
                    referenceId: tournament._id
                });

                if (existingRefund) {
                    console.log(`  - Refund already exists for user ${userId} (TxID: ${existingRefund._id}). Skipping.`);
                    continue;
                }

                console.log(`Refunding user ${userId}...`);

                // Create Transaction
                const transaction = await Transaction.create({
                    user: userId,
                    amount: fee,
                    type: 'refund',
                    description: `Refund for tournament cancellation: ${tournament.title}`,
                    referenceId: tournament._id,
                    status: 'completed'
                });

                // Update User Balance safely using $inc
                await User.findByIdAndUpdate(userId, {
                    $inc: { walletBalance: fee },
                    $push: { transactions: transaction._id }
                });

                // Create Notification
                await Notification.create({
                    userId: userId,
                    title: 'Tournament Refund',
                    message: `Tournament "${tournament.title}" has been cancelled. ${fee} coins have been refunded to your wallet.`,
                    type: 'info'
                });

                console.log(`  - Users refunded ${fee} coins.`);
            }
        }

        // Update Tournament Status
        if (tournament.status !== 'Cancelled') {
            await Tournament.findByIdAndUpdate(TOURNAMENT_ID, {
                status: 'Cancelled',
                cancellationReason: CANCELLATION_REASON
            });
            console.log('Tournament status updated to Cancelled.');
        } else {
            console.log('Tournament status was already Cancelled.');
        }

        console.log('Done.');

    } catch (error) {
        console.error('Error:', error);
    } finally {
        await mongoose.disconnect();
    }
}

main();
