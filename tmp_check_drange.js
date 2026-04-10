require('dotenv').config({ path: '.env.local' });
const mongoose = require('mongoose');

const OrderSchema = new mongoose.Schema({ userId: mongoose.Schema.Types.ObjectId, createdAt: Date, userDetails: Object });
const Order = mongoose.models.Order || mongoose.model('Order', OrderSchema);

const TransactionSchema = new mongoose.Schema({ user: mongoose.Schema.Types.ObjectId, type: String, status: String, createdAt: Date, description: String }, { strict: false });
const Transaction = mongoose.models.Transaction || mongoose.model('Transaction', TransactionSchema);

async function checkDateRange() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        
        const start = new Date('2026-03-27T00:00:00Z');
        const end = new Date('2026-03-31T23:59:59Z');
        
        console.log('--- ALL Orders between March 27th and March 31st ---');
        const orders = await Order.find({ createdAt: { $gte: start, $lt: end } }).populate('userId', 'name');
        console.log(JSON.stringify(orders, null, 2));

        console.log('--- ALL Transactions between March 27th and March 31st ---');
        const trxs = await Transaction.find({ createdAt: { $gte: start, $lt: end } }).populate('user', 'name');
        console.log(JSON.stringify(trxs, null, 2));

        await mongoose.disconnect();
    } catch (err) {
        console.error(err);
    }
}

checkDateRange();
