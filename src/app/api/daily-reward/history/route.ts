import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import connectToDB from "@/lib/db";
import Transaction from "@/models/Transaction";

export async function GET() {
    try {
        await connectToDB();
        const session = await getServerSession(authOptions);
        if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const userId = (session.user as any).id;

        const history = await Transaction.find({
            user: userId,
            type: { $in: ["daily_reward_spin", "daily_free_coins"] },
        })
            .sort({ createdAt: -1 })
            .limit(30)
            .lean();

        return NextResponse.json({ success: true, history });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
