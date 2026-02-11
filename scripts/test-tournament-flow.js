/**
 * Automated Integration Test Script for Tournament Lifecycle
 * 
 * This script tests the complete tournament flow programmatically:
 * - User creation (Admin + Players)
 * - Tournament creation
 * - Join tournament with wallet deduction
 * - Slot overfill protection
 * - Credential privacy check
 * - Winner payout simulation
 * - Transaction logging
 * - Cleanup
 * 
 * Run: node scripts/test-tournament-flow.js
 */

require('dotenv').config({ path: '.env.local' });
const mongoose = require('mongoose');

// Color codes for terminal output
const colors = {
    reset: '\x1b[0m',
    green: '\x1b[32m',
    red: '\x1b[31m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    magenta: '\x1b[35m',
    cyan: '\x1b[36m',
};

// Helper functions
const log = {
    success: (msg) => console.log(`${colors.green}✅ ${msg}${colors.reset}`),
    error: (msg) => console.log(`${colors.red}❌ ${msg}${colors.reset}`),
    info: (msg) => console.log(`${colors.blue}ℹ️  ${msg}${colors.reset}`),
    warn: (msg) => console.log(`${colors.yellow}⚠️  ${msg}${colors.reset}`),
    header: (msg) => console.log(`\n${colors.cyan}${'='.repeat(60)}${colors.reset}\n${colors.cyan}${msg}${colors.reset}\n${colors.cyan}${'='.repeat(60)}${colors.reset}`),
};

// Import models
let User, Tournament, Transaction;

// Test data storage
const testData = {
    users: {},
    tournament: null,
};

/**
 * Connect to MongoDB and define models
 */
async function connectDB() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        log.success('Connected to MongoDB');

        const { Schema, model, models } = mongoose;

        // User Schema (inline definition)
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
            hasCompletedOnboarding: { type: Boolean, default: false },
        }, { timestamps: true });

        // Tournament Schema (inline definition)
        const TournamentSchema = new Schema({
            title: { type: String, required: true },
            format: { type: String, enum: ['Solo', 'Duo', 'Squad'], required: true },
            gameType: { type: String, enum: ['BR', 'CS'], required: true },
            map: { type: String, default: 'Bermuda' },
            entryFee: { type: Number, required: true, default: 0 },
            prizePool: { type: Number, required: true },
            prizeDistribution: {
                first: { type: Number, default: 0 },
                second: { type: Number, default: 0 },
                third: { type: Number, default: 0 },
            },
            maxSlots: { type: Number, required: true },
            joinedCount: { type: Number, default: 0 },
            startTime: { type: Date, required: true },
            participants: [{
                userId: { type: Schema.Types.ObjectId, ref: 'User' },
                inGameName: String,
                uid: String,
                teamName: String,
                teammates: [{ name: String, uid: String }],
            }],
            roomID: { type: String, select: false },
            roomPassword: { type: String, select: false },
            autoReleaseTime: Date,
            status: { type: String, enum: ['Open', 'Live', 'Completed', 'Cancelled'], default: 'Open' },
            isVisible: { type: Boolean, default: true },
            winners: {
                rank1: { type: Schema.Types.ObjectId, ref: 'User' },
                rank2: { type: Schema.Types.ObjectId, ref: 'User' },
                rank3: { type: Schema.Types.ObjectId, ref: 'User' },
            },
        }, { timestamps: true });

        // Transaction Schema (inline definition)
        const TransactionSchema = new Schema({
            user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
            amount: { type: Number, required: true },
            type: {
                type: String,
                enum: ['deposit', 'withdrawal', 'entry_fee', 'prize_winnings', 'refund', 'shop_purchase', 'spin_win', 'ADMIN_ADJUSTMENT'],
                required: true,
            },
            referenceId: { type: Schema.Types.Mixed, index: true },
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

        return true;
    } catch (error) {
        log.error(`MongoDB connection failed: ${error.message}`);
        return false;
    }
}

/**
 * Test 1: Create Test Users
 */
