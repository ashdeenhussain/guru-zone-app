const mongoose = require('mongoose');

async function test() {
    await mongoose.connect('mongodb://guru-mdb:QxJXLjXJBkVl7u1h@ac-b7suvb1-shard-00-00.5c5hedd.mongodb.net:27017,ac-b7suvb1-shard-00-01.5c5hedd.mongodb.net:27017,ac-b7suvb1-shard-00-02.5c5hedd.mongodb.net:27017/guru-zone?ssl=true&authSource=admin&retryWrites=true&w=majority');

    const OrderSchema = new mongoose.Schema({
        productId: mongoose.Schema.Types.ObjectId,
        pricePaid: Number,
        status: String,
        purchaseCost: Number,
        calculatedProfit: Number
    }, { collection: 'orders' });

    const Order = mongoose.models.Order || mongoose.model('Order', OrderSchema);

    const pendingCount = await Order.countDocuments({ status: { $in: ['pending', 'Pending'] } });
    const approvedCount = await Order.countDocuments({ status: { $in: ['approved', 'Approved'] } });
    const rejectedCount = await Order.countDocuments({ status: { $in: ['rejected', 'Rejected'] } });
    
    console.log(`Orders by status - Pending: ${pendingCount}, Approved: ${approvedCount}, Rejected: ${rejectedCount}`);

    const sampleOrders = await Order.find({ purchaseCost: { $exists: false } }).limit(5);
    console.log("Sample orders missing purchaseCost:", sampleOrders);

    process.exit(0);
}

test().catch(console.error);
