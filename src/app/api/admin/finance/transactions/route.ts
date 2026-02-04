
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import connectDB from '@/lib/db';
import Transaction from '@/models/Transaction';
import User from '@/models/User';

export async function GET(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || session.user.role !== 'admin') {
            return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
        }

        const { searchParams } = new URL(req.url);
        const type = searchParams.get('type');
        const status = searchParams.get('status');
        const method = searchParams.get('method');
        const dateRange = searchParams.get('dateRange');

        const query: any = {};
        if (type) query.type = type;
        if (status && status !== 'all') query.status = status;
        if (method && method !== 'all') query.method = method;

        if (dateRange) {
            const now = new Date();
            let startDate = new Date();

            switch (dateRange) {
                case 'today':
                    startDate.setHours(0, 0, 0, 0);
                    break;
                case 'week':
                    startDate.setDate(now.getDate() - 7);
                    break;
                case 'month':
                    startDate.setMonth(now.getMonth(), 1); // Start of current month
                    startDate.setHours(0, 0, 0, 0);
                    break;
                case '3m':
                    startDate.setMonth(now.getMonth() - 3);
                    break;
                case '6m':
                    startDate.setMonth(now.getMonth() - 6);
                    break;
                case 'year':
                    startDate.setFullYear(now.getFullYear() - 1);
                    break;
                default:
                    startDate = null as any;
            }

            if (startDate) {
                query.createdAt = { $gte: startDate };
            }
        }

        await connectDB();

        const transactions = await Transaction.find(query)
            .populate('user', 'name email inGameName freeFireUid')
            .sort({ createdAt: -1 });

        return NextResponse.json(transactions);

    } catch (error) {
        console.error('Error fetching admin transactions:', error);
        return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
    }
}
