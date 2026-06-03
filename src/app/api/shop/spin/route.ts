import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import connectToDatabase from "@/lib/db";
import User from "@/models/User";
import SpinItem from "@/models/SpinItem";
import Order from "@/models/Order";
import Transaction from "@/models/Transaction";
import mongoose from "mongoose";
import { rateLimit, getIP } from "@/lib/rate-limit";

export async function POST(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || !session.user) {
            return Response.json({ error: "Unauthorized" }, { status: 401 });
        }

        // Rate Limiting: 10 spins per minute
        const identifier = (session.user as any).id || getIP(req);
        const { success, limit, reset } = rateLimit(identifier, { limit: 10, windowMs: 60000 });

        if (!success) {
            return Response.json({ 
                error: "Wait a moment... too many spins! Please slow down.", 
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

            if ((user.spinsAvailable || 0) <= 0) {
                if ((user.loyaltyProgress || 0) >= 2500) {
                    const extraSpins = Math.floor(user.loyaltyProgress / 2500);
                    user.spinsAvailable = (user.spinsAvailable || 0) + extraSpins;
                    user.loyaltyProgress = user.loyaltyProgress % 2500;
                } else {
                    throw new Error("No spins available");
                }
            }

            // Fetch Items - Sorted by _id to match frontend order
            const items = await SpinItem.find({ isActive: true }).sort({ _id: 1 }).lean();

            if (items.length === 0) {
                throw new Error("No active spin items");
            }

            let winningItem = null;

            // Check if there is already a pending spin reward to prevent rerolling
            if (user.pendingSpinReward && user.pendingSpinReward.itemId) {
                const existingItem = items.find(i => i._id.toString() === user.pendingSpinReward.itemId);
                if (existingItem) {
                    winningItem = existingItem;
                }
            }

            if (!winningItem) {
                // Weighed Random Selection
                // 1. Calculate total weight
                const totalWeight = items.reduce((sum, item) => sum + (item.probability || 0), 0);

                // 2. Random value between 0 and totalWeight
                let randomValue = Math.random() * totalWeight;

                // 3. Find winner
                for (const item of items) {
                    randomValue -= (item.probability || 0);
                    if (randomValue <= 0) {
                        winningItem = item;
                        break;
                    }
                }

                // Fallback (rare float issues)
                if (!winningItem) {
                    winningItem = items[items.length - 1];
                }

                // Save reward as pending (do not credit or decrement yet)
                user.pendingSpinReward = {
                    itemId: winningItem._id.toString(),
                    value: Number(winningItem.value),
                    label: winningItem.label,
                    rewardType: winningItem.type?.toLowerCase(),
                    product: winningItem.product ? winningItem.product.toString() : (winningItem.type?.toLowerCase() === 'product' ? winningItem.value.toString() : undefined)
                };
                console.log("Saving pendingSpinReward for user:", user._id, user.pendingSpinReward);
            }

            await user.save();

            // Return Winner & Index for Frontend Animation
            const winnerIndex = items.findIndex(i => i._id.toString() === winningItem._id.toString());

            return Response.json({
                success: true,
                winningItem,
                winnerIndex,
                remainingSpins: user.spinsAvailable
            });

        } catch (error: any) {
            return Response.json({ error: error.message || "Spin failed" }, { status: 400 });
        }

    } catch (error) {
        console.error("Spin error:", error);
        return Response.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
