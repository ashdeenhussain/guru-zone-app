import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import connectToDB from "@/lib/db";
import User from "@/models/User";
import DailyRewardSpinItem from "@/models/DailyRewardSpinItem";
import Transaction from "@/models/Transaction";
import FinancialLog from "@/models/FinancialLog";

// Minimum coins required to use daily spin
const MIN_COINS_REQUIRED = 1000;

export async function GET() {
    try {
        await connectToDB();
        const session = await getServerSession(authOptions);
        if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const userId = (session.user as any).id;
        const user = await User.findById(userId).select("walletBalance lastDailySpinAt").lean();
        if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

        const now = new Date();
        const lastSpin = user.lastDailySpinAt ? new Date(user.lastDailySpinAt) : null;
        const canSpin = !lastSpin || (now.getTime() - lastSpin.getTime()) >= 24 * 60 * 60 * 1000;
        const hasEnoughCoins = (user.walletBalance || 0) >= MIN_COINS_REQUIRED;

        let nextSpinAt: string | null = null;
        if (lastSpin && !canSpin) {
            const nextTime = new Date(lastSpin.getTime() + 24 * 60 * 60 * 1000);
            nextSpinAt = nextTime.toISOString();
        }

        return NextResponse.json({
            canSpin,
            hasEnoughCoins,
            walletBalance: user.walletBalance || 0,
            minCoinsRequired: MIN_COINS_REQUIRED,
            nextSpinAt,
        });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function POST() {
    try {
        await connectToDB();
        const session = await getServerSession(authOptions);
        if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const userId = (session.user as any).id;
        const user = await User.findById(userId).select("walletBalance lastDailySpinAt");
        if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

        // Check minimum coins
        if ((user.walletBalance || 0) < MIN_COINS_REQUIRED) {
            return NextResponse.json({
                error: `You need at least ${MIN_COINS_REQUIRED} coins to spin!`
            }, { status: 403 });
        }

        // Check 24hr cooldown
        const now = new Date();
        const lastSpin = user.lastDailySpinAt ? new Date(user.lastDailySpinAt) : null;
        if (lastSpin && (now.getTime() - lastSpin.getTime()) < 24 * 60 * 60 * 1000) {
            const nextTime = new Date(lastSpin.getTime() + 24 * 60 * 60 * 1000);
            return NextResponse.json({
                error: "You have already spun today! Come back tomorrow.",
                nextSpinAt: nextTime.toISOString(),
            }, { status: 429 });
        }

        // Fetch active spin items
        const items = await DailyRewardSpinItem.find({ isActive: true }).lean();
        if (!items || items.length === 0) {
            return NextResponse.json({ error: "No spin items configured" }, { status: 500 });
        }

        // Weighted random selection — controlled probability
        // Build cumulative probability array
        const totalProbability = items.reduce((sum, item) => sum + item.probability, 0);
        const rand = Math.random() * totalProbability;
        let cumulative = 0;
        let winnerIndex = 0;
        let winningItem = items[0];

        for (let i = 0; i < items.length; i++) {
            cumulative += items[i].probability;
            if (rand <= cumulative) {
                winnerIndex = i;
                winningItem = items[i];
                break;
            }
        }

        // Award coins
        const coinsWon = winningItem.value || 0;
        if (coinsWon > 0) {
            user.walletBalance = (user.walletBalance || 0) + coinsWon;
        }
        user.lastDailySpinAt = now;
        await user.save();

        // Record transaction
        if (coinsWon > 0) {
            const tx = await Transaction.create({
                user: userId,
                amount: coinsWon,
                type: "daily_reward_spin",
                status: "approved",
                description: `Daily Reward Spin — Won ${coinsWon} Coins`,
            });

            // ── Financial Log Event ──
            try {
                await FinancialLog.create({
                    type: 'free_spin',
                    amount: coinsWon,
                    currency: 'Coins',
                    userId: userId,
                    referenceId: tx._id,
                    description: `Daily Reward Spin — Won ${coinsWon} Coins`,
                    timestamp: new Date()
                });
            } catch (logErr) {
                console.error("Failed to write daily reward spin to FinancialLog:", logErr);
            }
        }

        return NextResponse.json({
            success: true,
            winnerIndex,
            winningItem: {
                _id: winningItem._id.toString(),
                label: winningItem.label,
                value: winningItem.value,
                color: winningItem.color,
            },
            coinsWon,
            newBalance: user.walletBalance,
        });
    } catch (error: any) {
        console.error("Daily spin error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
