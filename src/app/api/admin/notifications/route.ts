import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import dbConnect from "@/lib/db";
import AdminNotification from "@/models/AdminNotification";
import Tournament from "@/models/Tournament";
import mongoose from "mongoose";
import { addMinutes } from "date-fns";

export async function GET(req: Request) {
    try {
        await dbConnect();
        const session = await getServerSession(authOptions);

        if (!session?.user || session.user.role !== 'admin') {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        // --- TOURNAMENT REMINDERS LOGIC ---
        // Check for tournaments starting in the next 15 minutes
        const now = new Date();
        const reminderWindow = addMinutes(now, 15);

        const upcomingTournaments = await Tournament.find({
            startTime: { $gte: now, $lte: reminderWindow },
            status: { $in: ['Open', 'full', 'upcoming'] }
        });

        for (const tournament of upcomingTournaments) {
            const reminderTitle = `Tournament Starting Soon: ${tournament.title}`;
            const reminderLink = `/admin/tournaments/${tournament._id}`;

            // Check if reminder already exists
            const existingNotification = await AdminNotification.findOne({
                title: reminderTitle,
                link: reminderLink
            });

            if (!existingNotification) {
                await AdminNotification.create({
                    title: reminderTitle,
                    message: `The tournament "${tournament.title}" is starting at ${tournament.startTime.toLocaleTimeString()}. Please prepare the room credentials.`,
                    type: 'request',
                    link: reminderLink
                });
            }
        }
        // --- END REMINDERS LOGIC ---

        const userId = new mongoose.Types.ObjectId(session.user.id);

        // Fetch notifications that the current admin hasn't read yet
        // OR we can just fetch the latest 50 notifications
        const url = new URL(req.url);
        const unreadOnly = url.searchParams.get('unread') === 'true';

        let filter = {};
        if (unreadOnly) {
            filter = { isRead: { $ne: userId } };
        }

        const notifications = await AdminNotification.find(filter)
            .sort({ createdAt: -1 })
            .limit(50);

        return NextResponse.json(notifications);
    } catch (error) {
        console.error("Error fetching admin notifications:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

export async function POST(req: Request) {
    try {
        await dbConnect();
        const session = await getServerSession(authOptions);

        if (!session?.user || session.user.role !== 'admin') {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { id, markAllRead } = await req.json();
        const userId = new mongoose.Types.ObjectId(session.user.id);

        if (markAllRead) {
            await AdminNotification.updateMany(
                { isRead: { $ne: userId } },
                { $addToSet: { isRead: userId } }
            );
            return NextResponse.json({ success: true });
        }

        if (id) {
            await AdminNotification.findByIdAndUpdate(id, {
                $addToSet: { isRead: userId }
            });
            return NextResponse.json({ success: true });
        }

        return NextResponse.json({ error: "Invalid request" }, { status: 400 });
    } catch (error) {
        console.error("Error updating admin notification:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
