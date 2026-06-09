const mongoose = require('mongoose');

const uri = 'mongodb://guru-mdb:QxJXLjXJBkVl7u1h@ac-b7suvb1-shard-00-00.5c5hedd.mongodb.net:27017,ac-b7suvb1-shard-00-01.5c5hedd.mongodb.net:27017,ac-b7suvb1-shard-00-02.5c5hedd.mongodb.net:27017/guru-zone?ssl=true&authSource=admin&retryWrites=true&w=majority';

async function main() {
    await mongoose.connect(uri);
    console.log("Connected to MongoDB.");

    const TransactionSchema = new mongoose.Schema({}, { strict: false, collection: 'transactions' });
    const Transaction = mongoose.models.Transaction || mongoose.model('Transaction', TransactionSchema);

    const txs = await Transaction.find({ referenceId: '6a21b4fb53d4125ccdb016c2' }).lean();
    console.log("Transactions for this tournament:", JSON.stringify(txs, null, 2));

    process.exit(0);
}

main().catch(console.error);
