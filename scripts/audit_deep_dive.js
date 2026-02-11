
const mongoose = require('mongoose');

// Define minimal schemas to avoid import issues
const TransactionSchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    amount: Number,
    type: String,
    status: String,
    details: mongoose.Schema.Types.Mixed,
    description: String
}, { timestamps: true });

const AdminActivitySchema = new mongoose.Schema({
    adminId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    actionType: String,
    targetId: String,
    details: String,
    metadata: mongoose.Schema.Types.Mixed
}, { timestamps: true });

const UserSchema = new mongoose.Schema({
    name: String,
    email: String,
    walletBalance: Number
});

const Transaction = mongoose.model('Transaction', TransactionSchema);
const AdminActivity = mongoose.model('AdminActivity', AdminActivitySchema);
const User = mongoose.model('User', UserSchema);

async function runAudit() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to DB');

        const targetUserId = '679e00000000000000000000'; // Placeholder, will replace with CLI arg or hardcoded if needed
        // Authenticating User ID from screenshot: 6984bb31770fc1f747b3bc4a (Wait, that looks like a custom ID or long string, likely MongoDB ObjectId is 24 chars hex)
        // Screenshot ID: 6984bb31770fc1f747b3bc4a (24 chars? No, let's count)
        // 69 84 bb 31 77 0f c1 f7 47 b3 bc 4a -> 24 hex chars. It IS a valid ObjectId format.
        // Wait, 69... is not standard (starts with timestamp). 0x69 = 105. Year 2038?
        // Maybe it's not an ObjectId.

        // Let's first search for the user by name/email "Muhammad Ahmad" / "ahmadpml247@gmail.com" from screenshot
        const user = await User.findOne({ email: 'ahmadpml247@gmail.com' });

        if (!user) {
            console.log("User 'ahmadpml247@gmail.com' not found.");
            return;
        }

        console.log(`User Found: ${user.name} (${user._id})`);
        console.log(`Current Wallet Balance: ${user.walletBalance}`);

        // 1. Fetch Transactions
        const transactions = await Transaction.find({ user: user._id }).sort({ createdAt: 1 });
        console.log(`\n--- Transaction History (${transactions.length}) ---`);
        let calculated = 0;
        transactions.forEach(t => {
            console.log(`[${t.createdAt.toISOString()}] ${t.type} (${t.status}): ${t.amount} | Ref: ${t.description}`);

            // Replicate Frontend Logic rough check
            let effect = 0;
            const status = t.status?.toLowerCase() || 'pending';
            if (!['rejected', 'failed', 'cancelled'].includes(status)) {
                if (['deposit', 'prize_winnings', 'spin_win', 'refund', 'MANUAL_ADJUSTMENT'].includes(t.type)) {
                    effect = t.amount;
                } else if (['withdrawal', 'entry_fee', 'admin_deduction', 'shop_purchase'].includes(t.type)) {
                    effect = -t.amount;
                } else if (t.type === 'ADMIN_ADJUSTMENT') {
                    effect = (t.details?.adjustmentType === 'CREDIT') ? t.amount : -t.amount;
                }
            }
            if (t.type === 'deposit' && status === 'pending') effect = 0;

            calculated += effect;
        });

        console.log(`\nCalculated from History: ${calculated}`);
        console.log(`Difference: ${user.walletBalance - calculated}`);

        // 2. Fetch Admin Activity for this user
        console.log(`\n--- Admin Activity Log (Targeting User) ---`);
        const activities = await AdminActivity.find({
            $or: [
                { targetId: user._id.toString() },
                { details: { $regex: user.email, $options: 'i' } } // Check contents
            ]
        }).sort({ createdAt: 1 });

        activities.forEach(a => {
            console.log(`[${a.createdAt.toISOString()}] ${a.actionType}: ${a.details}`);
        });

        if (activities.length === 0) {
            console.log("No Admin Activity found for this user.");
        }

    } catch (err) {
        console.error('Audit failed:', err);
    } finally {
        await mongoose.disconnect();
    }
}

// Load env validation (rudimentary)
const fs = require('fs');
const path = require('path');
const envPath = path.resolve(process.cwd(), '.env.local');
if (fs.existsSync(envPath)) {
    const envConfig = require('dotenv').parse(fs.readFileSync(envPath));
    for (const k in envConfig) {
        process.env[k] = envConfig[k];
    }
}

runAudit();
