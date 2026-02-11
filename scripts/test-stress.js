/**
 * Stress Test Script for Concurrency & Refunds
 * 
 * This script verifies:
 * 1. Race Condition Protection (Double Spending Prevention)
 * 2. Automatic Refund Processing
 */

const mongoose = require('mongoose');
require('dotenv').config({ path: '.env.local' });

// Model variables
let User, Tournament, Transaction;

// Database Connection
async function connectDB() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ Connected to MongoDB\n');

        // Define models inline (commonJS compatible)
        const { Schema, model, models } = mongoose;

        // User Schema
        const UserSchema = new Schema({
            name: { type: String, required: true },
            email: { type: String, required: true, unique: true },
            password: { type: String, required: false, select: false },
            role: { type: String, enum: ['user', 'admin'], default: 'user' },
            walletBalance: { type: Number, default: 0 },
            totalWins: { type: Number, default: 0 },
            netEarnings: { type: Number, default: 0 },
            tournamentsPlayed: [{ type: Schema.Types.ObjectId, ref: 'Tournament' }],
            transactions: [{ type: Schema.Types.ObjectId, ref: 'Transaction' }],
            inGameName: { type: String, default: "" },
            freeFireUid: { type: String, default: "" },
        }, { timestamps: true });

        // Tournament Schema
        const TournamentSchema = new Schema({
            title: { type: String, required: true },
            format: { type: String, enum: ['Solo', 'Duo', 'Squad'], required: true },
            gameType: { type: String, enum: ['BR', 'CS'], required: true },
            entryFee: { type: Number, required: true, default: 0 },
            prizePool: { type: Number, required: true },
            maxSlots: { type: Number, required: true },
            joinedCount: { type: Number, default: 0 },
            startTime: { type: Date, required: true },
            participants: [{
                userId: { type: Schema.Types.ObjectId, ref: 'User' },
                inGameName: String,
                uid: String,
            }],
            status: { type: String, enum: ['Open', 'Live', 'Completed', 'Cancelled'], default: 'Open' },
        }, { timestamps: true });

        // Transaction Schema
        const TransactionSchema = new Schema({
            user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
            amount: { type: Number, required: true },
            type: {
                type: String,
                enum: ['deposit', 'withdrawal', 'entry_fee', 'prize_winnings', 'refund', 'shop_purchase', 'spin_win', 'ADMIN_ADJUSTMENT'],
                required: true,
            },
            description: { type: String, required: true },
            status: {
                type: String,
                enum: ['pending', 'approved', 'rejected'],
                default: 'pending',
            },
        }, { timestamps: true });

        // Create or reuse models
        User = models.User || model('User', UserSchema);
        Tournament = models.Tournament || model('Tournament', TournamentSchema);
        Transaction = models.Transaction || model('Transaction', TransactionSchema);

    } catch (error) {
        console.error('❌ MongoDB Connection Error:', error);
        process.exit(1);
    }
}

// Cleanup Test Data
async function cleanup() {
    try {
        await User.deleteMany({ email: { $regex: /^test-stress-.*@test\.com$/ } });
        await Tournament.deleteMany({ title: { $regex: /^TEST-STRESS/ } });
        console.log('🧹 Cleaned up previous test data\n');
    } catch (error) {
        console.error('Cleanup error:', error);
    }
}

// Create Test User
async function createTestUser(email, name, balance = 0) {
    const user = await User.create({
        name,
        email,
        password: 'test123',
        provider: 'credentials',
        walletBalance: balance,
        role: 'user'
    });
    return user;
}

// Create Test Tournament
async function createTestTournament(entryFee, title) {
    const tournament = await Tournament.create({
        title,
        format: 'Solo',
        gameType: 'BR',
        entryFee,
        prizePool: entryFee * 10,
        maxSlots: 100,
        startTime: new Date(Date.now() + 3600000), // 1 hour from now
        status: 'Open'
    });
    return tournament;
}

// Simulate Join Request (Mocks the API call)
async function attemptJoin(userId, tournamentId, attemptNumber) {
    const session = await mongoose.startSession();
    try {
        session.startTransaction();

        // Fetch Tournament
        const tournament = await Tournament.findById(tournamentId).session(session);
        if (!tournament) {
            throw new Error('Tournament not found');
        }

        if (tournament.status !== 'Open') {
            throw new Error(`Tournament is ${tournament.status}`);
        }

        if (tournament.joinedCount >= tournament.maxSlots) {
            throw new Error('Tournament is full');
        }

        // Check if already joined
        const isAlreadyJoined = tournament.participants.some(
            (p) => p.userId.toString() === userId.toString()
        );
        if (isAlreadyJoined) {
            throw new Error('Already joined this tournament');
        }

        // Fetch User
        const user = await User.findById(userId).session(session);
        if (!user) {
            throw new Error('User not found');
        }

        if (user.walletBalance < tournament.entryFee) {
            throw new Error('Insufficient balance');
        }

        // Deduct balance
        user.walletBalance -= tournament.entryFee;

        // Add to participants
        tournament.participants.push({
            userId: user._id,
            inGameName: `TestPlayer${attemptNumber}`,
            uid: `TEST${attemptNumber}${Date.now()}`
        });
        tournament.joinedCount += 1;

        // Create Transaction
        const transaction = new Transaction({
            user: user._id,
            amount: -tournament.entryFee,
            type: 'entry_fee',
            description: `Joined Tournament: ${tournament.title}`,
            status: 'approved'
        });

        user.transactions = user.transactions || [];
        user.transactions.push(transaction._id);

        // Save all
        await user.save({ session });
        await tournament.save({ session });
        await transaction.save({ session });

        await session.commitTransaction();
        return { success: true, message: 'Joined successfully' };

    } catch (error) {
        await session.abortTransaction();
        return { success: false, message: error.message };
    } finally {
        session.endSession();
    }
}

