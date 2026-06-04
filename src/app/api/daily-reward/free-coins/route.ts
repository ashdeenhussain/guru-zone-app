import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import connectToDB from "@/lib/db";
import User from "@/models/User";
import Transaction from "@/models/Transaction";
import FinancialLog from "@/models/FinancialLog";

// Weekly schedule: Day 1→1 coin, Day 2-3→2 coins, Day 4-5→4 coins, Day 6-7→5 coins
const WEEKLY_SCHEDULE = [0, 1, 2, 2, 4, 4, 5, 5]; // index 0 unused, 1-7 are days
const RESET_HOURS = 24; // hours before streak resets if not claimed
const MS_PER_HOUR = 3600 * 1000;

function getCoinsForDay(day: number): number {
    if (day < 1 || day > 7) return 0;
    return WEEKLY_SCHEDULE[day];
}

export async function GET() {
    try {
        await connectToDB();
        const session = await getServerSession(authOptions);
        if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const userId = (session.user as any).id;
        const user = await User.findById(userId)
            .select("lastFreeCoinsAt freeCoinsStreak freeCoinsStreakStartedAt")
            .lean();
        if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

        const now = new Date();
        const lastClaim = user.lastFreeCoinsAt ? new Date(user.lastFreeCoinsAt) : null;
        const hoursSinceLast = lastClaim
            ? (now.getTime() - lastClaim.getTime()) / MS_PER_HOUR
            : null;

        // Check if streak is broken (more than 48 hrs since last claim — give some grace)
        const streakBroken = lastClaim && hoursSinceLast! > 48;
        const currentStreak = streakBroken ? 0 : (user.freeCoinsStreak || 0);

        // Can claim if: never claimed OR it's been >= 24 hours since last claim (and <= 48 hrs to keep streak)
        const canClaim = !lastClaim || hoursSinceLast! >= RESET_HOURS;

        // Next day in streak (what they'll get next)
        const nextDay = (currentStreak % 7) + 1;
        const nextCoins = getCoinsForDay(nextDay);

        // When can they claim next
        let nextClaimAt: string | null = null;
        if (lastClaim && !canClaim) {
            nextClaimAt = new Date(lastClaim.getTime() + RESET_HOURS * MS_PER_HOUR).toISOString();
        }

        // Build weekly schedule with status for each day
        const schedule = Array.from({ length: 7 }, (_, i) => {
            const day = i + 1;
            const coins = getCoinsForDay(day);
            let status: "claimed" | "current" | "upcoming" | "locked" = "upcoming";
            if (day <= currentStreak) status = "claimed";
            else if (day === nextDay && canClaim) status = "current";
            else if (day === nextDay && !canClaim) status = "locked";
            return { day, coins, status };
        });

        return NextResponse.json({
            canClaim,
            currentStreak,
            nextDay,
            nextCoins,
            nextClaimAt,
            streakBroken,
            schedule,
            lastClaimAt: lastClaim?.toISOString() || null,
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
        const user = await User.findById(userId)
            .select("walletBalance lastFreeCoinsAt freeCoinsStreak freeCoinsStreakStartedAt");
        if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

        const now = new Date();
        const lastClaim = user.lastFreeCoinsAt ? new Date(user.lastFreeCoinsAt) : null;
        const hoursSinceLast = lastClaim
            ? (now.getTime() - lastClaim.getTime()) / MS_PER_HOUR
            : null;

        // Check cooldown
        if (lastClaim && hoursSinceLast! < RESET_HOURS) {
            const nextClaimAt = new Date(lastClaim.getTime() + RESET_HOURS * MS_PER_HOUR);
            return NextResponse.json({
                error: "Come back tomorrow to claim!",
                nextClaimAt: nextClaimAt.toISOString(),
            }, { status: 429 });
        }

        // Determine streak — if > 48 hrs without claim, reset
        const streakBroken = lastClaim && hoursSinceLast! > 48;
        const currentStreak = streakBroken ? 0 : (user.freeCoinsStreak || 0);

        // Next day in streak
        const nextDay = (currentStreak % 7) + 1;
        const coinsToAward = getCoinsForDay(nextDay);

        // Update user
        user.walletBalance = (user.walletBalance || 0) + coinsToAward;
        user.freeCoinsStreak = nextDay;
        user.lastFreeCoinsAt = now;
        if (nextDay === 1 || !user.freeCoinsStreakStartedAt) {
            user.freeCoinsStreakStartedAt = now;
        }
        await user.save();

        // Record transaction
        const tx = await Transaction.create({
            user: userId,
            amount: coinsToAward,
            type: "daily_free_coins",
            status: "approved",
            description: `Daily Free Coins — Day ${nextDay} (${coinsToAward} Coins)`,
        });

        // ── Financial Log Event ──
        try {
            await FinancialLog.create({
                type: 'daily_collect',
                amount: coinsToAward,
                currency: 'Coins',
                userId: userId,
                referenceId: tx._id,
                description: `Daily Free Coins — Day ${nextDay} (${coinsToAward} Coins)`,
                timestamp: new Date()
            });
        } catch (logErr) {
            console.error("Failed to write daily collect to FinancialLog:", logErr);
        }

        return NextResponse.json({
            success: true,
            dayCompleted: nextDay,
            coinsAwarded: coinsToAward,
            newStreak: nextDay,
            newBalance: user.walletBalance,
            streakBroken: !!streakBroken,
        });
    } catch (error: any) {
        console.error("Free coins error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
