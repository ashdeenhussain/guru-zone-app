const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../.env.local') });

// Schema Definitions
const UserSchema = new mongoose.Schema({
    name: String,
    email: String,
    walletBalance: Number,
}, { collection: 'users' });

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
    currency: String,
    userId: mongoose.Schema.Types.ObjectId,
    description: String,
    timestamp: Date,
    referenceId: mongoose.Schema.Types.Mixed
}, { collection: 'financiallogs' });

const User = mongoose.models.User || mongoose.model('User', UserSchema);
const Transaction = mongoose.models.Transaction || mongoose.model('Transaction', TransactionSchema);
const FinancialLog = mongoose.models.FinancialLog || mongoose.model('FinancialLog', FinancialLogSchema);

async function run() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log("Connected to DB");

        const user = await User.findOne({ email: 'admin@zp.com' });
        if (!user) {
            console.log("User admin@zp.com not found!");
            await mongoose.disconnect();
            return;
        }

        console.log(`\n=== User: ${user.name} (${user.email}) ===`);
        console.log(`Current Wallet Balance: ${user.walletBalance}`);

        // Fetch Financial Logs
        const logs = await FinancialLog.find({ userId: user._id }).sort({ timestamp: 1 }).lean();
        console.log(`\n--- FinancialLogs (${logs.length}) ---`);
        logs.forEach((log, index) => {
            console.log(`${index + 1}. Type: ${log.type}, Amount: ${log.amount}, Timestamp: ${log.timestamp}, Desc: "${log.description}"`);
        });

        // Fetch Transactions
        const txs = await Transaction.find({ user: user._id }).sort({ createdAt: 1 }).lean();
        console.log(`\n--- Transactions (${txs.length}) ---`);
        txs.forEach((tx, index) => {
            console.log(`${index + 1}. Type: ${tx.type}, Amount: ${tx.amount}, Status: ${tx.status}, Date: ${tx.createdAt}, Desc: "${tx.description}", Details: ${JSON.stringify(tx.details)}`);
        });

        await mongoose.disconnect();
    } catch (err) {
        console.error(err);
    }
}

run();