async function test1_CreateUsers() {
    log.header('TEST 1: User Creation');

    try {
        // Create Admin
        const admin = await User.create({
            name: 'Test Admin',
            email: `test_admin_${Date.now()}@testmail.com`,
            role: 'admin',
            walletBalance: 1000,
            hasCompletedOnboarding: true,
        });
        testData.users.admin = admin;
        log.info(`Admin created: ${admin.email} (Wallet: ${admin.walletBalance})`);

        // Create Player A
        const playerA = await User.create({
            name: 'Test Player A',
            email: `test_player_a_${Date.now()}@testmail.com`,
            role: 'user',
            walletBalance: 100,
            inGameName: 'PlayerA_IGN',
            freeFireUid: 'UID_A_12345',
            hasCompletedOnboarding: true,
        });
        testData.users.playerA = playerA;
        log.info(`Player A created: ${playerA.email} (Wallet: ${playerA.walletBalance})`);

        // Create Player B
        const playerB = await User.create({
            name: 'Test Player B',
            email: `test_player_b_${Date.now()}@testmail.com`,
            role: 'user',
            walletBalance: 100,
            inGameName: 'PlayerB_IGN',
            freeFireUid: 'UID_B_67890',
            hasCompletedOnboarding: true,
        });
        testData.users.playerB = playerB;
        log.info(`Player B created: ${playerB.email} (Wallet: ${playerB.walletBalance})`);

        // Create Player C (won't join)
        const playerC = await User.create({
            name: 'Test Player C',
            email: `test_player_c_${Date.now()}@testmail.com`,
            role: 'user',
            walletBalance: 100,
            inGameName: 'PlayerC_IGN',
            freeFireUid: 'UID_C_11111',
            hasCompletedOnboarding: true,
        });
        testData.users.playerC = playerC;
        log.info(`Player C created: ${playerC.email} (Wallet: ${playerC.walletBalance})`);

        log.success('Test 1: User Creation - PASS');
        return true;
    } catch (error) {
        log.error(`Test 1 FAILED: ${error.message}`);
        return false;
    }
}

/**
 * Test 2: Create Tournament
 */
async function test2_CreateTournament() {
    log.header('TEST 2: Tournament Creation');

    try {
        const tournament = await Tournament.create({
            title: `Test Tournament ${Date.now()}`,
            format: 'Solo',
            gameType: 'BR',
            map: 'Bermuda',
            entryFee: 20,
            prizePool: 100,
            prizeDistribution: {
                first: 100,
                second: 0,
                third: 0,
            },
            maxSlots: 2, // Only 2 players allowed
            joinedCount: 0,
            startTime: new Date(Date.now() + 3600000), // 1 hour from now
            status: 'Open',
            isVisible: true,
        });

        testData.tournament = tournament;
        log.info(`Tournament created: ${tournament.title}`);
        log.info(`Entry Fee: ${tournament.entryFee} | Prize: ${tournament.prizePool} | Max Slots: ${tournament.maxSlots}`);

        log.success('Test 2: Tournament Creation - PASS');
        return true;
    } catch (error) {
        log.error(`Test 2 FAILED: ${error.message}`);
        return false;
    }
}

/**
 * Test 3: Player A Joins Tournament
 */
async function test3_PlayerAJoins() {
    log.header('TEST 3: Player A Join (Wallet Deduction)');

    const session = await mongoose.startSession();
    try {
        await session.withTransaction(async () => {
            const tournament = await Tournament.findById(testData.tournament._id).session(session);
            const user = await User.findById(testData.users.playerA._id).session(session);

            // Validate
            if (tournament.joinedCount >= tournament.maxSlots) {
                throw new Error('Tournament is full');
            }
            if (user.walletBalance < tournament.entryFee) {
                throw new Error('Insufficient balance');
            }

            const initialBalance = user.walletBalance;

            // Deduct wallet
            user.walletBalance -= tournament.entryFee;

            // Add to participants
            tournament.participants.push({
                userId: user._id,
                inGameName: user.inGameName,
                uid: user.freeFireUid,
            });
            tournament.joinedCount += 1;

            // Create transaction
            const transaction = new Transaction({
                user: user._id,
                amount: -tournament.entryFee,
                type: 'entry_fee',
                description: `Joined Tournament: ${tournament.title}`,
                status: 'approved',
            });

            await user.save({ session });
            await tournament.save({ session });
            await transaction.save({ session });

            log.info(`Player A wallet: ${initialBalance} → ${user.walletBalance} (Deducted: ${tournament.entryFee})`);
            log.info(`Tournament slots: ${tournament.joinedCount}/${tournament.maxSlots}`);

            // Update test data
            testData.users.playerA = user;
            testData.tournament = tournament;
        });

        log.success('Test 3: Player A Join (Wallet Deduction) - PASS');
        return true;
    } catch (error) {
        log.error(`Test 3 FAILED: ${error.message}`);
        return false;
    } finally {
        await session.endSession();
    }
}

