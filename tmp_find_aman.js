require('dotenv').config({ path: '.env.local' });
const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({ name: String, email: String, walletBalance: Number });
const User = mongoose.models.User || mongoose.model('User', UserSchema);

async function findAman() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        const aman = await User.findOne({ name: /Aman malik/i });
        console.log('--- Aman Malik ---');
        console.log(JSON.stringify(aman, null, 2));

        if (aman) {
            const OrderSchema = new mongoose.Schema({ userId: mongoose.Schema.Types.ObjectId, createdAt: Date, userDetails: Object });
            const Order = mongoose.models.Order || mongoose.model('Order', OrderSchema);
            const orders = await Order.find({ userId: aman._id }).sort({ createdAt: -1 });
            console.log('--- Aman Malik Orders ---');
            console.log(JSON.stringify(orders, null, 2));
        }

        await mongoose.disconnect();
    } catch (err) {
        console.error(err);
    }
}

findAman();
