require('dotenv').config({ path: '.env.local' });
const mongoose = require('mongoose');

const OrderSchema = new mongoose.Schema({ userId: mongoose.Schema.Types.ObjectId, productId: mongoose.Schema.Types.ObjectId, pricePaid: Number, status: String, source: String, createdAt: Date, userDetails: Object });
const Order = mongoose.models.Order || mongoose.model('Order', OrderSchema);

async function checkPendingOrder() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        const order = await Order.findOne({ status: 'Pending' }).populate('userId', 'name');
        console.log('--- One Pending Order ---');
        console.log(JSON.stringify(order, null, 2));

        await mongoose.disconnect();
    } catch (err) {
        console.error(err);
    }
}

checkPendingOrder();
