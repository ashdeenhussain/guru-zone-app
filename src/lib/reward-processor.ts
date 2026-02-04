import User from "@/models/User";
import Transaction from "@/models/Transaction";
import { getRankFromPoints, RANK_THRESHOLDS, RankInfo } from "./ranks";
import Notification from "@/models/Notification"; // Assuming Notification model exists, if not we will skip or create basic implementation

export async function processRankRewards(userId: string, currentPoints: number) {
    try {
        const user = await User.findById(userId);
        if (!user) return;

        const claimedRewards = user.claimedRankRewards || [];
        const rewardsToAward: { reward: any; rank: RankInfo; id: string }[] = [];

        // Check all ranks that the user has passed
        // We iterate through all thresholds. If user points >= threshold minPoints, they "passed" it.
        for (const rank of RANK_THRESHOLDS) {
            if (currentPoints >= rank.minPoints) {
                if (rank.rankUpReward) {
                    // Generate a unique ID for this reward claim
                    // Format: Tier-Division (e.g., "Silver-1" for reaching Silver I)
                    // If division is null (like Master), just "Master-0"
                    const rewardId = `${rank.tier}-${rank.division || 0}`;

                    if (!claimedRewards.includes(rewardId)) {
                        rewardsToAward.push({
                            reward: rank.rankUpReward,
                            rank: rank,
                            id: rewardId
                        });
                    }
                }
            }
        }

        if (rewardsToAward.length === 0) return;

        // Award rewards
        let totalCoins = 0;
        let totalDiamonds = 0;
        const newClaimedIds: string[] = [];

        for (const item of rewardsToAward) {
            if (item.reward.type === 'coins') {
                totalCoins += item.reward.amount;
            } else if (item.reward.type === 'diamonds') {
                totalDiamonds += item.reward.amount;
            }
            newClaimedIds.push(item.id);
        }

        const updates: any = {
            $addToSet: { claimedRankRewards: { $each: newClaimedIds } }
        };

        if (totalCoins > 0) {
            updates.$inc = { walletBalance: totalCoins };
        }
        // If we had a diamondBalance field we would update it here too. Assuming only walletBalance (coins) for now based on user context.

        // Update User
        await User.findByIdAndUpdate(userId, updates);

        // Create Transactions
        if (totalCoins > 0) {
            await Transaction.create({
                user: userId,
                amount: totalCoins,
                type: 'rank_reward',
                description: `Rank Up Rewards (Found ${rewardsToAward.length} new rewards)`,
                status: 'approved'
            });
        }

        // Create Notification
        try {
            const title = "Rank Up Rewards!";
            let message = "Congratulations! You've received rewards for reaching new ranks.";
            if (totalCoins > 0) message += ` +${totalCoins} Coins.`;
            if (totalDiamonds > 0) message += ` +${totalDiamonds} Diamonds.`;

            await Notification.create({
                userId,
                title,
                message,
                type: 'success'
            });
        } catch (e) {
            console.log("Error creating notification", e);
        }

        return { success: true, awarded: rewardsToAward.length, coins: totalCoins };

    } catch (error) {
        console.error("Error processing rank rewards:", error);
        return { success: false, error };
    }
}
