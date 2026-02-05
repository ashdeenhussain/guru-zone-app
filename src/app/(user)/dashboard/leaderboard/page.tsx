
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
    rank?: number;
}

interface LeaderboardResponse {
    leaderboard: LeaderboardUser[];
    currentUser: LeaderboardUser & { rank: number } | null;
}

export default function LeaderboardPage() {
    const [leaderboard, setLeaderboard] = useState<LeaderboardUser[]>([]);
    const [currentUser, setCurrentUser] = useState<(LeaderboardUser & { rank: number }) | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchLeaderboard() {
            try {
                const response = await fetch('/api/leaderboard');
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
    }, []);

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

                {/* Empty State */}
                {leaderboard.length === 0 && (
                    <div className="text-center py-20 bg-card/50 rounded-2xl border border-border">
                        <Trophy className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                        <h2 className="text-2xl font-bold text-foreground">Be the first to win!</h2>
                        <p className="text-muted-foreground mt-2">No players have ranked yet. Join a tournament and claim your spot.</p>
                    </div>
                )}

                {/* Podium Section */}
                {leaderboard.length > 0 && (
                    <div className="flex flex-col md:flex-row justify-center items-end gap-6 md:gap-8 mt-8 mb-16 relative">

                        {/* Rank 2 (Silver) */}
                        {rank2 && (
                            <motion.div
                                initial={{ opacity: 0, y: 50 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.2 }}
                                className="order-2 md:order-1 flex flex-col items-center w-full md:w-1/3"
                            >
                                <div className="relative">
                                    <div className="w-24 h-24 rounded-full border-4 border-slate-400 p-1 bg-card relative z-10 overflow-hidden shadow-[0_0_20px_rgba(148,163,184,0.3)]">
                                        {(getAvatarSrc(rank2)) ? (
                                            <Image src={getAvatarSrc(rank2)!} alt={rank2.name} fill className="object-cover" />
                                        ) : (
                                            <div className="w-full h-full bg-muted flex items-center justify-center text-xl font-bold text-muted-foreground">{getInitials(rank2.name)}</div>
                                        )}
                                    </div>
                                    <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 bg-slate-400 text-slate-900 text-xs font-bold px-2 py-0.5 rounded-full z-20 shadow-md">
                                        #2
                                    </div>
                                </div>

                                <div className="mt-4 text-center w-full bg-card/50 p-4 rounded-xl border border-border backdrop-blur-sm">
                                    <h3 className="font-bold text-lg text-foreground truncate">{rank2.name}</h3>
                                    <div className="flex justify-center items-center gap-2 mt-2">
                                        <div className="text-center">
                                            <p className="text-xs text-muted-foreground uppercase">Wins</p>
                                            <p className="text-lg font-bold text-primary">{rank2.totalWins}</p>
                                        </div>
                                        <div className="w-px h-8 bg-border"></div>
                                        <div className="text-center">
                                            <p className="text-xs text-muted-foreground uppercase">Earnings</p>
                                            <p className="text-sm font-bold text-green-500">🪙 {rank2.netEarnings}</p>
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        )}

                        {/* Rank 1 (Gold) */}
                        {rank1 && (
                            <motion.div
                                initial={{ opacity: 0, y: 50, scale: 0.9 }}
                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                transition={{ delay: 0.1, type: "spring" }}
                                className="order-1 md:order-2 flex flex-col items-center w-full md:w-1/3 z-10 -mt-10 md:-mt-0"
                            >
                                <div className="relative mb-2">
                                    <Crown className="w-10 h-10 text-yellow-500 absolute -top-12 left-1/2 -translate-x-1/2 animate-bounce" />
                                    <div className="w-32 h-32 rounded-full border-4 border-yellow-500 p-1 bg-card relative z-10 overflow-hidden shadow-[0_0_30px_rgba(234,179,8,0.4)]">
                                        {(getAvatarSrc(rank1)) ? (
                                            <Image src={getAvatarSrc(rank1)!} alt={rank1.name} fill className="object-cover" />
                                        ) : (
                                            <div className="w-full h-full bg-muted flex items-center justify-center text-3xl font-bold text-yellow-500">{getInitials(rank1.name)}</div>
                                        )}
                                    </div>
                                    <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 bg-yellow-500 text-yellow-950 text-sm font-bold px-3 py-0.5 rounded-full z-20 shadow-md flex items-center gap-1">
                                        <Trophy className="w-3 h-3" /> #1
                                    </div>
                                </div>

                                <div className="mt-4 text-center w-full bg-gradient-to-b from-card to-background p-6 rounded-xl border border-yellow-500/30 shadow-lg relative overflow-hidden">
                                    <div className="absolute top-0 left-0 w-full h-1 bg-yellow-500"></div>
                                    <h3 className="font-bold text-xl text-yellow-600 dark:text-yellow-400 truncate">{rank1.name}</h3>
                                    <div className="mt-3 grid grid-cols-2 gap-2">
                                        <div className="bg-muted/50 p-2 rounded-lg">
                                            <p className="text-xs text-muted-foreground uppercase">Total Wins</p>
                                            <p className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">{rank1.totalWins}</p>
                                        </div>
                                        <div className="bg-muted/50 p-2 rounded-lg">
                                            <p className="text-xs text-muted-foreground uppercase">Earnings</p>
                                            <p className="text-xl font-bold text-green-500">🪙 {rank1.netEarnings}</p>
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        )}

                        {/* Rank 3 (Bronze) */}
                        {rank3 && (
                            <motion.div
                                initial={{ opacity: 0, y: 50 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.3 }}
                                className="order-3 flex flex-col items-center w-full md:w-1/3"
                            >
                                <div className="relative">
                                    <div className="w-24 h-24 rounded-full border-4 border-orange-700/80 p-1 bg-card relative z-10 overflow-hidden shadow-[0_0_20px_rgba(194,65,12,0.3)]">
                                        {(getAvatarSrc(rank3)) ? (
                                            <Image src={getAvatarSrc(rank3)!} alt={rank3.name} fill className="object-cover" />
                                        ) : (
                                            <div className="w-full h-full bg-muted flex items-center justify-center text-xl font-bold text-orange-400">{getInitials(rank3.name)}</div>
                                        )}
                                    </div>
                                    <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 bg-orange-700 text-orange-100 text-xs font-bold px-2 py-0.5 rounded-full z-20 shadow-md">
                                        #3
                                    </div>
                                </div>

                                <div className="mt-4 text-center w-full bg-card/50 p-4 rounded-xl border border-border backdrop-blur-sm">
                                    <h3 className="font-bold text-lg text-foreground truncate">{rank3.name}</h3>
                                    <div className="flex justify-center items-center gap-2 mt-2">
                                        <div className="text-center">
                                            <p className="text-xs text-muted-foreground uppercase">Wins</p>
                                            <p className="text-lg font-bold text-primary">{rank3.totalWins}</p>
                                        </div>
                                        <div className="w-px h-8 bg-border"></div>
                                        <div className="text-center">
                                            <p className="text-xs text-muted-foreground uppercase">Earnings</p>
                                            <p className="text-sm font-bold text-green-500">🪙 {rank3.netEarnings}</p>
                                        </div>
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
                            <span className="text-muted-foreground text-sm font-medium uppercase tracking-wider">Rank</span>
                            <span className="text-muted-foreground text-sm font-medium uppercase tracking-wider text-right flex-1 pr-4">Player</span>
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
