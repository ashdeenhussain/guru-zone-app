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
            .populate('winners.rank1', 'username inGameName freeFireUid image name')
            .populate('disputedBy', 'username inGameName freeFireUid name image');

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

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        await connectToDatabase();
        const { id } = await params;
        const body = await req.json();
        const { number } = body;

        if (!number) {
            return NextResponse.json({ success: false, error: 'Admin number is required' }, { status: 400 });
        }

        const match = await BattleMatch.findById(id);
        if (!match) {
            return NextResponse.json({ success: false, error: 'Match not found' }, { status: 404 });
        }

        // Initialize sharedWithAdmins if it doesn't exist
        if (!match.sharedWithAdmins) {
            match.sharedWithAdmins = [] as any;
        }

        // Check if this admin is already in the list
        const existingIdx = match.sharedWithAdmins.findIndex((item: any) => item.number === number);
        if (existingIdx > -1) {
            match.sharedWithAdmins[existingIdx].sharedAt = new Date();
        } else {
            match.sharedWithAdmins.push({ number, sharedAt: new Date() });
        }

        await match.save();

        return NextResponse.json({ success: true, data: match });
    } catch (error: any) {
        console.error("Error logging battle match share:", error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