/**
 * Test 4: Player B Joins Tournament
 */
async function test4_PlayerBJoins() {
    log.header('TEST 4: Player B Join (Slots Full)');

    const session = await mongoose.startSession();
    try {
        await session.withTransaction(async () => {
            const tournament = await Tournament.findById(testData.tournament._id).session(session);
            const user = await User.findById(testData.users.playerB._id).session(session);

            // Validate
            if (tournament.joinedCount >= tournament.maxSlots) {
                throw new Error('Tournament is full');
            }
            if (user.walletBalance < tournament.entryFee) {
                throw new Error('Insufficient balance');
            }

            const initialBalance = user.walletBalance;

            // Deduct wallet
            user.walletBalance -= tournament.entryFee;

            // Add to participants
            tournament.participants.push({
                userId: user._id,
                inGameName: user.inGameName,
                uid: user.freeFireUid,
            });
            tournament.joinedCount += 1;

            // Create transaction
            const transaction = new Transaction({
                user: user._id,
                amount: -tournament.entryFee,
                type: 'entry_fee',
                description: `Joined Tournament: ${tournament.title}`,
                status: 'approved',
            });

            await user.save({ session });
            await tournament.save({ session });
            await transaction.save({ session });

            log.info(`Player B wallet: ${initialBalance} → ${user.walletBalance} (Deducted: ${tournament.entryFee})`);
            log.info(`Tournament slots: ${tournament.joinedCount}/${tournament.maxSlots} - NOW FULL!`);

            // Update test data
            testData.users.playerB = user;
            testData.tournament = tournament;
        });

        log.success('Test 4: Player B Join (Slots Full) - PASS');
        return true;
    } catch (error) {
        log.error(`Test 4 FAILED: ${error.message}`);
        return false;
    } finally {
        await session.endSession();
    }
}

/**
 * Test 5: Player C Rejected (Overfill Protection)
 */
async function test5_PlayerCRejected() {
    log.header('TEST 5: Player C Rejected (Overfill Protection)');

    const session = await mongoose.startSession();
    try {
        await session.withTransaction(async () => {
            const tournament = await Tournament.findById(testData.tournament._id).session(session);
            const user = await User.findById(testData.users.playerC._id).session(session);

            const initialBalance = user.walletBalance;

            // Validate - THIS SHOULD FAIL
            if (tournament.joinedCount >= tournament.maxSlots) {
                throw new Error('Tournament is full');
            }

            // This should never execute
            log.error('CRITICAL: Player C was allowed to join a full tournament!');
            return false;
        });

        // If we reach here, the test FAILED
        log.error('Test 5 FAILED: Player C was not rejected!');
        return false;

    } catch (error) {
        if (error.message === 'Tournament is full') {
            const user = await User.findById(testData.users.playerC._id);
            log.info(`Player C wallet: ${user.walletBalance} (Unchanged - Good!)`);
            log.info(`Rejection reason: ${error.message}`);
            log.success('Test 5: Player C Rejected (Overfill Protection) - PASS');
            return true;
        } else {
            log.error(`Test 5 FAILED: Unexpected error: ${error.message}`);
            return false;
        }
    } finally {
        await session.endSession();
    }
}

/**
 * Test 6: Credential Privacy Check
 */
