require('dotenv').config({ path: '.env.local' });
const mongoose = require('mongoose');

const OrderSchema = new mongoose.Schema({ userId: mongoose.Schema.Types.ObjectId, productId: mongoose.Schema.Types.ObjectId, pricePaid: Number, status: String, source: String, createdAt: Date, userDetails: Object });
const Order = mongoose.models.Order || mongoose.model('Order', OrderSchema);

const TransactionSchema = new mongoose.Schema({ user: mongoose.Schema.Types.ObjectId, amount: Number, type: String, status: String, createdAt: Date, description: String });
const Transaction = mongoose.models.Transaction || mongoose.model('Transaction', TransactionSchema);

async function checkAzanOrders() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        const userId = '6984bea82d9bd17205f5588d';
        
        console.log('--- Orders for User 6984bea82d9bd17205f5588d ---');
        const orders = await Order.find({ userId }).sort({ createdAt: -1 });
        console.log(JSON.stringify(orders, null, 2));

        console.log('--- Transactions for User 6984bea82d9bd17205f5588d ---');
        const trxs = await Transaction.find({ user: userId }).sort({ createdAt: -1 });
        console.log(JSON.stringify(trxs, null, 2));

        await mongoose.disconnect();
    } catch (err) {
        console.error(err);
    }
}

checkAzanOrders();
