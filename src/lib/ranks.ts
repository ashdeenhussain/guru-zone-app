export type RankTier =
    | 'Bronze'
    | 'Silver'
    | 'Gold'
    | 'Platinum'
    | 'Diamond'
    | 'Heroic'
    | 'Master'
    | 'Elite Master'
    | 'Grandmaster';

export interface RankInfo {
    tier: RankTier;
    division: number | null; // I, II, III, IV -> 1, 2, 3, 4. null for top tiers without divisions
    minPoints: number;
    nextRankPoints: number | null; // null for max rank
    color: string; // Hex color for the rank
    rankUpReward?: {
        type: 'coins' | 'diamonds';
        amount: number;
    };
    tierCompletionReward?: { // Explicit reward for completing this tier (overrides next rank check)
        type: 'coins' | 'diamonds';
        amount: number;
    };
}

// Points required to REACH the rank
export const RANK_THRESHOLDS: RankInfo[] = [
    // Bronze (3 sub-tiers) - 100 pts each
    { tier: 'Bronze', division: 1, minPoints: 0, nextRankPoints: 100, color: '#CD7F32' },
    { tier: 'Bronze', division: 2, minPoints: 100, nextRankPoints: 200, color: '#CD7F32' },
    { tier: 'Bronze', division: 3, minPoints: 200, nextRankPoints: 300, color: '#CD7F32' },

    // Silver (3 sub-tiers) - 100 pts each
    { tier: 'Silver', division: 1, minPoints: 300, nextRankPoints: 400, color: '#C0C0C0', rankUpReward: { type: 'coins', amount: 100 } }, // Rank up to Silver (Bronze Completed)
    { tier: 'Silver', division: 2, minPoints: 400, nextRankPoints: 500, color: '#C0C0C0' },
    { tier: 'Silver', division: 3, minPoints: 500, nextRankPoints: 600, color: '#C0C0C0' },

    // Gold (4 sub-tiers) - 100 pts each
    { tier: 'Gold', division: 1, minPoints: 600, nextRankPoints: 700, color: '#FFD700', rankUpReward: { type: 'coins', amount: 200 } }, // Rank up to Gold
    { tier: 'Gold', division: 2, minPoints: 700, nextRankPoints: 800, color: '#FFD700' },
    { tier: 'Gold', division: 3, minPoints: 800, nextRankPoints: 900, color: '#FFD700' },
    { tier: 'Gold', division: 4, minPoints: 900, nextRankPoints: 1000, color: '#FFD700' },

    // Platinum (4 sub-tiers) - 150 pts each
    { tier: 'Platinum', division: 1, minPoints: 1000, nextRankPoints: 1150, color: '#00CED1', rankUpReward: { type: 'coins', amount: 300 } }, // Rank up to Platinum
    { tier: 'Platinum', division: 2, minPoints: 1150, nextRankPoints: 1300, color: '#00CED1' },
    { tier: 'Platinum', division: 3, minPoints: 1300, nextRankPoints: 1450, color: '#00CED1' },
    { tier: 'Platinum', division: 4, minPoints: 1450, nextRankPoints: 1600, color: '#00CED1' },

    // Diamond (4 sub-tiers) - 200 pts each
    { tier: 'Diamond', division: 1, minPoints: 1600, nextRankPoints: 1800, color: '#B9F2FF', rankUpReward: { type: 'coins', amount: 400 } }, // Rank up to Diamond
    { tier: 'Diamond', division: 2, minPoints: 1800, nextRankPoints: 2000, color: '#B9F2FF' },
    { tier: 'Diamond', division: 3, minPoints: 2000, nextRankPoints: 2200, color: '#B9F2FF' },
    { tier: 'Diamond', division: 4, minPoints: 2200, nextRankPoints: 2400, color: '#B9F2FF' },

    // High Tiers
    { tier: 'Heroic', division: null, minPoints: 2400, nextRankPoints: 3200, color: '#FF4500', rankUpReward: { type: 'coins', amount: 500 } },
    { tier: 'Master', division: null, minPoints: 3200, nextRankPoints: 6000, color: '#800080', rankUpReward: { type: 'coins', amount: 600 } },
    { tier: 'Elite Master', division: null, minPoints: 6000, nextRankPoints: 12000, color: '#FF1493', rankUpReward: { type: 'coins', amount: 700 } },
    { tier: 'Grandmaster', division: null, minPoints: 12000, nextRankPoints: null, color: '#FF0000', rankUpReward: { type: 'coins', amount: 800 }, tierCompletionReward: { type: 'coins', amount: 900 } },
];

export const getRankFromPoints = (points: number): RankInfo => {
    // Find the highest rank threshold that the points meet
    // ranks are sorted by minPoints ascending by default in the definition
    // We reverse iterate or findLast (but findLast might need polyfill depending on env, so lets just filter and pop)

    const reachedRanks = RANK_THRESHOLDS.filter(r => points >= r.minPoints);
    if (reachedRanks.length === 0) return RANK_THRESHOLDS[0];

    return reachedRanks[reachedRanks.length - 1];
};

export const getNextRank = (currentRank: RankInfo): RankInfo | null => {
    const currentIndex = RANK_THRESHOLDS.findIndex(r => r === currentRank);
    if (currentIndex === -1 || currentIndex === RANK_THRESHOLDS.length - 1) return null;
    return RANK_THRESHOLDS[currentIndex + 1];
}

export const formatRankName = (rank: RankInfo) => {
    if (rank.division) {
        // Convert 1,2,3,4 to Roman numerals
        const roman = ["", "I", "II", "III", "IV"][rank.division];
        return `${rank.tier} ${roman}`;
    }
    return rank.tier;
};
