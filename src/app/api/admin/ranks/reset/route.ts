import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/db';
import User from '@/models/User';
import SystemSetting from '@/models/SystemSetting';
import AdminActivity from '@/models/AdminActivity';
import Transaction from '@/models/Transaction';
import { getServerSession } from 'next-auth';
import { authOptions, hasPermission } from '@/lib/auth';
import { getRankFromPoints, formatRankName, RANK_THRESHOLDS } from '@/lib/ranks';

export async function POST(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!hasPermission(session, 'manage_system')) {
            return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
        }

        const adminId = (session.user as any).id;
        const adminName = session.user.name;

        await connectToDatabase();

        // 1. Fetch current season details
        let settings = await SystemSetting.findOne();
        if (!settings) {
            settings = await SystemSetting.create({
                rankSeason: {
                    currentSeasonName: 'Season 1',
                    startDate: new Date(),
                    endDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
                    durationDays: 365
                }
            });
        }

        const currentSeasonName = settings.rankSeason?.currentSeasonName || 'Season 1';

        // 2. Fetch all users
        const users = await User.find({});

        // Compile Season History Summary before resetting
        let totalUsersCount = 0;
        let topPlayerObj = { name: "N/A", points: 0, rank: "Bronze III" };

        for (const user of users) {
            const pts = user.rankPoints || 0;
            if (pts > 0) {
                totalUsersCount++;
                if (pts > topPlayerObj.points) {
                    const r = getRankFromPoints(pts);
                    topPlayerObj = {
                        name: user.name || "Unknown",
                        points: pts,
                        rank: formatRankName(r)
                    };
                }
            }
        }

        // Fetch claims paid this season
        const seasonStart = settings.rankSeason?.startDate || new Date(Date.now() - 365 * 24 * 60 * 60 * 1000);
        const txs = await Transaction.find({
            type: 'rank_reward',
            status: 'approved',
            createdAt: { $gte: seasonStart }
        }, { amount: 1 }).lean();

        let totalClaimsPaid = 0;
        for (const tx of txs) {
            totalClaimsPaid += tx.amount || 0;
        }

        const seasonSummary = {
            seasonName: currentSeasonName,
            startDate: settings.rankSeason?.startDate || new Date(),
            endDate: settings.rankSeason?.endDate || new Date(),
            totalUsers: totalUsersCount,
            totalClaimsPaid,
            topPlayer: topPlayerObj
        };

        if (!settings.seasonHistory) {
            settings.seasonHistory = [];
        }
        settings.seasonHistory.push(seasonSummary);

        let processedCount = 0;

        for (const user of users) {
            const currentPoints = user.rankPoints || 0;
            const currentRank = getRankFromPoints(currentPoints);
            const currentRankName = formatRankName(currentRank);

            // A. LOCK/EXPIRE UNCLAIMED REWARDS
            // Find all rank rewards the user reached in this season but didn't claim,
            // and add them to claimedRankRewards so they can never be claimed in the future.
            const userClaimed = user.claimedRankRewards || [];
            const reachedRewardsToLock: string[] = [];

            for (const r of RANK_THRESHOLDS) {
                if (currentPoints >= r.minPoints && r.rankUpReward) {
                    const rewardId = `${r.tier}-${r.division || 0}`;
                    if (!userClaimed.includes(rewardId)) {
                        reachedRewardsToLock.push(rewardId);
                    }
                }
            }

            // B. PUSH TO PROFILE RANK HISTORY
            const newHistoryItem = {
                seasonName: currentSeasonName,
                points: currentPoints,
                rankName: currentRankName,
                achievedAt: new Date()
            };

            // C. CALCULATE RANK DROP RESET POINTS
            // Rules:
            // - Master/Elite Master/Grandmaster (minPoints >= 3200) -> Platinum I (1000 points)
            // - Heroic/Diamond (minPoints >= 1600 && < 3200) -> Gold I (600 points)
            // - Platinum/Gold (minPoints >= 600 && < 1600) -> Silver I (300 points)
            // - Silver/Bronze (minPoints < 600) -> Bronze I (0 points)
            let newPoints = 0;
            if (currentPoints >= 3200) {
                newPoints = 1000; // Platinum I
            } else if (currentPoints >= 1600) {
                newPoints = 600;  // Gold I
            } else if (currentPoints >= 600) {
                newPoints = 300;  // Silver I
            } else {
                newPoints = 0;    // Bronze I
            }

            // D. UPDATE USER
            await User.findByIdAndUpdate(user._id, {
                $set: { rankPoints: newPoints },
                $addToSet: { claimedRankRewards: { $each: reachedRewardsToLock } },
                $push: { rankHistory: newHistoryItem }
            });

            processedCount++;
        }

        // 3. Increment season name and update settings
        let nextSeasonName = 'Season 2';
        const match = currentSeasonName.match(/Season\s+(\d+)/i);
        if (match) {
            const num = parseInt(match[1]) + 1;
            nextSeasonName = `Season ${num}`;
        } else {
            nextSeasonName = `${currentSeasonName} (Next)`;
        }

        const durationDays = settings.rankSeason?.durationDays || 365;
        const newStartDate = new Date();
        const newEndDate = new Date(Date.now() + durationDays * 24 * 60 * 60 * 1000);

        settings.rankSeason = {
            currentSeasonName: nextSeasonName,
            startDate: newStartDate,
            endDate: newEndDate,
            durationDays: durationDays
        };
        await settings.save();

        // 4. Log Admin Activity
        await AdminActivity.create({
            adminId: adminId,
            adminName: adminName,
            actionType: 'UPDATE_SYSTEM_SETTINGS', // Standard type, or we can use another string
            targetId: settings._id,
            details: `Reset rank season from "${currentSeasonName}" to "${nextSeasonName}". Dropped ranks for ${processedCount} users.`
        });

        return NextResponse.json({
            success: true,
            message: `Successfully reset season! Processed ${processedCount} users.`,
            previousSeason: currentSeasonName,
            newSeason: nextSeasonName,
            processedUsers: processedCount
        });

    } catch (error: any) {
        console.error('Error during rank season reset:', error);
        return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
    }
}
