import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import connectToDatabase from "@/lib/db";
import User from "@/models/User";
import SpinItem from "@/models/SpinItem";
import Order from "@/models/Order";
import Transaction from "@/models/Transaction";
import mongoose from "mongoose";

export async function POST(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || !session.user) {
            return Response.json({ error: "Unauthorized" }, { status: 401 });
        }

        await connectToDatabase();

        // Start Transaction
        const sessionDB = await mongoose.startSession();
        sessionDB.startTransaction();

        try {
            // @ts-ignore
            const userId = session.user.id;
            const user = await User.findById(userId).session(sessionDB);

            if (!user) {
                throw new Error("User not found");
            }

            if ((user.spinsAvailable || 0) <= 0) {
                throw new Error("No spins available");
            }

            // Fetch Items
            const items = await SpinItem.find({ isActive: true }).lean();

            if (items.length === 0) {
                throw new Error("No active spin items");
            }

            // Weighed Random Selection
            // 1. Calculate total weight
            const totalWeight = items.reduce((sum, item) => sum + (item.probability || 0), 0);

            // 2. Random value between 0 and totalWeight
            let randomValue = Math.random() * totalWeight;

            // 3. Find winner
            let winningItem = null;
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

            // Process Reward
            user.spinsAvailable -= 1;

            if (winningItem.type === 'coins') {
                const amount = Number(winningItem.value);
                if (isNaN(amount)) throw new Error("Invalid coin value in spin item");

                user.walletBalance += amount; // Auto-commit to wallet

                await Transaction.create([{
                    user: user._id,
                    amount: amount,
                    type: 'prize_winnings',
                    description: `Won from Lucky Spin: ${winningItem.label}`,
                    status: 'approved'
                }], { session: sessionDB });

            } else if (winningItem.type === 'product' || winningItem.type === 'Product') {
                // Create Order for Product Win
                await Order.create([{
                    userId: user._id,
                    productId: winningItem.product || winningItem.value, // Expecting ID here
                    pricePaid: 0,
                    status: 'Pending',
                    source: 'spin',
                    userDetails: {
                        inGameName: user.inGameName || "Unknown",
                        uid: user.freeFireUid || "Unknown"
                    },
                    adminComment: `Won via Lucky Spin: ${winningItem.label}`
                }], { session: sessionDB });
            }

            await user.save({ session: sessionDB });

            await sessionDB.commitTransaction();
            sessionDB.endSession();

            // Return Winner & Index for Frontend Animation
            const winnerIndex = items.findIndex(i => i._id.toString() === winningItem._id.toString());

            return Response.json({
                success: true,
                winningItem,
                winnerIndex,
                remainingSpins: user.spinsAvailable
            });

        } catch (error: any) {
            await sessionDB.abortTransaction();
            sessionDB.endSession();
            return Response.json({ error: error.message || "Spin failed" }, { status: 400 });
        }

    } catch (error) {
        console.error("Spin error:", error);
        return Response.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
