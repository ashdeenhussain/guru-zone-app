import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import connectDB from '@/lib/db';
import User from '@/models/User';
import { authOptions } from '@/lib/auth';

export async function PATCH(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || !session.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await req.json();
        const { inGameName, freeFireUid, avatarId, bio, image } = body;

        await connectDB();

        // Only update allowed fields
        const updateData: any = {};
        if (inGameName !== undefined) updateData.inGameName = inGameName;
        if (freeFireUid !== undefined) updateData.freeFireUid = freeFireUid;
        if (avatarId !== undefined) updateData.avatarId = avatarId;
        if (bio !== undefined) updateData.bio = bio;
        if (image !== undefined) updateData.image = image;

        const updatedUser = await User.findByIdAndUpdate(
            session.user.id,
            { $set: updateData },
            { new: true, runValidators: true }
        ).select('-password');

        if (!updatedUser) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        return NextResponse.json({ message: 'Profile updated successfully', user: updatedUser }, { status: 200 });

    } catch (error) {
        console.error('Error updating profile:', error);
        return NextResponse.json({ error: 'Failed to update profile' }, { status: 500 });
    }
}
