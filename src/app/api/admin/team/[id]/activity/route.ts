import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import connectToDatabase from '@/lib/db';
import AdminActivity from '@/models/AdminActivity';

export async function GET(req: NextRequest, context: { params: Promise<{ id: string }> }) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || session.user.role !== 'admin') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const params = await context.params;
        const { id } = params;
        await connectToDatabase();

        const logs = await AdminActivity.find({ adminId: id })
            .sort({ createdAt: -1 })
            .limit(50); // Limit to last 50 actions for now

        return NextResponse.json({ logs }, { status: 200 });
    } catch (error) {
        console.error('Error fetching activity logs:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
