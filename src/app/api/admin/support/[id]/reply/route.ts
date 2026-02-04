import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import connectToDatabase from '@/lib/db';
import SupportTicket from '@/models/SupportTicket';
import Notification from '@/models/Notification';
import AdminActivity from '@/models/AdminActivity';
import { authOptions } from '@/lib/auth';

export async function POST(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await getServerSession(authOptions);

        if (!session || !session.user || (session.user as any).role !== 'admin') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { message, newStatus } = await req.json();
        const { id } = await params;

        if (!message) {
            return NextResponse.json({ error: 'Message is required' }, { status: 400 });
        }

        await connectToDatabase();

        const ticket = await SupportTicket.findById(id);

        if (!ticket) {
            return NextResponse.json({ error: 'Ticket not found' }, { status: 404 });
        }

        // Add admin message to conversation
        ticket.conversation.push({
            sender: 'admin',
            message,
            timestamp: new Date(),
        });

        // Update status if provided
        if (newStatus && ['Open', 'In Progress', 'Closed'].includes(newStatus)) {
            ticket.status = newStatus;
        }

        await ticket.save();

        // Send Notification to User
        await Notification.create({
            userId: ticket.userId,
            title: 'Support Responded',
            message: `Admin has replied to your ticket: "${ticket.subject}".\n\nPreview: ${message.substring(0, 50)}${message.length > 50 ? '...' : ''}`,
            type: 'info',
        });

        // Log Activity
        await AdminActivity.create({
            adminId: (session.user as any).id,
            adminName: session.user.name,
            actionType: 'REPLY_TICKET',
            targetId: ticket._id,
            details: `Replied to ticket #${ticket._id.toString().slice(-6)}. Status: ${newStatus || ticket.status}. Message: ${message.substring(0, 50)}...`
        });

        return NextResponse.json({ success: true, ticket }, { status: 200 });
    } catch (error) {
        console.error('Error replying to ticket:', error);
        return NextResponse.json(
            { error: 'Internal Server Error' },
            { status: 500 }
        );
    }
}
