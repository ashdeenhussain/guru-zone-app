import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import PaymentMethod from '@/models/PaymentMethod';

export async function GET() {
    try {
        await connectDB();

        const methods = [
            {
                bankName: 'Easypaisa',
                accountTitle: 'Guru Zone Official',
                accountNumber: '03001234567',
                instructions: 'Please upload a clear screenshot of the successful transaction showing the Transaction ID.',
                proofGuideImageUrl: '/images/payment-methods/EasyPasa.png'
            },
            {
                bankName: 'JazzCash',
                accountTitle: 'Guru Zone Official',
                accountNumber: '03211234567',
                instructions: 'Ensure the Transaction ID and Status are visible in the screenshot.',
                proofGuideImageUrl: '/images/payment-methods/JazzCash.png'
            },
            {
                bankName: 'Sadapay',
                accountTitle: 'Ali Ahmed',
                accountNumber: '03121234567',
                instructions: 'Upload the SadaPay transaction receipt screenshot.',
                proofGuideImageUrl: '/images/payment-methods/SadaPay.png'
            },
            {
                bankName: 'Nayapay',
                accountTitle: 'Ali Ahmed',
                accountNumber: '03127654321',
                instructions: 'Upload the NayaPay transaction details screenshot.',
                proofGuideImageUrl: '/images/payment-methods/NayPay.png'
            },
            {
                bankName: 'U-Paisa',
                accountTitle: 'Ali Ahmed',
                accountNumber: '03331234567',
                instructions: 'Upload the U-Paisa transaction confirmation screenshot.',
                proofGuideImageUrl: '/images/payment-methods/U-pasa.jpg'
            },
        ];

        for (const method of methods) {
            await PaymentMethod.findOneAndUpdate(
                { bankName: method.bankName },
                method,
                { upsert: true, new: true }
            );
        }

        return NextResponse.json({ message: 'Payment methods seeded/updated successfully', methods });
    } catch (error) {
        return NextResponse.json({ error: 'Failed to seed payment methods', details: error }, { status: 500 });
    }
}
