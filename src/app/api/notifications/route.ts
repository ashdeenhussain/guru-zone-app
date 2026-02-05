import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import connectToDatabase from "@/lib/db";
import Notification from "@/models/Notification";
import { NextResponse } from "next/server";

// GET: Fetch notifications for the current user
export async function GET(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || !session.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        await connectToDatabase();

        // @ts-ignore
        const userId = session.user.id;

        const notifications = await Notification.find({ userId })
            .sort({ createdAt: -1 })
            .limit(20) // Fetch last 20 notifications
            .lean();

        const unreadCount = await Notification.countDocuments({ userId, isRead: false });

        return NextResponse.json({
            notifications,
            unreadCount
        });
    } catch (error: any) {
        console.error("Error fetching notifications:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

// PATCH: Mark notification(s) as read
export async function PATCH(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || !session.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { notificationId, markAll } = await req.json();

        await connectToDatabase();
        // @ts-ignore
        const userId = session.user.id;

        if (markAll) {
            await Notification.updateMany(
                { userId, isRead: false },
                { $set: { isRead: true } }
            );
            return NextResponse.json({ message: "All notifications marked as read" });
        }

        if (notificationId) {
            const notification = await Notification.findOne({ _id: notificationId, userId });
            if (!notification) {
                return NextResponse.json({ error: "Notification not found" }, { status: 404 });
            }

            notification.isRead = true;
            await notification.save();

            return NextResponse.json({ message: "Notification marked as read", notification });
        }

        return NextResponse.json({ error: "Invalid request" }, { status: 400 });
    } catch (error: any) {
        console.error("Error updating notification:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
