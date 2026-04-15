import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import connectToDB from "@/lib/db";
import DailyRewardSpinItem from "@/models/DailyRewardSpinItem";

/**
 * Public endpoint for authenticated users to fetch active spin items
 * (used by the Daily Reward page to render the wheel)
 */
export async function GET() {
    try {
        await connectToDB();
        const session = await getServerSession(authOptions);
        if (!session?.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const items = await DailyRewardSpinItem.find({ isActive: true })
            .select("label value color probability")
            .sort({ createdAt: 1 })
            .lean();

        return NextResponse.json({ success: true, items });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
