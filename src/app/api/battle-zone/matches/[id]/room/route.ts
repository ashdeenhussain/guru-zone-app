import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/db';
import BattleMatch from '@/models/BattleMatch';
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

        const match = await BattleMatch.findById(id);

        if (!match) {
            return NextResponse.json({ success: false, error: 'Match not found' }, { status: 404 });
        }

        const userId = (session.user as any).id;
        const isHost = match.createdBy?.toString() === userId;
        const isAdmin = (session.user as any).role === 'admin';

        if (!isHost && !isAdmin) {
            return NextResponse.json({ success: false, error: 'Access denied' }, { status: 403 });
        }

        match.roomID = roomID;
        match.roomPassword = roomPassword;

        if (match.status === 'open' || match.status === 'full') {
            match.status = 'active';
        }

        await match.save();

        // Push Notification
        try {
            const participantIds = match.participants.map((p: any) => 
                p.userId?._id?.toString() || p.userId?.toString()
            ).filter((pId: string) => pId && pId !== userId);

            await Promise.all(participantIds.map((pId: string) => 
                sendPushNotification(pId, {
                    title: '🔥 Room is Ready!',
                    body: `The Host has provided the Room ID for "${match.title}". Join the game now!`,
                    url: `/battle-zone/${match._id}`
                })
            ));
        } catch (pushErr) {
            console.error('[BattleRoomAPI] Push notification failed:', pushErr);
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

        const match = await BattleMatch.findById(id).select('+roomID +roomPassword participants createdBy');

        if (!match) {
            return NextResponse.json({ success: false, error: 'Match not found' }, { status: 404 });
        }

        const userId = (session.user as any).id;
        const isHost = match.createdBy?.toString() === userId;
        const isAdmin = (session.user as any).role === 'admin';
        const isParticipant = match.participants.some((p: any) =>
            (p.userId._id?.toString() || p.userId?.toString()) === userId
        );

        if (!isHost && !isAdmin && !isParticipant) {
            return NextResponse.json({ success: false, error: 'Access denied' }, { status: 403 });
        }

        return NextResponse.json({
            success: true,
            data: {
                roomID: match.roomID,
                roomPassword: match.roomPassword
            }
        });

    } catch (error: any) {
        console.error("Error fetching room details:", error);
        return NextResponse.json({ success: false, error: "Failed to fetch room details" }, { status: 500 });
    }
}
