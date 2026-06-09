import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import connectToDatabase from '@/lib/db';
import User from '@/models/User';
import Transaction from '@/models/Transaction';
import SystemSetting from '@/models/SystemSetting';
import { RANK_THRESHOLDS, getRankFromPoints } from '@/lib/ranks';

export async function GET() {
    try {
        const session = await getServerSession(authOptions);
        if (!session || !session.user || (session.user as any).role !== 'admin') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        await connectToDatabase();

        const settings = await SystemSetting.findOne().lean();

        // 1. Fetch active users (points > 0)
        const users = await User.find({ rankPoints: { $gt: 0 } }, { rankPoints: 1, claimedRankRewards: 1 }).lean();
        
        let unclaimedLiability = 0;
        const activePlayersCount = users.length;

        // Rank distribution counters
        const distribution: Record<string, number> = {
            "Bronze": 0,
            "Silver": 0,
            "Gold": 0,
            "Diamond": 0,
            "Heroic": 0,
            "Elite Heroic": 0,
            "Master": 0,
            "Elite Master": 0,
            "Grandmaster": 0
        };

        const rankRewardsDb = settings?.rankRewards || {};

        for (const u of users) {
            const pts = u.rankPoints || 0;
            const rank = getRankFromPoints(pts);

            // Increment distribution count
            if (distribution[rank.tier] !== undefined) {
                distribution[rank.tier]++;
            }

            // Calculate unclaimed rewards liability for this user
            const claimed = u.claimedRankRewards || [];
            for (const r of RANK_THRESHOLDS) {
                if (r.rankUpReward && pts >= r.minPoints) {
                    const rewardId = `${r.tier}-${r.division || 0}`;
                    if (!claimed.includes(rewardId)) {
                        let amt = 0;
                        if (rankRewardsDb[rewardId] !== undefined) {
                            amt = Number(rankRewardsDb[rewardId]) || 0;
                        } else {
                            amt = r.rankUpReward.amount || 0;
                        }
                        unclaimedLiability += amt;
                    }
                }
            }
        }

        // 2. Fetch total claimed rewards this season
        const seasonStart = settings?.rankSeason?.startDate || new Date(Date.now() - 365 * 24 * 60 * 60 * 1000);
        const txs = await Transaction.find({
            type: 'rank_reward',
            status: 'approved',
            createdAt: { $gte: seasonStart }
        }, { amount: 1 }).lean();

        let totalClaimsPaid = 0;
        for (const tx of txs) {
            totalClaimsPaid += tx.amount || 0;
        }

        return NextResponse.json({
            success: true,
            stats: {
                activePlayers: activePlayersCount,
                totalClaimsPaid,
                unclaimedLiability,
                distribution,
                seasonHistory: settings?.seasonHistory || []
            }
        });

    } catch (error: any) {
        console.error('Error fetching admin ranks stats:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
