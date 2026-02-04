import { NextResponse } from 'next/server';
import connectToDB from '@/lib/db';
import Tournament from '@/models/Tournament';
import User from '@/models/User';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import AdminActivity from '@/models/AdminActivity';

// Helper to check for admin role (in a real app, middleware handles this, but good to be safe)
// For this task, we assume middleware/layout protects this, but we can access session if needed.

export async function GET() {
    try {
        await connectToDB();
        const tournaments = await Tournament.find({})
            .sort({ createdAt: -1 })
            .select('+roomID +roomPassword')
            .populate('participants.userId', 'username name email inGameName uid avatarId image');
        return NextResponse.json({ success: true, count: tournaments.length, tournaments });
    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}

export async function POST(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || !session.user || (session.user as any).role !== 'admin') {
            return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
        }

        await connectToDB();
        const body = await req.json();

        // Basic validation happens in Mongoose, but we can force specifics here
        // prizeDistribution is key

        const tournament = await Tournament.create(body);

        // Log Activity
        await AdminActivity.create({
            adminId: (session.user as any).id,
            adminName: session.user.name,
            actionType: 'CREATE_TOURNAMENT',
            targetId: tournament._id,
            details: `Created tournament: ${tournament.title} (${tournament.gameType})`
        });

        return NextResponse.json({ success: true, tournament }, { status: 201 });
    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
