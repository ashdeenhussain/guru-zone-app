"use client";

import { getRankFromPoints, formatRankName, RankInfo, RANK_THRESHOLDS } from '@/lib/ranks';
import RankBadge from './RankBadge';
import { motion, AnimatePresence } from 'framer-motion';
import { Info, X, ChevronRight, Target, Gift } from 'lucide-react';
import { useState } from 'react';

interface RankDisplayProps {
    points: number;
}

const RankDisplay: React.FC<RankDisplayProps> = ({ points }) => {
    const [showInfo, setShowInfo] = useState(false);
    const [expandedTier, setExpandedTier] = useState<string | null>(null);
    const currentRank = getRankFromPoints(points);
    const nextRankPoints = currentRank.nextRankPoints;
    const prevRankPoints = currentRank.minPoints;

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

    return (
        <>

            <div
                className="w-full bg-white dark:bg-gray-900/50 backdrop-blur-md border rounded-xl p-4 md:p-6 mb-6 overflow-hidden relative group transition-colors duration-500"
                style={{
                    borderColor: `${currentRank.color}40`,
                    // Use CSS variable workaround or simple logic if needed, but for now assuming direct style overrides work.
                    // Ideally we'd move this into valid Tailwind or conditional logic, but inline styles override classes.
                    // For light theme, we want a lighter tint.
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
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 dark:bg-black/80 backdrop-blur-sm" onClick={() => setShowInfo(false)}>
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            onClick={(e) => e.stopPropagation()}
                            className="bg-white border border-gray-200 w-full max-w-lg rounded-2xl overflow-hidden shadow-2xl max-h-[90vh] flex flex-col"
                        >
                            {/* Header */}
                            <div className="p-4 border-b border-gray-200 flex justify-between items-center bg-gray-50">
                                <h3 className="font-bold text-lg text-gray-900 flex items-center gap-2">
                                    <Target className="text-primary" size={20} />
                                    Rank Roadmap
                                </h3>
                                <button onClick={() => setShowInfo(false)} className="p-1 hover:bg-gray-100 rounded-lg transition-colors">
                                    <X size={20} className="text-gray-500" />
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
                                        <p className="text-sm text-gray-600 mb-1">Current Standing</p>
                                        <h4 className="text-xl font-bold text-gray-900 leading-none mb-1" style={{ textShadow: `0 0 10px ${currentRank.color}40` }}>{formatRankName(currentRank)}</h4>
                                        <p className="text-sm font-medium" style={{ color: currentRank.color }}>{points} Rank Points</p>
                                    </div>
                                </div>

                                {/* Next Rank Goal */}
                                {nextRankPoints ? (
                                    <div className="text-center p-4 bg-primary/10 rounded-xl border border-primary/20 relative overflow-hidden">
                                        <div className="relative z-10">
                                            <p className="text-sm text-gray-600 mb-2">Next Milestone</p>
                                            <div className="flex items-center justify-center gap-3 mb-2">
                                                <span className="text-2xl font-bold text-gray-900">{pointsNeeded}</span>
                                                <span className="text-sm text-gray-500">points needed for</span>
                                            </div>
                                            <div className="inline-flex items-center gap-2 bg-white/50 px-3 py-1 rounded-full border border-gray-200">
                                                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: currentRank.nextRankPoints ? RANK_THRESHOLDS.find(r => r.minPoints === currentRank.nextRankPoints)?.color : '#fff' }}></span>
                                                <span className="text-sm font-bold text-gray-900">
                                                    {currentRank.nextRankPoints
                                                        ? formatRankName(RANK_THRESHOLDS.find(r => r.minPoints === currentRank.nextRankPoints)!)
                                                        : 'Max Rank'}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="text-center p-6 bg-yellow-500/10 rounded-xl border border-yellow-500/20">
                                        <p className="text-yellow-400 font-bold text-lg">You are at the pinnacle!</p>
                                        <p className="text-sm text-gray-400">Grandmaster is the highest honor.</p>
                                    </div>
                                )}

                                {/* Rank List / Roadmap */}
                                <div>
                                    <h4 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-3">Progression Path</h4>
                                    <div className="space-y-2 relative">
                                        {/* Vertical Line */}
                                        <div className="absolute left-[19px] top-2 bottom-2 w-[2px] bg-gray-200"></div>

                                        {RANK_THRESHOLDS.filter(r => r.division === 1 || !r.division).map((rank, idx, allMajorTiers) => {
                                            const isCurrentTier = currentRank.tier === rank.tier;
                                            const isPassed = points >= rank.minPoints;
                                            const isExpanded = expandedTier === rank.tier;

                                            // Get all sub-tiers (divisions) for this rank tier
                                            const subTiers = RANK_THRESHOLDS.filter(r => r.tier === rank.tier);

                                            // Check if there is a major reward for reaching the NEXT tier (which means completing this one)
                                            // The reward is technically attached to the *next* tier's entry.
                                            const nextMajorTier = allMajorTiers[idx + 1];
                                            const completionReward = rank.tierCompletionReward || nextMajorTier?.rankUpReward;

                                            // Also show the reward attached to THIS tier (for simply reaching it) - existing logic
                                            const tierReward = rank.rankUpReward;

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
                                                                borderColor: isPassed ? rank.color : '#e5e7eb', // gray-200 for light
                                                                backgroundColor: '#f3f4f6' // gray-100 for light
                                                            }}
                                                        >
                                                            {isPassed ? (
                                                                <div className="w-3 h-3 rounded-full shadow-[0_0_10px]" style={{ backgroundColor: rank.color, boxShadow: `0 0 10px ${rank.color}` }}></div>
                                                            ) : (
                                                                <div className="w-2 h-2 bg-gray-300 rounded-full"></div>
                                                            )}
                                                        </div>
                                                        <div className="flex-1">
                                                            <div className="flex justify-between items-center">
                                                                <h5 className={`font-bold ${isPassed ? 'text-gray-900' : 'text-gray-400'}`}>{rank.tier}</h5>
                                                                {/* Show Completion Reward Icon (Target Prize for this rank) */}
                                                                {completionReward && (
                                                                    <div className="flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-yellow-500/10 border border-yellow-500/20 text-yellow-600">
                                                                        <Gift size={10} />
                                                                        <span>{completionReward.amount}</span>
                                                                    </div>
                                                                )}
                                                                <ChevronRight size={16} className={`transition-transform duration-300 ml-auto ${isExpanded ? 'rotate-90 text-gray-900' : 'text-gray-400'}`} />
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
                                                                    {subTiers.map((sub, sIdx) => (
                                                                        <div key={sIdx} className="flex justify-between items-center text-xs py-1 border-b border-gray-100 last:border-0">
                                                                            <div>
                                                                                <span className="text-gray-500 block">
                                                                                    {sub.division ? `${sub.tier} ${["", "I", "II", "III", "IV"][sub.division]}` : sub.tier}
                                                                                </span>
                                                                                <span className={`${points >= sub.minPoints ? 'text-primary' : 'text-gray-400'}`}>
                                                                                    {sub.minPoints} pts
                                                                                </span>
                                                                            </div>
                                                                            {sub.rankUpReward && (
                                                                                <div className="flex items-center gap-1 text-gray-400">
                                                                                    <Gift size={12} className="text-yellow-500" />
                                                                                    <span>{sub.rankUpReward.amount}</span>
                                                                                </div>
                                                                            )}
                                                                        </div>
                                                                    ))
                                                                    }

                                                                    {/* Completion Reward Details */}
                                                                    {completionReward && (
                                                                        <div className="mt-2 pt-2 border-t border-dashed border-gray-700">
                                                                            <div className="flex justify-between items-center bg-yellow-500/5 p-2 rounded border border-yellow-500/10">
                                                                                <span className="text-[10px] text-yellow-200 uppercase tracking-wider font-semibold">
                                                                                    Rank Completion Prize
                                                                                </span>
                                                                                <div className="flex items-center gap-1.5 text-yellow-400 font-bold text-xs">
                                                                                    <Gift size={14} />
                                                                                    <span>{completionReward.amount} Coins</span>
                                                                                </div>
                                                                            </div>
                                                                        </div>
                                                                    )}

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
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </>
    );
};

export default RankDisplay;
