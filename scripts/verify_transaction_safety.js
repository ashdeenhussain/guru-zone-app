const mongoose = require('mongoose');
require('dotenv').config({ path: '.env.local' });

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
    console.error('Error: MONGODB_URI is not defined.');
    process.exit(1);
}

// minimal schemas
const UserSchema = new mongoose.Schema({
    walletBalance: { type: Number, default: 0 },
    name: String
}, { strict: false });
const User = mongoose.model('User', UserSchema);

const TournamentSchema = new mongoose.Schema({
    title: String,
    status: { type: String, default: 'Open' }
}, { strict: false });
const Tournament = mongoose.model('Tournament', TournamentSchema);

const TransactionSchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    amount: Number,
    type: String,
    referenceId: { type: mongoose.Schema.Types.Mixed, index: true },
    description: String
}, { strict: false, timestamps: true });
const Transaction = mongoose.model('Transaction', TransactionSchema);

async function run() {
    try {
        console.log('Connecting to MongoDB...');
        await mongoose.connect(MONGODB_URI);
        console.log('Connected.');

        // 1. Setup Data
        console.log('\n--- Setting up Test Data ---');
        const user = await User.create({ name: 'Test User', walletBalance: 0 });
        const tournament = await Tournament.create({ title: 'Test Tournament Double Pay', status: 'Live' });
        console.log(`Created User: ${user._id}`);
        console.log(`Created Tournament: ${tournament._id}`);

        // 2. Define the Payment Logic (Simulating the API code)
        const processPayment = async (userId, tournamentId, amount, label) => {
            const session = await mongoose.startSession();
            try {
                await session.withTransaction(async () => {
                    console.log(`[${label}] Starting Transaction...`);

                    // a) Idempotency Check
                    const existing = await Transaction.findOne({
                        user: userId,
                        referenceId: tournamentId,
                        type: 'prize_winnings'
                    }).session(session);

                    if (existing) {
                        console.warn(`[${label}] BLOCKED: Transaction already exists!`);
                        return;
                    }

                    // b) Verify Tournament Status (Optional for this test, but good practice)
                    // const t = await Tournament.findById(tournamentId).session(session);
                    // if(t.status === 'Completed') throw new Error('Already Completed');

                    // c) Execute Payment
                    await User.findByIdAndUpdate(userId, { $inc: { walletBalance: amount } }).session(session);
                    await Transaction.create([{
                        user: userId,
                        amount: amount,
                        type: 'prize_winnings',
                        referenceId: tournamentId,
                        description: 'Test Prize'
                    }], { session: session });

                    console.log(`[${label}] Payment Executed Successfully.`);

                    // Simulate processing time to allow race condition overlap
                    // await new Promise(r => setTimeout(r, 100)); 
                });
            } catch (err) {
                console.error(`[${label}] Transaction Failed:`, err.message);
            } finally {
                await session.endSession();
            }
        };

        // 3. Run Checks
        console.log('\n--- Testing Sequential Double Payment (Should Block 2nd) ---');
        await processPayment(user._id, tournament._id, 100, 'Attempt 1');
        await processPayment(user._id, tournament._id, 100, 'Attempt 2');

        // Check Results
        let finalUser = await User.findById(user._id);
        let txs = await Transaction.find({ user: user._id, referenceId: tournament._id });
        console.log(`\nUser Balance: ${finalUser.walletBalance} (Expected: 100)`);
        console.log(`Transaction Count: ${txs.length} (Expected: 1)`);

        if (finalUser.walletBalance === 100 && txs.length === 1) {
            console.log('✅ Sequential Test PASSED');
        } else {
            console.error('❌ Sequential Test FAILED');
        }

        // 4. Test Concurrent/Race Condition (Optional, harder to deterministicly reproduce without complex setup, but logic ensures it)
        console.log('\n--- Resetting for Concurrent Test ---');
        await Transaction.deleteMany({ referenceId: tournament._id });
        await User.findByIdAndUpdate(user._id, { walletBalance: 0 });

        console.log('--- Running Concurrent Double Payment ---');
        await Promise.all([
            processPayment(user._id, tournament._id, 50, 'Race A'),
            processPayment(user._id, tournament._id, 50, 'Race B'),
            processPayment(user._id, tournament._id, 50, 'Race C')
        ]);

        finalUser = await User.findById(user._id);
        txs = await Transaction.find({ user: user._id, referenceId: tournament._id });
        console.log(`\nUser Balance: ${finalUser.walletBalance} (Expected: 50)`);
        console.log(`Transaction Count: ${txs.length} (Expected: 1)`);

        if (finalUser.walletBalance === 50 && txs.length === 1) {
            console.log('✅ Concurrent Test PASSED');
        } else {
            console.error('❌ Concurrent Test FAILED');
        }

        // Cleanup
        console.log('\n--- Cleaning Up ---');
        await User.deleteOne({ _id: user._id });
        await Tournament.deleteOne({ _id: tournament._id });
        await Transaction.deleteMany({ referenceId: tournament._id });

    } catch (err) {
        console.error('Script Error:', err);
    } finally {
        await mongoose.disconnect();
        console.log('Disconnected.');
    }
}

run();
