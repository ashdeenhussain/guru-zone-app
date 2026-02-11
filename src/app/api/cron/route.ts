import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/db'; // Adjust path as needed
import Tournament from '@/models/Tournament';
import Transaction from '@/models/Transaction';

export const dynamic = 'force-dynamic'; // Important!

export async function GET(request: Request) {
    try {
        // 1. Security Check
        const authHeader = request.headers.get('authorization');
        if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
            return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
        }

        await connectToDatabase();

        // 2. Auto-Start Tournaments
        const now = new Date();
        const result = await Tournament.updateMany(
            { status: 'Open', startTime: { $lte: now } },
            { $set: { status: 'Live' } }
        );

        // 3. Cleanup Transactions (Optional)
        // Add your cleanup logic here if needed

        return NextResponse.json({ success: true, started: result.modifiedCount });
    } catch (error) {
        console.error('Cron Error:', error);
        return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
    }
}
