import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import PaymentMethod from '@/models/PaymentMethod';

export async function GET() {
    try {
        await connectDB();

        const count = await PaymentMethod.countDocuments();
        if (count > 0) {
            return NextResponse.json({ message: 'Payment methods already seeded', count });
        }

        const methods = [
            {
                bankName: 'Easypaisa',
                accountTitle: 'Guru Zone Official',
                accountNumber: '03001234567',
                instructions: 'Please send only via Easypaisa App. Do not SMS.',
            },
            {
                bankName: 'JazzCash',
                accountTitle: 'Guru Zone Official',
                accountNumber: '03211234567',
                instructions: 'JazzCash to JazzCash only.',
            },
            {
                bankName: 'Sadapay',
                accountTitle: 'Ali Ahmed',
                accountNumber: '03121234567',
                instructions: 'Free instant transfer.',
            },
        ];

        await PaymentMethod.insertMany(methods);

        return NextResponse.json({ message: 'Payment methods seeded successfully', methods });
    } catch (error) {
        return NextResponse.json({ error: 'Failed to seed payment methods', details: error }, { status: 500 });
    }
}
