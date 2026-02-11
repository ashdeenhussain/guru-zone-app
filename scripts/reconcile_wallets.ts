
import mongoose from 'mongoose';
import * as dotenv from 'dotenv';
import path from 'path';

// Load environment variables from .env.local
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

// Define Mongoose Schemas/Models locally to avoid import issues
const UserSchema = new mongoose.Schema({
    name: String,
    email: String,
    walletBalance: { type: Number, default: 0 },
    // Timestamps are automatic, but we need to read them
}, { strict: false, timestamps: true });

const TransactionSchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    amount: Number,
    type: String,
    status: String,
    description: String,
    details: mongoose.Schema.Types.Mixed,
    createdAt: Date // Explicitly define createdAt to allow overriding
}, { strict: false, timestamps: true });

const User = mongoose.models.User || mongoose.model('User', UserSchema);
const Transaction = mongoose.models.Transaction || mongoose.model('Transaction', TransactionSchema);

async function connectToDB() {
    if (mongoose.connection.readyState >= 1) return;
    if (!process.env.MONGODB_URI) {
        throw new Error('MONGODB_URI is not defined');
    }
    // Added options to improve connection stability
    await mongoose.connect(process.env.MONGODB_URI, {
        serverSelectionTimeoutMS: 5000,
        socketTimeoutMS: 45000,
    });
    console.log('Connected to MongoDB');
}

async function reconcileWallets() {
    const executeArgs = process.argv.includes('--execute');
    const dryRun = !executeArgs;

    console.log(`Starting Wallet Reconciliation... Mode: ${dryRun ? 'DRY RUN' : 'EXECUTE'}`);

    await connectToDB();

    // Cleanup previous run if executing (to avoid duplicates/mess)
    if (!dryRun) {
        console.log('Cleaning up previous "System Correction" transactions...');
        const deleteResult = await Transaction.deleteMany({
            description: 'System Correction for past manual adjustment',
            type: 'ADMIN_ADJUSTMENT'
        });
        console.log(`Deleted ${deleteResult.deletedCount} previous reconciliation records.`);
    }

    const users = await User.find({});
    console.log(`Found ${users.length} users. Checking balances...`);

    let mismatchedCount = 0;

    for (const user of users) {
        const transactions = await Transaction.find({
            user: user._id,
            status: { $in: ['approved', 'completed'] }
        });

        let calculatedBalance = 0;

        for (const trx of transactions) {
            let amount = trx.amount || 0;
            const type = (trx.type || '').toLowerCase();

            // Determine if credit or debit
            let isCredit = false;

            if (['deposit', 'prize_winnings', 'refund'].includes(type)) {
                isCredit = true;
            } else if (type === 'admin_adjustment') {
                if (trx.details?.adjustmentType === 'CREDIT') {
                    isCredit = true;
                } else {
                    isCredit = false;
                }
            } else if (type === 'spin_win') {
                // Assuming spin_win is a prize/credit
                isCredit = true;
            } else {
                // withdrawal, entry_fee, shop_purchase, etc.
                isCredit = false;
            }

            if (isCredit) {
                calculatedBalance += amount;
            } else {
                calculatedBalance -= amount;
            }
        }

        const actualBalance = user.walletBalance || 0;
        const difference = actualBalance - calculatedBalance;

        // Allow for small floating point errors
        if (Math.abs(difference) > 0.01) {
            mismatchedCount++;
            console.log(`---------------------------------------------------`);
            console.log(`User: ${user.name} (${user.email})`);
            console.log(`ID: ${user._id}`);
            console.log(`Stored Balance: ${actualBalance}`);
            console.log(`Calculated Hist: ${calculatedBalance}`);
            console.log(`Mismatch Diff:  ${difference > 0 ? '+' : ''}${difference}`);

            if (!dryRun) {
                // Create reconciliation transaction
                console.log(`>> CREATING RECONCILIATION TRANSACTION...`);

                const adjustmentType = difference > 0 ? 'CREDIT' : 'DEBIT';
                const amount = Math.abs(difference);

                // Backdate to User Creation Time + 1 minute (as an "Opening Balance" correction)
                // Fallback to now if createdAt is missing
                const backdate = user.createdAt ? new Date(new Date(user.createdAt).getTime() + 60000) : new Date();

                await Transaction.create({
                    user: user._id,
                    amount: amount,
                    type: 'ADMIN_ADJUSTMENT',
                    status: 'approved',
                    description: 'System Correction for past manual adjustment',
                    details: {
                        adjustmentType: adjustmentType,
                        note: 'Legacy Reconciliation Auto-Fix',
                        isLegacy: true
                    },
                    createdAt: backdate // Override timestamp
                });

                console.log(`>> FIXED. Added ${adjustmentType} of ${amount} dated ${backdate.toISOString()}`);
            }
        }
    }

    console.log(`---------------------------------------------------`);
    console.log(`Scan Complete.`);
    console.log(`Total Users with Mismatches: ${mismatchedCount}`);

    if (dryRun && mismatchedCount > 0) {
        console.log(`\nTo fix these mismatches (and backdate them to account creation), run this script again with --execute`);
    }

    process.exit(0);
}

reconcileWallets().catch(console.error);
