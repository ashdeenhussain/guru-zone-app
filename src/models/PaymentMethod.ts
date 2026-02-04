import { Schema, model, models } from 'mongoose';

const PaymentMethodSchema = new Schema(
    {
        bankName: {
            type: String,
            required: true,
            enum: ['Easypaisa', 'JazzCash', 'Sadapay', 'Nayapay', 'U-Paisa', 'Bank Transfer'],
        },
        accountTitle: {
            type: String,
            required: true,
        },
        accountNumber: {
            type: String,
            required: true,
        },
        isActive: {
            type: Boolean,
            default: true,
        },
        instructions: {
            type: String,
            required: false,
        },
        proofGuideImageUrl: {
            type: String,
            required: false,
        },
    },
    { timestamps: true }
);

const PaymentMethod = models.PaymentMethod || model('PaymentMethod', PaymentMethodSchema);

export default PaymentMethod;
