import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import AdminActivity from '@/models/AdminActivity';
import connectDB from '@/lib/db';

export async function GET(req: Request) {
    try {
        await connectDB();
        const session = await getServerSession(authOptions);

        if (!session || session.user.role !== 'admin') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { searchParams } = new URL(req.url);
        const page = parseInt(searchParams.get('page') || '1');
        const limit = parseInt(searchParams.get('limit') || '20');
        const actionType = searchParams.get('actionType');
        const search = searchParams.get('search') || '';

        const skip = (page - 1) * limit;

        const query: any = {};

        if (actionType && actionType !== 'all') {
            query.actionType = actionType;
        }

        if (search) {
            query.$or = [
                { adminName: { $regex: search, $options: 'i' } },
                { details: { $regex: search, $options: 'i' } },
                { targetId: { $regex: search, $options: 'i' } }
            ];
        }

        const logsPromise = AdminActivity.find(query)
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit);

        const totalPromise = AdminActivity.countDocuments(query);

        const [logs, total] = await Promise.all([logsPromise, totalPromise]);

        return NextResponse.json({
            logs,
            pagination: {
                total,
                page,
                limit,
                pages: Math.ceil(total / limit)
            }
        });

    } catch (error: any) {
        console.error('Error fetching audit logs:', error);
        return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
    }
}
