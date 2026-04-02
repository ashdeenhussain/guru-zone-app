import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/db';
import ChatReport from '@/models/ChatReport';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function POST(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || !session.user) {
            return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
        }

        await connectToDatabase();
        const body = await req.json();
        const { matchId, reportedUserId, messageText, reason } = body;

        if (!matchId || !reportedUserId || !messageText || !reason) {
            return NextResponse.json({ success: false, error: 'Missing required fields' }, { status: 400 });
        }

        const reporterId = (session.user as any).id;

        const report = await ChatReport.create({
            matchId,
            reporterId,
            reportedUserId,
            messageText,
            reason,
            status: 'pending'
        });

        return NextResponse.json({ success: true, message: 'Report submitted successfully. Admin will review it.', report });

    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
