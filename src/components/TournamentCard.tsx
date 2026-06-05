'use client';

import React, { useState, useEffect } from 'react';
import { Trophy, Swords, Target, Coins } from 'lucide-react';

interface Tournament {
    _id: string;
    title: string;
    format: string;
    gameType: string;
    entryFee: number;
    prizePool: number;
    prizeType?: 'TOP 3' | 'TOP 5' | 'TOP 10';
    prizeDistribution: {
        first: number;
        second: number;
        third: number;
        fourth?: number;
        fifth?: number;
        sixth?: number;
        seventh?: number;
        eighth?: number;
        ninth?: number;
        tenth?: number;
    };
    maxSlots: number;
    joinedCount: number;
    startTime: string; // Date string
    status: 'Open' | 'Live' | 'Completed';
    map: string;
    isOfficial?: boolean;
    isPerKill?: boolean;
    perKillAmount?: number;
    rules?: string;
}

const TournamentCard = ({ tournament }: { tournament: Tournament }) => {
    const [timeLeft, setTimeLeft] = useState<{
        days: number;
        hours: number;
        minutes: number;
        seconds: number;
    } | null>(null);

    useEffect(() => {
        const calculateTimeLeft = () => {
            const now = new Date().getTime();
            const start = new Date(tournament.startTime).getTime();
            const distance = start - now;

            if (distance < 0) {
                setTimeLeft(null);
            } else {
                setTimeLeft({
                    days: Math.floor(distance / (1000 * 60 * 60 * 24)),
                    hours: Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
                    minutes: Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60)),
                    seconds: Math.floor((distance % (1000 * 60)) / 1000),
                });
            }
        };

        calculateTimeLeft();
        const timer = setInterval(calculateTimeLeft, 1000);

        return () => clearInterval(timer);
    }, [tournament.startTime]);

    const progressPercent = Math.min((tournament.joinedCount / tournament.maxSlots) * 100, 100);
    const isFull = tournament.joinedCount >= tournament.maxSlots;

    // Determine status for "Join" button independently of timeLeft to avoid hydration mismatch potentially, 
    // but here we rely on timeLeft which is set in useEffect, so it's safe for client-side interaction.
    // If strict match is needed, we handle it. 

    const canJoin = tournament.status === 'Open' && timeLeft !== null && !isFull;
    const isCompleted = tournament.status === 'Completed';

    // Progress color logic
    let progressColor = 'bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]';
    if (progressPercent >= 90) progressColor = 'bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.5)]';
    else if (progressPercent >= 50) progressColor = 'bg-yellow-500 shadow-[0_0_10px_rgba(234,179,8,0.5)]';

    return (
        <div className={`bg-card backdrop-blur-xl border border-border rounded-2xl overflow-hidden transition-all duration-300 group relative flex flex-col h-full shadow-sm ${
            tournament.isPerKill 
                ? 'hover:border-emerald-500/30 hover:shadow-emerald-500/10' 
                : 'hover:border-primary/30 hover:shadow-primary/10'
        }`}>
            {/* Top Badge Section */}
            <div className="absolute top-3 right-3 z-10 flex gap-1 sm:gap-2 items-center">
                {tournament.isPerKill && (
                    <span className="px-1.5 sm:px-2 py-0.5 sm:py-1 rounded text-[10px] sm:text-xs font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 shadow-[0_0_10px_rgba(16,185,129,0.15)] flex items-center gap-0.5 sm:gap-1">
                        ⚔️ PER KILL
                    </span>
                )}
                <span className={`px-1.5 sm:px-2 py-0.5 sm:py-1 rounded text-[10px] sm:text-xs font-bold backdrop-blur-md shadow-sm ${tournament.status === 'Live' ? 'bg-red-600/90 animate-pulse text-white shadow-[0_0_10px_rgba(220,38,38,0.5)]' :
                    isCompleted ? 'bg-muted text-muted-foreground' :
                        'bg-emerald-600/90 text-white shadow-[0_0_10px_rgba(5,150,105,0.4)]'
                    }`}>
                    {tournament.status === 'Live' ? '🔴 LIVE' :
                        isCompleted ? 'COMPLETED' :
                            timeLeft ? 'OPEN' : 'REG CLOSED'}
                </span>
                <span className="bg-background/80 backdrop-blur-sm px-1.5 sm:px-2 py-0.5 sm:py-1 rounded text-[10px] sm:text-xs text-muted-foreground border border-border">
                    {tournament.gameType}
                </span>
            </div>

            {/* Content Container */}
            <div className="p-5 flex-1 flex flex-col relative">
                {/* Glow Effect */}
                <div className={`absolute top-10 -left-10 w-32 h-32 blur-[60px] rounded-full pointer-events-none transition-colors ${
                    tournament.isPerKill 
                        ? 'bg-emerald-500/10 group-hover:bg-emerald-500/20' 
                        : 'bg-purple-500/10 group-hover:bg-purple-500/20'
                }`} />

                <div className="flex justify-between items-start mb-4 relative z-10">
                    <div>
                        <h3 className={`text-xl font-bold text-foreground mb-1 transition-colors line-clamp-1 drop-shadow-sm ${
                            tournament.isPerKill ? 'pr-[175px] sm:pr-0' : 'pr-[115px] sm:pr-0'
                        } ${
                            tournament.isPerKill ? 'group-hover:text-emerald-400' : 'group-hover:text-primary'
                        }`}>
                            {tournament.title}
                        </h3>
                        <div className="flex gap-2 text-sm text-muted-foreground">
                            <span>{tournament.map}</span>
                            <span>•</span>
                            <span>{tournament.format}</span>
                        </div>
                    </div>
                </div>

                {tournament.isPerKill ? (
                    <div className="bg-emerald-500/10 border border-emerald-500/20 p-5 rounded-xl relative z-10 backdrop-blur-sm mb-5 shadow-[0_4px_20px_rgba(16,185,129,0.05)] overflow-hidden flex flex-col items-center justify-center text-center">
                        <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 rounded-bl-full blur-2xl pointer-events-none" />
                        
                        <span className="text-[10px] font-bold text-emerald-400/90 uppercase tracking-[0.2em] flex items-center gap-1.5 mb-1.5">
                            <Swords size={14} className="text-emerald-400" />
                            ELIMINATION REWARD
                        </span>
                        
                        <div className="text-3xl font-black text-amber-400 drop-shadow-[0_2px_10px_rgba(245,158,11,0.25)] font-mono flex items-center justify-center gap-1.5 my-1">
                            <Coins size={22} className="text-amber-400 animate-pulse" />
                            <span>{tournament.perKillAmount}</span>
                            <span className="text-xs font-bold uppercase opacity-80 tracking-wider">Coins / Kill</span>
                        </div>
                        
                        <p className="text-[11px] text-muted-foreground font-semibold mt-2.5 border-t border-emerald-500/10 pt-2.5 w-full text-center leading-relaxed">
                            Earn <span className="text-amber-400 font-bold">{tournament.perKillAmount} Coins</span> for every elimination you secure.
                        </p>
                    </div>
                ) : (
                    <>
                        <div className="flex justify-between items-center mb-4 border p-3 rounded-xl bg-muted/30 border-border relative z-10 backdrop-blur-sm">
                            <span className="text-sm text-muted-foreground flex items-center gap-2">
                                <Trophy size={16} className="text-primary" />
                                <span>Prize Pool</span>
                            </span>
                            <div className="text-xl font-bold text-primary relative group/prize cursor-help drop-shadow-[0_2px_4px_rgba(234,179,8,0.2)] font-mono">
                                {tournament.prizePool} Coins
                                {/* Tooltip */}
                                <div className="absolute right-0 top-full mt-2 w-48 p-3 bg-card backdrop-blur-xl border border-border rounded-xl hidden group-hover/prize:block z-20 shadow-2xl">
                                    <div className="text-xs text-muted-foreground space-y-1">
                                        <div className="flex justify-between border-b border-border pb-1 mb-1 font-semibold text-foreground"><span>Distribution</span></div>
                                        <div className="space-y-1 max-h-48 overflow-y-auto pr-1">
                                            {[
                                                { label: '🥇 1st', val: tournament.prizeDistribution.first, color: 'text-primary' },
                                                { label: '🥈 2nd', val: tournament.prizeDistribution.second, color: 'text-muted-foreground' },
                                                { label: '🥉 3rd', val: tournament.prizeDistribution.third, color: 'text-muted-foreground' },
                                                { label: '🎖️ 4th', val: tournament.prizeDistribution.fourth, color: 'text-muted-foreground' },
                                                { label: '🎖️ 5th', val: tournament.prizeDistribution.fifth, color: 'text-muted-foreground' },
                                                { label: '🎖️ 6th', val: tournament.prizeDistribution.sixth, color: 'text-muted-foreground' },
                                                { label: '🎖️ 7th', val: tournament.prizeDistribution.seventh, color: 'text-muted-foreground' },
                                                { label: '🎖️ 8th', val: tournament.prizeDistribution.eighth, color: 'text-muted-foreground' },
                                                { label: '🎖️ 9th', val: tournament.prizeDistribution.ninth, color: 'text-muted-foreground' },
                                                { label: '🎖️ 10th', val: tournament.prizeDistribution.tenth, color: 'text-muted-foreground' },
                                            ].filter(item => item.val !== undefined && item.val > 0).map((item, idx) => (
                                                <div key={idx} className="flex justify-between text-[10px]">
                                                    <span>{item.label}:</span>
                                                    <span className={item.color}>{item.val} Coins</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Prize Breakdown Section (Premium Tier Layouts) */}
                        <div className="mb-5 relative z-10">
                            <div className="flex items-center justify-between mb-3">
                                <div className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] flex items-center gap-2">
                                    <div className="h-[1px] w-4 bg-primary/30" />
                                    Prize Allocation
                                </div>
                                <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20">
                                    {tournament.prizeType || 'TOP 3'}
                                </span>
                            </div>

                            <div className={`grid gap-2 relative z-10 ${
                                (tournament.prizeType || 'TOP 3').toString().toUpperCase().trim() === 'TOP 3' ? 'grid-cols-3' : 
                                'grid-cols-3 sm:grid-cols-5'
                            }`}>
                                {[
                                    { label: 'Top 1', val: tournament.prizeDistribution.first, theme: 'gold' },
                                    { label: 'Top 2', val: tournament.prizeDistribution.second, theme: 'silver' },
                                    { label: 'Top 3', val: tournament.prizeDistribution.third, theme: 'bronze' },
                                    { label: 'Top 4', val: tournament.prizeDistribution.fourth, theme: 'default' },
                                    { label: 'Top 5', val: tournament.prizeDistribution.fifth, theme: 'default' },
                                    { label: 'Top 6', val: tournament.prizeDistribution.sixth, theme: 'default' },
                                    { label: 'Top 7', val: tournament.prizeDistribution.seventh, theme: 'default' },
                                    { label: 'Top 8', val: tournament.prizeDistribution.eighth, theme: 'default' },
                                    { label: 'Top 9', val: tournament.prizeDistribution.ninth, theme: 'default' },
                                    { label: 'Top 10', val: tournament.prizeDistribution.tenth, theme: 'default' },
                                ].filter((item, i) => {
                                    const pType = (tournament.prizeType || 'TOP 3').toString().toUpperCase().trim();
                                    if (pType === 'TOP 3') return i < 3;
                                    if (pType === 'TOP 5') return i < 5;
                                    return true;
                                }).map((item, idx) => {
                                    const isTop3 = idx < 3;
                                    const themes: Record<string, string> = {
                                        gold: 'border-amber-500/40 bg-gradient-to-br from-amber-500/30 via-yellow-500/10 to-transparent text-amber-700 dark:text-amber-300 shadow-[0_8px_30px_rgb(245,158,11,0.15)] ring-1 ring-amber-500/20',
                                        silver: 'border-indigo-400/40 bg-gradient-to-br from-indigo-500/20 via-slate-400/10 to-transparent text-indigo-700 dark:text-indigo-300 shadow-[0_8px_30px_rgb(99,102,241,0.1)] ring-1 ring-indigo-400/20',
                                        bronze: 'border-rose-400/40 bg-gradient-to-br from-rose-500/20 via-orange-500/10 to-transparent text-rose-700 dark:text-rose-300 shadow-[0_8px_30px_rgb(244,63,94,0.1)] ring-1 ring-rose-400/20',
                                        default: 'bg-emerald-500/5 border-emerald-500/20 text-emerald-700 dark:text-emerald-400/80 backdrop-blur-sm'
                                    };
                                    const themeStyles = themes[item.theme] || themes.default;

                                    return (
                                        <div 
                                            key={idx} 
                                            className={`relative flex flex-col items-center justify-center gap-1.5 rounded-xl border transition-all duration-300 hover:scale-[1.05] hover:z-10 ${themeStyles} ${isTop3 ? 'py-5 px-3 min-h-[90px] shadow-md border-[1.5px]' : 'py-2 px-1 min-h-[60px] opacity-80'}`}
                                        >
                                            {isTop3 && (
                                                <div className={`absolute -top-2 left-1/2 -translate-x-1/2 px-2.5 py-0.5 rounded-full text-[8px] font-black uppercase tracking-tighter ${
                                                    idx === 0 ? 'bg-yellow-500 text-white shadow-lg shadow-yellow-500/30' : 
                                                    idx === 1 ? 'bg-slate-400 text-white' : 
                                                    'bg-orange-500 text-white'
                                                }`}>
                                                    {idx === 0 ? 'WINNER' : idx === 1 ? 'ELITE' : 'PRO'}
                                                </div>
                                            )}
                                            <span className={`text-[9px] font-bold uppercase ${!isTop3 ? 'opacity-60' : 'opacity-80'}`}>{item.label}</span>
                                            <span className={`font-black ${isTop3 ? 'text-lg' : 'text-sm'} leading-tight`}>
                                                {item.val}
                                            </span>
                                            <span className={`text-[8px] font-bold opacity-40`}>
                                                ({Math.round(((item.val || 0) / tournament.prizePool) * 100)}%)
                                            </span>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </>
                )}

                {/* Timer Section */}
                {tournament.status === 'Open' && timeLeft && (
                    <div className="mb-4 bg-muted/40 p-3 rounded-xl border border-border flex justify-center gap-3 md:gap-4 backdrop-blur-sm shadow-inner relative z-10">
                        <div className="text-center"><div className="text-sm font-bold text-foreground font-mono">{String(timeLeft.days).padStart(2, '0')}</div><div className="text-[10px] text-muted-foreground uppercase">Days</div></div>
                        <div className="text-muted-foreground pt-1">:</div>
                        <div className="text-center"><div className="text-sm font-bold text-foreground font-mono">{String(timeLeft.hours).padStart(2, '0')}</div><div className="text-[10px] text-muted-foreground uppercase">Hrs</div></div>
                        <div className="text-muted-foreground pt-1">:</div>
                        <div className="text-center"><div className="text-sm font-bold text-foreground font-mono">{String(timeLeft.minutes).padStart(2, '0')}</div><div className="text-[10px] text-muted-foreground uppercase">Mins</div></div>
                        <div className="text-muted-foreground pt-1">:</div>
                        <div className="text-center"><div className="text-sm font-bold text-foreground font-mono">{String(timeLeft.seconds).padStart(2, '0')}</div><div className="text-[10px] text-muted-foreground uppercase">Sec</div></div>
                    </div>
                )}

                {/* Progress Bar */}
                <div className="mt-auto mb-5 relative z-10">
                    <div className="flex justify-between text-xs mb-1.5 font-medium">
                        <span className="text-muted-foreground">{tournament.joinedCount}/{tournament.maxSlots} Joined</span>
                        <span className={isFull ? 'text-red-500' : 'text-emerald-500'}>
                            {isFull ? 'FULL' : 'Filling Fast'}
                        </span>
                    </div>
                    <div className="h-2.5 bg-muted rounded-full overflow-hidden border border-border">
                        <div
                            className={`h-full transition-all duration-500 rounded-full ${progressColor}`}
                            style={{ width: `${progressPercent}%` }}
                        />
                    </div>
                </div>

                {/* Actions */}
                <div className="flex items-center justify-between gap-4 pt-4 border-t border-border relative z-10">
                    <div className="flex flex-col flex-shrink-0">
                        <span className="text-xs text-muted-foreground uppercase tracking-wider">Entry Fee</span>
                        <span className={`text-lg font-bold ${tournament.isPerKill ? 'text-emerald-400' : 'text-primary'}`}>
                            {tournament.entryFee === 0 ? 'FREE' : `${tournament.entryFee} Coins`}
                        </span>
                    </div>
                    <div
                        className={`px-6 py-3 rounded-xl font-bold transition-all w-full sm:w-auto text-center text-sm shadow-[0_0_20px_rgba(0,0,0,0.1)] flex items-center justify-center gap-2 ${canJoin
                            ? tournament.isPerKill
                                ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-600/20 active:scale-95 cursor-pointer'
                                : 'bg-primary text-primary-foreground hover:opacity-90 shadow-primary/20 active:scale-95 cursor-pointer'
                            : isCompleted
                                ? 'bg-yellow-500 text-yellow-950 hover:bg-yellow-400 shadow-yellow-500/20 active:scale-95 cursor-pointer'
                                : 'bg-muted text-muted-foreground cursor-not-allowed border border-border'
                            }`}
                    >
                        {isCompleted ? (
                            <>
                                <Trophy size={16} /> View Winners
                            </>
                        ) : !canJoin ? (
                            isFull ? 'Full' : 'Closed'
                        ) : (
                            'JOIN NOW'
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default TournamentCard;
