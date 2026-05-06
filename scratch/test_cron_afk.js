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
    adminNote: String
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

async function runCronTest() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to DB');

        const hostId = new mongoose.Types.ObjectId('696f5fab36c1b6e7d2bd5310');
        const joinerId = new mongoose.Types.ObjectId('69722d25e1d7d7749dc7629c');

        const hostBefore = await User.findById(hostId);
        const joinerBefore = await User.findById(joinerId);

        // 1. Create a match that SHOULD be picked up by the new Cron logic
        // Rule: active, no roomID, expiresAt + 30 mins < now
        const match = await BattleMatch.create({
            title: 'Cron Test AFK Match',
            status: 'active',
            createdBy: hostId,
            participants: [{ userId: hostId }, { userId: joinerId }],
            entryFee: 10,
            expiresAt: new Date(Date.now() - 40 * 60 * 1000), // Expired 40 mins ago (Deadline was 10 mins ago)
            roomID: undefined
        });

        await Escrow.create({ matchId: match._id, status: 'held' });
        console.log(`Created match for Cron test: ${match._id}`);

        // 2. Execute the Cron logic for Host AFK
        // We replicate the updated logic in the cron/battle-zone-escrow/route.ts
        const thirtyMinsAgo = new Date(Date.now() - 30 * 60 * 1000);
        const afkMatches = await BattleMatch.find({
            _id: match._id, // Specifically target our test match
            status: 'active',
            expiresAt: { $lte: thirtyMinsAgo },
            roomID: { $exists: false }
        });

        console.log(`Cron found ${afkMatches.length} matches to cancel.`);

        for (const m of afkMatches) {
            const cronSession = await mongoose.startSession();
            cronSession.startTransaction();
            try {
                m.status = 'cancelled';
                m.adminNote = 'System Auto-Cancelled (CRON TEST)';
                await m.save({ session: cronSession });

                for (const p of m.participants) {
                    const u = await User.findById(p.userId).session(cronSession);
                    if (u) {
                        u.walletBalance += m.entryFee;
                        if (p.userId.toString() === m.createdBy.toString()) {
                            u.trustScore = Math.max(0, (u.trustScore || 100) - 10);
                        }
                        await u.save({ session: cronSession });
                        await Transaction.create([{
                            user: p.userId,
                            amount: m.entryFee,
                            type: 'refund',
                            referenceId: m._id
                        }], { session: cronSession });
                    }
                }

                const escrow = await Escrow.findOne({ matchId: m._id }).session(cronSession);
                if (escrow) {
                    escrow.status = 'refunded';
                    await escrow.save({ session: cronSession });
                }

                await cronSession.commitTransaction();
                console.log('Cron cancellation successful');
            } catch (err) {
                await cronSession.abortTransaction();
                console.error('Cron logic failed:', err);
            } finally {
                cronSession.endSession();
            }
        }

        // 3. Verify
        const hostAfter = await User.findById(hostId);
        const joinerAfter = await User.findById(joinerId);
        const updatedMatch = await BattleMatch.findById(match._id);

        console.log('\n--- Cron Verification ---');
        console.log(`Host Balance: ${hostAfter.walletBalance} (Expected: ${hostBefore.walletBalance + 10})`);
        console.log(`Host TS: ${hostAfter.trustScore} (Expected: ${hostBefore.trustScore - 10})`);
        console.log(`Joiner Balance: ${joinerAfter.walletBalance} (Expected: ${joinerBefore.walletBalance + 10})`);
        console.log(`Match Status: ${updatedMatch.status} (Expected: cancelled)`);

        // Cleanup
        await BattleMatch.findByIdAndDelete(match._id);
        await Escrow.findOneAndDelete({ matchId: match._id });
        hostAfter.walletBalance = hostBefore.walletBalance;
        hostAfter.trustScore = hostBefore.trustScore;
        await hostAfter.save();
        joinerAfter.walletBalance = joinerBefore.walletBalance;
        await joinerAfter.save();

        process.exit(0);

    } catch (error) {
        console.error('Critical Error:', error);
        process.exit(1);
    }
}

runCronTest();
