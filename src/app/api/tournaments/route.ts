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
            $and: [
                {
                    $or: [
                        { status: { $in: ['Open', 'Live', 'upcoming', 'active', 'pending_verification'] } },
                        {
                            status: { $in: ['Completed', 'Cancelled'] },
                            updatedAt: { $gte: cutoffTime }
                        }
                    ]
                }
            ]
        };
        
        // Fetch all admin and team member IDs to properly categorize tournaments
        const staff = await User.find({ role: { $in: ['admin', 'team_member'] } }).select('_id');
        const staffIds = staff.map(s => s._id);

        // Filter based on type
        if (type === 'community') {
            // Community matches are NOT official AND NOT created by staff AND have a creator
            query.$and.push({ isOfficial: { $ne: true } });
            query.$and.push({ createdBy: { $ne: null, $nin: staffIds } });
        } else {
            // Official matches are marked as isOfficial OR have no creator (legacy) OR created by staff
            query.$and.push({
                $or: [
                    { isOfficial: true },
                    { createdBy: null },
                    { createdBy: { $in: staffIds } }
                ]
            });
        }

        const tournaments = await Tournament.find(query)
            .populate('createdBy', 'name')
            .sort({ startTime: 1 });

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
        if (!body.title || !body.format || !body.gameType || !body.startTime || !body.maxSlots || body.prizePool === undefined) {
            return NextResponse.json({ success: false, error: 'Missing required fields (including prize pool)' }, { status: 400 });
        }

        // --- Trust Score Restriction Check ---
        const user = await User.findById((session.user as any).id).select('trustScore walletBalance inGameName freeFireUid');
        if (!user) {
            return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 });
        }

        // Block if score < 80
        if ((user.trustScore ?? 100) < 80) {
            return NextResponse.json({ 
                success: false, 
                error: `Trust Score too low (${user.trustScore ?? 100}%). You need at least 80% to host matches. Play fair matches to restore it.` 
            }, { status: 403 });
        }

        // --- Hosting Fee / User Entry Deduction ---
        // For community matches, the host also pays the entry fee
        const entryFee = Number(body.entryFee) || 0;
        if (user.walletBalance < entryFee) {
            return NextResponse.json({ 
                success: false, 
                error: `Insufficient balance. You need ${entryFee} coins to host this match.` 
            }, { status: 400 });
        }

        // Determine teamSize based on format
        let teamSize = 1;
        if (['2v2', 'Duo'].includes(body.format)) teamSize = 2;
        if (['4v4', 'Squad'].includes(body.format)) teamSize = 4;

        // Create the tournament
        const tournamentData = {
            ...body,
            createdBy: (session.user as any).id,
            isOfficial: (session.user as any).role === 'admin' || (session.user as any).role === 'team_member',
            teamSize: teamSize,
            status: 'Open', // Default status
            joinedCount: 1, // Host is already joined
            participants: [{
                userId: (session.user as any).id,
                inGameName: user.inGameName || session.user.name || "Host",
                uid: user.freeFireUid || "",
            }],
            // Ensure sensitive fields are handled safely if passed (though model default hides them)
            roomID: body.roomID || undefined,
            roomPassword: body.roomPassword || undefined,
            advancedRules: body.advancedRules || undefined
        };

        // Update user balance
        await User.findByIdAndUpdate((session.user as any).id, {
            $inc: { walletBalance: -entryFee }
        });

        const tournament = await Tournament.create(tournamentData);

        return NextResponse.json({ success: true, data: tournament }, { status: 201 });

    } catch (error: any) {
        console.error("Error creating tournament:", error);
        return NextResponse.json({ success: false, error: error.message || "Failed to create tournament" }, { status: 500 });
    }
}
