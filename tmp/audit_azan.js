const mongoose = require('mongoose');
require('dotenv').config({ path: 'c:/Users/ashde/Downloads/ashi/clon of zp/guru-zone/.env.local' });

// Define models directly for the script if imports are complex
const UserSchema = new mongoose.Schema({
    name: String,
    email: String,
    walletBalance: Number,
});
const User = mongoose.models.User || mongoose.model('User', UserSchema);

const TransactionSchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    amount: Number,
    type: String, // 'deposit', 'withdrawal', 'entry_fee', 'prize_winnings', 'refund', 'shop_purchase', 'spin_win', 'ADMIN_ADJUSTMENT'
    status: String, // 'pending', 'approved', 'rejected', 'failed', 'completed'
    createdAt: Date,
});
const Transaction = mongoose.models.Transaction || mongoose.model('Transaction', TransactionSchema);

const OrderSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    pricePaid: Number,
    status: String,
    createdAt: Date,
});
const Order = mongoose.models.Order || mongoose.model('Order', OrderSchema);

async function auditUser() {
    const MONGODB_URI = process.env.MONGODB_URI;
    if (!MONGODB_URI) {
        console.error('MONGODB_URI is not defined');
        process.exit(1);
    }

    try {
        await mongoose.connect(MONGODB_URI);
        console.log('Connected to database');

        const user = await User.findOne({ 
            $or: [
                { name: /Rx alone/i },
                { name: /Azan/i },
                { email: /azan/i }
            ]
        });

        if (!user) {
            console.error('User not found');
            return;
        }

        console.log(`\n--- Audit for ${user.name} (${user.email}) ---`);
        console.log(`Current Wallet Balance: ${user.walletBalance}`);

        const transactions = await Transaction.find({ user: user._id }).sort({ createdAt: 1 });
        console.log(`Total Transactions found: ${transactions.length}\n`);

        let runningBalance = 0;
        
        console.log('Date | Type | Amount | Status | Running Balance');
        console.log('--- | --- | --- | --- | ---');
        
        transactions.forEach(tx => {
            const amount = Number(tx.amount) || 0;
            const status = (tx.status || '').toLowerCase();
            const dateStr = tx.createdAt ? tx.createdAt.toISOString().split('T')[0] : 'N/A';
            
            let change = 0;
            if (tx.type === 'deposit') {
                if (status === 'approved' || status === 'completed') {
                    change = amount;
                }
            } else if (['prize_winnings', 'spin_win', 'refund'].includes(tx.type)) {
                change = amount;
            } else if (['withdrawal', 'entry_fee', 'shop_purchase'].includes(tx.type)) {
                change = -amount;
            } else if (tx.type === 'ADMIN_ADJUSTMENT') {
                change = amount;
            }
            
            runningBalance += change;
            console.log(`${dateStr} | ${tx.type} | ${amount} | ${tx.status} | ${runningBalance}`);
        });

        console.log(`\nFinal Calculated Ledger Balance: ${runningBalance}`);
        console.log(`Discrepancy: ${user.walletBalance - runningBalance}`);

        const pendingOrders = await Order.find({ userId: user._id, status: /pending/i });
        console.log(`\nPending Orders: ${pendingOrders.length}`);
        pendingOrders.forEach(o => {
            console.log(` - Order ID: ${o._id}, Price: ${o.pricePaid}, Created: ${o.createdAt.toISOString()}`);
        });

    } catch (error) {
        console.error('Error during audit:', error);
    } finally {
        await mongoose.disconnect();
    }
}

auditUser();
