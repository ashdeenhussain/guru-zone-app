import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/db';
import BattleMatch from '@/models/BattleMatch';
import User from '@/models/User';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
    try {
        await connectToDatabase();

        const { searchParams } = new URL(req.url);
        const type = searchParams.get('type'); // 'all' | 'my'
        const userId = searchParams.get('userId');

        const query: any = {};

        if (type === 'my' && userId) {
            query.$or = [
                { createdBy: userId },
                { 'participants.userId': userId }
            ];
        }

        // Only show matches that are not cancelled or very old completed ones
        // But for now, let's just return all active/open ones
        if (!type || type === 'all') {
             query.status = { $in: ['open', 'full', 'active', 'pending_verification', 'disputed'] };
        }

        const matches = await BattleMatch.find(query)
            .populate('createdBy', 'name inGameName')
            .sort({ createdAt: -1 });

        return NextResponse.json({ success: true, data: matches });
    } catch (error: any) {
        console.error("Error fetching battle matches:", error);
        return NextResponse.json({ success: false, error: "Failed to fetch matches" }, { status: 500 });
    }
}
