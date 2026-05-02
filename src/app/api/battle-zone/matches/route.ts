import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/db';
import BattleMatch from '@/models/BattleMatch';
import mongoose from 'mongoose';
import { runExpiredMatchesCleanup } from '@/lib/battle-zone-cleanup';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
    try {
        await connectToDatabase();

        // On-Demand Cleanup Safety Net: 
        // Ensure any expired matches are cancelled/refunded immediately when anyone views the list
        await runExpiredMatchesCleanup();

        const { searchParams } = new URL(req.url);
        const type = searchParams.get('type'); // 'all' | 'my'
        const userId = searchParams.get('userId');

        const query: any = {};

        // If userId is provided, we want to see matches where the user is host or participant
        // regardless of the 'type' parameter, but especially if type='my'
        if (userId && mongoose.Types.ObjectId.isValid(userId)) {
            const userObjId = new mongoose.Types.ObjectId(userId);
            if (type === 'my') {
                // For 'my battles', show everything I'm involved in
                query.$or = [
                    { createdBy: userObjId },
                    { 'participants.userId': userObjId }
                ];
            } else {
                // For 'all', show open/active matches OR matches I'm involved in
                // We now include 'cancelled' for the user's history
                query.$or = [
                    { status: { $in: ['open', 'full', 'active', 'pending_verification', 'disputed', 'cancelled'] } },
                    { createdBy: userObjId },
                    { 'participants.userId': userObjId }
                ];
            }
        } else {
            // Public view: only show open/active matches (exclude cancelled)
            query.status = { $in: ['open', 'full', 'active', 'pending_verification', 'disputed'] };
        }

        console.log("BattleMatch Query:", JSON.stringify(query));

        const matches = await BattleMatch.find(query)
            .populate('createdBy', 'name inGameName')
            .sort({ createdAt: -1 });

        return NextResponse.json({ success: true, data: matches });
    } catch (error: any) {
        console.error("Error fetching battle matches:", error);
        return NextResponse.json({ success: false, error: "Failed to fetch matches" }, { status: 500 });
    }
}
