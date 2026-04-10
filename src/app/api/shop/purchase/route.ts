import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import connectToDatabase from "@/lib/db";
import User from "@/models/User";
import StoreProduct from "@/models/StoreProduct";
import Order from "@/models/Order";
import Transaction from "@/models/Transaction";
import Notification from "@/models/Notification";
import mongoose from "mongoose";
import { z } from "zod";
import { rateLimit, getIP } from "@/lib/rate-limit";

const purchaseSchema = z.object({
    productId: z.string().min(1, "Product ID is required"),
    userDetails: z.object({
        inGameName: z.string().min(1, "In-game name is required").max(50),
        uid: z.string().min(1, "UID is required").max(30),
    })
});

export async function POST(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || !session.user) {
            return Response.json({ error: "Unauthorized" }, { status: 401 });
        }

        // Rate Limiting: 5 purchases per minute
        const identifier = (session.user as any).id || getIP(req);
        const { success, limit, reset } = rateLimit(identifier, { limit: 5, windowMs: 60000 });

        if (!success) {
            return Response.json({ 
                error: "Too many requests. Please wait a minute before trying again.",
                limit,
                resetAt: new Date(reset).toLocaleTimeString()
            }, { 
                status: 429,
                headers: { 'Retry-After': Math.ceil((reset - Date.now()) / 1000).toString() }
            });
        }


        const body = await req.json();
        const validation = purchaseSchema.safeParse(body);

        if (!validation.success) {
            return Response.json({ 
                error: "Invalid request data", 
                details: validation.error.format() 
            }, { status: 400 });
        }

        const { productId, userDetails } = validation.data;


        await connectToDatabase();

        // Start Transaction to prevent race conditions
        const dbSession = await mongoose.startSession();
        dbSession.startTransaction();

        try {
            const product = await StoreProduct.findById(productId).session(dbSession);
            if (!product) {
                throw new Error("Product not found");
            }
            if (!product.isActive) {
                throw new Error("Product is not active");
            }

            // @ts-ignore
            const userId = session.user.id;
            
            // Atomic update: only decrement if balance is enough
            const price = Number(product.priceCoins);
            const user = await User.findOneAndUpdate(
                { _id: userId, walletBalance: { $gte: price } },
                { $inc: { walletBalance: -price } },
                { session: dbSession, new: true }
            );

            if (!user) {
                throw new Error("Insufficient Coins or User not found");
            }

            // 2. Create Order
            const newOrder = await Order.create([{
                userId: user._id,
                productId: product._id,
                pricePaid: price,
                status: "pending",
                source: "shop",
                userDetails: {
                    inGameName: userDetails.inGameName,
                    uid: userDetails.uid
                }
            }], { session: dbSession });

            const order = newOrder[0];

            // 3. Create Transaction Record
            await Transaction.create([{
                user: user._id,
                amount: -price, // Store as negative to show deduction
                type: 'shop_purchase',
                description: `Purchased ${product.title}`,
                status: 'pending',
                referenceId: order._id
            }], { session: dbSession });

            // 4. Create Notification for User
            await Notification.create([{
                userId: user._id,
                title: "Purchase Successful",
                message: `You successfully purchased ${product.title}. It is now pending processing.`,
                type: "success",
                link: "/dashboard/shop"
            }], { session: dbSession });

            await dbSession.commitTransaction();
            dbSession.endSession();

            return Response.json({
                message: "Order Placed Successfully! Status: Pending.",
                order: order
            });

        } catch (error: any) {
            await dbSession.abortTransaction();
            dbSession.endSession();
            throw error;
        }

    } catch (error: any) {
        console.error("Purchase error:", error);
        return Response.json({ error: error.message || "Internal Server Error" }, { status: 500 });
    }
}
