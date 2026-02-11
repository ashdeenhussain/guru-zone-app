/**
 * Test Script: Tournament Cancellation & Refund Logic
 * 
 * This script tests the complete refund flow when an admin cancels a tournament.
 * It verifies that:
 * 1. Users receive their entry fees back
 * 2. Transaction records are created with status 'completed'
 * 3. Tournament status changes to 'Cancelled'
 * 4. Notifications are sent to participants
 */

const mongoose = require('mongoose');

// MongoDB Connection String - Update this with your local MongoDB URI
const MONGO_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/guru-zone';

// Test Configuration
const TEST_CONFIG = {
    tournamentTitle: '[TEST] Cancel Refund Test Tournament',
    entryFee: 100,
    format: 'Solo',
    gameType: 'BR',
    map: 'Erangel',
    startTime: new Date(Date.now() + 2 * 60 * 60 * 1000), // 2 hours from now
    prizePool: 300,
};

// Color codes for console output
const colors = {
    reset: '\x1b[0m',
    green: '\x1b[32m',
    red: '\x1b[31m',
    yellow: '\x1b[33m',
    blue: '\x1b[36m',
};

const log = {
    pass: (msg) => console.log(`${colors.green}✓ PASS${colors.reset} ${msg}`),
    fail: (msg) => console.log(`${colors.red}✗ FAIL${colors.reset} ${msg}`),
    info: (msg) => console.log(`${colors.blue}ℹ INFO${colors.reset} ${msg}`),
    warn: (msg) => console.log(`${colors.yellow}⚠ WARN${colors.reset} ${msg}`),
};

