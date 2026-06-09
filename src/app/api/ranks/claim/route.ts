import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/db';
import User from '@/models/User';
import SystemSetting from '@/models/SystemSetting';
import Transaction from '@/models/Transaction';
import FinancialLog from '@/models/FinancialLog';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { RANK_THRESHOLDS } from '@/lib/ranks';

export async function POST(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || !session.user) {
            return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
        }

        const userId = (session.user as any).id;
        const body = await req.json();
        const { rewardId } = body;

        if (!rewardId) {
            return NextResponse.json({ success: false, error: 'Reward ID is required' }, { status: 400 });
        }

        await connectToDatabase();

        const user = await User.findById(userId);
        if (!user) {
            return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 });
        }

        // 1. Check if already claimed
        if (user.claimedRankRewards && user.claimedRankRewards.includes(rewardId)) {
            return NextResponse.json({ success: false, error: 'Reward already claimed' }, { status: 400 });
        }

        // 2. Find matching rank from static thresholds
        const rank = RANK_THRESHOLDS.find(r => {
            const key = `${r.tier}-${r.division || 0}`;
            return key === rewardId;
        });

        if (!rank) {
            return NextResponse.json({ success: false, error: 'Invalid reward ID' }, { status: 400 });
        }

        // 3. Verify user has reached the required points for this rank
        const currentPoints = user.rankPoints || 0;
        if (currentPoints < rank.minPoints) {
            return NextResponse.json({ success: false, error: 'You have not reached the required rank points for this reward' }, { status: 400 });
        }

        // 4. Resolve reward coins amount (Check DB overrides first, then code defaults)
        let rewardAmount = 0;
        const settings = await SystemSetting.findOne().lean();
        
        if (settings && settings.rankRewards && (settings.rankRewards as any)[rewardId] !== undefined) {
            rewardAmount = Number((settings.rankRewards as any)[rewardId]) || 0;
        } else {
            rewardAmount = rank.rankUpReward?.amount || 0;
        }

        if (rewardAmount <= 0) {
            return NextResponse.json({ success: false, error: 'This rank does not have a claimable coin reward' }, { status: 400 });
        }

        // 5. Award Reward (Transaction & Wallet update)
        user.walletBalance = (user.walletBalance || 0) + rewardAmount;
        if (!user.claimedRankRewards) {
            user.claimedRankRewards = [];
        }
        user.claimedRankRewards.push(rewardId);
        await user.save();

        // Create transaction log
        const tx = await Transaction.create({
            user: userId,
            amount: rewardAmount,
            type: 'rank_reward',
            description: `Claimed Rank Reward for ${rank.tier}${rank.division ? ` ${rank.division}` : ''}`,
            status: 'approved'
        });

        // Record to FinancialLog
        try {
            await FinancialLog.create({
                type: 'rank_reward',
                amount: rewardAmount,
                currency: 'Coins',
                userId: userId,
                referenceId: tx._id,
                description: `Claimed Rank Reward for ${rank.tier}${rank.division ? ` ${rank.division}` : ''}`,
                timestamp: new Date()
            });
        } catch (logErr) {
            console.error("Failed to write rank reward to FinancialLog:", logErr);
        }

        return NextResponse.json({
            success: true,
            message: `Successfully claimed ${rewardAmount} coins!`,
            coinsAwarded: rewardAmount
        });

    } catch (error: any) {
        console.error('Error claiming rank reward:', error);
        return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
    }
}
