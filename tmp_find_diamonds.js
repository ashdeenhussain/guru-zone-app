require('dotenv').config({ path: '.env.local' });
const mongoose = require('mongoose');

const ProductSchema = new mongoose.Schema({ title: String, category: String });
const StoreProduct = mongoose.models.StoreProduct || mongoose.model('StoreProduct', ProductSchema);

async function findDiamondProducts() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        const products = await StoreProduct.find({ category: /Diamond/i });
        console.log('--- Diamond Products ---');
        console.log(JSON.stringify(products, null, 2));

        if (products.length > 0) {
            const OrderSchema = new mongoose.Schema({ productId: mongoose.Schema.Types.ObjectId, createdAt: Date, userDetails: Object });
            const Order = mongoose.models.Order || mongoose.model('Order', OrderSchema);
            const productIds = products.map(p => p._id);
            const orders = await Order.find({ productId: { $in: productIds } }).sort({ createdAt: -1 }).limit(10).populate('userId', 'name');
            console.log('--- Recent Diamond Orders ---');
            console.log(JSON.stringify(orders, null, 2));
        }

        await mongoose.disconnect();
    } catch (err) {
        console.error(err);
    }
}

findDiamondProducts();
