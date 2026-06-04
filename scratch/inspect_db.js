const mongoose = require('mongoose');

async function test() {
    await mongoose.connect('mongodb://guru-mdb:QxJXLjXJBkVl7u1h@ac-b7suvb1-shard-00-00.5c5hedd.mongodb.net:27017,ac-b7suvb1-shard-00-01.5c5hedd.mongodb.net:27017,ac-b7suvb1-shard-00-02.5c5hedd.mongodb.net:27017/guru-zone?ssl=true&authSource=admin&retryWrites=true&w=majority');

    const FinancialLogSchema = new mongoose.Schema({
        type: String,
        amount: Number,
        purchaseCost: Number,
        calculatedProfit: Number,
        referenceId: mongoose.Schema.Types.Mixed,
        description: String,
        timestamp: Date
    }, { collection: 'financiallogs' });

    const FinancialLog = mongoose.models.FinancialLog || mongoose.model('FinancialLog', FinancialLogSchema);

    const logs = await FinancialLog.find({ type: 'shop_purchase' });
    console.log(`Found ${logs.length} shop_purchase logs:`);
    logs.forEach(log => {
        console.log(`- Amount: ${log.amount}, Cost: ${log.purchaseCost}, Profit: ${log.calculatedProfit}, Ref: ${log.referenceId}, Desc: "${log.description}"`);
    });

    process.exit(0);
}

test().catch(console.error);
