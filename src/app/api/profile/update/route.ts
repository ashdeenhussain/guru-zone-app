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
        const { inGameName, freeFireUid, avatarId, bio, image, squad } = body;

        await connectDB();

        const user = await User.findById(session.user.id);
        if (!user) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        if (inGameName !== undefined) user.inGameName = inGameName;
        if (freeFireUid !== undefined) user.freeFireUid = freeFireUid;
        if (avatarId !== undefined) user.avatarId = avatarId;
        if (bio !== undefined) user.bio = bio;
        if (image !== undefined) user.image = image;
        
        if (squad !== undefined) {
            // Ensure squad structure is correct
            user.squad = {
                squadName: squad.squadName || "",
                members: (squad.members || []).map((m: any) => ({
                    name: m.name || "",
                    uid: m.uid || ""
                }))
            };
        }

        await user.save();

        return NextResponse.json({ message: 'Profile updated successfully', user }, { status: 200 });

    } catch (error) {
        console.error('Error updating profile:', error);
        return NextResponse.json({ error: 'Failed to update profile' }, { status: 500 });
    }
}
