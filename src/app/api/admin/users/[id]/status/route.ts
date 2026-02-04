import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import User from '@/models/User';
import AdminActivity from '@/models/AdminActivity';
import connectDB from '@/lib/db';

export async function PATCH(
    req: Request,
    context: { params: Promise<{ id: string }> }
) {
    try {
        await connectDB();
        const session = await getServerSession(authOptions);

        if (!session || session.user.role !== 'admin') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const params = await context.params;
        const { id } = params;
        const body = await req.json();
        const { status, banReason } = body;

        if (!['active', 'banned'].includes(status)) {
            return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
        }

        if (status === 'banned' && !banReason) {
            return NextResponse.json({ error: 'Ban reason is required' }, { status: 400 });
        }

        const updateData: any = { status };
        if (status === 'banned') {
            updateData.banReason = banReason;
        } else {
            updateData.banReason = ""; // Clear reason if unbanning
        }

        const user = await User.findByIdAndUpdate(
            id,
            updateData,
            { new: true, runValidators: true }
        ).select('-password');

        if (!user) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        // Log Activity
        await AdminActivity.create({
            adminId: session.user.id,
            adminName: session.user.name,
            actionType: status === 'banned' ? 'BAN_USER' : 'UNBAN_USER',
            targetId: user._id,
            details: status === 'banned'
                ? `Banned user ${user.email}. Reason: ${banReason}`
                : `Unbanned user ${user.email}`
        });

        return NextResponse.json({ success: true, user });

    } catch (error: any) {
        console.error('Error updating user status:', error);
        return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
    }
}
