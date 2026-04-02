import { NextResponse } from 'next/server';
import connectToDB from '@/lib/db';
import Tournament from '@/models/Tournament';

export async function GET(req: Request) {
    try {
        await connectToDB();

        // Search for tournaments created in the last 48 hours or scheduled effectively
        // User said yesterday 10:20 PM (2026-02-15 22:20 +05:00)
        // Let's get all Squad tournaments recently modified/created

        const tournaments = await Tournament.find({
            // Search for anything relevant
        })
            .sort({ createdAt: -1 })
            .limit(20)
            .populate('participants.userId', 'name email walletBalance');

        const results = tournaments.map(t => ({
            _id: t._id,
            title: t.title,
            format: t.format,
            entryFee: t.entryFee,
            status: t.status,
            startTime: t.startTime,
            createdAt: t.createdAt,
            joinedCount: t.joinedCount,
            participantCount: t.participants.length,
            participants: t.participants.map((p: any) => ({
                userId: p.userId?._id,
                name: p.userId?.name,
                email: p.userId?.email,
                walletBalance: p.userId?.walletBalance,
                teamName: p.teamName
            }))
        }));

        return NextResponse.json({ success: true, count: results.length, tournaments: results });
    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
