import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import PaymentMethod from '@/models/PaymentMethod';

export async function GET() {
    try {
        await connectDB();
        // Admin sees all methods, including inactive ones
        const methods = await PaymentMethod.find({}).sort({ createdAt: -1 });
        return NextResponse.json(methods);
    } catch (error) {
        console.error('Error fetching payment methods:', error);
        return NextResponse.json({ error: 'Failed to fetch payment methods' }, { status: 500 });
    }
}

export async function POST(req: Request) {
    try {
        await connectDB();
        const body = await req.json();

        // Basic validation could happen here, but Schema handles required fields
        const method = await PaymentMethod.create(body);

        return NextResponse.json(method, { status: 201 });
    } catch (error) {
        console.error('Error creating payment method:', error);
        return NextResponse.json({ error: 'Failed to create payment method' }, { status: 500 });
    }
}
