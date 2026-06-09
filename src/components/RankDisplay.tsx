"use client";

import { getRankFromPoints, formatRankName, RankInfo, RANK_THRESHOLDS } from '@/lib/ranks';
import RankBadge from './RankBadge';
import { motion, AnimatePresence } from 'framer-motion';
import { Info, X, ChevronRight, Target, Gift, Trophy } from 'lucide-react';
import { useState, useEffect } from 'react';

interface RankDisplayProps {
    points: number;
    initialClaimedRewards?: string[];
    initialWalletBalance?: number;
}

const RankDisplay: React.FC<RankDisplayProps> = ({ points, initialClaimedRewards = [], initialWalletBalance = 0 }) => {
    const [showInfo, setShowInfo] = useState(false);
    const [expandedTier, setExpandedTier] = useState<string | null>(null);
    const [claimedRewards, setClaimedRewards] = useState<string[]>(initialClaimedRewards);
    const [walletBalance, setWalletBalance] = useState<number>(initialWalletBalance);
    const [rankRewardsDb, setRankRewardsDb] = useState<Record<string, number>>({});
    const [claimingKey, setClaimingKey] = useState<string | null>(null);
    const [congratsReward, setCongratsReward] = useState<{ key: string, amount: number } | null>(null);
    const [seasonInfo, setSeasonInfo] = useState<{
        currentSeasonName: string;
        startDate: string;
        endDate: string;
        remainingDays: number;
    } | null>(null);

    const currentRank = getRankFromPoints(points);
    const nextRankPoints = currentRank.nextRankPoints;
    const prevRankPoints = currentRank.minPoints;

    // Fetch dynamic database settings for rank rewards
    useEffect(() => {
        const fetchSettings = async () => {
            try {
                const res = await fetch('/api/admin/settings');
                if (res.ok) {
                    const data = await res.json();
                    if (data.rankRewards) {
                        setRankRewardsDb(data.rankRewards);
                    }
                    if (data.rankSeason) {
                        const s = data.rankSeason;
                        const start = s.startDate ? new Date(s.startDate) : new Date();
                        const end = s.endDate ? new Date(s.endDate) : new Date();
                        const today = new Date();
                        const diffTime = end.getTime() - today.getTime();
                        const remaining = Math.max(0, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));
                        setSeasonInfo({
                            currentSeasonName: s.currentSeasonName || 'Season 1',
                            startDate: start.toLocaleDateString(),
                            endDate: end.toLocaleDateString(),
                            remainingDays: remaining
                        });
                    }
                }
            } catch (err) {
                console.error("Error fetching system settings for ranks:", err);
            }
        };
        fetchSettings();
    }, []);

    // Sync initial state updates
    useEffect(() => {
        setClaimedRewards(initialClaimedRewards);
    }, [initialClaimedRewards]);

    useEffect(() => {
        setWalletBalance(initialWalletBalance);
    }, [initialWalletBalance]);

    // Calculate progress percentage
    let progress = 0;
    let pointsNeeded = 0;

    if (nextRankPoints) {
        const totalRange = nextRankPoints - prevRankPoints;
        const currentProgress = points - prevRankPoints;
        progress = Math.min(100, Math.max(0, (currentProgress / totalRange) * 100));
        pointsNeeded = nextRankPoints - points;
    } else {
        progress = 100; // Max rank
    }

    const getRewardCoins = (rank: RankInfo) => {
        const key = `${rank.tier}-${rank.division || 0}`;
        if (rankRewardsDb[key] !== undefined) {
            return rankRewardsDb[key];
        }
        return rank.rankUpReward?.amount || 0;
    };

    // Calculate if the user has any reached, unclaimed rewards
    const unclaimedRewardsList = RANK_THRESHOLDS.filter(rank => {
        if (!rank.rankUpReward) return false;
        const key = `${rank.tier}-${rank.division || 0}`;
        const coins = getRewardCoins(rank);
        return points >= rank.minPoints && coins > 0 && !claimedRewards.includes(key);
    });

    const hasUnclaimedRewards = unclaimedRewardsList.length > 0;

    const handleClaimReward = async (rewardKey: string) => {
        if (claimingKey) return;
        setClaimingKey(rewardKey);
        try {
            const res = await fetch('/api/ranks/claim', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ rewardId: rewardKey })
            });
            const data = await res.json();
            if (res.ok && data.success) {
                setClaimedRewards(prev => [...prev, rewardKey]);
                setWalletBalance(prev => prev + data.coinsAwarded);
                setCongratsReward({ key: rewardKey, amount: data.coinsAwarded });
            } else {
                alert(data.error || 'Failed to claim reward');
            }
        } catch (err) {
            console.error("Error claiming reward:", err);
            alert('Connection error. Please try again.');
        } finally {
            setClaimingKey(null);
        }
    };

    return (
        <>
            <div
                className="w-full bg-white dark:bg-gray-900/50 backdrop-blur-md border rounded-xl p-4 md:p-6 mb-6 overflow-hidden relative group transition-colors duration-500"
                style={{
                    borderColor: `${currentRank.color}40`,
                    background: `linear-gradient(145deg, ${currentRank.color}10, rgba(255, 255, 255, 0.6))`,
                    boxShadow: `0 4px 20px -5px ${currentRank.color}20`
                }}
            >
                {/* Background decoration */}
                <div
                    className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-transparent to-white/5 rounded-full -translate-y-1/2 translate-x-1/2 blur-2xl group-hover:bg-white/10 transition-colors duration-500"
                    style={{ '--tw-gradient-to': `${currentRank.color}40` } as React.CSSProperties}
                />

                <div className="flex items-center gap-4 relative z-10 text-gray-900 dark:text-white">
                    <div className="flex-shrink-0">
                        <RankBadge rank={currentRank} size="lg" />
                    </div>

                    <div className="flex-grow min-w-0">
                        <div className="flex items-end justify-between mb-1">
                            <div>
                                <h3 className="text-xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-gray-900 to-gray-600 dark:from-white dark:to-gray-400">
                                    {formatRankName(currentRank)}
                                </h3>
                                <p className="text-xs text-gray-600 dark:text-gray-400">
                                    {points} Rank Points
                                </p>
                            </div>
                            {nextRankPoints && (
                                <div className="text-right">
                                    <span className="text-xs font-medium text-gray-600 dark:text-gray-300">
                                        {pointsNeeded} pts to next rank
                                    </span>
                                </div>
                            )}
                        </div>

                        {/* Progress Bar Container */}
                        <div className="h-3 w-full bg-gray-200 dark:bg-gray-800 rounded-full overflow-hidden relative border border-gray-300 dark:border-gray-700/50">
                            {/* Animated Progress Bar */}
                            <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: `${progress}%` }}
                                transition={{ duration: 1.5, ease: "easeOut" }}
                                className="h-full rounded-full relative"
                                style={{ backgroundColor: currentRank.color }}
                            >
                                {/* Shine effect on bar */}
                                <div className="absolute top-0 left-0 right-0 h-[1px] bg-white/30" />
                                <div className="absolute bottom-0 left-0 right-0 h-[1px] bg-black/10" />

                                {/* Moving shimmer */}
                                <div className="absolute top-0 bottom-0 w-full animate-[shimmer_2s_infinite] bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full" />
                            </motion.div>
                        </div>

                        <div className="flex justify-between mt-1 text-[10px] text-gray-500 font-mono">
                            <span>{currentRank.minPoints}</span>
                            <span>{nextRankPoints || 'MAX'}</span>
                        </div>
                    </div>
                </div>

                {/* Season Info Footer */}
                {seasonInfo && (
                    <div className="mt-4 pt-3 border-t border-gray-200/50 dark:border-gray-800/40 relative z-10 flex flex-wrap items-center justify-between gap-2 text-xs text-gray-500 dark:text-gray-400">
                        <span className="font-bold text-gray-700 dark:text-gray-300">
                            {seasonInfo.currentSeasonName}
                        </span>
                        <div className="flex items-center gap-3">
                            <span>Started: <strong className="font-mono text-gray-700 dark:text-gray-300">{seasonInfo.startDate}</strong></span>
                            <span>Ends: <strong className="font-mono text-gray-700 dark:text-gray-300">{seasonInfo.endDate}</strong></span>
                            {seasonInfo.remainingDays > 0 ? (
                                <span className="bg-purple-500/10 dark:bg-purple-500/20 text-purple-600 dark:text-purple-400 font-bold px-2 py-0.5 rounded-full text-[10px]">
                                    {seasonInfo.remainingDays} days left
                                </span>
                            ) : (
                                <span className="bg-red-500/10 dark:bg-red-500/20 text-red-600 dark:text-red-400 font-bold px-2 py-0.5 rounded-full text-[10px]">
                                    Ended
                                </span>
                            )}
                        </div>
                    </div>
                )}

                {/* Claim Gift Button */}
                {hasUnclaimedRewards && (
                    <motion.button
                        onClick={() => setShowInfo(true)}
                        animate={{ y: [0, -6, 0] }}
                        transition={{ repeat: Infinity, duration: 1.5, ease: "easeInOut" }}
                        className="absolute top-2 right-12 p-2 bg-yellow-500 hover:bg-yellow-400 text-yellow-950 rounded-full transition-all z-20 shadow-[0_0_15px_rgba(234,179,8,0.5)] border border-yellow-300 animate-pulse flex items-center justify-center"
                        title="Claim rewards!"
                    >
                        <Gift size={18} />
                        <span className="absolute -top-1 -right-1 w-4.5 h-4.5 bg-red-500 rounded-full flex items-center justify-center text-[8px] text-white font-bold font-mono border-2 border-white dark:border-gray-900 shadow">
                            {unclaimedRewardsList.length}
                        </span>
                    </motion.button>
                )}

                {/* Info Button */}
                <button
                    onClick={() => setShowInfo(true)}
                    className="absolute top-2 right-2 p-2 text-gray-400 hover:text-gray-900 dark:hover:text-white bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10 rounded-full transition-colors z-20"
                >
                    <Info size={18} />
                </button>
            </div>

            {/* Rank Details Modal */}
            <AnimatePresence>
                {showInfo && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 dark:bg-black/85 backdrop-blur-sm" onClick={() => setShowInfo(false)}>
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            onClick={(e) => e.stopPropagation()}
                            className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 w-full max-w-lg rounded-2xl overflow-hidden shadow-2xl max-h-[90vh] flex flex-col text-gray-900 dark:text-white relative"
                        >
                            {/* Congratulations Overlay */}
                            <AnimatePresence>
                                {congratsReward && (
                                    <motion.div
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        exit={{ opacity: 0 }}
                                        className="absolute inset-0 z-30 bg-black/90 flex flex-col items-center justify-center p-6 text-center"
                                    >
                                        <motion.div
                                            initial={{ scale: 0.8, y: 20 }}
                                            animate={{ scale: 1, y: 0 }}
                                            exit={{ scale: 0.8, y: 20 }}
                                            className="space-y-6"
                                        >
                                            <div className="w-20 h-20 bg-yellow-500/20 text-yellow-500 rounded-full flex items-center justify-center mx-auto border border-yellow-500/30 shadow-[0_0_30px_rgba(234,179,8,0.3)]">
                                                <Trophy size={40} className="animate-bounce" />
                                            </div>
                                            <div className="space-y-2">
                                                <h4 className="text-2xl font-black text-white italic tracking-tight uppercase">Rank Reward Claimed!</h4>
                                                <p className="text-sm text-gray-400 max-w-xs mx-auto">
                                                    Congratulations! Your reward coins have been credited to your wallet balance.
                                                </p>
                                            </div>
                                            <div className="inline-block px-6 py-4 bg-yellow-500 text-yellow-950 font-black text-3xl rounded-2xl shadow-xl shadow-yellow-500/10">
                                                +{congratsReward.amount} <span className="text-sm font-bold">Coins</span>
                                            </div>
                                            <div>
                                                <button
                                                    onClick={() => setCongratsReward(null)}
                                                    className="px-8 py-3 bg-white text-black hover:bg-gray-100 font-bold rounded-xl text-sm transition-all"
                                                >
                                                    Awesome!
                                                </button>
                                            </div>
                                        </motion.div>
                                    </motion.div>
                                )}
                            </AnimatePresence>

                            {/* Header */}
                            <div className="p-4 border-b border-gray-200 dark:border-gray-800 flex justify-between items-center bg-gray-50 dark:bg-gray-950/50">
                                <h3 className="font-bold text-lg text-gray-900 dark:text-white flex items-center gap-2">
                                    <Target className="text-primary" size={20} />
                                    Rank Roadmap
                                </h3>
                                <button onClick={() => setShowInfo(false)} className="p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors">
                                    <X size={20} className="text-gray-500 dark:text-gray-400" />
                                </button>
                            </div>

                            {/* Content */}
                            <div className="p-6 overflow-y-auto space-y-6">

                                {/* Current Status Card */}
                                <div
                                    className="rounded-xl p-4 border flex items-center gap-4 transition-colors duration-500"
                                    style={{
                                        backgroundColor: `${currentRank.color}10`,
                                        borderColor: `${currentRank.color}30`
                                    }}
                                >
                                    <RankBadge rank={currentRank} size="md" />
                                    <div className="flex-1">
                                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Current Standing</p>
                                        <h4 className="text-xl font-bold text-gray-950 dark:text-white leading-none mb-1" style={{ textShadow: `0 0 10px ${currentRank.color}40` }}>{formatRankName(currentRank)}</h4>
                                        <p className="text-sm font-medium" style={{ color: currentRank.color }}>{points} Rank Points</p>
                                    </div>
                                </div>

                                {/* Next Rank Goal */}
                                {nextRankPoints ? (
                                    <div className="text-center p-4 bg-primary/10 rounded-xl border border-primary/20 relative overflow-hidden">
                                        <div className="relative z-10">
                                            <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">Next Milestone</p>
                                            <div className="flex items-center justify-center gap-3 mb-2">
                                                <span className="text-2xl font-bold text-gray-950 dark:text-white">{pointsNeeded}</span>
                                                <span className="text-sm text-gray-500 dark:text-gray-400">points needed for</span>
                                            </div>
                                            <div className="inline-flex items-center gap-2 bg-white/50 dark:bg-gray-900/50 px-3 py-1 rounded-full border border-gray-200 dark:border-gray-800">
                                                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: currentRank.nextRankPoints ? RANK_THRESHOLDS.find(r => r.minPoints === currentRank.nextRankPoints)?.color : '#fff' }}></span>
                                                <span className="text-sm font-bold text-gray-900 dark:text-white">
                                                    {currentRank.nextRankPoints
                                                        ? formatRankName(RANK_THRESHOLDS.find(r => r.minPoints === currentRank.nextRankPoints)!)
                                                        : 'Max Rank'}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="text-center p-6 bg-yellow-500/10 rounded-xl border border-yellow-500/20">
                                        <p className="text-yellow-500 font-bold text-lg">You are at the pinnacle!</p>
                                        <p className="text-sm text-gray-400">Grandmaster is the highest honor.</p>
                                    </div>
                                )}

                                {/* Rank List / Roadmap */}
                                <div>
                                    <h4 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-3">Progression Path</h4>
                                    <div className="space-y-2 relative">
                                        {/* Vertical Line */}
                                        <div className="absolute left-[19px] top-2 bottom-2 w-[2px] bg-gray-200 dark:bg-gray-800"></div>

                                        {RANK_THRESHOLDS.filter(r => r.division === 1 || !r.division).map((rank, idx, allMajorTiers) => {
                                            const isCurrentTier = currentRank.tier === rank.tier;
                                            const isPassed = points >= rank.minPoints;
                                            const isExpanded = expandedTier === rank.tier;

                                            // Get all sub-tiers (divisions) for this rank tier
                                            const subTiers = RANK_THRESHOLDS.filter(r => r.tier === rank.tier);

                                            return (
                                                <div key={idx} className="relative z-10">
                                                    <div
                                                        onClick={() => setExpandedTier(isExpanded ? null : rank.tier)}
                                                        className={`relative flex items-center gap-3 p-2 rounded-lg transition-all cursor-pointer border`}
                                                        style={{
                                                            borderColor: isExpanded ? rank.color : (isCurrentTier ? `${rank.color}40` : 'transparent'),
                                                            backgroundColor: isExpanded ? `${rank.color}10` : (isCurrentTier ? `${rank.color}05` : 'transparent')
                                                        }}
                                                    >
                                                        <div
                                                            className={`w-10 h-10 rounded-full flex items-center justify-center relative z-10 border-2 shrink-0`}
                                                            style={{
                                                                borderColor: isPassed ? rank.color : '#e5e7eb',
                                                                backgroundColor: '#f3f4f6'
                                                            }}
                                                        >
                                                            {isPassed ? (
                                                                <div className="w-3 h-3 rounded-full shadow-[0_0_10px]" style={{ backgroundColor: rank.color, boxShadow: `0 0 10px ${rank.color}` }}></div>
                                                            ) : (
                                                                <div className="w-2 h-2 bg-gray-300 dark:bg-gray-700 rounded-full"></div>
                                                            )}
                                                        </div>
                                                        <div className="flex-1">
                                                            <div className="flex justify-between items-center">
                                                                <h5 className={`font-bold ${isPassed ? 'text-gray-900 dark:text-white' : 'text-gray-400 dark:text-gray-600'}`}>{rank.tier}</h5>
                                                                <ChevronRight size={16} className={`transition-transform duration-300 ml-auto ${isExpanded ? 'rotate-90 text-gray-900 dark:text-white' : 'text-gray-400 dark:text-gray-600'}`} />
                                                            </div>
                                                            <p className="text-xs text-gray-500">Starts at {rank.minPoints} pts</p>
                                                        </div>
                                                    </div>

                                                    {/* Expanded Details (Sub-tiers) */}
                                                    <AnimatePresence>
                                                        {isExpanded && (
                                                            <motion.div
                                                                initial={{ height: 0, opacity: 0 }}
                                                                animate={{ height: 'auto', opacity: 1 }}
                                                                exit={{ height: 0, opacity: 0 }}
                                                                className="overflow-hidden pl-14 pr-2"
                                                            >
                                                                <div className="py-2 space-y-2">
                                                                    {subTiers.map((sub, sIdx) => {
                                                                        const subKey = `${sub.tier}-${sub.division || 0}`;
                                                                        const hasReward = !!sub.rankUpReward;
                                                                        const coins = getRewardCoins(sub);

                                                                        return (
                                                                            <div key={sIdx} className="flex justify-between items-center text-xs py-2 border-b border-gray-100 dark:border-gray-800 last:border-0">
                                                                                <div>
                                                                                    <span className="text-gray-700 dark:text-gray-300 block">
                                                                                        {sub.division ? `${sub.tier} ${["", "I", "II", "III", "IV"][sub.division]}` : sub.tier}
                                                                                    </span>
                                                                                    <span className={`${points >= sub.minPoints ? 'text-primary' : 'text-gray-400 dark:text-gray-600'}`}>
                                                                                        {sub.minPoints} pts
                                                                                    </span>
                                                                                </div>
                                                                                
                                                                                {/* Custom Claim Logic */}
                                                                                {hasReward && (
                                                                                    <div className="flex items-center gap-2">
                                                                                        {(() => {
                                                                                            const isReached = points >= sub.minPoints;
                                                                                            const isClaimed = claimedRewards.includes(subKey);

                                                                                            if (isClaimed) {
                                                                                                return (
                                                                                                    <span className="text-[10px] font-bold text-green-500 bg-green-500/10 px-2.5 py-1 rounded border border-green-500/20">
                                                                                                        Claimed
                                                                                                    </span>
                                                                                                );
                                                                                            } else if (isReached && coins > 0) {
                                                                                                return (
                                                                                                    <button
                                                                                                        onClick={(e) => {
                                                                                                            e.stopPropagation();
                                                                                                            handleClaimReward(subKey);
                                                                                                        }}
                                                                                                        disabled={claimingKey === subKey}
                                                                                                        className="text-[10px] font-black uppercase text-white bg-gradient-to-r from-yellow-500 to-amber-600 hover:from-yellow-400 hover:to-amber-500 px-3 py-1.5 rounded-lg border border-yellow-300 hover:shadow-[0_0_12px_rgba(234,179,8,0.5)] transition-all animate-pulse disabled:opacity-50"
                                                                                                    >
                                                                                                        Claim {coins}
                                                                                                    </button>
                                                                                                );
                                                                                            } else {
                                                                                                return (
                                                                                                    <div className="flex items-center gap-1.5 text-gray-400 dark:text-gray-600 font-bold">
                                                                                                        <Gift size={12} className="text-yellow-500" />
                                                                                                        <span>{coins}</span>
                                                                                                    </div>
                                                                                                );
                                                                                            }
                                                                                        })()}
                                                                                    </div>
                                                                                )}
                                                                            </div>
                                                                        );
                                                                    })}
                                                                </div>
                                                            </motion.div>
                                                        )}
                                                    </AnimatePresence>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>

                            </div>

                            {/* Footer Wallet Balance */}
                            <div className="p-4 bg-gray-50 dark:bg-gray-950/50 border-t border-gray-200 dark:border-gray-800 flex justify-between items-center text-sm">
                                <span className="font-medium text-gray-600 dark:text-gray-400">Your Wallet Balance</span>
                                <span className="font-bold text-gray-900 dark:text-white flex items-center gap-1.5 bg-yellow-500/10 dark:bg-yellow-500/5 px-3 py-1 rounded-full border border-yellow-500/20 text-yellow-600 dark:text-yellow-400">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-coins"><circle cx="8" cy="8" r="6"/><circle cx="18" cy="18" r="4"/><path d="M12 18a6 6 0 0 0-6-6"/><path d="M20 10a8 8 0 0 0-8-8"/></svg>
                                    {walletBalance} Coins
                                </span>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </>
    );
};

export default RankDisplay;
