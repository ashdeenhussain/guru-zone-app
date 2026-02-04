"use client";

import { Activity, Clock } from "lucide-react";
import { useEffect, useState } from "react";
import { formatDistanceToNow, differenceInSeconds } from "date-fns";

interface ActiveTournamentsCardProps {
    count: number;
    nextMatchTime?: string | Date;
}

export default function ActiveTournamentsCard({ count, nextMatchTime }: ActiveTournamentsCardProps) {
    const [timeLeft, setTimeLeft] = useState<string>("");

    useEffect(() => {
        if (!nextMatchTime) return;

        const targetTime = new Date(nextMatchTime).getTime();

        const updateTimer = () => {
            const now = new Date().getTime();
            const difference = targetTime - now;

            if (difference <= 0) {
                setTimeLeft("Starting soon...");
                return;
            }

            const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
            const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
            const seconds = Math.floor((difference % (1000 * 60)) / 1000);

            setTimeLeft(`${hours}h ${minutes}m ${seconds}s`);
        };

        updateTimer();
        const interval = setInterval(updateTimer, 1000);

        return () => clearInterval(interval);
    }, [nextMatchTime]);

    return (
        <div className="relative overflow-hidden glass-card p-4 rounded-2xl group transition-all duration-300 hover:border-blue-500/50 shadow-sm">
            <div className="absolute right-0 bottom-0 w-24 h-24 bg-blue-500/20 blur-[60px] rounded-full pointer-events-none" />

            <div className="flex justify-between items-start mb-4 relative z-10">
                <div className="p-2 bg-blue-500/10 text-blue-600 dark:text-blue-400 rounded-xl border border-blue-500/20 shadow-[0_0_15px_rgba(96,165,250,0.2)]">
                    <Activity size={20} />
                </div>
                <div className="p-1">
                    <Activity size={16} className="text-blue-500/50" />
                </div>
            </div>

            <p className="text-muted-foreground text-sm mb-1 relative z-10">Active Tournaments</p>

            <div className="flex items-end gap-2 relative z-10">
                <h3 className="text-2xl font-bold text-foreground drop-shadow-[0_0_10px_rgba(96,165,250,0.5)]">
                    {count}
                </h3>
                {nextMatchTime && (
                    <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg px-2 py-1 mb-1 flex items-center gap-1.5 animate-pulse">
                        <Clock size={12} className="text-blue-400" />
                        <span className="text-xs font-mono font-medium text-blue-300">
                            {timeLeft}
                        </span>
                    </div>
                )}
            </div>

            <p className="text-xs text-blue-400/60 mt-1 relative z-10">
                {nextMatchTime ? "Next match upcoming" : "No upcoming matches"}
            </p>
        </div>
    );
}
