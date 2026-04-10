require('dotenv').config({ path: '.env.local' });
const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({ name: String, email: String, walletBalance: Number }, { timestamps: true });
const User = mongoose.models.User || mongoose.model('User', UserSchema);

const OrderSchema = new mongoose.Schema({ userId: mongoose.Schema.Types.ObjectId, productId: mongoose.Schema.Types.ObjectId, pricePaid: Number, status: String, source: String, createdAt: Date });
const Order = mongoose.models.Order || mongoose.model('Order', OrderSchema);

const TransactionSchema = new mongoose.Schema({ user: mongoose.Schema.Types.ObjectId, amount: Number, type: String, status: String, createdAt: Date });
const Transaction = mongoose.models.Transaction || mongoose.model('Transaction', TransactionSchema);

async function findUserAndTransactions() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        const users = await User.find({ 
            $or: [
                { name: /Aman/i }, 
                { name: /Azan/i }, 
                { name: /alone/i }
            ] 
        });

        console.log('--- USERS ---');
        console.log(JSON.stringify(users, null, 2));

        for (const user of users) {
            console.log(`--- Transactions for ${user.name} (${user._id}) ---`);
            const trxs = await Transaction.find({ user: user._id }).sort({ createdAt: -1 });
            console.log(JSON.stringify(trxs, null, 2));

            console.log(`--- Shop Orders for ${user.name} (${user._id}) ---`);
            const orders = await Order.find({ userId: user._id }).sort({ createdAt: -1 });
            console.log(JSON.stringify(orders, null, 2));
        }

        await mongoose.disconnect();
    } catch (err) {
        console.error(err);
    }
}

findUserAndTransactions();
