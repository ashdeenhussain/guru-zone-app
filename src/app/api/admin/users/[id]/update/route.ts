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

        // Security: Pick only allowed fields
        const { name, inGameName, freeFireUid, walletBalance } = body;

        // Explicitly Reject Email/Password attempts
        if (body.email || body.password) {
            // We can strictly fail, or just ignore. 
            // The prompt says "strictly IGNORE/REJECT". 
            // I'll ignore them by just strictly constructing the update object.
        }

        const updateData: any = {};
        if (name !== undefined) updateData.name = name;
        if (inGameName !== undefined) updateData.inGameName = inGameName;
        if (freeFireUid !== undefined) updateData.freeFireUid = freeFireUid;
        if (walletBalance !== undefined) updateData.walletBalance = walletBalance;

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
            actionType: 'UPDATE_USER',
            targetId: user._id,
            details: `Updated profile for ${user.email}. Changes: ${Object.keys(updateData).join(', ')}`
        });

        return NextResponse.json({ success: true, user });

    } catch (error: any) {
        console.error('Error updating user profile:', error);
        return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
    }
}
