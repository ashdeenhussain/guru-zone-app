import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/db';
import Message from '@/models/Message';
import BattleMatch from '@/models/BattleMatch';
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

        const match = await BattleMatch.findById(id).select('participants createdBy');
        if (!match) {
            return NextResponse.json({ success: false, error: 'Match not found' }, { status: 404 });
        }

        const userId = (session.user as any).id;
        const isAdmin = (session.user as any).role === 'admin';
        const isParticipant = match.participants.some((p: any) => p.userId.toString() === userId);
        const isHost = match.createdBy?.toString() === userId;

        if (!isAdmin && !isParticipant && !isHost) {
            return NextResponse.json({ success: false, error: 'Access denied' }, { status: 403 });
        }

        const messages = await Message.find({ tournamentId: id })
            .sort({ createdAt: 1 })
            .limit(100);

        return NextResponse.json({ success: true, data: messages });

    } catch (error: any) {
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

        if (!body.content || !body.content.trim()) {
            return NextResponse.json({ success: false, error: 'Content required' }, { status: 400 });
        }

        const match = await BattleMatch.findById(id).select('participants createdBy title');
        if (!match) {
            return NextResponse.json({ success: false, error: 'Match not found' }, { status: 404 });
        }

        const userId = (session.user as any).id;
        const isAdmin = (session.user as any).role === 'admin';
        const isParticipant = match.participants.some((p: any) => p.userId.toString() === userId);
        const isHost = match.createdBy?.toString() === userId;

        if (!isAdmin && !isParticipant && !isHost) {
            return NextResponse.json({ success: false, error: 'Access denied' }, { status: 403 });
        }

        const message = await Message.create({
            tournamentId: id, // Reusing field for BattleMatch ID
            sender: userId,
            senderName: (session.user as any).inGameName || session.user.name,
            content: body.content.trim(),
            isSystem: false
        });

        // Push Notifications
        const others = match.participants.filter((p: any) => p.userId.toString() !== userId);
        const hostId = match.createdBy?.toString();
        const notifyHost = hostId && hostId !== userId && !others.some((p: any) => p.userId.toString() === hostId);

        const payload = {
            title: `Battle Chat: ${message.senderName}`,
            body: message.content,
            url: `/battle-zone/${id}`
        };

        const pushPromises = others.map((p: any) => sendPushNotification(p.userId.toString(), payload, 'chat'));
        if (notifyHost) pushPromises.push(sendPushNotification(hostId, payload, 'chat'));

        Promise.all(pushPromises).catch(console.error);

        return NextResponse.json({ success: true, data: message });

    } catch (error: any) {
        return NextResponse.json({ success: false, error: "Failed to send message" }, { status: 500 });
    }
}
