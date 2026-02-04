'use client';

import React, { useState, useEffect } from 'react';
import { Trophy } from 'lucide-react';

interface Tournament {
    _id: string;
    title: string;
    format: string;
    gameType: string;
    entryFee: number;
    prizePool: number;
    prizeDistribution: {
        first: number;
        second: number;
        third: number;
    };
    maxSlots: number;
    joinedCount: number;
    startTime: string; // Date string
    status: 'Open' | 'Live' | 'Completed';
    map: string;
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
        <div className="bg-card backdrop-blur-xl border border-border rounded-2xl overflow-hidden hover:border-primary/30 transition-all duration-300 group relative flex flex-col h-full shadow-sm hover:shadow-primary/10">
            {/* Top Badge Section */}
            <div className="absolute top-3 right-3 z-10 flex gap-2">
                <span className={`px-2 py-1 rounded text-xs font-bold backdrop-blur-md shadow-sm ${tournament.status === 'Live' ? 'bg-red-600/90 animate-pulse text-white shadow-[0_0_10px_rgba(220,38,38,0.5)]' :
                    isCompleted ? 'bg-muted text-muted-foreground' :
                        'bg-emerald-600/90 text-white shadow-[0_0_10px_rgba(5,150,105,0.4)]'
                    }`}>
                    {tournament.status === 'Live' ? '🔴 LIVE' :
                        isCompleted ? 'COMPLETED' :
                            timeLeft ? 'OPEN' : 'REG CLOSED'}
                </span>
                <span className="bg-background/80 backdrop-blur-sm px-2 py-1 rounded text-xs text-muted-foreground border border-border">
                    {tournament.gameType}
                </span>
            </div>

            {/* Content Container */}
            <div className="p-5 flex-1 flex flex-col relative">
                {/* Glow Effect */}
                <div className="absolute top-10 -left-10 w-32 h-32 bg-purple-500/10 blur-[60px] rounded-full pointer-events-none group-hover:bg-purple-500/20 transition-colors" />

                <div className="flex justify-between items-start mb-4 relative z-10">
                    <div>
                        <h3 className="text-xl font-bold text-foreground mb-1 group-hover:text-primary transition-colors line-clamp-1 drop-shadow-sm">
                            {tournament.title}
                        </h3>
                        <div className="flex gap-2 text-sm text-muted-foreground">
                            <span>{tournament.map}</span>
                            <span>•</span>
                            <span>{tournament.format}</span>
                        </div>
                    </div>
                </div>

                <div className="flex justify-between items-center mb-4 bg-muted/30 border border-border p-3 rounded-xl relative z-10 backdrop-blur-sm">
                    <span className="text-sm text-muted-foreground">Prize Pool</span>
                    <div className="text-xl font-bold text-primary relative group/prize cursor-help drop-shadow-[0_2px_4px_rgba(234,179,8,0.2)]">
                        PKR {tournament.prizePool}
                        {/* Tooltip */}
                        <div className="absolute right-0 top-full mt-2 w-48 p-3 bg-card backdrop-blur-xl border border-border rounded-xl hidden group-hover/prize:block z-20 shadow-2xl">
                            <div className="text-xs text-muted-foreground space-y-1">
                                <div className="flex justify-between border-b border-border pb-1 mb-1 font-semibold text-foreground"><span>Distribution</span></div>
                                <div className="flex justify-between"><span>🥇 1st:</span> <span className="text-primary">PKR {tournament.prizeDistribution.first}</span></div>
                                <div className="flex justify-between"><span>🥈 2nd:</span> <span className="text-muted-foreground">PKR {tournament.prizeDistribution.second}</span></div>
                                <div className="flex justify-between"><span>🥉 3rd:</span> <span className="text-muted-foreground">PKR {tournament.prizeDistribution.third}</span></div>
                            </div>
                        </div>
                    </div>
                </div>

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
                    <div className="flex flex-col">
                        <span className="text-xs text-muted-foreground uppercase tracking-wider">Entry Fee</span>
                        <span className="text-lg font-bold text-primary">
                            {tournament.entryFee === 0 ? 'FREE' : `PKR ${tournament.entryFee}`}
                        </span>
                    </div>
                    <div
                        className={`px-6 py-3 rounded-xl font-bold transition-all w-full sm:w-auto text-center text-sm shadow-[0_0_20px_rgba(0,0,0,0.1)] flex items-center justify-center gap-2 ${canJoin
                            ? 'bg-primary text-primary-foreground hover:opacity-90 shadow-primary/20 active:scale-95 cursor-pointer'
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
