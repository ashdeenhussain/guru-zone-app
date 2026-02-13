import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/db';
import Tournament from '@/models/Tournament';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import User from '@/models/User';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
    try {
        await connectToDatabase();

        const { searchParams } = new URL(req.url);
        const type = searchParams.get('type'); // 'official' | 'community'

        // Calculate the cutoff time (4 hours ago)
        const cutoffTime = new Date(Date.now() - 4 * 60 * 60 * 1000);

        const query: any = {
            isVisible: { $ne: false },
            $or: [
                { status: { $in: ['Open', 'Live'] } },
                {
                    status: { $in: ['Completed', 'Cancelled'] },
                    updatedAt: { $gte: cutoffTime }
                }
            ]
        };

        // Filter based on type
        if (type === 'community') {
            query.createdBy = { $ne: null };
        } else {
            // Default to 'official' tourneys (Admin created -> createdBy is null or doesn't exist)
            query.createdBy = null;
        }

        const tournaments = await Tournament.find(query).sort({ startTime: 1 });

        return NextResponse.json({ success: true, data: tournaments });
    } catch (error) {
        console.error("Error fetching tournaments:", error);
        return NextResponse.json({ success: false, error: "Failed to fetch tournaments" }, { status: 500 });
    }
}

export async function POST(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || !session.user) {
            return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
        }

        await connectToDatabase();
        const body = await req.json();

        // Validate required fields
        if (!body.title || !body.format || !body.gameType || !body.startTime || !body.maxSlots) {
            return NextResponse.json({ success: false, error: 'Missing required fields' }, { status: 400 });
        }

        // Determine teamSize based on format
        let teamSize = 1;
        if (['2v2', 'Duo'].includes(body.format)) teamSize = 2;
        if (['4v4', 'Squad'].includes(body.format)) teamSize = 4;

        // Create the tournament
        const tournamentData = {
            ...body,
            createdBy: (session.user as any).id,
            teamSize: teamSize,
            status: 'Open', // Default status
            joinedCount: 0,
            participants: [],
            // Ensure sensitive fields are handled safely if passed (though model default hides them)
            roomID: body.roomID || undefined,
            roomPassword: body.roomPassword || undefined
        };

        // TODO: Validate user balance if there's a hosting fee
        // const hostingFee = 0; // standard fee?
        // const user = await User.findById(session.user.id);
        // if (user.walletBalance < hostingFee) { ... }

        const tournament = await Tournament.create(tournamentData);

        return NextResponse.json({ success: true, tournament }, { status: 201 });

    } catch (error: any) {
        console.error("Error creating tournament:", error);
        return NextResponse.json({ success: false, error: error.message || "Failed to create tournament" }, { status: 500 });
    }
}