// Simulate Admin Cancel Request (Mocks the API call)
async function cancelTournament(tournamentId) {
    const session = await mongoose.startSession();
    try {
        session.startTransaction();

        const tournament = await Tournament.findById(tournamentId).session(session);
        if (!tournament) {
            throw new Error('Tournament not found');
        }

        if (!['Open', 'Live'].includes(tournament.status)) {
            throw new Error('Cannot cancel completed/cancelled tournament');
        }

        // Refund Logic
        if (tournament.entryFee > 0 && tournament.participants && tournament.participants.length > 0) {
            for (const participant of tournament.participants) {
                if (!participant.userId) continue;

                const refundAmount = tournament.entryFee;
                const transactionId = new mongoose.Types.ObjectId();

                // Create Refund Transaction
                const transaction = new Transaction({
                    _id: transactionId,
                    user: participant.userId,
                    amount: refundAmount,
                    type: 'refund',
                    description: `Refund: Tournament "${tournament.title}" Cancelled`,
                    status: 'approved'
                });

                // Update User Wallet
                await User.findByIdAndUpdate(
                    participant.userId,
                    {
                        $inc: { walletBalance: refundAmount },
                        $push: { transactions: transactionId }
                    },
                    { new: true, session }
                );

                await transaction.save({ session });
            }
        }

        // Update Status
        tournament.status = 'Cancelled';
        await tournament.save({ session });

        await session.commitTransaction();
        return { success: true };

    } catch (error) {
        await session.abortTransaction();
        throw error;
    } finally {
        session.endSession();
    }
}

// ============================================================
// SCENARIO 1: Race Condition Test (Double Spending)
// ============================================================
async function testRaceCondition() {
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('🛑 SCENARIO 1: RACE CONDITION TEST');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    try {
        // Setup: Create user with 50 coins
        const user = await createTestUser('test-stress-race@test.com', 'Race Test User', 50);
        console.log(`✅ Created user with wallet balance: ${user.walletBalance} coins`);

        // Setup: Create tournament with 50 coin entry
        const tournament = await createTestTournament(50, 'TEST-STRESS-RACE-CONDITION');
        console.log(`✅ Created tournament with entry fee: ${tournament.entryFee} coins`);

        // The Attack: Send 5 parallel join requests
        console.log('\n🚨 Launching 5 parallel join requests...\n');

        const promises = [];
        for (let i = 1; i <= 5; i++) {
            promises.push(attemptJoin(user._id, tournament._id, i));
        }

        const results = await Promise.all(promises);

        // Analyze Results
        const successCount = results.filter(r => r.success).length;
        const failCount = results.filter(r => !r.success).length;

        console.log('📊 Results:');
        results.forEach((result, index) => {
            const icon = result.success ? '✅' : '❌';
            console.log(`   ${icon} Request ${index + 1}: ${result.message}`);
        });

        // Verify Final Balance
        const updatedUser = await User.findById(user._id);
        const finalBalance = updatedUser.walletBalance;

        console.log(`\n💰 Final Wallet Balance: ${finalBalance} coins`);
        console.log(`📈 Expected Balance: 0 coins`);

        // Determine PASS/FAIL
        const isPassed = successCount === 1 && failCount === 4 && finalBalance === 0 && finalBalance >= 0;

        if (isPassed) {
            console.log('\n🎉 RESULT: ✅ PASS');
            console.log('   - Only 1 request succeeded ✓');
            console.log('   - 4 requests failed as expected ✓');
            console.log('   - Balance is 0 (not negative) ✓');
        } else {
            console.log('\n💥 RESULT: ❌ FAIL');
            if (successCount !== 1) {
                console.log(`   - Expected 1 success, got ${successCount} ✗`);
            }
            if (failCount !== 4) {
                console.log(`   - Expected 4 failures, got ${failCount} ✗`);
            }
            if (finalBalance !== 0) {
                console.log(`   - Expected balance 0, got ${finalBalance} ✗`);
            }
            if (finalBalance < 0) {
                console.log(`   - ⚠️ CRITICAL: Balance went NEGATIVE! ✗`);
            }
        }

        return { passed: isPassed, finalBalance };

    } catch (error) {
        console.error('❌ Test Error:', error);
        return { passed: false, error: error.message };
    }
}

