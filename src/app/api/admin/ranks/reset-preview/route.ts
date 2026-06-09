import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import connectToDatabase from '@/lib/db';
import User from '@/models/User';
import { RANK_THRESHOLDS } from '@/lib/ranks';

export async function GET() {
    try {
        const session = await getServerSession(authOptions);
        if (!session || !session.user || (session.user as any).role !== 'admin') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        await connectToDatabase();

        // Fetch all active players (points > 0)
        const users = await User.find({ rankPoints: { $gt: 0 } }, { rankPoints: 1, claimedRankRewards: 1 }).lean();

        let totalAffected = users.length;
        let dropToPlatinum = 0; // points >= 3200 -> Platinum I (1000)
        let dropToGold = 0;     // points >= 1600 && < 3200 -> Gold I (600)
        let dropToSilver = 0;   // points >= 600 && < 1600 -> Silver I (300)
        let dropToBronze = 0;   // points < 600 -> Bronze I (0)

        let rewardsToLockCount = 0;

        for (const user of users) {
            const pts = user.rankPoints || 0;
            if (pts >= 3200) {
                dropToPlatinum++;
            } else if (pts >= 1600) {
                dropToGold++;
            } else if (pts >= 600) {
                dropToSilver++;
            } else {
                dropToBronze++;
            }

            // Count unclaimed reached rewards that will expire/lock
            const claimed = user.claimedRankRewards || [];
            for (const r of RANK_THRESHOLDS) {
                if (pts >= r.minPoints && r.rankUpReward) {
                    const rId = `${r.tier}-${r.division || 0}`;
                    if (!claimed.includes(rId)) {
                        rewardsToLockCount++;
                    }
                }
            }
        }

        return NextResponse.json({
            success: true,
            preview: {
                totalAffected,
                drops: {
                    platinum: dropToPlatinum,
                    gold: dropToGold,
                    silver: dropToSilver,
                    bronze: dropToBronze
                },
                rewardsToLock: rewardsToLockCount
            }
        });

    } catch (error: any) {
        console.error('Error fetching admin ranks reset preview:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
