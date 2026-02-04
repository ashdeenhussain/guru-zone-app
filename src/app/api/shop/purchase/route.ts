import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import connectToDatabase from "@/lib/db";
import User from "@/models/User";
import StoreProduct from "@/models/StoreProduct";
import Order from "@/models/Order";
import Transaction from "@/models/Transaction";
import mongoose from "mongoose";

export async function POST(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || !session.user) {
            return Response.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { productId, userDetails } = await req.json();

        if (!productId || !userDetails || !userDetails.inGameName || !userDetails.uid) {
            return Response.json({ error: "Missing required fields" }, { status: 400 });
        }

        await connectToDatabase();

        const product = await StoreProduct.findById(productId);
        if (!product) {
            return Response.json({ error: "Product not found" }, { status: 404 });
        }
        if (!product.isActive) {
            return Response.json({ error: "Product is not active" }, { status: 400 });
        }

        // @ts-ignore - session.user.id is usually present in NextAuth
        const userId = session.user.id;
        const user = await User.findById(userId);

        if (!user) {
            return Response.json({ error: "User not found" }, { status: 404 });
        }

        // Ensure numbers
        const price = Number(product.priceCoins);
        const balance = Number(user.walletBalance);

        if (isNaN(price) || isNaN(balance)) {
            return Response.json({ error: "Invalid price or balance data" }, { status: 500 });
        }

        if (balance < price) {
            return Response.json({ error: "Insufficient Coins" }, { status: 400 });
        }

        // 1. Deduct Coins
        user.walletBalance = balance - price;
        await user.save();

        // 2. Create Order
        const newOrder = await Order.create({
            userId: user._id,
            productId: product._id,
            pricePaid: price,
            status: "Pending",
            source: "shop",
            userDetails: {
                inGameName: userDetails.inGameName,
                uid: userDetails.uid
            }
        });

        // 3. Create Transaction Record
        await Transaction.create({
            user: user._id,
            amount: -price,
            type: 'shop_purchase',
            description: `Purchased ${product.title}`,
            status: 'approved' // Set to approved as the deduction already happened
        });

        return Response.json({
            message: "Order Placed Successfully! Status: Pending.",
            order: newOrder
        });

    } catch (error: any) {
        console.error("Purchase error:", error);
        return Response.json({ error: error.message || "Internal Server Error" }, { status: 500 });
    }
}
