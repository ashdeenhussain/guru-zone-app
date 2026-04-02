import mongoose from 'mongoose';
import Tournament from './src/models/Tournament';
import User from './src/models/User';
import Transaction from './src/models/Transaction';
import Notification from './src/models/Notification';

const MONGODB_URI = "mongodb://guru-mdb:QxJXLjXJBkVl7u1h@ac-b7suvb1-shard-00-00.5c5hedd.mongodb.net:27017,ac-b7suvb1-shard-00-01.5c5hedd.mongodb.net:27017,ac-b7suvb1-shard-00-02.5c5hedd.mongodb.net:27017/guru-zone?ssl=true&authSource=admin&retryWrites=true&w=majority";

async function cancelAndRefund() {
    try {
        await mongoose.connect(MONGODB_URI);
        console.log("Connected to DB");

        const t = await Tournament.find({ title: /Sunday War/i }).sort({ createdAt: -1 }).limit(1);
        if (t.length === 0) {
            console.log("Sunday War tournament not found.");
            process.exit(0);
        }

        const tournament = t[0];
        console.log(`Found tournament: ${tournament._id}, Status: ${tournament.status}`);

        if (['Cancelled', 'Completed'].includes(tournament.status)) {
            console.log("Tournament is already cancelled or completed.");
            process.exit(0);
        }

        let refundedCount = 0;

        if (tournament.entryFee > 0 && tournament.participants && tournament.participants.length > 0) {
            for (const participant of tournament.participants) {
                const user = await User.findById(participant.userId);
                if (user) {
                    const [transaction] = await Transaction.create([{
                        user: user._id,
                        amount: tournament.entryFee,
                        type: 'refund',
                        description: `Refund for tournament cancellation: ${tournament.title}`,
                        referenceId: tournament._id,
                        status: 'completed'
                    }]);

                    user.walletBalance += tournament.entryFee;
                    user.transactions.push(transaction._id);
                    await user.save();

                    await Notification.create([{
                        userId: user._id,
                        type: 'Tournament',
                        title: 'Tournament Cancelled',
                        message: `Tournament "${tournament.title}" has been cancelled. ${tournament.entryFee} coins have been refunded.`,
                        data: { tournamentId: tournament._id }
                    }]);
                    refundedCount++;
                    console.log(`Refunded user: ${user.name}`);
                }
            }
        }

        tournament.status = 'Cancelled';
        tournament.cancellationReason = 'Administrative Decision (Requested)';
        await tournament.save();

        console.log(`Tournament marked as Cancelled. Total refunded: ${refundedCount}`);
        process.exit(0);
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
}

cancelAndRefund();