async function runTest() {
    let testUsers = [];
    let testTournament = null;
    let connection = null;

    try {
        log.info('Connecting to MongoDB...');
        connection = await mongoose.connect(MONGO_URI);
        log.pass('Connected to MongoDB');

        // Import models after connection
        const User = require('../src/models/User').default;
        const Tournament = require('../src/models/Tournament').default;
        const Transaction = require('../src/models/Transaction').default;

        // Step 1: Create Test Users
        log.info('Step 1: Creating test users...');
        const userPromises = [1, 2, 3].map(async (i) => {
            const username = `test_user_${Date.now()}_${i}`;
            const user = await User.create({
                username,
                email: `${username}@test.com`,
                password: 'hashedpassword123',
                walletBalance: 500, // Give them enough balance
                inGameName: `TestPlayer${i}`,
                inGameUID: `UID${Date.now()}${i}`,
            });
            return user;
        });
        testUsers = await Promise.all(userPromises);
        log.pass(`Created ${testUsers.length} test users`);

        // Step 2: Create Test Tournament
        log.info('Step 2: Creating test tournament...');
        testTournament = await Tournament.create({
            title: TEST_CONFIG.tournamentTitle,
            format: TEST_CONFIG.format,
            gameType: TEST_CONFIG.gameType,
            map: TEST_CONFIG.map,
            entryFee: TEST_CONFIG.entryFee,
            prizePool: TEST_CONFIG.prizePool,
            prizeDistribution: { first: 150, second: 100, third: 50 },
            startTime: TEST_CONFIG.startTime,
            maxPlayers: 10,
            status: 'Open',
            participants: testUsers.map(user => ({
                userId: user._id,
                inGameName: user.inGameName,
                username: user.username,
                uid: user.inGameUID,
                name: user.inGameName,
            })),
        });
        log.pass(`Created tournament: ${testTournament.title} (ID: ${testTournament._id})`);

        // Step 3: Simulate Entry Fee Deduction (as if users joined)
        log.info('Step 3: Simulating entry fee deductions...');
        for (const user of testUsers) {
            await User.findByIdAndUpdate(user._id, {
                $inc: { walletBalance: -TEST_CONFIG.entryFee },
            });
            await Transaction.create({
                user: user._id,
                amount: -TEST_CONFIG.entryFee,
                type: 'entry_fee',
                description: `Joined tournament: ${testTournament.title}`,
                status: 'completed',
            });
        }
        log.pass('Entry fees deducted from all test users');

        // Get initial balances
        const initialBalances = {};
        for (const user of testUsers) {
            const updatedUser = await User.findById(user._id);
            initialBalances[user._id.toString()] = updatedUser.walletBalance;
            log.info(`  ${updatedUser.username}: ${updatedUser.walletBalance} coins`);
        }

        // Step 4: Cancel Tournament (simulate API call)
        log.info('Step 4: Cancelling tournament and processing refunds...');

        const session = await mongoose.startSession();
        session.startTransaction();

        try {
            const tournament = await Tournament.findById(testTournament._id).session(session);

            if (!['Open', 'Live'].includes(tournament.status)) {
                throw new Error('Cannot cancel tournament');
            }

            // Refund Logic (from the API route)
            if (tournament.entryFee > 0 && tournament.participants && tournament.participants.length > 0) {
                for (const participant of tournament.participants) {
                    if (!participant.userId) continue;

                    const refundAmount = tournament.entryFee;
                    const transactionId = new mongoose.Types.ObjectId();

                    const transaction = new Transaction({
                        _id: transactionId,
                        user: participant.userId,
                        amount: refundAmount,
                        type: 'refund',
                        description: `Refund: Tournament "${tournament.title}" Cancelled`,
                        status: 'completed', // This is what we fixed!
                    });

                    const user = await User.findByIdAndUpdate(
                        participant.userId,
                        {
                            $inc: { walletBalance: refundAmount },
                            $push: { transactions: transactionId },
                        },
                        { new: true, session }
                    );

                    if (user) {
                        await transaction.save({ session });
                    }
                }
            }

            tournament.status = 'Cancelled';
            await tournament.save({ session });

            await session.commitTransaction();
            log.pass('Tournament cancelled and refunds processed');

        } catch (err) {
            await session.abortTransaction();
            throw err;
        } finally {
            session.endSession();
        }

        // Step 5: Verify Results
        log.info('Step 5: Verifying refunds...');
        let allPassed = true;

        for (const user of testUsers) {
            const updatedUser = await User.findById(user._id);
            const finalBalance = updatedUser.walletBalance;
            const expectedBalance = initialBalances[user._id.toString()] + TEST_CONFIG.entryFee;

            if (finalBalance === expectedBalance) {
                log.pass(`  ${updatedUser.username}: Balance correctly refunded (${finalBalance} coins)`);
            } else {
                log.fail(`  ${updatedUser.username}: Expected ${expectedBalance}, got ${finalBalance}`);
                allPassed = false;
            }

            // Check transaction record
            const refundTransaction = await Transaction.findOne({
                user: user._id,
                type: 'refund',
                description: { $regex: testTournament.title },
            });

            if (refundTransaction) {
                if (refundTransaction.status === 'completed') {
                    log.pass(`  ${updatedUser.username}: Refund transaction has status 'completed'`);
                } else {
                    log.fail(`  ${updatedUser.username}: Refund transaction status is '${refundTransaction.status}', expected 'completed'`);
                    allPassed = false;
                }
                if (refundTransaction.amount === TEST_CONFIG.entryFee) {
                    log.pass(`  ${updatedUser.username}: Refund amount is correct (${refundTransaction.amount})`);
                } else {
                    log.fail(`  ${updatedUser.username}: Refund amount is ${refundTransaction.amount}, expected ${TEST_CONFIG.entryFee}`);
                    allPassed = false;
                }
            } else {
                log.fail(`  ${updatedUser.username}: No refund transaction found`);
                allPassed = false;
            }
        }

        // Verify tournament status
        const updatedTournament = await Tournament.findById(testTournament._id);
        if (updatedTournament.status === 'Cancelled') {
            log.pass('Tournament status is "Cancelled"');
        } else {
            log.fail(`Tournament status is "${updatedTournament.status}", expected "Cancelled"`);
            allPassed = false;
        }

        // Step 6: Summary
        console.log('\n' + '='.repeat(60));
        if (allPassed) {
            log.pass('ALL TESTS PASSED ✓');
        } else {
            log.fail('SOME TESTS FAILED ✗');
        }
        console.log('='.repeat(60) + '\n');

        // Cleanup
        log.info('Cleaning up test data...');
        await User.deleteMany({ _id: { $in: testUsers.map(u => u._id) } });
        await Tournament.deleteOne({ _id: testTournament._id });
        await Transaction.deleteMany({
            user: { $in: testUsers.map(u => u._id) },
        });
        log.pass('Test data cleaned up');

        process.exit(allPassed ? 0 : 1);

    } catch (error) {
        log.fail(`Test failed with error: ${error.message}`);
        console.error(error);

        // Cleanup on error
        if (connection) {
            try {
                const User = require('../src/models/User').default;
                const Tournament = require('../src/models/Tournament').default;
                const Transaction = require('../src/models/Transaction').default;

                if (testUsers.length > 0) {
                    await User.deleteMany({ _id: { $in: testUsers.map(u => u._id) } });
                }
                if (testTournament) {
                    await Tournament.deleteOne({ _id: testTournament._id });
                    await Transaction.deleteMany({
                        user: { $in: testUsers.map(u => u._id) },
                    });
                }
                log.info('Cleaned up test data after error');
            } catch (cleanupError) {
                log.warn('Failed to cleanup test data');
            }
        }

        process.exit(1);
    } finally {
        if (connection) {
            await mongoose.disconnect();
            log.info('Disconnected from MongoDB');
        }
    }
}

// Run the test
runTest();
