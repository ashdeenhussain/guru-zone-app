import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import connectToDatabase from '@/lib/db';
import User from '@/models/User';
import { authOptions } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        const session = await getServerSession(authOptions);

        if (!session?.user?.email) {
            return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
        }

        await connectToDatabase();

        const user = await User.findOne({ email: session.user.email }).select('inGameName freeFireUid trustScore');

        if (!user) {
            return NextResponse.json({ success: false, error: "User not found" }, { status: 404 });
        }

        return NextResponse.json({
            success: true,
            user: {
                inGameName: user.inGameName,
                freeFireUid: user.freeFireUid,
                trustScore: user.trustScore ?? 100
            }
        });
    } catch (error) {
        console.error("Error fetching profile:", error);
        return NextResponse.json({ success: false, error: "Failed to fetch profile" }, { status: 500 });
    }
}
