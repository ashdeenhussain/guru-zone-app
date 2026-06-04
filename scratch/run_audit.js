const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../.env.local') });

// Schema Definitions
const UserSchema = new mongoose.Schema({
    name: String,
    email: String,
    walletBalance: { type: Number, default: 0 },
    walletStatus: { type: String, default: 'Synced' },
    suspiciousFlag: { type: Boolean, default: false },
    walletFlagReason: { type: String, default: '' },
    status: String
}, { collection: 'users' });

const FinancialLogSchema = new mongoose.Schema({
    type: String,
    amount: Number,
    currency: String,
    userId: mongoose.Schema.Types.ObjectId,
    description: String,
    timestamp: Date
}, { collection: 'financiallogs' });

const User = mongoose.models.User || mongoose.model('User', UserSchema);
const FinancialLog = mongoose.models.FinancialLog || mongoose.model('FinancialLog', FinancialLogSchema);

async function run() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log("Connected to DB");

        const users = await User.find({ status: { $ne: 'banned' } });
        console.log(`Found ${users.length} active users. Starting audit...`);

        let mismatchCount = 0;
        let suspiciousCount = 0;

        for (const user of users) {
            const logs = await FinancialLog.find({ userId: user._id });
            
            let calculatedBalance = 0;
            logs.forEach(log => {
                const amount = Math.abs(log.amount || 0);
                if (log.type === 'deposit') {
                    calculatedBalance += amount;
                } else if (log.type === 'withdrawal') {
                    calculatedBalance -= amount;
                } else if (log.type === 'shop_purchase') {
                    calculatedBalance -= amount;
                } else if (log.type === 'free_spin') {
                    calculatedBalance += amount;
                } else if (log.type === 'daily_collect') {
                    calculatedBalance += amount;
                } else if (log.type === 'prize_winnings') {
                    calculatedBalance += amount;
                } else if (log.type === 'admin_adjustment') {
                    calculatedBalance += log.amount || 0;
                }
            });

            const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
            const recentLogs = await FinancialLog.find({
                userId: user._id,
                timestamp: { $gte: oneDayAgo },
                type: { $in: ['admin_adjustment', 'daily_collect'] }
            });

            const suspicious = recentLogs.length > 5;
            const currentBalance = user.walletBalance || 0;
            const mismatch = Math.abs(calculatedBalance - currentBalance) > 0.01;

            let walletStatus = 'Synced';
            let suspiciousFlag = false;
            const reasons = [];

            if (mismatch) {
                walletStatus = 'Mismatch';
                reasons.push(`Balance mismatch: calculated ${calculatedBalance} but wallet has ${currentBalance}`);
                mismatchCount++;
            }
            if (suspicious) {
                suspiciousFlag = true;
                reasons.push(`Suspicious activity: ${recentLogs.length} admin adjustments/daily collects in 24 hours`);
                walletStatus = 'Mismatch';
                suspiciousCount++;
            }

            user.walletStatus = walletStatus;
            user.suspiciousFlag = suspiciousFlag;
            user.walletFlagReason = reasons.join('; ');
            user.walletLedgerSum = calculatedBalance;
            await user.save();

            if (mismatch || suspicious) {
                console.log(`\n🚨 Alert for User: ${user.name} (${user.email})`);
                console.log(`   Wallet Balance: ${currentBalance}`);
                console.log(`   Calculated Balance: ${calculatedBalance}`);
                console.log(`   Status: ${walletStatus}`);
                console.log(`   Reasons: ${user.walletFlagReason}`);
            }
        }

        console.log(`\nAudit Complete.`);
        console.log(`Total checked: ${users.length}`);
        console.log(`Mismatched accounts count: ${mismatchCount}`);
        console.log(`Suspicious accounts count: ${suspiciousCount}`);

        await mongoose.disconnect();
    } catch (err) {
        console.error("Error running audit:", err);
    }
}

run();
