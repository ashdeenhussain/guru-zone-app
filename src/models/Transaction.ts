import { Schema, model, models } from 'mongoose';

const TransactionSchema = new Schema(
    {
        user: {
            type: Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
        amount: {
            type: Number,
            required: true,
        },
        type: {
            type: String,
            enum: ['deposit', 'withdrawal', 'entry_fee', 'prize_winnings', 'refund', 'shop_purchase', 'spin_win'],
            required: true,
        },
        method: {
            type: String, // e.g., 'Easypaisa', 'JazzCash'
            required: false,
        },
        proofImage: {
            type: String, // URL to image
            required: false,
        },
        trxID: {
            type: String, // Transaction ID from user
            required: false,
        },
        description: {
            type: String,
            required: true,
        },
        bankDetails: {
            bankName: String,
            accountTitle: String,
            accountNumber: String,
        },
        rejectionReason: {
            type: String,
            required: false,
        },
        status: {
            type: String,
            enum: ['pending', 'approved', 'rejected', 'Pending', 'Approved', 'Rejected'], // Keeping capitalized for backward compatibility if needed, but per specs we will use lowercase
            default: 'pending',
        },
        details: {
            type: Schema.Types.Mixed,
            required: false,
        },
    },
    { timestamps: true }
);

// Force model recompilation if schema changed (important for HMR/Dev)
if (models.Transaction) {
    delete models.Transaction;
}

const Transaction = model('Transaction', TransactionSchema);

export default Transaction;
