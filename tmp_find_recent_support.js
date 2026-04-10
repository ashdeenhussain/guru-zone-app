require('dotenv').config({ path: '.env.local' });
const mongoose = require('mongoose');

const SupportTicketSchema = new mongoose.Schema({ userId: mongoose.Schema.Types.ObjectId, message: String, createdAt: Date, status: String, subject: String });
const SupportTicket = mongoose.models.SupportTicket || mongoose.model('SupportTicket', SupportTicketSchema);

async function findRecentSupport() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        const start = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000); // 30 days
        const tickets = await SupportTicket.find({ createdAt: { $gte: start } }).populate('userId', 'name');
        console.log('--- Recent Support Tickets ---');
        console.log(JSON.stringify(tickets, null, 2));

        const TransactionSchema = new mongoose.Schema({ user: mongoose.Schema.Types.ObjectId, type: String, status: String, createdAt: Date, amount: Number, description: String });
        const Transaction = mongoose.models.Transaction || mongoose.model('Transaction', TransactionSchema);
        const withdrawals = await Transaction.find({ type: 'withdrawal', createdAt: { $gte: start } }).populate('user', 'name');
        console.log('--- Recent Withdrawal Requests ---');
        console.log(JSON.stringify(withdrawals, null, 2));

        await mongoose.disconnect();
    } catch (err) {
        console.error(err);
    }
}

findRecentSupport();
