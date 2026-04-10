import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions, hasPermission } from '@/lib/auth';
import connectToDatabase from '@/lib/db';
import User from '@/models/User';
import AdminActivity from '@/models/AdminActivity';

// DELETE: Remove a Staff Member (Demote to User)
export async function DELETE(req: NextRequest, context: { params: Promise<{ id: string }> }) {
    try {
        const session = await getServerSession(authOptions);
        if (!hasPermission(session, 'manage_system')) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const params = await context.params;
        const { id } = params;

        await connectToDatabase();

        const user = await User.findById(id);
        if (!user) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        if (user.role !== 'admin') {
            return NextResponse.json({ error: 'User is not an admin' }, { status: 400 });
        }

        // Demote Admin back to User
        user.role = 'user';
        user.permissions = [];
        await user.save();

        // Log Activity
        await AdminActivity.create({
            adminId: session.user.id,
            adminName: session.user.name,
            actionType: 'DEMOTE_ADMIN',
            targetId: user._id,
            details: `Removed staff access for ${user.name} (${user.email}). User demoted to regular user.`
        });

        return NextResponse.json({ message: 'Staff member removed successfully' }, { status: 200 });
    } catch (error) {
        console.error('Error removing staff member:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
