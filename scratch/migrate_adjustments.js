const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../.env.local') });

// Schema definitions
const TransactionSchema = new mongoose.Schema({
    type: String,
    amount: Number,
    description: String,
    status: String,
    user: mongoose.Schema.Types.ObjectId,
    createdAt: Date,
    details: mongoose.Schema.Types.Mixed
}, { collection: 'transactions' });

const FinancialLogSchema = new mongoose.Schema({
    type: String,
    amount: Number,
    currency: { type: String, default: 'PKR' },
    userId: mongoose.Schema.Types.ObjectId,
    adminId: mongoose.Schema.Types.ObjectId,
    referenceId: mongoose.Schema.Types.Mixed,
    description: String,
    timestamp: Date
}, { collection: 'financiallogs' });

const UserSchema = new mongoose.Schema({
    email: String,
    role: String
}, { collection: 'users' });

const Transaction = mongoose.models.Transaction || mongoose.model('Transaction', TransactionSchema);
const FinancialLog = mongoose.models.FinancialLog || mongoose.model('FinancialLog', FinancialLogSchema);
const User = mongoose.models.User || mongoose.model('User', UserSchema);

async function run() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log("Connected to DB");
        
        const txs = await Transaction.find({ type: 'ADMIN_ADJUSTMENT' }).lean();
        console.log(`Processing ${txs.length} transactions...`);
        
        let createdCount = 0;
        let skippedCount = 0;

        for (const tx of txs) {
            // Check if already migrated
            const exists = await FinancialLog.findOne({ referenceId: tx._id });
            if (exists) {
                skippedCount++;
                continue;
            }

            // Find admin details
            let adminId = null;
            if (tx.details && tx.details.adjustedBy) {
                const adminUser = await User.findOne({ email: tx.details.adjustedBy }).lean();
                if (adminUser) {
                    adminId = adminUser._id;
                }
            }

            const isDebit = tx.details && tx.details.adjustmentType === 'DEBIT';
            const signedAmount = isDebit ? -tx.amount : tx.amount;

            await FinancialLog.create({
                type: 'admin_adjustment',
                amount: signedAmount,
                currency: 'Coins',
                userId: tx.user,
                adminId: adminId,
                referenceId: tx._id,
                description: tx.description || 'Legacy Wallet Adjustment',
                timestamp: tx.createdAt || new Date()
            });

            createdCount++;
        }

        console.log(`Migration Complete: Created ${createdCount} logs, Skipped ${skippedCount} existing logs.`);
        await mongoose.disconnect();
    } catch (err) {
        console.error(err);
    }
}

run();
