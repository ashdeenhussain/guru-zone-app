import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/db';
import BattleMatch from '@/models/BattleMatch';
import User from '@/models/User';

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        await connectToDatabase();
        const { id } = await params;

        const match = await BattleMatch.findById(id)
            .populate('createdBy', 'name inGameName freeFireUid image')
            .populate('participants.userId', 'username inGameName freeFireUid image name')
            .populate('winners.rank1', 'username inGameName freeFireUid image name');

        if (!match) {
            // Fallback: Check Tournament model in case it's an old match (optional, but good for transition)
            // However, user said "Strictly Separate", so maybe we don't fallback.
            return NextResponse.json({ success: false, error: 'Match not found' }, { status: 404 });
        }

        return NextResponse.json({ success: true, data: match });
    } catch (error: any) {
        console.error("Error fetching battle match details:", error);
        return NextResponse.json({ success: false, error: "Failed to load match: " + error.message }, { status: 500 });
    }
}
