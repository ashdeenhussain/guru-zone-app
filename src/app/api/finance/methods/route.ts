import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import PaymentMethod from '@/models/PaymentMethod';

export async function GET() {
    try {
        await connectDB();
        let methods = await PaymentMethod.find({ isActive: true }).select('-createdAt -updatedAt');

        // DEBUG: If no active methods, fetch ALL to check if they exist but are inactive
        if (!methods || methods.length === 0) {
            console.log("No active payment methods found. Checking for inactive ones...");
            const allMethods = await PaymentMethod.find({});
            console.log(`Found ${allMethods.length} total methods.`);

            // Fallback for dev: return dummy if absolutely nothing exists
            if (allMethods.length === 0) {
                return NextResponse.json([{ _id: 'dummy', bankName: 'Easypaisa (Dev)' }, { _id: 'dummy2', bankName: 'JazzCash (Dev)' }], { status: 200 });
            }
        }

        return NextResponse.json(methods, { status: 200 });
    } catch (error) {
        console.error('Error fetching payment methods:', error);
        return NextResponse.json({ error: 'Failed to fetch payment methods' }, { status: 500 });
    }
}
