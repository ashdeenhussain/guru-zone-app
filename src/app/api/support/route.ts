import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import connectToDatabase from '@/lib/db';
import SupportTicket from '@/models/SupportTicket';
import { authOptions } from '@/lib/auth';

export async function POST(req: Request) {
    try {
        const session = await getServerSession(authOptions);

        if (!session || !session.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { subject, category, priority, message } = await req.json();

        if (!subject || !category || !priority || !message) {
            return NextResponse.json(
                { error: 'All fields are required' },
                { status: 400 }
            );
        }

        await connectToDatabase();

        const newTicket = await SupportTicket.create({
            userId: (session.user as any).id,
            subject,
            category,
            priority,
            message,
            status: 'Open',
        });

        return NextResponse.json(newTicket, { status: 201 });
    } catch (error) {
        console.error('Error creating support ticket:', error);
        return NextResponse.json(
            { error: 'Internal Server Error' },
            { status: 500 }
        );
    }
}

export async function GET(req: Request) {
    try {
        const session = await getServerSession(authOptions);

        if (!session || !session.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        await connectToDatabase();

        const tickets = await SupportTicket.find({ userId: (session.user as any).id })
            .sort({ createdAt: -1 });

        return NextResponse.json(tickets, { status: 200 });
    } catch (error) {
        console.error('Error fetching support tickets:', error);
        return NextResponse.json(
            { error: 'Internal Server Error' },
            { status: 500 }
        );
    }
}
