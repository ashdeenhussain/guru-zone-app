"use client";

import { useEffect, useState } from "react";
import { format } from "date-fns";
import {
    Trophy,
    Gamepad2,
    Calendar,
    Users,
    MapPin,
    Target,
    Clock,
    Filter,
    ChevronRight,
    Sword
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import PageHeader from "@/components/PageHeader";
import Link from "next/link";

interface Tournament {
    _id: string;
    title: string;
    format: string; // Solo, Duo, Squad
    gameType: string; // BR, CS
    entryFee: number;
    prizePool: number;
    startTime: string;
    status: 'Open' | 'Live' | 'Completed' | 'Cancelled';
    map: string;
    joinedCount: number;
    maxSlots: number;
}

export default function TournamentHistoryPage() {
    const [tournaments, setTournaments] = useState<Tournament[]>([]);
    const [loading, setLoading] = useState(true);

    // Filters
    const [gameTypeFilter, setGameTypeFilter] = useState<'All' | 'BR' | 'CS'>('All');
    const [formatFilter, setFormatFilter] = useState<'All' | 'Solo' | 'Duo' | 'Squad'>('All');

    useEffect(() => {
        fetchTournaments();
    }, []);

    const fetchTournaments = async () => {
        try {
            const res = await fetch("/api/user/tournaments");
            const data = await res.json();
            if (data.success) {
                setTournaments(data.joined || []);
            }
        } catch (error) {
            console.error("Failed to fetch tournaments", error);
        } finally {
            setLoading(false);
        }
    };

    const filteredTournaments = tournaments.filter(t => {
        if (gameTypeFilter !== 'All' && t.gameType !== gameTypeFilter) return false;
        if (formatFilter !== 'All' && t.format !== formatFilter) return false;
        return true;
    });

    // Helper to get status distinct styles
    const getStatusStyle = (status: string) => {
        switch (status) {
            case 'Open': return "bg-emerald-500/10 text-emerald-500 border-emerald-500/20";
            case 'Live': return "bg-red-500/10 text-red-500 border-red-500/20 animate-pulse";
            case 'Completed': return "bg-blue-500/10 text-blue-500 border-blue-500/20";
            case 'Cancelled': return "bg-gray-500/10 text-gray-400 border-gray-500/20";
            default: return "bg-gray-500/10 text-gray-400 border-gray-500/20";
        }
    };

    return (
        <div className="min-h-screen bg-background text-foreground pb-24 lg:pb-8">
            <div className="max-w-5xl mx-auto space-y-6 p-4 md:p-6">
                {/* Header */}
                <PageHeader
                    title="My Battlefield"
                    description="Your Tournament History & Records"
                    icon={Sword}
                />

                {/* Filters Section */}
                <div className="bg-card border border-border rounded-2xl p-4 md:p-6 shadow-sm space-y-4">
                    <div className="flex items-center gap-2 mb-2">
                        <Filter className="w-5 h-5 text-primary" />
                        <h2 className="text-lg font-bold">Filters</h2>
                    </div>

                    <div className="flex flex-col md:flex-row gap-4">
                        {/* Game Type Filter */}
                        <div className="space-y-2 flex-1">
                            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Game Type</label>
                            <div className="flex bg-muted/30 p-1 rounded-xl border border-border/50">
                                {(['All', 'BR', 'CS'] as const).map((type) => (
                                    <button
                                        key={type}
                                        onClick={() => setGameTypeFilter(type)}
                                        className={`flex-1 py-2 px-3 rounded-lg text-sm font-bold transition-all ${gameTypeFilter === type
                                                ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/20'
                                                : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                                            }`}
                                    >
                                        {type}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Format Filter */}
                        <div className="space-y-2 flex-1">
                            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Format</label>
                            <div className="flex bg-muted/30 p-1 rounded-xl border border-border/50 overflow-x-auto">
                                {(['All', 'Solo', 'Duo', 'Squad'] as const).map((fmt) => (
                                    <button
                                        key={fmt}
                                        onClick={() => setFormatFilter(fmt)}
                                        className={`flex-1 py-2 px-3 rounded-lg text-sm font-bold transition-all whitespace-nowrap ${formatFilter === fmt
                                                ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/20'
                                                : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                                            }`}
                                    >
                                        {fmt}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Tournaments List */}
                <div className="space-y-4">
                    <div className="flex justify-between items-center px-1">
                        <h3 className="font-bold text-lg flex items-center gap-2">
                            <Gamepad2 className="text-primary w-5 h-5" />
                            Joined Tournaments
                            <span className="bg-muted px-2 py-0.5 rounded-full text-xs text-muted-foreground border border-border">
                                {filteredTournaments.length}
                            </span>
                        </h3>
                    </div>

                    {loading ? (
                        <div className="flex justify-center py-20">
                            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
                        </div>
                    ) : filteredTournaments.length === 0 ? (
                        <div className="text-center py-20 bg-card/50 rounded-2xl border border-border/50 border-dashed">
                            <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4 text-muted-foreground/50">
                                <Trophy size={32} />
                            </div>
                            <h3 className="text-xl font-bold text-foreground">No matches found</h3>
                            <p className="text-muted-foreground">You haven't joined any tournaments matching these filters.</p>
                            <Link href="/dashboard/tournaments" className="inline-block mt-4 text-primary hover:underline font-medium">
                                Browse Available Tournaments
                            </Link>
                        </div>
                    ) : (
                        <AnimatePresence mode="popLayout">
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-4">
                                {filteredTournaments.map((tournament) => (
                                    <motion.div
                                        layout
                                        initial={{ opacity: 0, scale: 0.95 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        exit={{ opacity: 0, scale: 0.95 }}
                                        transition={{ duration: 0.2 }}
                                        key={tournament._id}
                                        className="group"
                                    >
                                        <Link href={`/tournaments/${tournament._id}`}>
                                            <div className="bg-card hover:bg-muted/10 border border-border rounded-2xl p-5 shadow-sm hover:shadow-md hover:border-primary/30 transition-all relative overflow-hidden h-full flex flex-col">
                                                {/* Status Badge */}
                                                <div className="flex justify-between items-start mb-4">
                                                    <span className={`px-2.5 py-1 rounded-full text-xs font-bold border flex items-center gap-1.5 ${getStatusStyle(tournament.status)}`}>
                                                        <span className="w-1.5 h-1.5 rounded-full bg-current" />
                                                        {tournament.status}
                                                    </span>
                                                    <span className="text-xs font-mono text-muted-foreground bg-muted/50 px-2 py-1 rounded-md border border-border/50">
                                                        {tournament.gameType} • {tournament.format}
                                                    </span>
                                                </div>

                                                {/* Title & Prize */}
                                                <div className="mb-4 flex-1">
                                                    <h3 className="font-bold text-lg group-hover:text-primary transition-colors line-clamp-1 mb-1">
                                                        {tournament.title}
                                                    </h3>
                                                    <div className="flex items-center text-sm text-muted-foreground gap-1">
                                                        <Calendar className="w-3.5 h-3.5" />
                                                        {format(new Date(tournament.startTime), "MMM d, yyyy • h:mm a")}
                                                    </div>
                                                </div>

                                                {/* Details Grid */}
                                                <div className="grid grid-cols-2 gap-2 text-sm bg-muted/20 p-3 rounded-xl border border-border/50 mb-3">
                                                    <div className="flex items-center gap-2 text-muted-foreground">
                                                        <MapPin className="w-4 h-4 text-primary/70" />
                                                        <span className="truncate">{tournament.map}</span>
                                                    </div>
                                                    <div className="flex items-center gap-2 text-muted-foreground">
                                                        <Users className="w-4 h-4 text-primary/70" />
                                                        <span>{tournament.joinedCount}/{tournament.maxSlots}</span>
                                                    </div>
                                                    <div className="flex items-center gap-2 text-muted-foreground">
                                                        <Trophy className="w-4 h-4 text-yellow-500" />
                                                        <span className="text-foreground font-medium">PKR {tournament.prizePool}</span>
                                                    </div>
                                                    <div className="flex items-center gap-2 text-muted-foreground">
                                                        <Target className="w-4 h-4 text-blue-500" />
                                                        <span className={tournament.entryFee === 0 ? 'text-green-500 font-bold' : 'text-foreground'}>
                                                            {tournament.entryFee === 0 ? 'FREE' : `PKR ${tournament.entryFee}`}
                                                        </span>
                                                    </div>
                                                </div>

                                                <div className="flex items-center justify-end text-primary text-sm font-bold group-hover:gap-2 transition-all duration-300">
                                                    View Details <ChevronRight size={16} />
                                                </div>
                                            </div>
                                        </Link>
                                    </motion.div>
                                ))}
                            </div>
                        </AnimatePresence>
                    )}
                </div>
            </div>
        </div>
    );
}
