import { NextResponse } from 'next/server';
import connectToDB from '@/lib/db';
import Tournament from '@/models/Tournament';
import { getServerSession } from 'next-auth';
import { authOptions, hasPermission } from '@/lib/auth';

export async function PATCH(req: Request, context: { params: Promise<{ id: string }> }) {
    try {
        const session = await getServerSession(authOptions);
        if (!hasPermission(session, 'manage_tournaments')) {
            return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
        }

        await connectToDB();
        const params = await context.params;
        const { id } = params;
        const { roomID, roomPassword, autoRelease, releaseTime } = await req.json();

        const tournament = await Tournament.findById(id);
        if (!tournament) {
            return NextResponse.json({ success: false, error: 'Tournament not found' }, { status: 404 });
        }

        // Ownership Check: Only creator, anyone with manage_tournaments (for official ones), or Super Admin can manage
        const canManage = hasPermission(session, 'manage_system') || 
                         (tournament.createdBy === null && hasPermission(session, 'manage_tournaments')) ||
                         (tournament.createdBy?.toString() === (session as any)?.user?.id);
        
        if (!canManage) {
            return NextResponse.json({ 
                success: false, 
                error: 'Unauthorized: You can only manage tournaments created by you.' 
            }, { status: 403 });
        }

        if (!roomID || !roomPassword) {
            return NextResponse.json({ success: false, error: 'Room ID and Password are required' }, { status: 400 });
        }

        // Determine when credentials should be visible
        // If autoRelease is false (immediate release), set time to NOW
        // If autoRelease is true, use the provided time
        let finalReleaseTime = new Date();
        if (autoRelease && releaseTime) {
            finalReleaseTime = new Date(releaseTime);
        }

        const updatedTournament = await Tournament.findByIdAndUpdate(
            id,
            {
                roomID,
                roomPassword,
                status: 'Live', // Mark as Live implies active room
                autoReleaseTime: finalReleaseTime,
            },
            { new: true }
        );

        if (!updatedTournament) {
            return NextResponse.json({ success: false, error: 'Tournament not found' }, { status: 404 });
        }

        // Logic to notify participants would go here


        return NextResponse.json({ success: true, tournament: updatedTournament });
    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