// ============================================================
// SCENARIO 2: Refund Test
// ============================================================
async function testRefunds() {
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('💸 SCENARIO 2: AUTOMATIC REFUND TEST');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    try {
        // Setup: Create tournament with 100 coin entry
        const tournament = await createTestTournament(100, 'TEST-STRESS-REFUND');
        console.log(`✅ Created tournament with entry fee: ${tournament.entryFee} coins`);

        // Setup: Create 3 users and join them
        const users = [];
        for (let i = 1; i <= 3; i++) {
            const user = await createTestUser(
                `test-stress-refund-${i}@test.com`,
                `Refund Test User ${i}`,
                100
            );
            users.push(user);
            console.log(`✅ Created User ${i} with 100 coins`);
        }

        console.log('\n💳 Joining users to tournament...');
        for (let i = 0; i < users.length; i++) {
            const result = await attemptJoin(users[i]._id, tournament._id, i + 1);
            if (result.success) {
                console.log(`   ✅ User ${i + 1} joined successfully`);
            } else {
                console.log(`   ❌ User ${i + 1} failed: ${result.message}`);
            }
        }

        // Verify balances BEFORE cancellation
        const balancesBefore = [];
        for (let i = 0; i < users.length; i++) {
            const u = await User.findById(users[i]._id);
            balancesBefore.push(u.walletBalance);
        }
        console.log(`\n💰 Balances BEFORE cancellation: ${balancesBefore.join(', ')}`);

        // Action: Cancel tournament
        console.log('\n🚨 Admin cancelling tournament...');
        await cancelTournament(tournament._id);
        console.log('✅ Tournament cancelled');

        // Verify balances AFTER cancellation
        const balancesAfter = [];
        const refunded = [];
        for (let i = 0; i < users.length; i++) {
            const u = await User.findById(users[i]._id);
            balancesAfter.push(u.walletBalance);
            refunded.push(u.walletBalance === 100);
        }
        console.log(`💰 Balances AFTER cancellation: ${balancesAfter.join(', ')}`);

        // Verify refund transactions exist
        console.log('\n🔍 Checking refund transactions...');
        const refundTransactions = await Transaction.find({
            user: { $in: users.map(u => u._id) },
            type: 'refund',
            description: { $regex: /TEST-STRESS-REFUND/ }
        });

        console.log(`📝 Found ${refundTransactions.length} refund transactions`);

        // Determine PASS/FAIL
        const allRefunded = refunded.every(r => r === true);
        const correctTransactionCount = refundTransactions.length === 3;
        const isPassed = allRefunded && correctTransactionCount;

        if (isPassed) {
            console.log('\n🎉 RESULT: ✅ PASS');
            console.log('   - All 3 users refunded 100 coins ✓');
            console.log('   - All balances restored to 100 ✓');
            console.log('   - 3 refund transactions created ✓');
        } else {
            console.log('\n💥 RESULT: ❌ FAIL');
            if (!allRefunded) {
                console.log('   - Not all users were refunded ✗');
                refunded.forEach((r, i) => {
                    console.log(`     User ${i + 1}: ${r ? 'Refunded ✓' : 'NOT Refunded ✗'} (Balance: ${balancesAfter[i]})`);
                });
            }
            if (!correctTransactionCount) {
                console.log(`   - Expected 3 refund transactions, found ${refundTransactions.length} ✗`);
            }
        }

        return { passed: isPassed, usersRefunded: allRefunded };

    } catch (error) {
        console.error('❌ Test Error:', error);
        return { passed: false, error: error.message };
    }
}

// ============================================================
// Main Execution
// ============================================================
async function main() {
    console.log('\n');
    console.log('╔═══════════════════════════════════════════════════════╗');
    console.log('║   STRESS TEST: CONCURRENCY & REFUNDS                  ║');
    console.log('╚═══════════════════════════════════════════════════════╝');
    console.log('\n');

    await connectDB();
    await cleanup();

    // Run Tests
    const raceResult = await testRaceCondition();
    const refundResult = await testRefunds();

    // Final Summary
    console.log('\n');
    console.log('╔═══════════════════════════════════════════════════════╗');
    console.log('║   FINAL SUMMARY                                       ║');
    console.log('╚═══════════════════════════════════════════════════════╝');
    console.log('');

    const raceIcon = raceResult.passed ? '✅' : '❌';
    const refundIcon = refundResult.passed ? '✅' : '❌';

    console.log(`🛑 Race Condition Test: ${raceResult.passed ? 'PASS' : 'FAIL'} ${raceIcon} - Final Balance: ${raceResult.finalBalance !== undefined ? raceResult.finalBalance : 'N/A'}`);
    console.log(`💸 Refund Test: ${refundResult.passed ? 'PASS' : 'FAIL'} ${refundIcon} - Users Refunded: ${refundResult.usersRefunded ? 'Yes' : 'No'}`);
    console.log('');

    // Disconnect
    await mongoose.disconnect();
    console.log('👋 Disconnected from MongoDB\n');

    // Exit with appropriate code
    const allPassed = raceResult.passed && refundResult.passed;
    process.exit(allPassed ? 0 : 1);
}

// Run the tests
main().catch(console.error);