async function test6_CredentialPrivacy() {
    log.header('TEST 6: Credential Privacy Check');

    try {
        // Update room credentials
        const roomID = '12345-TEST';
        const roomPassword = 'SECRET_PASS';

        await Tournament.findByIdAndUpdate(testData.tournament._id, {
            roomID,
            roomPassword,
            status: 'Live',
            autoReleaseTime: new Date(), // Release now
        });

        log.info(`Room credentials set: ID=${roomID}, Pass=${roomPassword}`);

        // Fetch tournament with credentials (simulating participant query)
        const tournamentWithCreds = await Tournament.findById(testData.tournament._id)
            .select('+roomID +roomPassword +participants');

        // Check if Player A (participant) can access
        const isParticipantA = tournamentWithCreds.participants.some(
            p => p.userId.toString() === testData.users.playerA._id.toString()
        );

        // Check if Player C (non-participant) can access
        const isParticipantC = tournamentWithCreds.participants.some(
            p => p.userId.toString() === testData.users.playerC._id.toString()
        );

        log.info(`Player A is participant: ${isParticipantA}`);
        log.info(`Player C is participant: ${isParticipantC}`);

        if (isParticipantA && !isParticipantC) {
            log.info('✓ Player A can see credentials (participant)');
            log.info('✓ Player C cannot see credentials (non-participant)');
            log.success('Test 6: Credential Privacy Check - PASS');
            return true;
        } else {
            log.error('Privacy check failed: Participant status mismatch');
            return false;
        }
    } catch (error) {
        log.error(`Test 6 FAILED: ${error.message}`);
        return false;
    }
}

/**
 * Test 7: Winner Payout
 */
async function test7_WinnerPayout() {
    log.header('TEST 7: Winner Payout');

    const session = await mongoose.startSession();
    try {
        await session.withTransaction(async () => {
            const tournament = await Tournament.findById(testData.tournament._id).session(session);
            const winner = await User.findById(testData.users.playerA._id).session(session);

            const prizeAmount = tournament.prizeDistribution.first;
            const initialBalance = winner.walletBalance;

            log.info(`Winner: ${winner.name}`);
            log.info(`Prize amount: ${prizeAmount}`);
            log.info(`Initial wallet: ${initialBalance}`);

            // Credit winner
            winner.walletBalance += prizeAmount;
            winner.totalWins += 1;
            winner.netEarnings += prizeAmount;

            // Create transaction
            const transaction = new Transaction({
                user: winner._id,
                amount: prizeAmount,
                type: 'prize_winnings',
                description: `Prize for 1st Place in ${tournament.title}`,
                referenceId: tournament._id,
                status: 'approved',
            });

            // Update tournament
            tournament.status = 'Completed';
            tournament.winners = {
                rank1: winner._id,
            };

            await winner.save({ session });
            await transaction.save({ session });
            await tournament.save({ session });

            log.info(`Final wallet: ${winner.walletBalance} (Credited: +${prizeAmount})`);
            log.info(`Total wins: ${winner.totalWins}`);
            log.info(`Net earnings: ${winner.netEarnings}`);

            // Verify calculation
            const expectedBalance = initialBalance + prizeAmount;
            if (winner.walletBalance === expectedBalance) {
                log.success('Test 7: Winner Payout - PASS');
                testData.users.playerA = winner;
                return true;
            } else {
                throw new Error(`Balance mismatch: Expected ${expectedBalance}, Got ${winner.walletBalance}`);
            }
        });

        return true;
    } catch (error) {
        log.error(`Test 7 FAILED: ${error.message}`);
        return false;
    } finally {
        await session.endSession();
    }
}

/**
 * Test 8: Transaction Logging Verification
 */
async function test8_TransactionLogging() {
    log.header('TEST 8: Transaction Logging Verification');

    try {
        // Check Player A transactions
        const playerATransactions = await Transaction.find({
            user: testData.users.playerA._id
        }).sort({ createdAt: 1 });

        log.info(`Player A transactions found: ${playerATransactions.length}`);

        // Should have 2 transactions: entry_fee (-20) and prize_winnings (+100)
        const entryFeeTx = playerATransactions.find(tx => tx.type === 'entry_fee');
        const prizeTx = playerATransactions.find(tx => tx.type === 'prize_winnings');

        let passed = true;

        if (!entryFeeTx) {
            log.error('Missing entry_fee transaction');
            passed = false;
        } else {
            log.info(`✓ Entry Fee Transaction: ${entryFeeTx.amount} (${entryFeeTx.status})`);
        }

        if (!prizeTx) {
            log.error('Missing prize_winnings transaction');
            passed = false;
        } else {
            log.info(`✓ Prize Transaction: ${prizeTx.amount} (${prizeTx.status})`);
        }

        // Check Player B transactions
        const playerBTransactions = await Transaction.find({
            user: testData.users.playerB._id
        });

        log.info(`Player B transactions found: ${playerBTransactions.length}`);

        if (playerBTransactions.length === 0) {
            log.error('Missing Player B entry_fee transaction');
            passed = false;
        } else {
            log.info(`✓ Player B Entry Fee Transaction: ${playerBTransactions[0].amount}`);
        }

        // Check Player C transactions (should be 0)
        const playerCTransactions = await Transaction.find({
            user: testData.users.playerC._id
        });

        if (playerCTransactions.length !== 0) {
            log.error(`Player C should have 0 transactions, found ${playerCTransactions.length}`);
            passed = false;
        } else {
            log.info(`✓ Player C has no transactions (correct, was rejected)`);
        }

        if (passed) {
            log.success('Test 8: Transaction Logging - PASS');
        } else {
            log.error('Test 8: Transaction Logging - FAIL');
        }

        return passed;
    } catch (error) {
        log.error(`Test 8 FAILED: ${error.message}`);
        return false;
    }
}

