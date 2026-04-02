import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/db';
import Tournament from '@/models/Tournament';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { sendPushNotification } from '@/lib/webpush';

export async function POST(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || !session.user) {
            return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
        }

        await connectToDatabase();
        const { id } = await params;
        const body = await req.json();

        const { roomID, roomPassword } = body;

        if (!roomID || !roomPassword) {
            return NextResponse.json({ success: false, error: 'Room ID and Password required' }, { status: 400 });
        }

        const tournament = await Tournament.findById(id);

        if (!tournament) {
            return NextResponse.json({ success: false, error: 'Tournament not found' }, { status: 404 });
        }

        // Only Host or Admin can update room details
        const userId = (session.user as any).id;
        const isHost = tournament.createdBy?.toString() === userId;
        const isAdmin = (session.user as any).role === 'admin';

        if (!isHost && !isAdmin) {
            return NextResponse.json({ success: false, error: 'Access denied' }, { status: 403 });
        }

        // Update fields
        tournament.roomID = roomID;
        tournament.roomPassword = roomPassword;

        // Optionally update status to 'Live' if not already
        if (tournament.status === 'Full' || tournament.status === 'Upcoming' || tournament.status === 'Open') {
            // Let host trigger 'Live' manually or assume credentials mean live?
            // Let's keep status manual control or assume credentials implies active match.
            // tournament.status = 'Live'; 
        }

        await tournament.save();

        // ── Push Notification (To Participants) ──
        try {
            const participantIds = tournament.participants.map((p: any) => 
                p.userId?._id?.toString() || p.userId?.toString()
            ).filter((pId: string) => pId && pId !== userId);

            await Promise.all(participantIds.map((pId: string) => 
                sendPushNotification(pId, {
                    title: '🔥 Room is Ready!',
                    body: `The Host has provided the Room ID for "${tournament.title}". Join the game now!`,
                    url: `/battle-zone/${tournament._id}`
                })
            ));
        } catch (pushErr) {
            console.error('[RoomAPI] Push notification failed:', pushErr);
        }

        return NextResponse.json({ success: true, message: 'Room details updated' });

    } catch (error: any) {
        console.error("Error updating room details:", error);
        return NextResponse.json({ success: false, error: "Failed to update room details" }, { status: 500 });
    }
}

export async function GET(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || !session.user) {
            return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
        }

        await connectToDatabase();
        const { id } = await params;

        // Use findById + select explicitly to get roomID/Pass because schema has select: false
        const tournament = await Tournament.findById(id).select('+roomID +roomPassword participants createdBy');

        if (!tournament) {
            return NextResponse.json({ success: false, error: 'Tournament not found' }, { status: 404 });
        }

        const userId = (session.user as any).id;
        const isHost = tournament.createdBy?.toString() === userId;
        const isAdmin = (session.user as any).role === 'admin';
        const isParticipant = tournament.participants.some((p: any) =>
            (p.userId._id?.toString() || p.userId?.toString()) === userId
        );

        if (!isHost && !isAdmin && !isParticipant) {
            return NextResponse.json({ success: false, error: 'Access denied' }, { status: 403 });
        }

        // If participant, do we check startTime? Maybe allow seeing creds only if match hasn't been completed/cancelled?
        // Let's allow seeing if user is allowed.

        return NextResponse.json({
            success: true,
            data: {
                roomID: tournament.roomID,
                roomPassword: tournament.roomPassword
            }
        });

    } catch (error: any) {
        console.error("Error fetching room details:", error);
        return NextResponse.json({ success: false, error: "Failed to fetch room details" }, { status: 500 });
    }
}
