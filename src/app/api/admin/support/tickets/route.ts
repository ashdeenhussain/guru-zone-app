import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import connectToDatabase from '@/lib/db';
import SupportTicket from '@/models/SupportTicket';
import { authOptions } from '@/lib/auth';

export async function GET(req: Request) {
    try {
        const session = await getServerSession(authOptions);

        // Simple admin check
        if (!session || !session.user || (session.user as any).role !== 'admin') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { searchParams } = new URL(req.url);
        const status = searchParams.get('status');
        const priority = searchParams.get('priority');

        await connectToDatabase();

        const query: any = {};
        if (status && status !== 'All') query.status = status;
        if (priority && priority !== 'All') query.priority = priority;

        // Fetch tickets. Populate user to get name/email.
        const tickets = await SupportTicket.find(query)
            .populate('userId', 'name email')
            .lean();

        // Custom Sort: Urgent > High > Medium > Low. Then Newest first.
        const priorityOrder: { [key: string]: number } = {
            'Urgent': 0,
            'High': 1,
            'Medium': 2,
            'Low': 3
        };

        const sortedTickets = tickets.sort((a, b) => {
            const priorityDiff = (priorityOrder[a.priority] ?? 4) - (priorityOrder[b.priority] ?? 4);
            if (priorityDiff !== 0) return priorityDiff;
            return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        });

        return NextResponse.json(sortedTickets, { status: 200 });

    } catch (error) {
        console.error('Error fetching admin tickets:', error);
        return NextResponse.json(
            { error: 'Internal Server Error' },
            { status: 500 }
        );
    }
}
