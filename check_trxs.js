const mongoose = require('mongoose');
const { Schema, model, models } = mongoose;

const TransactionSchema = new Schema({
    user: { type: Schema.Types.ObjectId, ref: 'User' },
    amount: Number,
    type: String,
    status: String,
    description: String,
    createdAt: Date
}, { timestamps: true });

const Transaction = models.Transaction || model('Transaction', TransactionSchema);

const MONGODB_URI = "mongodb://guru-mdb:QxJXLjXJBkVl7u1h@ac-b7suvb1-shard-00-00.5c5hedd.mongodb.net:27017,ac-b7suvb1-shard-00-01.5c5hedd.mongodb.net:27017,ac-b7suvb1-shard-00-02.5c5hedd.mongodb.net:27017/guru-zone?ssl=true&authSource=admin&retryWrites=true&w=majority";

async function checkTrxs() {
    try {
        await mongoose.connect(MONGODB_URI);
        const trxs = await Transaction.find({ type: 'prize_winnings' }).sort({ createdAt: -1 }).limit(10);
        console.log('PRIZE_WINNINGS_FOUND:');
        console.log(JSON.stringify(trxs, null, 2));

        const lastFew = await Transaction.find({}).sort({ createdAt: -1 }).limit(5);
        console.log('LATEST_TRANSACTIONS:');
        console.log(JSON.stringify(lastFew, null, 2));

        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

checkTrxs();
