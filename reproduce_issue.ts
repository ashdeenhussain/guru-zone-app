
import mongoose from 'mongoose';
import Transaction from './src/models/Transaction';
import User from './src/models/User';
import connectDB from './src/lib/db';

async function run() {
    try {
        await connectDB();
        console.log('Connected to DB');

        // Create a dummy user
        const user = await User.create({
            name: 'Test User',
            email: `test_${Date.now()}@example.com`,
            password: 'password',
            walletBalance: 0
        });
        console.log('Created user:', user._id);

        // Create a CREDIT adjustment
        const adjustment = {
            user: user._id,
            amount: 150,
            type: 'ADMIN_ADJUSTMENT',
            description: 'Test Adjustment',
            status: 'approved',
            details: {
                adjustedBy: 'admin@example.com',
                adjustmentType: 'CREDIT'
            }
        };

        const tx = await Transaction.create(adjustment);
        console.log('Created transaction:', tx._id);

        // Fetch it back
        const fetchedTx = await Transaction.findById(tx._id).lean();

        if (!fetchedTx) {
            console.error('FAILURE: Transaction not found');
            return;
        }

        console.log('Fetched details:', JSON.stringify(fetchedTx.details, null, 2));

        if (fetchedTx.details?.adjustmentType === 'CREDIT') {
            console.log('SUCCESS: adjustmentType is preserved.');
        } else {
            console.error('FAILURE: adjustmentType is missing or incorrect.');
        }

        // Cleanup
        await Transaction.findByIdAndDelete(tx._id);
        await User.findByIdAndDelete(user._id);
        console.log('Cleanup done');

    } catch (err) {
        console.error(err);
    } finally {
        await mongoose.disconnect();
    }
}

run();
