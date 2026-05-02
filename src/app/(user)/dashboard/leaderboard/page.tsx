
'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Crown, Trophy, Medal, Shield, TrendingUp, Users } from 'lucide-react';
import Image from 'next/image';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { AVATARS } from '@/lib/avatars';
import PageHeader from "@/components/PageHeader";

// Helper for tailwind class merging
function cn(...inputs: (string | undefined | null | false)[]) {
    return twMerge(clsx(inputs));
}

interface LeaderboardUser {
    id: string;
    name: string;
    avatar: string | null;
    avatarId?: number; // Added optional avatarId
    totalWins: number;
    netEarnings: number;
    tournamentsPlayed: number;
    trustScore?: number;
    rank?: number;
}

interface LeaderboardResponse {
    leaderboard: LeaderboardUser[];
    currentUser: LeaderboardUser & { rank: number } | null;
}

export default function LeaderboardPage() {
    const [activeTab, setActiveTab] = useState<'official' | 'battlezone'>('official');
    const [leaderboard, setLeaderboard] = useState<LeaderboardUser[]>([]);
    const [currentUser, setCurrentUser] = useState<(LeaderboardUser & { rank: number }) | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchLeaderboard() {
            setLoading(true);
            try {
                const response = await fetch(`/api/leaderboard?type=${activeTab}`);
                const data: LeaderboardResponse = await response.json();
                setLeaderboard(data.leaderboard);
                setCurrentUser(data.currentUser);
            } catch (error) {
                console.error('Failed to fetch leaderboard:', error);
            } finally {
                setLoading(false);
            }
        }

        fetchLeaderboard();
    }, [activeTab]);

    // Podium Logic
    const topThree = leaderboard.slice(0, 3);
    const restOfList = leaderboard.slice(3);

    const rank1 = topThree[0];
    const rank2 = topThree[1];
    const rank3 = topThree[2];

    const getInitials = (name: string) => name.substring(0, 2).toUpperCase();

    // Helper to resolve avatar logic
    const getAvatarSrc = (user: LeaderboardUser) => {
        if (user.avatarId) {
            const avatar = AVATARS.find(a => a.id === user.avatarId);
            if (avatar) return avatar.src;
        }
        return user.avatar || AVATARS[0].src; // Fallback to upload URL or first avatar
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-background p-6 flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background text-foreground pb-24 md:pb-10">
            {/* Page Title Header */}
            <PageHeader
                title="Leaderboard"
                description="Global Rankings"
                icon={Trophy}
            />

            <div className="max-w-5xl mx-auto px-4 py-8 space-y-10">

                {/* Tabs Selector */}
                <div className="flex justify-center mb-8">
                    <div className="grid grid-cols-2 p-1.5 bg-muted/40 rounded-2xl border border-border/50 backdrop-blur-xl w-full max-w-md">
                        <button
                            onClick={() => setActiveTab('official')}
                            className={`py-3 text-sm font-black rounded-xl transition-all duration-300 tracking-wider uppercase ${activeTab === 'official'
                                ? 'bg-primary text-primary-foreground shadow-xl shadow-primary/25 scale-[1.02]'
                                : 'text-muted-foreground hover:bg-muted/50 hover:text-foreground'
                                }`}
                        >
                            Official Pro League
                        </button>
                        <button
                            onClick={() => setActiveTab('battlezone')}
                            className={`py-3 text-sm font-black rounded-xl transition-all duration-300 tracking-wider uppercase flex items-center justify-center gap-2 ${activeTab === 'battlezone'
                                ? 'bg-primary text-primary-foreground shadow-xl shadow-primary/25 scale-[1.02]'
                                : 'text-muted-foreground hover:bg-muted/50 hover:text-foreground'
                                }`}
                        >
                            Battle Zone Kings
                        </button>
                    </div>
                </div>

                {/* Empty State */}
                {leaderboard.length === 0 && (
                    <div className="text-center py-20 bg-card/50 rounded-2xl border border-border">
                        <Trophy className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                        <h2 className="text-2xl font-bold text-foreground">Be the first to win!</h2>
                        <p className="text-muted-foreground mt-2">No players have ranked yet. Join a tournament and claim your spot.</p>
                    </div>
                )}

                {/* Podium Section - Redesigned Unified 2-1-3 Horizontal Layout */}
                {leaderboard.length > 0 && (
                    <div className="flex justify-center items-end gap-1 sm:gap-4 md:gap-8 mt-16 mb-20 px-1 sm:px-4">
                        
                        {/* Rank 2 (Silver) - Left */}
                        {rank2 && (
                            <motion.div
                                initial={{ opacity: 0, y: 30 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.2 }}
                                className="flex flex-col items-center w-[32%] sm:w-1/3 max-w-[180px]"
                            >
                                <div className="relative mb-2">
                                    <div className="w-14 h-14 sm:w-24 sm:h-24 md:w-24 md:h-24 rounded-full border-2 sm:border-4 border-slate-400 p-0.5 sm:p-1 bg-card relative z-10 overflow-hidden shadow-[0_0_15px_rgba(148,163,184,0.2)]">
                                        {(getAvatarSrc(rank2)) ? (
                                            <Image src={getAvatarSrc(rank2)!} alt={rank2.name} fill className="object-cover" />
                                        ) : (
                                            <div className="w-full h-full bg-muted flex items-center justify-center text-xs sm:text-xl font-bold text-muted-foreground">{getInitials(rank2.name)}</div>
                                        )}
                                    </div>
                                    <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 bg-slate-400 text-slate-900 text-[10px] sm:text-xs font-black px-1.5 sm:px-2 py-0.5 rounded-full z-20 shadow-md">
                                        #2
                                    </div>
                                </div>

                                <div className="w-full bg-card/40 backdrop-blur-xl p-2 sm:p-4 rounded-xl sm:rounded-2xl border border-white/5 shadow-xl relative overflow-hidden flex flex-col items-center h-28 sm:h-40 justify-center">
                                    <div className="absolute top-0 left-0 w-full h-0.5 bg-slate-400/50"></div>
                                    {activeTab === 'battlezone' && rank2.trustScore !== undefined && (
                                        <div className="mb-1 bg-background/50 border border-border/30 px-1.5 py-0.5 rounded-full text-[8px] font-bold text-muted-foreground flex items-center gap-1">
                                            <Shield className="w-2 h-2 sm:w-3 sm:h-3" /> {rank2.trustScore}%
                                        </div>
                                    )}
                                    <h3 className="font-bold text-[10px] sm:text-base text-foreground truncate w-full text-center px-1">{rank2.name}</h3>
                                    <div className="mt-1 sm:mt-3 flex flex-col items-center gap-0.5 sm:gap-1">
                                        <p className="text-[8px] sm:text-[10px] text-muted-foreground uppercase tracking-widest font-bold">Earnings</p>
                                        <p className="text-[10px] sm:text-lg font-black text-green-500 flex items-center gap-0.5 sm:gap-1">
                                            <span className="text-[8px] sm:text-sm">🪙</span> {rank2.netEarnings}
                                        </p>
                                        <p className="text-[8px] sm:text-[10px] text-muted-foreground font-medium mt-0.5 sm:mt-1">{rank2.totalWins} Wins</p>
                                    </div>
                                </div>
                            </motion.div>
                        )}

                        {/* Rank 1 (Gold) - Center */}
                        {rank1 && (
                            <motion.div
                                initial={{ opacity: 0, y: 30, scale: 0.95 }}
                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                transition={{ delay: 0.1, type: "spring" }}
                                className="flex flex-col items-center w-[36%] sm:w-1/3 max-w-[220px] z-10 -mb-2 sm:-mb-4"
                            >
                                <div className="relative mb-3 sm:mb-4">
                                    <Crown className="w-6 h-6 sm:w-10 sm:h-10 text-yellow-500 absolute -top-7 sm:-top-12 left-1/2 -translate-x-1/2 animate-bounce drop-shadow-[0_0_10px_rgba(234,179,8,0.5)]" />
                                    <div className="w-20 h-20 sm:w-28 sm:h-28 md:w-32 md:h-32 rounded-full border-4 border-yellow-500 p-0.5 sm:p-1.5 bg-card relative z-10 overflow-hidden shadow-[0_0_30px_rgba(234,179,8,0.3)]">
                                        {(getAvatarSrc(rank1)) ? (
                                            <Image src={getAvatarSrc(rank1)!} alt={rank1.name} fill className="object-cover" />
                                        ) : (
                                            <div className="w-full h-full bg-muted flex items-center justify-center text-xl sm:text-3xl font-bold text-yellow-500">{getInitials(rank1.name)}</div>
                                        )}
                                    </div>
                                    <div className="absolute -bottom-2 sm:-bottom-3 left-1/2 -translate-x-1/2 bg-yellow-500 text-yellow-950 text-[10px] sm:text-sm font-black px-2 sm:px-3 py-0.5 sm:py-1 rounded-full z-20 shadow-lg flex items-center gap-1">
                                        <Trophy className="w-2 h-2 sm:w-3 sm:h-3" /> #1
                                    </div>
                                </div>

                                <div className="w-full bg-gradient-to-b from-yellow-500/10 to-card/60 backdrop-blur-2xl p-3 sm:p-6 rounded-2xl sm:rounded-3xl border border-yellow-500/30 shadow-[0_20px_50px_rgba(234,179,8,0.15)] relative overflow-hidden flex flex-col items-center h-36 sm:h-52 justify-center">
                                    <div className="absolute top-0 left-0 w-full h-1 bg-yellow-500"></div>
                                    <h3 className="font-black text-xs sm:text-xl text-yellow-500 truncate w-full text-center uppercase tracking-tight">{rank1.name}</h3>
                                    <div className="mt-2 sm:mt-4 flex flex-col items-center">
                                        <p className="text-[8px] sm:text-[10px] text-yellow-500/70 uppercase tracking-[0.2em] font-black">King's Bounty</p>
                                        <p className="text-sm sm:text-3xl font-black text-green-500 flex items-center gap-1 sm:gap-2 mt-0.5 sm:mt-1 drop-shadow-[0_0_15px_rgba(34,197,94,0.3)]">
                                            <span className="text-xs sm:text-2xl">🪙</span> {rank1.netEarnings}
                                        </p>
                                        <div className="mt-2 sm:mt-4 px-2 sm:px-3 py-0.5 sm:py-1 bg-white/5 rounded-full border border-white/10">
                                            <p className="text-[8px] sm:text-xs font-bold text-foreground/80">{rank1.totalWins} Victories</p>
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        )}

                        {/* Rank 3 (Bronze) - Right */}
                        {rank3 && (
                            <motion.div
                                initial={{ opacity: 0, y: 30 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.3 }}
                                className="flex flex-col items-center w-[32%] sm:w-1/3 max-w-[180px]"
                            >
                                <div className="relative mb-2">
                                    <div className="w-14 h-14 sm:w-24 sm:h-24 md:w-24 md:h-24 rounded-full border-2 sm:border-4 border-orange-700/80 p-0.5 sm:p-1 bg-card relative z-10 overflow-hidden shadow-[0_0_15px_rgba(194,65,12,0.2)]">
                                        {(getAvatarSrc(rank3)) ? (
                                            <Image src={getAvatarSrc(rank3)!} alt={rank3.name} fill className="object-cover" />
                                        ) : (
                                            <div className="w-full h-full bg-muted flex items-center justify-center text-xs sm:text-xl font-bold text-muted-foreground">{getInitials(rank3.name)}</div>
                                        )}
                                    </div>
                                    <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 bg-orange-700 text-orange-100 text-[10px] sm:text-xs font-black px-1.5 sm:px-2 py-0.5 rounded-full z-20 shadow-md">
                                        #3
                                    </div>
                                </div>

                                <div className="w-full bg-card/40 backdrop-blur-xl p-2 sm:p-4 rounded-xl sm:rounded-2xl border border-white/5 shadow-xl relative overflow-hidden flex flex-col items-center h-28 sm:h-40 justify-center">
                                    <div className="absolute top-0 left-0 w-full h-0.5 bg-orange-700/50"></div>
                                    {activeTab === 'battlezone' && rank3.trustScore !== undefined && (
                                        <div className="mb-1 bg-background/50 border border-border/30 px-1.5 py-0.5 rounded-full text-[8px] font-bold text-muted-foreground flex items-center gap-1">
                                            <Shield className="w-2 h-2 sm:w-3 sm:h-3" /> {rank3.trustScore}%
                                        </div>
                                    )}
                                    <h3 className="font-bold text-[10px] sm:text-base text-foreground truncate w-full text-center px-1">{rank3.name}</h3>
                                    <div className="mt-1 sm:mt-3 flex flex-col items-center gap-0.5 sm:gap-1">
                                        <p className="text-[8px] sm:text-[10px] text-muted-foreground uppercase tracking-widest font-bold">Earnings</p>
                                        <p className="text-[10px] sm:text-lg font-black text-green-500 flex items-center gap-0.5 sm:gap-1">
                                            <span className="text-[8px] sm:text-sm">🪙</span> {rank3.netEarnings}
                                        </p>
                                        <p className="text-[8px] sm:text-[10px] text-muted-foreground font-medium mt-0.5 sm:mt-1">{rank3.totalWins} Wins</p>
                                    </div>
                                </div>
                            </motion.div>
                        )}
                    </div>
                )}

                {/* The List (Rank 4-10) */}
                {restOfList.length > 0 && (
                    <div className="bg-card rounded-2xl border border-border overflow-hidden shadow-sm">
                        <div className="p-4 border-b border-border bg-muted/30 flex justify-between items-center">
                            <span className="text-muted-foreground text-sm font-medium uppercase tracking-wider w-8">Rank</span>
                            <span className="text-muted-foreground text-sm font-medium uppercase tracking-wider flex-1 pl-4">Player</span>
                            {activeTab === 'battlezone' && (
                                <span className="text-muted-foreground text-sm font-medium uppercase tracking-wider w-20 text-center hidden sm:block">Trust</span>
                            )}
                            <span className="text-muted-foreground text-sm font-medium uppercase tracking-wider w-20 text-center">Wins</span>
                            <span className="text-muted-foreground text-sm font-medium uppercase tracking-wider w-24 text-right">Earned</span>
                        </div>

                        <div className="divide-y divide-border">
                            {restOfList.map((user, index) => (
                                <motion.div
                                    initial={{ opacity: 0, x: -20 }}
                                    whileInView={{ opacity: 1, x: 0 }}
                                    viewport={{ once: true }}
                                    transition={{ delay: index * 0.05 }}
                                    key={user.id}
                                    className="flex items-center p-4 hover:bg-muted/50 transition-colors"
                                >
                                    <div className="w-8 h-8 flex items-center justify-center font-bold text-muted-foreground">
                                        {index + 4}
                                    </div>
                                    <div className="flex-1 flex items-center gap-3 pl-4">
                                        <div className="w-10 h-10 rounded-full bg-muted overflow-hidden relative border border-border">
                                            {(getAvatarSrc(user)) ? (
                                                <Image src={getAvatarSrc(user)!} alt={user.name} fill className="object-cover" />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center text-muted-foreground text-xs font-bold">{getInitials(user.name)}</div>
                                            )}
                                        </div>
                                        <span className="font-semibold text-foreground truncate">{user.name}</span>
                                    </div>
                                    {activeTab === 'battlezone' && (
                                        <div className="w-20 text-center font-bold text-muted-foreground hidden sm:flex justify-center items-center gap-1 text-sm">
                                            <Shield className="w-3 h-3 text-primary" /> {user.trustScore}%
                                        </div>
                                    )}
                                    <div className="w-20 text-center font-bold text-primary">{user.totalWins}</div>
                                    <div className="w-24 text-right font-medium text-green-500">🪙 {user.netEarnings}</div>
                                </motion.div>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            {/* Sticky My Rank Bar */}
            {currentUser && (
                <div className="fixed bottom-[5.5rem] md:bottom-6 left-0 right-0 z-40 flex justify-center pointer-events-none">
                    <div className="w-full pl-0 lg:pl-20 flex justify-center">
                        <div className="w-full max-w-5xl px-4 pointer-events-auto">
                            <div className="bg-card border border-border p-4 rounded-2xl shadow-[0_0_50px_rgba(0,0,0,0.2)] dark:shadow-[0_0_50px_rgba(0,0,0,0.5)] transform translate-y-0 transition-transform">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-4">
                                        <div className="flex flex-col items-center justify-center bg-primary w-12 h-12 rounded-lg shadow-lg">
                                            <span className="text-xs text-primary-foreground uppercase font-bold">Your</span>
                                            <span className="text-lg font-bold text-primary-foreground leading-none">#{currentUser.rank}</span>
                                        </div>
                                        <div>
                                            <h4 className="font-bold text-foreground text-lg">My Ranking</h4>
                                            <p className="text-muted-foreground text-xs truncate max-w-[150px] md:max-w-none">Keep playing to reach the top!</p>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-4 md:gap-8">
                                        <div className="text-center">
                                            <p className="text-xs text-muted-foreground uppercase">Wins</p>
                                            <p className="text-xl font-bold text-primary">{currentUser.totalWins}</p>
                                        </div>
                                        <div className="text-center pl-4 border-l border-border">
                                            <p className="text-xs text-muted-foreground uppercase">Earned</p>
                                            <p className="text-xl font-bold text-green-500">🪙 {currentUser.netEarnings}</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
