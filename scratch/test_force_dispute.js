const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../.env.local') });

// Redefine schemas
const User = mongoose.models.User || mongoose.model('User', new mongoose.Schema({
    walletBalance: { type: Number, default: 0 },
    trustScore: { type: Number, default: 100 }
}));

const BattleMatch = mongoose.models.BattleMatch || mongoose.model('BattleMatch', new mongoose.Schema({
    title: String,
    status: String,
    createdBy: mongoose.Schema.Types.ObjectId,
    participants: [{ userId: mongoose.Schema.Types.ObjectId }],
    entryFee: Number,
    expiresAt: Date,
    roomID: String,
    adminNote: String,
    resolutionComment: String
}));

const Escrow = mongoose.models.Escrow || mongoose.model('Escrow', new mongoose.Schema({
    matchId: mongoose.Schema.Types.ObjectId,
    status: String
}));

const Transaction = mongoose.models.Transaction || mongoose.model('Transaction', new mongoose.Schema({
    user: mongoose.Schema.Types.ObjectId,
    amount: Number,
    type: String,
    referenceId: mongoose.Schema.Types.ObjectId
}));

const Notification = mongoose.models.Notification || mongoose.model('Notification', new mongoose.Schema({
    userId: mongoose.Schema.Types.ObjectId,
    title: String,
    message: String
}));

async function runTest() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to DB');

        const hostId = new mongoose.Types.ObjectId('696f5fab36c1b6e7d2bd5310');
        const joinerId = new mongoose.Types.ObjectId('69722d25e1d7d7749dc7629c');

        // Capture initial states
        const hostBefore = await User.findById(hostId);
        const joinerBefore = await User.findById(joinerId);
        console.log(`Initial Host Balance: ${hostBefore.walletBalance}, TS: ${hostBefore.trustScore}`);
        console.log(`Initial Joiner Balance: ${joinerBefore.walletBalance}`);

        // 1. Create Test Match (Expired, No Room ID, Active)
        const match = await BattleMatch.create({
            title: 'Test Force Dispute Match',
            status: 'active',
            createdBy: hostId,
            participants: [{ userId: hostId }, { userId: joinerId }],
            entryFee: 10,
            expiresAt: new Date(Date.now() - 60 * 60 * 1000), // 1 hour ago
            roomID: undefined // Missing Room ID
        });

        await Escrow.create({
            matchId: match._id,
            status: 'held'
        });

        console.log(`Created Test Match: ${match._id}`);

        // 2. Simulate Case A (Force Dispute - No Room ID)
        // We will execute the logic I just added to the API
        const dbSession = await mongoose.startSession();
        dbSession.startTransaction();

        try {
            console.log('Executing Refund Flow (Case A)...');
            match.status = 'cancelled';
            match.adminNote = 'System Auto-Cancelled (TEST)';
            await match.save({ session: dbSession });

            for (const participant of match.participants) {
                const pId = participant.userId;
                const user = await User.findById(pId).session(dbSession);
                if (user) {
                    user.walletBalance += match.entryFee;
                    
                    const isHost = pId.toString() === match.createdBy.toString();
                    if (isHost) {
                        user.trustScore = Math.max(0, (user.trustScore || 100) - 10);
                    }

                    await user.save({ session: dbSession });

                    await Transaction.create([{
                        user: pId,
                        amount: match.entryFee,
                        type: 'refund',
                        referenceId: match._id
                    }], { session: dbSession });
                }
            }

            const escrow = await Escrow.findOne({ matchId: match._id }).session(dbSession);
            if (escrow) {
                escrow.status = 'refunded';
                await escrow.save({ session: dbSession });
            }

            await dbSession.commitTransaction();
            console.log('Transaction Committed Successfully');
        } catch (err) {
            await dbSession.abortTransaction();
            console.error('Test Logic Failed:', err);
        } finally {
            dbSession.endSession();
        }

        // 3. Verify Results
        const hostAfter = await User.findById(hostId);
        const joinerAfter = await User.findById(joinerId);
        const updatedMatch = await BattleMatch.findById(match._id);
        const updatedEscrow = await Escrow.findOne({ matchId: match._id });

        console.log('\n--- Test Verification ---');
        console.log(`Host Balance: ${hostAfter.walletBalance} (Expected: ${hostBefore.walletBalance + 10})`);
        console.log(`Host TS: ${hostAfter.trustScore} (Expected: ${hostBefore.trustScore - 10})`);
        console.log(`Joiner Balance: ${joinerAfter.walletBalance} (Expected: ${joinerBefore.walletBalance + 10})`);
        console.log(`Match Status: ${updatedMatch.status} (Expected: cancelled)`);
        console.log(`Escrow Status: ${updatedEscrow.status} (Expected: refunded)`);

        // Cleanup test data
        await BattleMatch.findByIdAndDelete(match._id);
        await Escrow.findOneAndDelete({ matchId: match._id });
        
        // Restore user states for the sake of the environment
        hostAfter.walletBalance = hostBefore.walletBalance;
        hostAfter.trustScore = hostBefore.trustScore;
        await hostAfter.save();
        joinerAfter.walletBalance = joinerBefore.walletBalance;
        await joinerAfter.save();
        console.log('\nCleaned up test data and restored user balances.');

        process.exit(0);

    } catch (error) {
        console.error('Critical Error:', error);
        process.exit(1);
    }
}

runTest();
