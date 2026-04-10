require('dotenv').config({ path: '.env.local' });
const mongoose = require('mongoose');

const OrderSchema = new mongoose.Schema({ userId: mongoose.Schema.Types.ObjectId, createdAt: Date, userDetails: Object });
const Order = mongoose.models.Order || mongoose.model('Order', OrderSchema);

const TransactionSchema = new mongoose.Schema({ user: mongoose.Schema.Types.ObjectId, amount: Number, type: String, status: String, createdAt: Date, description: String });
const Transaction = mongoose.models.Transaction || mongoose.model('Transaction', TransactionSchema);

async function checkDate() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        
        const start = new Date('2026-03-29T00:00:00Z');
        const end = new Date('2026-03-30T00:00:00Z');
        
        console.log('--- Orders on March 29th ---');
        const orders = await Order.find({ createdAt: { $gte: start, $lt: end } }).populate('userId', 'name');
        console.log(JSON.stringify(orders, null, 2));

        console.log('--- Transactions on March 29th ---');
        const trxs = await Transaction.find({ createdAt: { $gte: start, $lt: end } }).populate('user', 'name');
        console.log(JSON.stringify(trxs, null, 2));

        await mongoose.disconnect();
    } catch (err) {
        console.error(err);
    }
}

checkDate();
