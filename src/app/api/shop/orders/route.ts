import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import connectToDatabase from "@/lib/db";
import Order from "@/models/Order";
import StoreProduct from "@/models/StoreProduct";

export async function GET(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || !session.user) {
            return Response.json({ error: "Unauthorized" }, { status: 401 });
        }

        await connectToDatabase();

        // @ts-ignore - session.user.id is available in our auth setup
        const userId = session.user.id;

        // Fetch orders and populate product details
        const orders = await Order.find({ userId })
            .sort({ createdAt: -1 })
            .populate("productId", "title imageUrl category priceCoins emoji imageType");

        return Response.json({ orders });

    } catch (error) {
        console.error("Fetch orders error:", error);
        return Response.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
