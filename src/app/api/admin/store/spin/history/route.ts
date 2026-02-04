import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import connectToDB from "@/lib/db";
import Transaction from "@/models/Transaction";
import Order from "@/models/Order";
import User from "@/models/User"; // Ensure User model is registered if populate needs it

export async function GET() {
    try {
        await connectToDB();
        const session = await getServerSession(authOptions);

        if (!session || !session.user || (session.user as any).role !== "admin") {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        // 1. Fetch Transactions (Coin Wins)
        const transactions = await Transaction.find({ type: 'spin_win' })
            .populate('user', 'name email image')
            .sort({ createdAt: -1 })
            .lean();

        // 2. Fetch Orders (Product Wins - source: 'spin')
        const orders = await Order.find({ source: 'spin' })
            .populate('userId', 'name email image') // Consistent with transaction population
            .populate('productId', 'title imageUrl')
            .sort({ createdAt: -1 })
            .lean();

        // 3. Merge and Normalize
        // We want a unified structure: { _id, date, user, type: 'Coin'|'Product', prize: string, status: string }

        const normalizedTransactions = transactions.map((t: any) => ({
            _id: t._id,
            date: t.createdAt,
            user: t.user,
            type: 'Coin',
            prize: `${t.amount} Coins`,
            status: t.status === 'approved' ? 'Auto-Credited' : t.status, // Should be 'approved' usually
            originalData: t
        }));

        const normalizedOrders = orders.map((o: any) => ({
            _id: o._id,
            date: o.createdAt,
            user: o.userId,
            type: 'Product',
            prize: o.productId?.title || 'Unknown Product',
            status: o.status, // Pending, Approved (Delivered)
            originalData: o
        }));

        const combinedHistory = [...normalizedTransactions, ...normalizedOrders].sort((a, b) =>
            new Date(b.date).getTime() - new Date(a.date).getTime()
        );

        return NextResponse.json(combinedHistory);

    } catch (error: any) {
        console.error("History fetch error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
