import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import connectToDatabase from '@/lib/db';
import User from '@/models/User';
import AdminActivity from '@/models/AdminActivity';

// GET: List all Team Members (Admins)
export async function GET(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || session.user.role !== 'admin') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        await connectToDatabase();

        const teamMembers = await User.find({ role: 'admin' })
            .select('name email image role permissions lastLogin status createdAt')
            .sort({ createdAt: -1 });

        return NextResponse.json({ team: teamMembers }, { status: 200 });
    } catch (error) {
        console.error('Error fetching team members:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

// POST: Promote a User to Admin/Team Member
export async function POST(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || session.user.role !== 'admin') { // In real app, check for 'manage_system' permission
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { email, permissions } = await req.json();

        if (!email) {
            return NextResponse.json({ error: 'Email is required' }, { status: 400 });
        }

        await connectToDatabase();

        const user = await User.findOne({ email });
        if (!user) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        if (user.role === 'admin') {
            return NextResponse.json({ error: 'User is already an admin' }, { status: 400 });
        }

        // Promote User
        user.role = 'admin';
        user.permissions = permissions || [];
        await user.save();

        // Log Activity
        await AdminActivity.create({
            adminId: session.user.id,
            adminName: session.user.name,
            actionType: 'PROMOTE_ADMIN',
            targetId: user._id,
            details: `Promoted ${user.name} (${user.email}) to Team Member with permissions: ${permissions?.join(', ')}`
        });

        return NextResponse.json({ message: 'User promoted successfully', user }, { status: 200 });
    } catch (error) {
        console.error('Error promoting user:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
