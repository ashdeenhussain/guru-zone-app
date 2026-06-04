const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../.env.local') });

const TransactionSchema = new mongoose.Schema({
    type: String,
    amount: Number,
    description: String,
    status: String,
    user: mongoose.Schema.Types.ObjectId,
    createdAt: Date,
    details: mongoose.Schema.Types.Mixed
}, { collection: 'transactions' });

const Transaction = mongoose.models.Transaction || mongoose.model('Transaction', TransactionSchema);

async function run() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log("Connected to DB");
        const count = await Transaction.countDocuments({ type: 'ADMIN_ADJUSTMENT' });
        console.log(`Found ${count} ADMIN_ADJUSTMENT transactions`);
        
        const samples = await Transaction.find({ type: 'ADMIN_ADJUSTMENT' }).limit(5).lean();
        console.log("Samples:", JSON.stringify(samples, null, 2));
        
        await mongoose.disconnect();
    } catch (err) {
        console.error(err);
    }
}

run();
