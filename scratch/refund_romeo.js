const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../.env.local') });

// Self-contained schemas to avoid import errors
const userSchema = new mongoose.Schema({
    email: String,
    username: String,
    walletBalance: { type: Number, default: 0 }
});
const User = mongoose.models.User || mongoose.model('User', userSchema);

const matchSchema = new mongoose.Schema({
    title: String,
    entryFee: Number
});
const BattleMatch = mongoose.models.BattleMatch || mongoose.model('BattleMatch', matchSchema);

const transactionSchema = new mongoose.Schema({
    user: mongoose.Schema.Types.ObjectId,
    amount: Number,
    type: String,
    description: String,
    status: String,
    referenceId: mongoose.Schema.Types.ObjectId,
    createdAt: { type: Date, default: Date.now }
});
const Transaction = mongoose.models.Transaction || mongoose.model('Transaction', transactionSchema);

async function refundRomeo() {
    try {
        const MONGODB_URI = process.env.MONGODB_URI;
        if (!MONGODB_URI) throw new Error('MONGODB_URI not found');

        await mongoose.connect(MONGODB_URI);
        console.log('Connected to Database');

        const matchId = '69f99331e273b691b82dc1bc';
        const romeoEmail = 'rehanabid198@gmail.com';

        const match = await BattleMatch.findById(matchId);
        if (!match) {
            console.error('Match not found');
            process.exit(1);
        }

        const user = await User.findOne({ email: romeoEmail });
        if (!user) {
            console.error('User Romeo not found');
            process.exit(1);
        }

        // Check if refund already exists
        const existingTx = await Transaction.findOne({
            user: user._id,
            referenceId: match._id,
            type: 'refund'
        });

        if (existingTx) {
            console.log('Romeo has already been refunded for this match.');
            process.exit(0);
        }

        const refundAmount = match.entryFee || 10; // Fallback to 10 if not found
        console.log(`Refunding Romeo (${user.username}) ${refundAmount} coins...`);

        // Perform Refund
        user.walletBalance += refundAmount;
        await user.save();

        await Transaction.create({
            user: user._id,
            amount: refundAmount,
            type: 'refund',
            description: `Coin Refund: ${match.title || 'Battle Match'} (Auto-Cancelled)`,
            status: 'completed',
            referenceId: match._id
        });

        console.log('Refund successful!');
        process.exit(0);

    } catch (error) {
        console.error('Error during refund:', error);
        process.exit(1);
    }
}

refundRomeo();
