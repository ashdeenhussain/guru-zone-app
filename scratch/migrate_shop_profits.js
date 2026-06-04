const mongoose = require('mongoose');

const MONGODB_URI = 'mongodb://guru-mdb:QxJXLjXJBkVl7u1h@ac-b7suvb1-shard-00-00.5c5hedd.mongodb.net:27017,ac-b7suvb1-shard-00-01.5c5hedd.mongodb.net:27017,ac-b7suvb1-shard-00-02.5c5hedd.mongodb.net:27017/guru-zone?ssl=true&authSource=admin&retryWrites=true&w=majority';

async function run() {
    console.log("Connecting to database...");
    await mongoose.connect(MONGODB_URI);
    console.log("Connected to database successfully!");

    // Schemas & Models
    const StoreProductSchema = new mongoose.Schema({
        title: String,
        priceCoins: Number,
        costPrice: Number
    }, { collection: 'storeproducts' });

    const OrderSchema = new mongoose.Schema({
        userId: mongoose.Schema.Types.ObjectId,
        productId: mongoose.Schema.Types.ObjectId,
        pricePaid: Number,
        status: String,
        source: String,
        purchaseCost: Number,
        calculatedProfit: Number
    }, { collection: 'orders' });

    const FinancialLogSchema = new mongoose.Schema({
        type: String,
        amount: Number,
        userId: mongoose.Schema.Types.ObjectId,
        referenceId: mongoose.Schema.Types.Mixed,
        description: String,
        purchaseCost: Number,
        calculatedProfit: Number,
        timestamp: Date
    }, { collection: 'financiallogs' });

    const StoreProduct = mongoose.models.StoreProduct || mongoose.model('StoreProduct', StoreProductSchema);
    const Order = mongoose.models.Order || mongoose.model('Order', OrderSchema);
    const FinancialLog = mongoose.models.FinancialLog || mongoose.model('FinancialLog', FinancialLogSchema);

    // Fetch all active/inactive store products to have a quick lookup map
    const products = await StoreProduct.find({});
    const productMap = {};
    products.forEach(p => {
        productMap[p._id.toString()] = p;
    });
    console.log(`Fetched ${products.length} products for lookup.`);

    // 1. Migrate Order records
    const orders = await Order.find({});
    console.log(`Processing ${orders.length} orders...`);
    let ordersUpdated = 0;

    for (const order of orders) {
        const product = productMap[order.productId ? order.productId.toString() : ''];
        const costPrice = product ? (product.costPrice || 0) : 0;
        const purchaseCost = costPrice;
        const calculatedProfit = (order.pricePaid || 0) - purchaseCost;

        // Update if fields are missing or mismatching
        if (order.purchaseCost === undefined || order.calculatedProfit === undefined) {
            order.purchaseCost = purchaseCost;
            order.calculatedProfit = calculatedProfit;
            await order.save();
            ordersUpdated++;
        }
    }
    console.log(`Successfully migrated ${ordersUpdated} order records.`);

    // 2. Migrate FinancialLog records of type 'shop_purchase'
    const logs = await FinancialLog.find({ type: 'shop_purchase' });
    console.log(`Processing ${logs.length} shop_purchase financial logs...`);
    let logsUpdated = 0;

    for (const log of logs) {
        let purchaseCost = 0;
        let calculatedProfit = log.amount || 0;

        // Try to match by referenceId (Order ID)
        if (log.referenceId) {
            const matchedOrder = await Order.findById(log.referenceId);
            if (matchedOrder) {
                purchaseCost = matchedOrder.purchaseCost !== undefined ? matchedOrder.purchaseCost : 0;
                calculatedProfit = matchedOrder.calculatedProfit !== undefined ? matchedOrder.calculatedProfit : (log.amount - purchaseCost);
            } else {
                // If order not found, fallback to searching for a product that might match description or amount
                console.log(`Order not found for log ${log._id} (ref: ${log.referenceId}). Fallback to product match.`);
                // Fallback: search for product by title match or matching price
                const matchedProd = products.find(p => log.description.includes(p.title) || p.priceCoins === log.amount);
                if (matchedProd) {
                    purchaseCost = matchedProd.costPrice || 0;
                    calculatedProfit = log.amount - purchaseCost;
                }
            }
        } else {
            // No reference ID, fallback to product matching
            const matchedProd = products.find(p => log.description.includes(p.title) || p.priceCoins === log.amount);
            if (matchedProd) {
                purchaseCost = matchedProd.costPrice || 0;
                calculatedProfit = log.amount - purchaseCost;
            }
        }

        // Apply updates
        if (log.purchaseCost === undefined || log.calculatedProfit === undefined) {
            log.purchaseCost = purchaseCost;
            log.calculatedProfit = calculatedProfit;
            await log.save();
            logsUpdated++;
        }
    }
    console.log(`Successfully migrated ${logsUpdated} shop_purchase financial log records.`);

    console.log("Migration complete!");
    process.exit(0);
}

run().catch(err => {
    console.error("Migration failed:", err);
    process.exit(1);
});
