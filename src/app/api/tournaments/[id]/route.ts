import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/db';
import Tournament from '@/models/Tournament';
import User from '@/models/User';

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        await connectToDatabase();
        const { id } = await params; // Await the params promise
        const tournament = await Tournament.findById(id)
            .populate('createdBy', 'name')
            .populate('participants.userId', 'username inGameName freeFireUid image name')
            .populate('winners.rank1', 'username inGameName freeFireUid image name')
            .populate('winners.rank2', 'username inGameName freeFireUid image name')
            .populate('winners.rank3', 'username inGameName freeFireUid image name');

        if (!tournament) {
            return NextResponse.json({ success: false, error: 'Tournament not found' }, { status: 404 });
        }

        return NextResponse.json({ success: true, data: tournament });
    } catch (error: any) {
        console.error("Error fetching tournament details:", error.message, error.stack);
        return NextResponse.json({ success: false, error: "Failed to load tournament details: " + error.message }, { status: 500 });
    }
}
