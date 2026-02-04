'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import TournamentCard from '@/components/TournamentCard';
import { Trophy, Filter, Wallet } from 'lucide-react';
import { useSearchParams } from 'next/navigation';

interface Tournament {
    _id: string;
    title: string;
    format: string;
    gameType: string;
    entryFee: number;
    prizePool: number;
    prizeDistribution: { first: number; second: number; third: number };
    maxSlots: number;
    joinedCount: number;
    startTime: string;
    status: 'Open' | 'Live' | 'Completed';
    map: string;
}

export default function TournamentsPage() {
    const searchParams = useSearchParams();
    const initialTab = searchParams.get('tab') === 'my' ? 'my' : 'all';

    const [tournaments, setTournaments] = useState<Tournament[]>([]);
    const [loading, setLoading] = useState(true);
    const [balance, setBalance] = useState<number>(0);
    const [joinedIds, setJoinedIds] = useState<string[]>([]);
    const [activeTab, setActiveTab] = useState<'all' | 'my'>(initialTab); // Initialize from URL
    const [filterFormat, setFilterFormat] = useState('All');
    const [filterGameType, setFilterGameType] = useState('All');

    useEffect(() => {
        fetchTournaments();
        fetchBalance();
        fetchJoinedTournaments();
    }, []);

    const fetchTournaments = async () => {
        try {
            const res = await fetch('/api/tournaments');
            const data = await res.json();
            if (data.success) {
                setTournaments(data.data);
            }
        } catch (error) {
            console.error('Failed to fetch tournaments', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchBalance = async () => {
        try {
            const res = await fetch('/api/user/balance');
            const data = await res.json();
            if (data.success) {
                setBalance(data.balance);
            }
        } catch (error) {
            console.error('Failed to fetch balance', error);
        }
    };

    const fetchJoinedTournaments = async () => {
        try {
            const res = await fetch('/api/user/tournaments');
            const data = await res.json();
            if (data.success) {
                setJoinedIds(data.joined);
            }
        } catch (error) {
            console.error('Failed to fetch joined tournaments', error);
        }
    };

    const filteredTournaments = tournaments.filter(t => {
        // Tab Filter
        if (activeTab === 'my') {
            if (!joinedIds.includes(t._id)) return false;
        }

        // Standard Filters
        if (filterFormat !== 'All' && t.format !== filterFormat) return false;
        if (filterGameType !== 'All' && t.gameType !== filterGameType) return false;
        return true;
    });

    return (
        <div className="bg-background text-foreground pb-24 lg:pb-8">
            {/* Minimal Header */}
            <div className="pt-2 pb-3 px-4 border-b border-border/40 bg-background/50 backdrop-blur-md sticky top-0 z-30">
                <div className="flex items-center gap-3">
                    <div className="p-1.5 bg-primary/10 rounded-lg shrink-0">
                        <Trophy className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                        <h1 className="text-base font-bold text-foreground leading-none">
                            Tournaments
                        </h1>
                        <p className="text-[10px] text-muted-foreground font-medium mt-0.5">
                            Join Battle & Win
                        </p>
                    </div>
                </div>
            </div>

            <div className="p-4 md:p-6 space-y-6 max-w-4xl mx-auto">

                {/* Wallet Balance Card */}
                <div className="bg-card border border-border rounded-2xl p-6 relative overflow-hidden shadow-sm">
                    <div className="absolute right-0 top-0 w-32 h-32 bg-primary/5 rounded-full blur-2xl pointer-events-none" />
                    <div className="flex justify-between items-center relative z-10">
                        <div className="flex items-center gap-2 text-muted-foreground">
                            <Wallet className="w-5 h-5 text-primary" />
                            <span className="font-medium text-sm">Your Balance</span>
                        </div>
                        <div className="text-2xl font-bold text-foreground">
                            {balance} <span className="text-sm text-muted-foreground font-normal">coins</span>
                        </div>
                    </div>
                </div>

                {/* Tabs Selector */}
                <div className="grid grid-cols-2 p-1.5 bg-muted/40 rounded-xl border border-border/50">
                    <button
                        onClick={() => setActiveTab('all')}
                        className={`py-2.5 text-sm font-bold rounded-lg transition-all duration-300 ${activeTab === 'all'
                            ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/25 scale-[1.02]'
                            : 'text-muted-foreground hover:bg-muted/50 hover:text-foreground'
                            }`}
                    >
                        Browse All
                    </button>
                    <button
                        onClick={() => setActiveTab('my')}
                        className={`py-2.5 text-sm font-bold rounded-lg transition-all duration-300 flex items-center justify-center gap-2 ${activeTab === 'my'
                            ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/25 scale-[1.02]'
                            : 'text-muted-foreground hover:bg-muted/50 hover:text-foreground'
                            }`}
                    >
                        My Matches
                        {joinedIds.length > 0 && (
                            <span className={`text-[10px] h-5 min-w-[20px] px-1 rounded-full flex items-center justify-center transition-colors ${activeTab === 'my'
                                ? 'bg-background/20 text-white'
                                : 'bg-primary/20 text-primary'
                                }`}>
                                {joinedIds.length}
                            </span>
                        )}
                    </button>
                </div>

                {/* Filters Card */}
                <div className="bg-card border border-border rounded-2xl p-6 shadow-sm">
                    <div className="flex items-center gap-2 mb-6">
                        <Filter className="w-5 h-5 text-primary" />
                        <h2 className="text-lg font-bold text-foreground">Filters</h2>
                    </div>

                    <div className="space-y-6">
                        {/* Game Type Filter */}
                        <div className="space-y-2">
                            <label className="text-sm text-muted-foreground font-medium">Game Type</label>
                            <div className="flex flex-wrap gap-2">
                                {['All', 'BR', 'CS'].map(type => (
                                    <button
                                        key={type}
                                        onClick={() => setFilterGameType(type)}
                                        className={`px-6 py-2 rounded-lg text-sm font-bold transition-all ${filterGameType === type
                                            ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/20'
                                            : 'bg-background/50 border border-border/50 text-muted-foreground hover:bg-muted/80 hover:text-foreground'
                                            }`}
                                    >
                                        {type}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Mode Filter */}
                        <div className="space-y-2">
                            <label className="text-sm text-muted-foreground font-medium">Mode</label>
                            <div className="flex flex-wrap gap-2">
                                {['All', 'Solo', 'Duo', 'Squad'].map(mode => (
                                    <button
                                        key={mode}
                                        onClick={() => setFilterFormat(mode)}
                                        className={`px-6 py-2 rounded-lg text-sm font-bold transition-all ${filterFormat === mode
                                            ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/20'
                                            : 'bg-background/50 border border-border/50 text-muted-foreground hover:bg-muted/80 hover:text-foreground'
                                            }`}
                                    >
                                        {mode}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Tournaments List */}
                {loading ? (
                    <div className="space-y-4">
                        {[1, 2].map(i => (
                            <div key={i} className="h-64 bg-card rounded-2xl border border-border animate-pulse"></div>
                        ))}
                    </div>
                ) : filteredTournaments.length > 0 ? (
                    <div className="grid grid-cols-1 gap-6">
                        {filteredTournaments.map(tournament => (
                            <Link key={tournament._id} href={`/tournaments/${tournament._id}`} className="block h-full">
                                <TournamentCard tournament={tournament} />
                            </Link>
                        ))}
                    </div>
                ) : (
                    <div className="bg-card border border-dashed border-border rounded-2xl p-12 flex flex-col items-center justify-center text-center">
                        <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
                            <Trophy className="w-8 h-8 text-muted-foreground" />
                        </div>
                        <h3 className="text-xl font-semibold text-foreground mb-2">No tournaments available</h3>
                        <p className="text-muted-foreground max-w-xs mx-auto">
                            Check back later for new tournaments!
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
}
