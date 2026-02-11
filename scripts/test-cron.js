/**
 * Cron Job Test Script
 * 
 * This script tests the automated cron job system by:
 * 1. Creating test tournaments with past start times
 * 2. Creating stuck pending transactions
 * 3. Calling the cron endpoint
 * 4. Verifying all changes
 * 
 * Usage: node scripts/test-cron.js
 */

// Load environment variables from .env files
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
require('dotenv').config({ path: path.resolve(__dirname, '../.env.local') });

const mongoose = require('mongoose');

// MongoDB Connection String
const MONGO_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/guru-zone';

// API Base URL
const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

// Cron Secret
const CRON_SECRET = process.env.CRON_SECRET || 'test-secret-123';

// Test Data
let testTournamentId = null;
let testUserId = null;
let testTransactionId = null;

// Simple models (reusing schemas)
const TournamentSchema = new mongoose.Schema({
    title: String,
    format: String,
    gameType: String,
    entryFee: Number,
    prizePool: Number,
    maxSlots: Number,
    joinedCount: Number,
    startTime: Date,
    participants: [{
        userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        inGameName: String,
        uid: String,
    }],
    status: {
        type: String,
        enum: ['Open', 'Live', 'Completed', 'Cancelled'],
        default: 'Open',
    },
    autoReleaseTime: Date,
}, { timestamps: true });

const UserSchema = new mongoose.Schema({
    name: String,
    email: String,
    walletBalance: { type: Number, default: 0 },
}, { timestamps: true });

const TransactionSchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    amount: Number,
    type: String,
    description: String,
    status: String,
    rejectionReason: String,
}, { timestamps: true });

const NotificationSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    title: String,
    message: String,
    type: String,
    link: String,
    isRead: { type: Boolean, default: false },
}, { timestamps: true });

let Tournament, User, Transaction, Notification;

async function connectDB() {
    console.log('🔌 Connecting to MongoDB...');
    console.log('🔗 Connecting to:', MONGO_URI ? MONGO_URI.substring(0, 30) + '...' : 'NOT SET');
    await mongoose.connect(MONGO_URI);

    Tournament = mongoose.models.Tournament || mongoose.model('Tournament', TournamentSchema);
    User = mongoose.models.User || mongoose.model('User', UserSchema);
    Transaction = mongoose.models.Transaction || mongoose.model('Transaction', TransactionSchema);
    Notification = mongoose.models.Notification || mongoose.model('Notification', NotificationSchema);

    console.log('✅ Connected to MongoDB\n');
}

async function createTestData() {
    console.log('📝 Creating test data...');

    // Create test user
    const user = new User({
        name: 'Test User - Cron Test',
        email: `cron-test-${Date.now()}@test.com`,
        walletBalance: 100,
    });
    await user.save();
    testUserId = user._id;
    console.log(`✅ Created test user: ${user.email}`);

    // Create test tournament with start time in the past
    const pastTime = new Date(Date.now() - 5 * 60 * 1000); // 5 minutes ago
    const tournament = new Tournament({
        title: 'CRON TEST Tournament - Should Auto Start',
        format: 'Solo',
        gameType: 'BR',
        entryFee: 10,
        prizePool: 100,
        maxSlots: 10,
        joinedCount: 1,
        startTime: pastTime,
        status: 'Open',
        participants: [{
            userId: testUserId,
            inGameName: 'TestPlayer',
            uid: '123456789',
        }],
    });
    await tournament.save();
    testTournamentId = tournament._id;
    console.log(`✅ Created test tournament: ${tournament.title} (starts: ${pastTime.toISOString()})`);

    // Create stuck transaction (created 35 minutes ago)
    const oldTime = new Date(Date.now() - 35 * 60 * 1000); // 35 minutes ago
    const transaction = new Transaction({
        user: testUserId,
        amount: 50,
        type: 'deposit',
        description: 'Test stuck deposit',
        status: 'pending',
        createdAt: oldTime,
    });
    await transaction.save();
    testTransactionId = transaction._id;
    console.log(`✅ Created stuck transaction (created: ${oldTime.toISOString()})\n`);
}

async function callCronEndpoint() {
    console.log('🚀 Calling cron endpoint...');

    try {
        const response = await fetch(`${API_BASE}/api/cron/update-status`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${CRON_SECRET}`,
            },
        });

        const data = await response.json();

        console.log(`Status: ${response.status}`);
        console.log('Response:', JSON.stringify(data, null, 2));
        console.log('');

        return data;
    } catch (error) {
        console.error('❌ Error calling cron endpoint:', error.message);
        throw error;
    }
}

async function verifyResults() {
    console.log('🔍 Verifying results...\n');

    let allPassed = true;

    // Test 1: Check tournament status changed to Live
    console.log('TEST 1: Tournament Auto-Start');
    const tournament = await Tournament.findById(testTournamentId);
    if (tournament.status === 'Live') {
        console.log('✅ PASS: Tournament status changed to "Live"');
    } else {
        console.log(`❌ FAIL: Tournament status is "${tournament.status}", expected "Live"`);
        allPassed = false;
    }

    // Test 2: Check notifications were created
    console.log('\nTEST 2: Participant Notifications');
    const notifications = await Notification.find({
        userId: testUserId,
        title: 'Match Started! Check Room ID.',
    });
    if (notifications.length > 0) {
        console.log(`✅ PASS: ${notifications.length} notification(s) created for participants`);
    } else {
        console.log('❌ FAIL: No notifications created for participants');
        allPassed = false;
    }

    // Test 3: Check transaction marked as failed
    console.log('\nTEST 3: Transaction Cleanup');
    const transaction = await Transaction.findById(testTransactionId);
    if (transaction.status === 'failed') {
        console.log('✅ PASS: Stuck transaction marked as "failed"');
        console.log(`   Reason: ${transaction.rejectionReason}`);
    } else {
        console.log(`❌ FAIL: Transaction status is "${transaction.status}", expected "failed"`);
        allPassed = false;
    }

    // Test 4: Check notification for failed transaction
    console.log('\nTEST 4: Transaction Failure Notification');
    const txNotifications = await Notification.find({
        userId: testUserId,
        title: 'Transaction Failed',
    });
    if (txNotifications.length > 0) {
        console.log('✅ PASS: Notification created for failed transaction');
    } else {
        console.log('❌ FAIL: No notification created for failed transaction');
        allPassed = false;
    }

    return allPassed;
}

async function cleanup() {
    console.log('\n🧹 Cleaning up test data...');

    await Tournament.deleteOne({ _id: testTournamentId });
    await User.deleteOne({ _id: testUserId });
    await Transaction.deleteOne({ _id: testTransactionId });
    await Notification.deleteMany({ userId: testUserId });

    console.log('✅ Cleanup complete\n');
}

async function main() {
    try {
        console.log('='.repeat(60));
        console.log('   CRON JOB TEST SCRIPT');
        console.log('='.repeat(60));
        console.log('');

        await connectDB();
        await createTestData();
        await callCronEndpoint();
        const allPassed = await verifyResults();
        await cleanup();

        console.log('='.repeat(60));
        if (allPassed) {
            console.log('🎉 ALL TESTS PASSED!');
        } else {
            console.log('⚠️  SOME TESTS FAILED');
            process.exit(1);
        }
        console.log('='.repeat(60));

    } catch (error) {
        console.error('\n❌ Test script failed:', error);
        process.exit(1);
    } finally {
        await mongoose.disconnect();
    }
}

main();
