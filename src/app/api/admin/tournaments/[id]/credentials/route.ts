import { NextResponse } from 'next/server';
import connectToDB from '@/lib/db';
import Tournament from '@/models/Tournament';

export async function PATCH(req: Request, context: { params: Promise<{ id: string }> }) {
    try {
        await connectToDB();
        const params = await context.params;
        const { id } = params;
        const { roomID, roomPassword, autoRelease, releaseTime } = await req.json();

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

        const tournament = await Tournament.findByIdAndUpdate(
            id,
            {
                roomID,
                roomPassword,
                status: 'Live', // Mark as Live implies active room
                autoReleaseTime: finalReleaseTime,
            },
            { new: true }
        );

        if (!tournament) {
            return NextResponse.json({ success: false, error: 'Tournament not found' }, { status: 404 });
        }

        // Logic to notify participants would go here
        console.log(`[Notification] Tournament ${tournament.title} is now LIVE! Credentials set for release at ${finalReleaseTime.toISOString()}.`);

        return NextResponse.json({ success: true, tournament });
    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
