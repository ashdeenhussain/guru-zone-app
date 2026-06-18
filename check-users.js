const mongoose = require('mongoose');
const { Schema, model, models } = mongoose;

const UserSchema = new Schema({
    email: String,
    name: String,
    spinsAvailable: Number,
    loyaltyProgress: Number,
    walletBalance: Number
}, { timestamps: true });

const User = models.User || model('User', UserSchema);

const TransactionSchema = new Schema({
    user: { type: Schema.Types.ObjectId, ref: 'User' },
    amount: Number,
    type: String,
    status: String,
    description: String,
    createdAt: Date
}, { timestamps: true });

const Transaction = models.Transaction || model('Transaction', TransactionSchema);

const uri = 'mongodb://guru-mdb:QxJXLjXJBkVl7u1h@ac-b7suvb1-shard-00-00.5c5hedd.mongodb.net:27017,ac-b7suvb1-shard-00-01.5c5hedd.mongodb.net:27017,ac-b7suvb1-shard-00-02.5c5hedd.mongodb.net:27017/guru-zone?ssl=true&authSource=admin&retryWrites=true&w=majority';

async function main() {
    await mongoose.connect(uri);
    console.log("Connected to MongoDB");

    // Find users with spinsAvailable > 0 or loyaltyProgress > 0
    const users = await User.find({
        $or: [
            { spinsAvailable: { $gt: 0 } },
            { loyaltyProgress: { $gt: 0 } }
        ]
    });

    console.log(`Found ${users.length} users with spins or progress.`);
    
    for (const user of users) {
        // Find approved deposits for this user
        const deposits = await Transaction.find({
            user: user._id,
            type: 'deposit',
            status: 'approved'
        });

        const depositAmounts = deposits.map(d => d.amount);
        const totalDeposits = depositAmounts.reduce((a, b) => a + b, 0);

        console.log(`User: ${user.email} (${user.name})`);
        console.log(`  Spins Available: ${user.spinsAvailable}`);
        console.log(`  Loyalty Progress: ${user.loyaltyProgress}`);
        console.log(`  Wallet Balance: ${user.walletBalance}`);
        console.log(`  Approved Deposits Total: ${totalDeposits} (${depositAmounts.length} deposits: [${depositAmounts.join(', ')}])`);
        console.log('--------------------------------------------');
    }

    process.exit(0);
}

main().catch(err => {
    console.error(err);
    process.exit(1);
});
