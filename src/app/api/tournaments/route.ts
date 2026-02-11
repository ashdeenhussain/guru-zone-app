import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/db';
import Tournament from '@/models/Tournament';

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        await connectToDatabase();

        // Calculate the cutoff time (4 hours ago)
        const cutoffTime = new Date(Date.now() - 4 * 60 * 60 * 1000);

        const query = {
            isVisible: { $ne: false },
            $or: [
                { status: { $in: ['Open', 'Live'] } },
                {
                    status: { $in: ['Completed', 'Cancelled'] },
                    updatedAt: { $gte: cutoffTime }
                }
            ]
        };

        const tournaments = await Tournament.find(query).sort({ startTime: 1 });



        return NextResponse.json({ success: true, data: tournaments });
    } catch (error) {
        console.error("Error fetching tournaments:", error);
        return NextResponse.json({ success: false, error: "Failed to fetch tournaments" }, { status: 500 });
    }
}
