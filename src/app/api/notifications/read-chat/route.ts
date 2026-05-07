import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import connectToDatabase from '@/lib/db';
import User from '@/models/User';

export async function POST(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || !session.user) {
            return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
        }

        const { tournamentId } = await req.json();
        if (!tournamentId) {
            return NextResponse.json({ success: false, error: 'Tournament ID required' }, { status: 400 });
        }

        await connectToDatabase();
        const userId = (session.user as any).id;

        const user = await User.findById(userId);
        if (!user) {
            return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 });
        }

        // Update lastChatReadAt map
        if (!user.lastChatReadAt) {
            user.lastChatReadAt = new Map();
        }
        
        user.lastChatReadAt.set(tournamentId, new Date());
        
        // Mark the map as modified so Mongoose saves it
        user.markModified('lastChatReadAt');
        await user.save();

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error marking chat as read:', error);
        return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
    }
}
