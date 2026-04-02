const mongoose = require('mongoose');

async function test() {
    await mongoose.connect('mongodb://guru-mdb:QxJXLjXJBkVl7u1h@ac-b7suvb1-shard-00-00.5c5hedd.mongodb.net:27017,ac-b7suvb1-shard-00-01.5c5hedd.mongodb.net:27017,ac-b7suvb1-shard-00-02.5c5hedd.mongodb.net:27017/guru-zone?ssl=true&authSource=admin&retryWrites=true&w=majority');

    const PaymentMethodSchema = new mongoose.Schema({
        bankName: String,
        isActive: Boolean,
        usageType: String
    }, { collection: 'paymentmethods' });

    const PaymentMethod = mongoose.models.PaymentMethod || mongoose.model('PaymentMethod', PaymentMethodSchema);

    const allMethods = await PaymentMethod.find({});
    console.log("All methods:", allMethods);

    const activeDepositMethods = await PaymentMethod.find({
        isActive: true,
        usageType: { $in: ['both', 'deposit'] }
    });
    console.log("Active deposit methods:", activeDepositMethods);

    process.exit(0);
}

test().catch(console.error);
