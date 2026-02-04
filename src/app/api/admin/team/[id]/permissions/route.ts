import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import connectToDatabase from '@/lib/db';
import User from '@/models/User';
import AdminActivity from '@/models/AdminActivity';

export async function PATCH(req: NextRequest, context: { params: Promise<{ id: string }> }) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || session.user.role !== 'admin') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { permissions } = await req.json();
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

        const oldPermissions = user.permissions;
        user.permissions = permissions;
        await user.save();

        // Log Activity
        await AdminActivity.create({
            adminId: session.user.id,
            adminName: session.user.name,
            actionType: 'UPDATE_PERMISSIONS',
            targetId: user._id,
            details: `Updated permissions for ${user.name}. Old: [${oldPermissions.join(', ')}], New: [${permissions.join(', ')}]`
        });

        return NextResponse.json({ message: 'Permissions updated successfully', user }, { status: 200 });
    } catch (error) {
        console.error('Error updating permissions:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