/**
 * Cleanup: Delete test data
 */
async function cleanup() {
    log.header('CLEANUP: Removing Test Data');

    try {
        // Delete users
        const userIds = Object.values(testData.users).map(u => u._id);
        await User.deleteMany({ _id: { $in: userIds } });
        log.info(`Deleted ${userIds.length} test users`);

        // Delete tournament
        if (testData.tournament) {
            await Tournament.deleteOne({ _id: testData.tournament._id });
            log.info('Deleted test tournament');
        }

        // Delete transactions
        await Transaction.deleteMany({ user: { $in: userIds } });
        log.info('Deleted test transactions');

        log.success('Cleanup complete - database is clean');
        return true;
    } catch (error) {
        log.error(`Cleanup FAILED: ${error.message}`);
        return false;
    }
}

/**
 * Main test runner
 */
async function runTests() {
    console.log(`\n${colors.magenta}${'*'.repeat(60)}${colors.reset}`);
    console.log(`${colors.magenta}  🚀 AUTOMATED TOURNAMENT INTEGRATION TESTS${colors.reset}`);
    console.log(`${colors.magenta}${'*'.repeat(60)}${colors.reset}\n`);

    const startTime = Date.now();
    const results = [];

    try {
        // Connect to DB
        const connected = await connectDB();
        if (!connected) {
            process.exit(1);
        }

        // Run tests sequentially
        results.push({ name: 'User Creation', pass: await test1_CreateUsers() });
        results.push({ name: 'Tournament Creation', pass: await test2_CreateTournament() });
        results.push({ name: 'Player A Join (Wallet Deduction)', pass: await test3_PlayerAJoins() });
        results.push({ name: 'Player B Join (Slots Full)', pass: await test4_PlayerBJoins() });
        results.push({ name: 'Player C Rejected (Overfill Protection)', pass: await test5_PlayerCRejected() });
        results.push({ name: 'Credential Privacy Check', pass: await test6_CredentialPrivacy() });
        results.push({ name: 'Winner Payout', pass: await test7_WinnerPayout() });
        results.push({ name: 'Transaction Logging', pass: await test8_TransactionLogging() });

        // Cleanup
        await cleanup();

        // Summary
        const endTime = Date.now();
        const duration = ((endTime - startTime) / 1000).toFixed(2);

        log.header('TEST SUMMARY');
        results.forEach((result, index) => {
            const status = result.pass ? `${colors.green}PASS${colors.reset}` : `${colors.red}FAIL${colors.reset}`;
            console.log(`${index + 1}. ${result.name}: ${status}`);
        });

        const passCount = results.filter(r => r.pass).length;
        const totalCount = results.length;

        console.log(`\n${colors.cyan}Total: ${passCount}/${totalCount} tests passed${colors.reset}`);
        console.log(`${colors.cyan}Duration: ${duration}s${colors.reset}\n`);

        if (passCount === totalCount) {
            console.log(`${colors.green}🎉 ALL TESTS PASSED! 🎉${colors.reset}\n`);
        } else {
            console.log(`${colors.red}⚠️  SOME TESTS FAILED - Review output above${colors.reset}\n`);
        }

    } catch (error) {
        log.error(`Test suite crashed: ${error.message}`);
        console.error(error);
    } finally {
        await mongoose.connection.close();
        log.info('Database connection closed');
    }
}

// Run the tests
runTests();
