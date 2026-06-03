import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import connectToDatabase from "@/lib/db";
import User from "@/models/User";
import Transaction from "@/models/Transaction";
import Order from "@/models/Order";
import mongoose from "mongoose";
import { rateLimit, getIP } from "@/lib/rate-limit";

export async function POST(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || !session.user) {
            return Response.json({ error: "Unauthorized" }, { status: 401 });
        }

        // Rate Limiting: 10 claims per minute
        const identifier = (session.user as any).id || getIP(req);
        const { success, limit, reset } = rateLimit(identifier, { limit: 10, windowMs: 60000 });

        if (!success) {
            return Response.json({ 
                error: "Too many reward claim requests. Please slow down.", 
                resetAt: new Date(reset).toLocaleTimeString()
            }, { status: 429 });
        }

        await connectToDatabase();

        try {
            // @ts-ignore
            const userId = session.user.id;
            const user = await User.findById(userId);

            if (!user) {
                throw new Error("User not found");
            }

            // Verify if user had a pending reward
            console.log("Fetched pendingSpinReward for user:", user._id, user.pendingSpinReward);
            if (!user.pendingSpinReward || !user.pendingSpinReward.itemId) {
                throw new Error("No pending spin reward found to claim.");
            }

            // Verify if user actually had a "Spin Token" (spinsAvailable > 0)
            if ((user.spinsAvailable || 0) <= 0) {
                if ((user.loyaltyProgress || 0) >= 2500) {
                    const extraSpins = Math.floor(user.loyaltyProgress / 2500);
                    user.spinsAvailable = (user.spinsAvailable || 0) + extraSpins;
                    user.loyaltyProgress = user.loyaltyProgress % 2500;
                }
            }

            if ((user.spinsAvailable || 0) <= 0) {
                throw new Error("Requirements not met: No spin token available.");
            }

            const reward = user.pendingSpinReward;
            const rewardType = reward.rewardType?.toLowerCase();

            if (rewardType === 'coins' || rewardType === 'coin') {
                const amount = Number(reward.value);
                if (isNaN(amount)) throw new Error("Invalid coin value in pending reward");

                user.walletBalance += amount;

                await Transaction.create({
                    user: user._id,
                    amount: amount,
                    type: 'prize_winnings',
                    description: `Won from Lucky Spin: ${reward.label}`,
                    status: 'approved'
                });

            } else if (rewardType === 'product') {
                // Create Order for Product Win
                await Order.create({
                    userId: user._id,
                    productId: reward.product || reward.value, // Expecting ID here
                    pricePaid: 0,
                    status: 'Pending',
                    source: 'spin',
                    userDetails: {
                        inGameName: user.inGameName || "Unknown",
                        uid: user.freeFireUid || "Unknown"
                    },
                    adminComment: `Won via Lucky Spin: ${reward.label}`
                });
            } else {
                throw new Error(`Unsupported reward type: ${reward.rewardType}`);
            }

            // Decrement user's spin token by 1
            user.spinsAvailable = Math.max(0, (user.spinsAvailable || 0) - 1);

            // Clear the pending reward
            user.pendingSpinReward = undefined;

            await user.save();

            return Response.json({
                success: true,
                message: "Reward claimed and wallet updated successfully",
                walletBalance: user.walletBalance,
                remainingSpins: user.spinsAvailable
            });

        } catch (error: any) {
            return Response.json({ error: error.message || "Claim failed" }, { status: 400 });
        }

    } catch (error) {
        console.error("Claim reward error:", error);
        return Response.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
