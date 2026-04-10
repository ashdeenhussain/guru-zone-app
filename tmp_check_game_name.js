require('dotenv').config({ path: '.env.local' });
const mongoose = require('mongoose');

const OrderSchema = new mongoose.Schema({ userId: mongoose.Schema.Types.ObjectId, createdAt: Date, userDetails: Object });
const Order = mongoose.models.Order || mongoose.model('Order', OrderSchema);

async function checkGameName() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        
        console.log('--- Searching for Rx alone ---');
        const orders = await Order.find({ "userDetails.inGameName": /Rx alone/i }).populate('userId', 'name');
        console.log(JSON.stringify(orders, null, 2));

        await mongoose.disconnect();
    } catch (err) {
        console.error(err);
    }
}

checkGameName();
