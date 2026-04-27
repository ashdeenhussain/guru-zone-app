import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import connectMongo from '@/lib/db';
import BattleMatch from '@/models/BattleMatch';
import User from '@/models/User';

export async function GET(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.email) {
            return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
        }

        await connectMongo();

        const user = await User.findOne({ email: session.user.email });
        if (!user || user.role !== 'admin') {
            return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
        }

        const { searchParams } = new URL(req.url);
        const page = parseInt(searchParams.get('page') || '1', 10);
        const limit = parseInt(searchParams.get('limit') || '50', 10);
        const skip = (page - 1) * limit;

        const matches = await BattleMatch.find({})
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit)
            .populate('createdBy', 'name inGameName email')
            .populate('participants.userId', 'name inGameName email');

        const total = await BattleMatch.countDocuments({});

        return NextResponse.json({
            success: true,
            data: matches,
            pagination: {
                total,
                page,
                pages: Math.ceil(total / limit)
            }
        });

    } catch (error: any) {
        console.error('Error fetching admin battle zone matches:', error);
        return NextResponse.json({ success: false, error: error.message || 'Server Error' }, { status: 500 });
    }
}
