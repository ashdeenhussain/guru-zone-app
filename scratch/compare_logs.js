const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../.env.local') });

const TransactionSchema = new mongoose.Schema({
    type: String,
    amount: Number,
    status: String,
    user: mongoose.Schema.Types.ObjectId,
    description: String,
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

const UserSchema = new mongoose.Schema({
    name: String,
    email: String,
    walletBalance: Number,
}, { collection: 'users' });

const Transaction = mongoose.models.Transaction || mongoose.model('Transaction', TransactionSchema);
const FinancialLog = mongoose.models.FinancialLog || mongoose.model('FinancialLog', FinancialLogSchema);
const User = mongoose.models.User || mongoose.model('User', UserSchema);

async function run() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        const email = 'za3005033@gmail.com';
        const user = await User.findOne({ email });
        if (!user) {
            console.log(`User ${email} not found!`);
            await mongoose.disconnect();
            return;
        }

        const transactions = await Transaction.find({ user: user._id });
        const logs = await FinancialLog.find({ userId: user._id });

        console.log(`\n=== Compare for ${user.name} ===`);
        console.log(`Wallet Balance: ${user.walletBalance}`);
        console.log(`Total Transactions: ${transactions.length}`);
        console.log(`Total FinancialLogs: ${logs.length}`);

        console.log("\n--- FinancialLogs ---");
        logs.forEach((log, idx) => {
            console.log(`${idx + 1}. [${log.timestamp}] Type: ${log.type}, Amount: ${log.amount}, RefId: ${log.referenceId || 'N/A'}, Desc: "${log.description}"`);
        });

        await mongoose.disconnect();
    } catch (err) {
        console.error(err);
    }
}

run();
