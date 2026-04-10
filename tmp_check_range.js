require('dotenv').config({ path: '.env.local' });
const mongoose = require('mongoose');

const TransactionSchema = new mongoose.Schema({ user: mongoose.Schema.Types.ObjectId, amount: Number, type: String, status: String, createdAt: Date, description: String }, { strict: false });
const Transaction = mongoose.models.Transaction || mongoose.model('Transaction', TransactionSchema);

async function checkRange() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        const start = new Date('2026-03-25T00:00:00Z');
        const end = new Date('2026-04-05T00:00:00Z');
        const trxs = await Transaction.find({ createdAt: { $gte: start, $lt: end }, type: 'shop_purchase' }).populate('user', 'name');
        console.log('--- Shop transactions between March 25th and April 5th ---');
        console.log(JSON.stringify(trxs, null, 2));
        await mongoose.disconnect();
    } catch (err) {
        console.error(err);
    }
}

checkRange();
