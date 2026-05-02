import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/db';
import Message from '@/models/Message';
import Tournament from '@/models/Tournament';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { sendPushNotification } from '@/lib/webpush';

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

        // Optional: Check if user is participant or admin?
        // For now, let's allow fetching if you can view the page, but strictly speaking only participants should see chat?
        // Let's enforce participant/admin check for security.

        const tournament = await Tournament.findById(id).select('participants createdBy');
        if (!tournament) {
            return NextResponse.json({ success: false, error: 'Tournament not found' }, { status: 404 });
        }

        const userId = (session.user as any).id;
        const isAdmin = (session.user as any).role === 'admin';
        const isParticipant = tournament.participants.some((p: any) => p.userId.toString() === userId);
        const isHost = tournament.createdBy?.toString() === userId;

        if (!isAdmin && !isParticipant && !isHost) {
            return NextResponse.json({ success: false, error: 'Access denied: You must join the match to view chat.' }, { status: 403 });
        }

        // Fetch messages
        const messages = await Message.find({ tournamentId: id })
            .sort({ createdAt: 1 }) // Oldest first
            .limit(100); // Limit to last 100 messages for performance

        return NextResponse.json({ success: true, data: messages });

    } catch (error: any) {
        console.error("Error fetching messages:", error);
        return NextResponse.json({ success: false, error: "Failed to fetch messages" }, { status: 500 });
    }
}

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

        if (!body.content || typeof body.content !== 'string' || !body.content.trim()) {
            return NextResponse.json({ success: false, error: 'Message content required' }, { status: 400 });
        }

        // Security Check
        const tournament = await Tournament.findById(id).select('participants createdBy');
        if (!tournament) {
            return NextResponse.json({ success: false, error: 'Tournament not found' }, { status: 404 });
        }

        const userId = (session.user as any).id;
        const isAdmin = (session.user as any).role === 'admin';
        const isParticipant = tournament.participants.some((p: any) => p.userId.toString() === userId);
        const isHost = tournament.createdBy?.toString() === userId;

        if (!isAdmin && !isParticipant && !isHost) {
            return NextResponse.json({ success: false, error: 'Access denied: You must join the match to chat.' }, { status: 403 });
        }

        // Create Message
        const message = await Message.create({
            tournamentId: id,
            sender: userId,
            senderName: (session.user as any).inGameName || session.user.name, // Snapshot name
            content: body.content.trim(),
            isSystem: false
        });

        // Send push notification to other participants (not self)
        // Ensure this doesn't block the API response
        const otherParticipants = tournament.participants.filter(
            (p: any) => p.userId && p.userId.toString() !== userId
        );

        // Also notify host if the sender is not the host and host is not in participants list
        const hostId = tournament.createdBy?.toString();
        const notifyHost = hostId && hostId !== userId && !otherParticipants.some((p: any) => p.userId.toString() === hostId);

        const notificationPromises = [];
        const payload = {
            title: `New Message from ${message.senderName}`,
            body: message.content,
            url: `/battle-zone/match/${id}`
        };

        for (const participant of otherParticipants) {
            notificationPromises.push(sendPushNotification(participant.userId.toString(), payload));
        }

        if (notifyHost) {
            notificationPromises.push(sendPushNotification(hostId, payload));
        }

        // Fire and forget push notifications
        Promise.all(notificationPromises).catch(err => console.error("Push Error:", err));

        return NextResponse.json({ success: true, data: message });

    } catch (error: any) {
        console.error("Error sending message:", error);
        return NextResponse.json({ success: false, error: "Failed to send message" }, { status: 500 });
    }
}
