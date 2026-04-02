import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/db';
import ChatReport from '@/models/ChatReport';
import User from '@/models/User';
import Notification from '@/models/Notification';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        const session = await getServerSession(authOptions);
        if (!session || (session.user as any).role !== 'admin') {
            return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
        }

        await connectToDatabase();

        const reports = await ChatReport.find({ status: 'pending' })
            .populate('reporterId', 'name username')
            .populate('reportedUserId', 'name username trustScore')
            .populate('matchId', 'title')
            .sort({ createdAt: -1 });

        return NextResponse.json({ success: true, data: reports });

    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}

export async function POST(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || (session.user as any).role !== 'admin') {
            return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
        }

        await connectToDatabase();
        const { reportId, action } = await req.json();

        if (!reportId || !action) {
            return NextResponse.json({ success: false, error: 'Missing reportId or action' }, { status: 400 });
        }

        const report = await ChatReport.findById(reportId);
        if (!report) {
            return NextResponse.json({ success: false, error: 'Report not found' }, { status: 404 });
        }

        if (action === 'penalize') {
            const user = await User.findById(report.reportedUserId);
            if (user) {
                const oldScore = user.trustScore || 100;
                user.trustScore = Math.max(0, oldScore - 10);
                await user.save();

                await Notification.create({
                    userId: report.reportedUserId,
                    title: 'Trust Score Decreased',
                    message: `Your Trust Score was reduced by 10 points due to a chat violation/abuse. Current: ${user.trustScore}%`,
                    type: 'error'
                });
            }
            report.status = 'resolved';
            await report.save();

            return NextResponse.json({ success: true, message: 'User penalized and report resolved.' });
        }

        if (action === 'dismiss') {
            report.status = 'dismissed';
            await report.save();
            return NextResponse.json({ success: true, message: 'Report dismissed.' });
        }

        return NextResponse.json({ success: false, error: 'Invalid action' }, { status: 400 });

    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
