import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import User from '@/models/User';
import Notification from '@/models/Notification';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import AdminActivity from '@/models/AdminActivity';

export async function POST(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || !session.user || (session.user as any).role !== 'admin') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        await connectDB();
        const { title, message } = await req.json();

        if (!title || !message) {
            return NextResponse.json({ error: "Title and message are required" }, { status: 400 });
        }

        // Fetch all user IDs
        const users = await User.find({}, '_id');

        if (users.length === 0) {
            return NextResponse.json({ message: "No users to notify" });
        }

        // Prepare notifications for all users
        const notifications = users.map(user => ({
            userId: user._id,
            title,
            message,
            type: 'info',
            isRead: false,
        }));

        await Notification.insertMany(notifications);

        // Log Activity
        await AdminActivity.create({
            adminId: (session.user as any).id,
            adminName: session.user.name,
            actionType: 'GLOBAL_NOTIFICATION',
            details: `Sent global notification: "${title}" to ${users.length} users.`
        });

        return NextResponse.json({ message: `Successfully sent notification to ${users.length} users` });
    } catch (error) {
        console.error("Error sending global notification:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
