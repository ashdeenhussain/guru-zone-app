import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import connectToDB from "@/lib/db";
import DailyRewardSpinItem from "@/models/DailyRewardSpinItem";
import AdminActivity from "@/models/AdminActivity";

export async function GET() {
    try {
        await connectToDB();
        const session = await getServerSession(authOptions);
        if (!session?.user || (session.user as any).role !== "admin") {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }
        const items = await DailyRewardSpinItem.find().sort({ createdAt: 1 }).lean();
        return NextResponse.json({ success: true, items });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        await connectToDB();
        const session = await getServerSession(authOptions);
        if (!session?.user || (session.user as any).role !== "admin") {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }
        const body = await request.json();
        const { label, value, probability, color } = body;
        if (!label || probability === undefined) {
            return NextResponse.json({ error: "Label and probability are required" }, { status: 400 });
        }
        const item = await DailyRewardSpinItem.create({ label, value: value || 0, probability, color: color || '#9333ea' });
        await AdminActivity.create({
            adminId: (session.user as any).id,
            adminName: session.user.name,
            actionType: 'CREATE_DAILY_SPIN_ITEM',
            targetId: item._id,
            details: `Created Daily Spin item: ${label} (${probability}%)`
        });
        return NextResponse.json({ success: true, item });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
