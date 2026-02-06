'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Trophy,
    Calendar,
    Users,
    MoreVertical,
    Plus,
    ArrowLeft,
    ShieldAlert,
    CheckCircle,
    XCircle,
    Clock,
    Swords,
    Gamepad2,
    DollarSign,
    Copy,
    Bell,
    Search
} from 'lucide-react';
import { format } from 'date-fns';
import { AVATARS } from '@/lib/avatars';
import ImageUpload from '@/components/admin/ImageUpload';
import Image from 'next/image';

// Types
interface Participant {
    userId: string;
    inGameName: string;
    username?: string;
    ign?: string;
    uid?: string;
}

interface Tournament {
    _id: string;
    title: string;
    format: 'Solo' | 'Duo' | 'Squad';
    gameType: 'BR' | 'CS';
    map: string;
    banner?: string;
    entryFee: number;
    prizePool: number;
    prizeDistribution: {
        first: number;
        second: number;
        third: number;
    };
    maxSlots: number;
    joinedCount: number;
    startTime: string;
    status: 'Open' | 'Live' | 'Completed' | 'Cancelled';
    roomID?: string;
    roomPassword?: string;
    participants: Participant[];
    winners?: {
        rank1: string;
        rank2: string;
        rank3: string;
    };
}

// Helper: Countdown Timer
function CountdownTimer({ targetDate }: { targetDate: string }) {
    const [timeLeft, setTimeLeft] = useState('');
    const [isUrgent, setIsUrgent] = useState(false);

    useEffect(() => {
        const calculateTime = () => {
            const difference = new Date(targetDate).getTime() - new Date().getTime();

            if (difference > 0) {
                const hours = Math.floor((difference / (1000 * 60 * 60)) % 24);
                const minutes = Math.floor((difference / 1000 / 60) % 60);
                const seconds = Math.floor((difference / 1000) % 60);

                setTimeLeft(`${hours}h ${minutes}m ${seconds}s`);
                setIsUrgent(difference < 10 * 60 * 1000); // Less than 10 mins
            } else {
                setTimeLeft('Starting...');
            }
        };

        calculateTime();
        const timer = setInterval(calculateTime, 1000);
        return () => clearInterval(timer);
    }, [targetDate]);

    return (
        <span className={`font-mono text-xs font-bold ${isUrgent ? 'text-red-500 animate-pulse' : 'text-muted-foreground'}`}>
            {timeLeft}
        </span>
    );
}

export default function AdminTournamentsPage() {
    const [tournaments, setTournaments] = useState<Tournament[]>([]);
    const [loading, setLoading] = useState(true);
    const [view, setView] = useState<'list' | 'create' | 'manage'>('list');
    const [selectedTournament, setSelectedTournament] = useState<Tournament | null>(null);
    const [urgentCount, setUrgentCount] = useState(0);

    // Fetch Tournaments & Check Urgency
    const fetchTournaments = async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/admin/tournaments');
            const data = await res.json();
            if (data.success) {
                setTournaments(data.tournaments);

                // Check for urgent tournaments (starting in < 10 mins)
                const now = new Date().getTime();
                const urgent = data.tournaments.filter((t: Tournament) => {
                    const diff = new Date(t.startTime).getTime() - now;
                    return t.status === 'Open' && diff > 0 && diff < 10 * 60 * 1000; // 10 mins
                });
                setUrgentCount(urgent.length);
            }
        } catch (error) {
            console.error('Failed to fetch tournaments', error);
            alert('Failed to load tournaments');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchTournaments();
        // Polling every minute to update urgency
        const interval = setInterval(fetchTournaments, 60000);
        return () => clearInterval(interval);
    }, []);

    const handleManage = (t: Tournament) => {
        setSelectedTournament(t);
        setView('manage');
    };

    const handleBack = () => {
        setSelectedTournament(null);
        setView('list');
        fetchTournaments(); // Refresh data on back
    };

    return (
        <div className="-m-4 lg:-m-8">
            {/* Sticky Header - Mimics User Dashboard but adapts to Admin Layout */}
            <div className="sticky top-16 lg:top-0 z-30 border-b border-border/40 bg-background/80 backdrop-blur-xl px-4 lg:px-6 py-3 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="p-1.5 bg-primary/10 rounded-lg shrink-0">
                        <Trophy className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                        <h1 className="text-base font-bold text-foreground leading-none">
                            Tournaments
                        </h1>
                        <p className="text-[10px] text-muted-foreground font-medium mt-0.5">
                            Manage & Create
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    {/* Urgent Notification Bell */}
                    <div className="relative p-2 rounded-full hover:bg-muted/50 transition-colors cursor-pointer">
                        <Bell size={20} className={urgentCount > 0 ? "text-red-500 animate-bounce" : "text-muted-foreground"} />
                        {urgentCount > 0 && (
                            <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-red-500 rounded-full animate-ping" />
                        )}
                    </div>

                    {view === 'list' && (
                        <button
                            onClick={() => setView('create')}
                            className="flex items-center gap-2 px-3 py-1.5 bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg font-bold text-xs transition-all shadow-lg shadow-primary/20"
                        >
                            <Plus size={14} />
                            <span className="hidden sm:inline">Create</span>
                        </button>
                    )}
                </div>
            </div>

            {/* Urgent Alert Banner */}
            <AnimatePresence>
                {urgentCount > 0 && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="bg-red-500/10 border-b border-red-500/20 px-4 py-2 flex items-center justify-between"
                    >
                        <div className="flex items-center gap-2 text-red-500">
                            <ShieldAlert size={16} className="animate-pulse" />
                            <span className="text-xs font-bold">Action Required: {urgentCount} tournament(s) starting soon! Create Room NOW.</span>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Main Content Area - With Padding Restored */}
            <div className={`p-4 lg:p-8 space-y-6 ${urgentCount > 0 ? 'pt-6' : 'pt-24 lg:pt-32'}`}>
                <AnimatePresence mode="wait">
                    {view === 'list' && (
                        <motion.div
                            key="list"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                        >
                            <TournamentList
                                tournaments={tournaments}
                                loading={loading}
                                onManage={handleManage}
                            />
                        </motion.div>
                    )}

                    {view === 'create' && (
                        <motion.div
                            key="create"
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                        >
                            <CreateTournamentForm onBack={handleBack} onSuccess={handleBack} />
                        </motion.div>
                    )}

                    {view === 'manage' && selectedTournament && (
                        <motion.div
                            key="manage"
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                        >
                            <ManageTournamentView
                                tournament={selectedTournament}
                                onBack={handleBack}
                                onUpdate={() => {
                                    // Ideally verify updated data
                                }}
                            />
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
}

// --- Sub-Components ---

// --- Sub-Components ---

// 1. Tournament List
function TournamentList({ tournaments, loading, onManage }: { tournaments: Tournament[], loading: boolean, onManage: (t: Tournament) => void }) {
    const [filter, setFilter] = useState<'active' | 'history'>('active');

    if (loading) return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map(i => (
                <div key={i} className="h-48 bg-muted/20 animate-pulse rounded-2xl border border-border/10"></div>
            ))}
        </div>
    );

    // Filter Logic
    const activeTournaments = tournaments.filter(t => ['Open', 'Live'].includes(t.status));
    const historyTournaments = tournaments.filter(t => ['Completed', 'Cancelled'].includes(t.status));

    const displayedTournaments = filter === 'active' ? activeTournaments : historyTournaments;

    const copyToClipboard = (text: string, e: React.MouseEvent) => {
        e.stopPropagation();
        navigator.clipboard.writeText(text);
        // Toast logic ideally, for now simple interaction
    };

    return (
        <div className="space-y-6">
            {/* Filter Tabs */}
            <div className="flex items-center gap-2 p-1 bg-muted/40 rounded-xl w-fit border border-border/50">
                <button
                    onClick={() => setFilter('active')}
                    className={`px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 transition-all ${filter === 'active' ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'}`}
                >
                    <Swords size={16} className={filter === 'active' ? 'text-primary' : ''} />
                    Active Zone
                    <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${filter === 'active' ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'}`}>
                        {activeTournaments.length}
                    </span>
                </button>
                <button
                    onClick={() => setFilter('history')}
                    className={`px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 transition-all ${filter === 'history' ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'}`}
                >
                    <Clock size={16} className={filter === 'history' ? 'text-blue-500' : ''} />
                    History / Archives
                    <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${filter === 'history' ? 'bg-blue-500/10 text-blue-500' : 'bg-muted text-muted-foreground'}`}>
                        {historyTournaments.length}
                    </span>
                </button>
            </div>

            {/* Empty State */}
            {displayedTournaments.length === 0 && (
                <div className="flex flex-col items-center justify-center py-20 bg-muted/20 border border-dashed border-border rounded-3xl">
                    <div className="p-4 bg-muted/30 rounded-full mb-4">
                        {filter === 'active' ? <Gamepad2 size={32} className="text-muted-foreground" /> : <Clock size={32} className="text-muted-foreground" />}
                    </div>
                    <h3 className="text-lg font-bold text-foreground">No {filter === 'active' ? 'Active' : 'Archived'} Tournaments</h3>
                    <p className="text-sm text-muted-foreground max-w-xs text-center mt-1">
                        {filter === 'active'
                            ? "Ready to host? Click 'Create' to launch a new battle."
                            : "Completed matches will appear here automatically."}
                    </p>
                </div>
            )}

            {/* List Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {displayedTournaments.map((tournament) => (
                    <div
                        key={tournament._id}
                        onClick={() => onManage(tournament)}
                        className="group relative bg-card hover:bg-muted/30 border border-border/50 hover:border-primary/30 rounded-2xl p-5 cursor-pointer transition-all hover:scale-[1.01] hover:shadow-xl hover:shadow-primary/5 overflow-hidden"
                    >
                        {/* Glow Effect or Banner */}
                        {tournament.banner ? (
                            <div className="absolute inset-0 opacity-20 group-hover:opacity-30 transition-opacity">
                                <Image
                                    src={tournament.banner}
                                    alt={tournament.title}
                                    fill
                                    className="object-cover"
                                />
                                <div className="absolute inset-0 bg-gradient-to-b from-card/80 to-card" />
                            </div>
                        ) : (
                            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-primary/5 to-transparent rounded-bl-full pointer-events-none transition-opacity group-hover:opacity-100 opacity-0" />
                        )}

                        {/* Header */}
                        <div className="flex justify-between items-start mb-4 relative z-10">
                            <div className="flex gap-3">
                                <div className={`w-10 h-10 rounded-xl flex items-center justify-center shadow-inner ${tournament.status === 'Live' ? 'bg-green-500 text-white animate-pulse' : 'bg-primary/10 text-primary'}`}>
                                    {tournament.status === 'Live' ? <Swords size={20} /> : <Trophy size={20} />}
                                </div>
                                <div>
                                    <h3
                                        className="font-bold text-foreground text-sm line-clamp-1 group-hover:text-primary transition-colors flex items-center gap-2"
                                        title={tournament.title}
                                    >
                                        {tournament.title}
                                        <button
                                            onClick={(e) => copyToClipboard(tournament.title, e)}
                                            className="opacity-0 group-hover:opacity-100 hover:bg-muted p-1 rounded transition-all text-muted-foreground hover:text-foreground"
                                        >
                                            <Copy size={10} />
                                        </button>
                                    </h3>
                                    <p className="text-[10px] text-muted-foreground font-mono flex items-center gap-1.5 mt-0.5">
                                        {tournament._id.slice(-6).toUpperCase()}
                                        <span className="w-1 h-1 rounded-full bg-border" />
                                        {tournament.map}
                                    </p>
                                </div>
                            </div>
                            <StatusBadge status={tournament.status} />
                        </div>

                        {/* Body Stats */}
                        <div className="grid grid-cols-2 gap-2 mb-4 relative z-10">
                            <div className="bg-muted/30 p-2.5 rounded-lg border border-border/30">
                                <span className="text-[10px] text-muted-foreground uppercase tracking-wider font-bold flex items-center gap-1 mb-1">
                                    <Users size={10} /> Players
                                </span>
                                <span className="text-sm font-bold block">{tournament.joinedCount}/{tournament.maxSlots}</span>
                            </div>
                            <div className="bg-muted/30 p-2.5 rounded-lg border border-border/30">
                                <span className="text-[10px] text-muted-foreground uppercase tracking-wider font-bold flex items-center gap-1 mb-1">
                                    <DollarSign size={10} /> Pool
                                </span>
                                <span className="text-sm font-bold block text-green-500">${tournament.prizePool}</span>
                            </div>
                        </div>

                        {/* Footer / Timer */}
                        <div className="flex items-center justify-between pt-3 border-t border-border/40 relative z-10">
                            <div className="flex items-center gap-1.5">
                                <Clock size={12} className="text-muted-foreground" />
                                {tournament.status === 'Open' ? (
                                    <CountdownTimer targetDate={tournament.startTime} />
                                ) : (
                                    <span className="text-xs font-mono font-bold text-muted-foreground">
                                        {format(new Date(tournament.startTime), 'MMM dd, HH:mm')}
                                    </span>
                                )}
                            </div>
                            <span className="text-[10px] font-bold text-primary group-hover:translate-x-1 transition-transform flex items-center gap-1">
                                Manage <ArrowLeft size={10} className="rotate-180" />
                            </span>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}


// 2. Create Form
function CreateTournamentForm({ onBack, onSuccess }: { onBack: () => void, onSuccess: () => void }) {
    const [formData, setFormData] = useState({
        title: '',
        banner: '',
        format: 'Solo',
        gameType: 'BR',
        map: 'Bermuda',
        entryFee: 0,
        prizePool: 0,
        maxSlots: 48,
        startTime: '',
        prizeDistribution: { first: 0, second: 0, third: 0 }
    });
    const [loading, setLoading] = useState(false);

    // Specific 15-char limit friendly names
    const PRESET_NAMES = [
        "Rush Hour", "Elite Cup", "Sniper Fest",
        "Booyah War", "Pro Scrims", "Zone Clash",
        "Night Raid", "Sunday War"
    ];

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            // Fix: Convert local datetime-local string to UTC ISO string
            const payload = {
                ...formData,
                startTime: new Date(formData.startTime).toISOString()
            };

            const res = await fetch('/api/admin/tournaments', {
                method: 'POST',
                body: JSON.stringify(payload),
                headers: { 'Content-Type': 'application/json' }
            });
            const data = await res.json();
            if (data.success) onSuccess();
            else alert('Error: ' + data.error);
        } catch (err) { alert('Something went wrong'); }
        finally { setLoading(false); }
    };



    // Theme-aware styles: Works for both Light & Dark modes
    const inputStyles = "w-full bg-muted/50 dark:bg-black/20 border border-border dark:border-white/10 rounded-xl p-3 text-sm text-foreground focus:ring-1 focus:ring-primary/50 focus:border-primary/50 outline-none transition-all placeholder:text-muted-foreground/50";
    const selectStyles = "w-full bg-muted/50 dark:bg-black/20 border border-border dark:border-white/10 rounded-xl p-3 text-sm text-foreground focus:ring-1 focus:ring-primary/50 focus:border-primary/50 outline-none transition-all appearance-none cursor-pointer";

    return (
        <div className="max-w-xl mx-auto">
            <div className="flex items-center gap-4 mb-6">
                <button onClick={onBack} className="p-2 hover:bg-muted/50 dark:hover:bg-white/5 rounded-full text-muted-foreground hover:text-foreground transition-colors border border-transparent hover:border-border">
                    <ArrowLeft size={18} />
                </button>
                <h2 className="text-lg font-bold text-foreground">New Tournament</h2>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
                {/* 1. Battle Intel Card */}
                <div className="bg-card/80 dark:bg-card/30 backdrop-blur-md border border-border/50 dark:border-white/5 rounded-2xl p-5 space-y-5 relative overflow-hidden shadow-sm">
                    <div className="absolute top-0 right-0 w-24 h-24 bg-blue-500/10 rounded-bl-full blur-2xl pointer-events-none" />

                    <div className="flex items-center gap-2 mb-2 pb-2 border-b border-border/50 dark:border-white/5">
                        <Swords size={14} className="text-blue-500 dark:text-blue-400" />
                        <span className="text-xs font-bold text-blue-600 dark:text-blue-100">Battle Intelligence</span>
                    </div>

                    <div className="space-y-3">
                        <InputGroup label="Tournament Title (Max 15 Chars)">
                            <div className="relative">
                                <input className={inputStyles}
                                    value={formData.title} onChange={e => setFormData({ ...formData, title: e.target.value.slice(0, 15) })}
                                    maxLength={15}
                                    required placeholder="Name" autoFocus />
                                <div className="absolute right-3 top-3 text-xs text-muted-foreground font-mono">
                                    {formData.title.length}/15
                                </div>
                            </div>
                        </InputGroup>

                        {/* Quick Picks */}
                        <div className="flex flex-wrap gap-2">
                            {PRESET_NAMES.map(name => (
                                <button
                                    key={name}
                                    type="button"
                                    onClick={() => setFormData({ ...formData, title: name })}
                                    className="px-2.5 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-[10px] font-bold hover:bg-primary/20 transition-colors"
                                >
                                    {name}
                                </button>
                            ))}
                        </div>

                        <div className="space-y-2 pt-2">
                            <ImageUpload
                                value={formData.banner}
                                onChange={(url) => setFormData({ ...formData, banner: url })}
                                label="Tournament Banner (Optional)"
                                className="w-full"
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <InputGroup label="Game Mode">
                            <div className="relative">
                                <select className={selectStyles} value={formData.format} onChange={e => setFormData({ ...formData, format: e.target.value as any })}>
                                    <option value="Solo">Solo Survival</option>
                                    <option value="Duo">Duo Queue</option>
                                    <option value="Squad">Squad Battle</option>
                                </select>
                                <div className="absolute right-3 top-3.5 pointer-events-none text-muted-foreground"><Users size={14} /></div>
                            </div>
                        </InputGroup>
                        <InputGroup label="Map">
                            <div className="relative">
                                <select className={selectStyles} value={formData.map} onChange={e => setFormData({ ...formData, map: e.target.value })}>
                                    <option value="Bermuda">Bermuda</option>
                                    <option value="Purgatory">Purgatory</option>
                                    <option value="Kalahari">Kalahari</option>
                                    <option value="Alpine">Alpine</option>
                                </select>
                                <div className="absolute right-3 top-3.5 pointer-events-none text-muted-foreground"><Gamepad2 size={14} /></div>
                            </div>
                        </InputGroup>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <InputGroup label="Battle Type">
                            <select className={selectStyles} value={formData.gameType} onChange={e => setFormData({ ...formData, gameType: e.target.value as any })}>
                                <option value="BR">Battle Royale (Classic)</option>
                                <option value="CS">Clash Squad (CS)</option>
                            </select>
                        </InputGroup>
                        <InputGroup label="Start Time">
                            <input type="datetime-local" className={inputStyles}
                                value={formData.startTime} onChange={e => setFormData({ ...formData, startTime: e.target.value })} required />
                        </InputGroup>
                    </div>
                </div>

                {/* 2. Economy & Stakes */}
                <div className="bg-card/80 dark:bg-card/30 backdrop-blur-md border border-border/50 dark:border-white/5 rounded-2xl p-5 space-y-5 relative overflow-hidden shadow-sm">
                    <div className="absolute top-0 right-0 w-24 h-24 bg-green-500/10 rounded-bl-full blur-2xl pointer-events-none" />

                    <div className="flex items-center gap-2 mb-2 pb-2 border-b border-border/50 dark:border-white/5">
                        <DollarSign size={14} className="text-green-500 dark:text-green-400" />
                        <span className="text-xs font-bold text-green-600 dark:text-green-100">Economy & Stakes</span>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <InputGroup label="Entry Fee (Coins)">
                            <div className="relative">
                                <span className="absolute left-3 top-3 text-yellow-600 dark:text-yellow-500 font-bold">$</span>
                                <input type="number" className={`${inputStyles} pl-8 font-mono`}
                                    value={formData.entryFee} onChange={e => setFormData({ ...formData, entryFee: parseInt(e.target.value) || 0 })} />
                            </div>
                        </InputGroup>
                        <InputGroup label="Total Slots">
                            <input type="number" className={`${inputStyles} font-mono`}
                                value={formData.maxSlots} onChange={e => setFormData({ ...formData, maxSlots: parseInt(e.target.value) || 0 })} />
                        </InputGroup>
                    </div>

                    <div className="bg-muted/30 dark:bg-black/20 rounded-xl p-4 border border-border/50 dark:border-white/5">
                        <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-3 block">Prize Distribution</label>
                        <div className="space-y-3">
                            {[
                                { label: '1st Place', color: 'text-yellow-600 dark:text-yellow-400', val: 'first' },
                                { label: '2nd Place', color: 'text-gray-500 dark:text-gray-300', val: 'second' },
                                { label: '3rd Place', color: 'text-orange-600 dark:text-orange-400', val: 'third' }
                            ].map((rank: any) => (
                                <div key={rank.val} className="flex items-center gap-3">
                                    <span className={`w-20 text-xs font-bold ${rank.color}`}>{rank.label}</span>
                                    <div className="relative flex-1">
                                        <input type="number" placeholder="0" className="w-full bg-background/50 dark:bg-black/40 border-none rounded-lg py-1.5 px-3 text-sm text-right font-mono text-green-600 dark:text-green-400 focus:ring-1 focus:ring-green-500/50"
                                            value={(formData.prizeDistribution as any)[rank.val]}
                                            onChange={e => {
                                                const val = parseInt(e.target.value) || 0;
                                                const newDist = { ...formData.prizeDistribution, [rank.val]: val };
                                                setFormData({
                                                    ...formData,
                                                    prizeDistribution: newDist,
                                                    prizePool: newDist.first + newDist.second + newDist.third
                                                });
                                            }} />
                                    </div>
                                </div>
                            ))}
                        </div>
                        <div className="mt-4 pt-3 border-t border-border/40 dark:border-white/10 flex justify-between items-center">
                            <span className="text-xs text-muted-foreground">Total Prize Pool</span>
                            <span className="text-lg font-bold text-green-600 dark:text-green-400 font-mono tracking-tight">${formData.prizePool}</span>
                        </div>
                    </div>
                </div>

                <div className="pt-4 pb-12">
                    <button
                        disabled={loading}
                        className="group w-full relative overflow-hidden py-4 bg-gradient-to-r from-primary to-blue-600 rounded-xl font-bold text-white shadow-xl shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 disabled:pointer-events-none"
                    >
                        <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
                        <span className="relative flex items-center justify-center gap-2">
                            {loading ? (
                                <>Deploying System...</>
                            ) : (
                                <>
                                    <Trophy size={18} className="text-yellow-300" />
                                    Launch Tournament
                                </>
                            )}
                        </span>
                    </button>
                    <p className="text-center text-[10px] text-muted-foreground mt-3">
                        This will deduct fees from the Prize Pool wallet immediately.
                    </p>
                </div>
            </form >
        </div >
    );
}

// 3. Manage View - Fully Revamped
function ManageTournamentView({ tournament, onBack, onUpdate }: { tournament: Tournament, onBack: () => void, onUpdate: () => void }) {
    const [roomForm, setRoomForm] = useState({
        roomID: tournament.roomID || '',
        roomPassword: tournament.roomPassword || '',
        autoRelease: false,
        releaseTime: '' // For scheduled release
    });
    const [winners, setWinners] = useState({
        rank1: (tournament.winners as any)?.rank1 || '',
        rank2: (tournament.winners as any)?.rank2 || '',
        rank3: (tournament.winners as any)?.rank3 || ''
    });
    const [searchTerm, setSearchTerm] = useState('');

    const filteredParticipants = tournament.participants?.filter(p =>
        ((p.userId as any)?.name?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
        ((p.userId as any)?.email?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
        (p.ign?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
        (p.userId?.toLowerCase() || '').includes(searchTerm.toLowerCase())
    ) || [];
    const [actionLoading, setActionLoading] = useState(false);
    const [activeTab, setActiveTab] = useState<'controls' | 'participants' | 'winners'>('controls');
    const [showDanger, setShowDanger] = useState(false); // Collapsible Danger Zone

    // --- Actions ---

    const handleGoLive = async (isReset = false) => {
        if (!roomForm.roomID || !roomForm.roomPassword) return alert('Enter Room Credentials first!');

        let confirmMsg = 'Start Match? This will notify all players.';
        if (roomForm.autoRelease) confirmMsg = `Schedule Credentials? They will be auto-revealed at ${roomForm.releaseTime || 'StartTime'}.`;
        if (isReset) confirmMsg = 'EMERGENCY: Re-sending credentials for new room. Users will be notified again.';

        if (!confirm(confirmMsg)) return;

        setActionLoading(true);
        try {
            const res = await fetch(`/api/admin/tournaments/${tournament._id}/credentials`, {
                method: 'PATCH',
                body: JSON.stringify(roomForm),
                headers: { 'Content-Type': 'application/json' }
            });
            const data = await res.json();
            if (data.success) {
                alert(isReset ? 'Room Updated & Players Notified!' : 'Match Started / Scheduled!');
                onUpdate();
                if (!isReset) onBack();
            } else {
                alert('Error: ' + data.error);
            }
        } catch (err) { alert('Failed to go live'); }
        setActionLoading(false);
    };

    const handleFinalize = async () => {
        if (!winners.rank1) return alert('Please input at least the Rank 1 User ID');
        if (!confirm('End Match & Distribute Prizes? This cannot be undone.')) return;

        setActionLoading(true);
        try {
            const res = await fetch(`/api/admin/tournaments/${tournament._id}/finalize`, {
                method: 'POST',
                body: JSON.stringify({ winners }),
                headers: { 'Content-Type': 'application/json' }
            });
            const data = await res.json();
            if (data.success) {
                alert('Match Ended. Prizes Distributed.');
                onUpdate();
                onBack();
            } else {
                alert('Error: ' + data.error);
            }
        } catch (err) { alert('Failed to finalize'); }
        setActionLoading(false);
    };

    const handleCancel = async () => {
        const confirmText = `DANGER: This will CANCEL the tournament and REFUND all ${tournament.joinedCount} players. Proceed?`;
        if (prompt(`Type "CANCEL" to confirm.\n\n${confirmText}`) !== "CANCEL") return;

        setActionLoading(true);
        try {
            const res = await fetch(`/api/admin/tournaments/${tournament._id}/cancel`, { method: 'POST' });
            const data = await res.json();
            if (data.success) {
                alert('Tournament Cancelled.');
                onUpdate();
                onBack();
            } else { alert('Error: ' + data.error); }
        } catch (err) { alert('Failed to cancel'); }
        setActionLoading(false);
    };

    const handleManualStatusChange = async (newStatus: string) => {
        if (!confirm(`Manually force status to "${newStatus}"? This may bypass normal checks.`)) return;

        setActionLoading(true);
        try {
            const res = await fetch(`/api/admin/tournaments/${tournament._id}`, { // Using the generic route
                method: 'PATCH',
                body: JSON.stringify({ status: newStatus }),
                headers: { 'Content-Type': 'application/json' }
            });
            const data = await res.json();
            if (data.success) {
                alert(`Status updated to ${newStatus}`);
                onUpdate(); // Refresh parent list
                // We also need to update the local 'tournament' prop or trigger a refresh, 
                // but onUpdate handles the list. Ideally we should also close or refresh this view.
                // For now, onUpdate is enough if it triggers a re-fetch in parent.
            } else {
                alert('Error: ' + data.error);
            }
        } catch (err) { alert('Update failed'); }
        setActionLoading(false);
    };

    // --- Render ---
    const isLive = tournament.status === 'Live';
    const isOpen = tournament.status === 'Open';
    const isCompleted = tournament.status === 'Completed';

    return (
        <div className="space-y-6">
            {/* Header Area */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                    <button onClick={onBack} className="p-2 hover:bg-muted/50 rounded-full text-muted-foreground hover:text-foreground transition-colors">
                        <ArrowLeft size={20} />
                    </button>
                    <div>
                        <div className="flex items-center gap-3">
                            <h2 className="text-2xl font-bold text-foreground">{tournament.title}</h2>
                            <StatusBadge status={tournament.status} />
                        </div>
                        <p className="text-xs text-muted-foreground font-mono mt-1 opacity-70">ID: {tournament._id}</p>
                    </div>
                </div>

                {/* Tabs */}
                <div className="bg-muted p-1 rounded-xl flex gap-1 overflow-x-auto">
                    {[
                        { id: 'controls', label: 'Match Control' },
                        { id: 'participants', label: 'Participants', count: tournament.joinedCount },
                        { id: 'winners', label: 'Winners' }
                    ].map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id as any)}
                            className={`px-4 py-2 rounded-lg text-sm font-bold transition-all whitespace-nowrap flex items-center gap-2 ${activeTab === tab.id ? 'bg-background shadow-sm text-primary' : 'text-muted-foreground hover:text-foreground'}`}
                        >
                            {tab.label}
                            {tab.count !== undefined && <span className="text-[10px] bg-primary/10 px-1.5 py-0.5 rounded-full">{tab.count}</span>}
                        </button>
                    ))}
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left: Quick Stats (Always Visible) */}
                <div className="space-y-6">
                    <div className="bg-card border border-border/50 p-6 rounded-2xl space-y-4">
                        <h3 className="font-bold text-muted-foreground uppercase text-xs tracking-wider">Overview</h3>

                        <div className="space-y-3">
                            {/* ... Stats Items ... */}
                            <div className="flex justify-between items-center p-3 bg-muted/30 rounded-xl">
                                <span className="text-sm font-medium flex items-center gap-2"><DollarSign size={14} className="text-green-500" /> Prize Pool</span>
                                <span className="font-bold font-mono text-green-500 text-sm">${tournament.prizePool}</span>
                            </div>
                            <div className="flex justify-between items-center p-3 bg-muted/30 rounded-xl">
                                <span className="text-sm font-medium flex items-center gap-2"><Users size={14} className="text-blue-500" /> Slots</span>
                                <span className="font-bold font-mono text-sm">{tournament.joinedCount} / {tournament.maxSlots}</span>
                            </div>
                            <div className="flex justify-between items-center p-3 bg-muted/30 rounded-xl">
                                <span className="text-sm font-medium flex items-center gap-2"><Clock size={14} className="text-yellow-500" /> Start</span>
                                <span className="font-bold font-mono text-xs">{tournament.startTime ? format(new Date(tournament.startTime), 'MMM dd, HH:mm') : 'TBA'}</span>
                            </div>
                        </div>
                    </div>

                    {(isOpen || isLive) && (
                        <div className="space-y-2">
                            <button
                                onClick={() => setShowDanger(!showDanger)}
                                className="w-full text-xs font-bold text-red-500/70 hover:text-red-500 flex items-center justify-between px-2"
                            >
                                <span>Advanced / Danger Action</span>
                                <span>{showDanger ? '−' : '+'}</span>
                            </button>

                            <AnimatePresence>
                                {showDanger && (
                                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                                        <div className="bg-red-500/5 border border-red-500/10 p-4 rounded-xl space-y-4">

                                            {/* Manual Status Override */}
                                            <div className="space-y-2">
                                                <label className="text-[10px] font-bold text-muted-foreground uppercase">Force Status Override</label>
                                                <div className="grid grid-cols-2 gap-2">
                                                    {['Open', 'Live', 'Completed', 'Cancelled'].map(s => (
                                                        <button
                                                            key={s}
                                                            onClick={() => handleManualStatusChange(s)}
                                                            disabled={actionLoading || tournament.status === s}
                                                            className={`px-3 py-2 text-[10px] font-bold rounded border transition-all ${tournament.status === s
                                                                ? 'bg-primary text-primary-foreground border-primary opacity-50 cursor-not-allowed'
                                                                : 'bg-background border-border hover:border-primary/50 text-foreground'}`}
                                                        >
                                                            {s}
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>

                                            <div className="h-px bg-red-500/20 my-2" />

                                            {/* Visibility Toggle */}
                                            <button
                                                onClick={async () => {
                                                    if (!confirm('Hide this tournament from users? It will still be visible in admin.')) return;
                                                    setActionLoading(true);
                                                    try {
                                                        const res = await fetch(`/api/admin/tournaments/${tournament._id}`, {
                                                            method: 'PATCH',
                                                            body: JSON.stringify({ isVisible: false }),
                                                            headers: { 'Content-Type': 'application/json' }
                                                        });
                                                        if (res.ok) {
                                                            alert('Tournament hidden from users.');
                                                            onUpdate();
                                                            onBack();
                                                        } else alert('Failed to hide');
                                                    } catch (e) { alert('Error hiding tournament'); }
                                                    setActionLoading(false);
                                                }}
                                                className="w-full py-2 bg-yellow-500/10 hover:bg-yellow-500 text-yellow-600 hover:text-white rounded-lg text-xs font-bold transition-all mb-2"
                                            >
                                                Hide from Users (Soft Delete)
                                            </button>

                                            <button
                                                onClick={handleCancel}
                                                disabled={actionLoading}
                                                className="w-full py-2 bg-red-500/10 hover:bg-red-500 text-red-500 hover:text-white rounded-lg text-xs font-bold transition-all"
                                            >
                                                Cancel Tournament (Refund All)
                                            </button>
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    )}
                </div>

                {/* Right: Tab Content */}
                <div className="lg:col-span-2">
                    <AnimatePresence mode="wait">
                        {activeTab === 'controls' ? (
                            <motion.div
                                key="controls"
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                className="space-y-6"
                            >
                                {/* Workflow Steps */}
                                <div className="relative">
                                    <div className="absolute left-6 top-8 bottom-8 w-0.5 bg-border -z-10" />

                                    {/* Step 1: Room Creds */}
                                    <div className={`relative transition-opacity ${isCompleted ? 'opacity-50 blur-[1px]' : 'opacity-100'}`}>

                                        <div className="bg-card border border-border rounded-2xl p-6 shadow-sm overflow-hidden relative group">
                                            {/* Top Gradient Line */}
                                            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-primary/0 via-primary/50 to-primary/0" />

                                            <div className="flex justify-between items-start mb-6">
                                                <div>
                                                    <h3 className="text-lg font-bold flex items-center gap-2">
                                                        Room Configuration
                                                        {isLive && <span className="text-[10px] bg-green-500 text-black px-2 py-0.5 rounded font-bold">LIVE</span>}
                                                    </h3>
                                                    <p className="text-xs text-muted-foreground mt-1">Set up custom room credentials to notify all participants.</p>
                                                </div>
                                                {isLive && (
                                                    <button
                                                        onClick={() => handleGoLive(true)}
                                                        className="text-[10px] bg-destructive/10 text-destructive px-3 py-1.5 rounded-lg font-bold hover:bg-destructive/20 border border-destructive/20 transition-all flex items-center gap-1.5"
                                                    >
                                                        <ShieldAlert size={12} /> Reset Room
                                                    </button>
                                                )}
                                            </div>

                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 mb-6">
                                                <InputGroup label="Room ID">
                                                    <div className="relative">
                                                        <input
                                                            type="text"
                                                            placeholder="e.g. 12345678"
                                                            value={roomForm.roomID}
                                                            onChange={(e) => setRoomForm({ ...roomForm, roomID: e.target.value })}
                                                            className="w-full bg-muted/40 border border-border hover:border-primary/30 focus:border-primary rounded-xl pl-10 pr-3 py-2.5 text-sm font-mono tracking-wider focus:ring-2 focus:ring-primary/20 transition-all outline-none"
                                                        />
                                                        <div className="absolute left-3 top-2.5 text-muted-foreground pointer-events-none">
                                                            <Gamepad2 size={16} />
                                                        </div>
                                                    </div>
                                                </InputGroup>
                                                <InputGroup label="Password">
                                                    <div className="relative">
                                                        <input
                                                            type="text"
                                                            placeholder="e.g. Pass123"
                                                            value={roomForm.roomPassword}
                                                            onChange={(e) => setRoomForm({ ...roomForm, roomPassword: e.target.value })}
                                                            className="w-full bg-muted/40 border border-border hover:border-primary/30 focus:border-primary rounded-xl pl-10 pr-3 py-2.5 text-sm font-mono tracking-wider focus:ring-2 focus:ring-primary/20 transition-all outline-none"
                                                        />
                                                        <div className="absolute left-3 top-2.5 text-muted-foreground pointer-events-none">
                                                            <MoreVertical size={16} className="rotate-90" />
                                                        </div>
                                                    </div>
                                                </InputGroup>
                                            </div>

                                            {/* Scheduled Release Toggle */}
                                            {!isLive && (
                                                <div className="mb-6 p-4 bg-muted/20 border border-border/50 rounded-xl flex flex-col gap-3">
                                                    <div className="flex items-center justify-between">
                                                        <div className="flex items-center gap-3">
                                                            <div className={`w-10 h-6 rounded-full p-1 transition-colors cursor-pointer ${roomForm.autoRelease ? 'bg-primary' : 'bg-muted-foreground/30'}`} onClick={() => setRoomForm({ ...roomForm, autoRelease: !roomForm.autoRelease })}>
                                                                <div className={`w-4 h-4 bg-white rounded-full shadow transition-transform ${roomForm.autoRelease ? 'translate-x-4' : 'translate-x-0'}`} />
                                                            </div>
                                                            <span className="text-sm font-bold text-foreground cursor-pointer select-none" onClick={() => setRoomForm({ ...roomForm, autoRelease: !roomForm.autoRelease })}>
                                                                Schedule Auto-Reveal
                                                            </span>
                                                        </div>
                                                        {roomForm.autoRelease && (
                                                            <input
                                                                type="time"
                                                                value={roomForm.releaseTime}
                                                                onChange={e => setRoomForm({ ...roomForm, releaseTime: e.target.value })}
                                                                className="bg-transparent border-b border-primary/50 text-foreground font-bold text-sm text-center w-20 focus:outline-none focus:border-primary"
                                                            />
                                                        )}
                                                    </div>
                                                    {roomForm.autoRelease && (
                                                        <div className="text-[10px] text-muted-foreground flex items-center gap-1.5 pl-1">
                                                            <Clock size={10} />
                                                            Credentials will be hidden until {roomForm.releaseTime || 'start time'}.
                                                        </div>
                                                    )}
                                                </div>
                                            )}

                                            {!isLive && !isCompleted && (
                                                <button
                                                    onClick={() => handleGoLive(false)}
                                                    disabled={actionLoading}
                                                    className="w-full py-3.5 bg-gradient-to-r from-primary to-yellow-600 hover:from-primary/90 hover:to-yellow-600/90 text-primary-foreground rounded-xl font-bold font-mono uppercase tracking-wide shadow-lg shadow-primary/25 hover:shadow-primary/40 hover:scale-[1.01] active:scale-[0.99] transition-all flex items-center justify-center gap-2"
                                                >
                                                    {actionLoading ? (
                                                        <span className="animate-pulse">Processing...</span>
                                                    ) : (
                                                        <>
                                                            {roomForm.autoRelease ? <Clock size={18} /> : <Swords size={18} />}
                                                            {roomForm.autoRelease ? 'Schedule Credential Release' : 'Update & Start Match'}
                                                        </>
                                                    )}
                                                </button>
                                            )}

                                            {isLive && (
                                                <div className="bg-green-500/5 border border-green-500/20 rounded-xl p-4 flex items-center gap-4">
                                                    <div className="w-10 h-10 rounded-full bg-green-500/10 flex items-center justify-center text-green-500 shrink-0">
                                                        <CheckCircle size={20} />
                                                    </div>
                                                    <div>
                                                        <h4 className="text-sm font-bold text-green-500">Match is LIVE</h4>
                                                        <p className="text-xs text-muted-foreground">Credentials are currently visible to all players.</p>
                                                    </div>
                                                    <button onClick={() => handleGoLive(false)} className="ml-auto text-xs font-bold text-foreground underline decoration-muted-foreground/50 hover:decoration-foreground transition-all">
                                                        Update Info
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* Result Declaration Removed */}
                                </div>
                            </motion.div>
                        ) : activeTab === 'winners' ? (
                            <motion.div
                                key="winners"
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                            >
                                <div className="bg-card border border-border rounded-2xl p-6 shadow-sm text-center">
                                    <h3 className="text-lg font-bold mb-4">Official Winners</h3>
                                    {isCompleted ? (
                                        <div className="space-y-4">
                                            <div className="p-4 bg-yellow-500/10 rounded-xl border border-yellow-500/20">
                                                <Trophy className="w-8 h-8 text-yellow-500 mx-auto mb-2" />
                                                <div className="text-xl font-bold text-foreground">Winner ID: {winners.rank1 || 'N/A'}</div>
                                                <div className="text-xs text-yellow-600 font-bold uppercase mt-1">1st Place • ${tournament.prizeDistribution.first}</div>
                                            </div>
                                            <div className="grid grid-cols-2 gap-4">
                                                <div className="p-3 bg-gray-500/10 rounded-xl">
                                                    <div className="text-sm font-bold">2nd: {winners.rank2 || 'N/A'}</div>
                                                    <div className="text-[10px] text-muted-foreground">${tournament.prizeDistribution.second}</div>
                                                </div>
                                                <div className="p-3 bg-orange-500/10 rounded-xl">
                                                    <div className="text-sm font-bold">3rd: {winners.rank3 || 'N/A'}</div>
                                                    <div className="text-[10px] text-muted-foreground">${tournament.prizeDistribution.third}</div>
                                                </div>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="py-10 text-muted-foreground">
                                            <Trophy className="w-12 h-12 opacity-20 mx-auto mb-2" />
                                            <p>Winners not yet declared.</p>
                                        </div>
                                    )}
                                </div>
                            </motion.div>
                        ) : (
                            // Participants Tab (Reused from previous step logic, kept intact)
                            <motion.div
                                key="participants"
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                            >
                                <div className="space-y-4">
                                    {/* Winners Selection Card */}
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                        {['rank1', 'rank2', 'rank3'].map((rank, i) => {
                                            const winnerId = (winners as any)[rank];
                                            const winner = tournament.participants?.find(p => (p.userId as any)?._id?.toString() === winnerId?.toString() || p.userId === winnerId);
                                            const placeColors = i === 0 ? 'text-yellow-500 border-yellow-500/20 bg-yellow-500/5'
                                                : i === 1 ? 'text-gray-400 border-gray-400/20 bg-gray-400/5'
                                                    : 'text-orange-600 border-orange-600/20 bg-orange-600/5';

                                            return (
                                                <div key={rank} className={`border rounded-xl p-3 flex flex-col gap-2 relative group ${placeColors}`}>
                                                    <div className="text-[10px] font-bold uppercase opacity-80 flex justify-between">
                                                        <span>Rank {i + 1}</span>
                                                        <span className="font-mono">${i === 0 ? tournament.prizeDistribution.first : i === 1 ? tournament.prizeDistribution.second : tournament.prizeDistribution.third}</span>
                                                    </div>
                                                    {winner ? (
                                                        <>
                                                            <div className="flex items-center gap-3 mb-2">
                                                                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-purple-600 flex items-center justify-center text-xs text-white font-bold shrink-0 overflow-hidden border border-white/20">
                                                                    {(winner.userId as any)?.avatarId ? (
                                                                        <img src={AVATARS.find(a => a.id === (winner.userId as any).avatarId)?.src || AVATARS[0].src} alt="Avatar" className="w-full h-full object-cover" />
                                                                    ) : (
                                                                        <img src={AVATARS[0].src} alt="Avatar" className="w-full h-full object-cover" />
                                                                    )}
                                                                </div>
                                                                <div className="flex-1 min-w-0">
                                                                    <div className="font-bold text-sm truncate">{(winner.userId as any)?.name || 'Unknown'}</div>
                                                                    <div className="text-[10px] font-mono opacity-50 truncate" title={(winner.userId as any)?.email}>
                                                                        {(winner.userId as any)?.email || (winner.userId as any)?.uid || winner.userId}
                                                                    </div>
                                                                </div>
                                                            </div>
                                                            <button
                                                                onClick={() => setWinners({ ...winners, [rank]: '' })}
                                                                className="absolute top-2 right-2 opacity-50 hover:opacity-100 hover:bg-background/20 rounded-full p-1 transition-all"
                                                            >
                                                                <XCircle size={14} />
                                                            </button>
                                                        </>
                                                    ) : (
                                                        <div className="text-sm opacity-40 italic py-1">Select from list</div>
                                                    )}
                                                </div>
                                            );
                                        })}
                                    </div>

                                    {/* Action Header */}
                                    <div className="flex flex-col sm:flex-row gap-4 justify-between items-center bg-card border border-border p-3 rounded-xl">
                                        <div className="relative w-full sm:w-64">
                                            <Search className="absolute left-3 top-2.5 text-muted-foreground w-4 h-4" />
                                            <input
                                                type="text"
                                                placeholder="Search Player..."
                                                className="w-full bg-muted/50 pl-9 pr-4 py-2 rounded-lg text-sm outline-none focus:ring-1 focus:ring-primary border border-transparent focus:border-primary/20"
                                                value={searchTerm}
                                                onChange={e => setSearchTerm(e.target.value)}
                                            />
                                        </div>

                                        <button
                                            onClick={handleFinalize}
                                            disabled={actionLoading || !winners.rank1}
                                            className="w-full sm:w-auto px-6 py-2.5 bg-green-600 hover:bg-green-500 text-white rounded-lg font-bold text-sm shadow-lg shadow-green-900/20 disabled:opacity-50 disabled:grayscale transition-all flex items-center justify-center gap-2"
                                        >
                                            {actionLoading ? <span className="animate-pulse">Processing...</span> : <><DollarSign size={16} /> Distribute Prizes</>}
                                        </button>
                                    </div>

                                    {/* Participants List */}
                                    <div className="bg-card border border-border rounded-xl overflow-hidden shadow-sm">
                                        <div className="max-h-[500px] overflow-y-auto">
                                            <table className="w-full text-sm text-left">
                                                <thead className="text-xs text-muted-foreground uppercase bg-muted/50 sticky top-0 z-10 backdrop-blur-md">
                                                    <tr>
                                                        <th className="px-4 py-3">User</th>
                                                        <th className="px-4 py-3">Details</th>
                                                        <th className="px-4 py-3 text-right">Action</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-border">
                                                    {filteredParticipants.length > 0 ? (
                                                        filteredParticipants.map((p, i) => (
                                                            <tr key={i} className="hover:bg-muted/10 transition-colors group">
                                                                <td className="px-4 py-3">
                                                                    <div className="flex items-center gap-3">
                                                                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-purple-600 flex items-center justify-center text-xs text-white font-bold shrink-0 overflow-hidden">
                                                                            {(p.userId as any)?.avatarId ? (
                                                                                <img src={AVATARS.find(a => a.id === (p.userId as any).avatarId)?.src || AVATARS[0].src} alt="Avatar" className="w-full h-full object-cover" />
                                                                            ) : (
                                                                                <img src={AVATARS[0].src} alt="Avatar" className="w-full h-full object-cover" />
                                                                            )}
                                                                        </div>
                                                                        <div>
                                                                            <div className="font-bold text-foreground line-clamp-1">{(p.userId as any)?.name || 'Unknown'}</div>
                                                                            <div className="text-[10px] text-muted-foreground truncate max-w-[120px]" title={(p.userId as any)?.email}>
                                                                                {(p.userId as any)?.email || 'No Email'}
                                                                            </div>
                                                                        </div>
                                                                    </div>
                                                                </td>
                                                                <td className="px-4 py-3">
                                                                    <div className="flex flex-col gap-0.5">
                                                                        <div className="text-xs font-mono bg-muted/50 px-1.5 py-0.5 rounded w-fit text-foreground/80" title="In-Game Name">
                                                                            {p.ign || p.inGameName || '-'}
                                                                        </div>
                                                                        <div className="text-[10px] font-mono text-muted-foreground">Game ID: {p.uid || (p.userId as any)?.uid || 'N/A'}</div>
                                                                    </div>
                                                                </td>
                                                                <td className="px-4 py-3 text-right">
                                                                    <div className="flex justify-end gap-1 opacity-60 group-hover:opacity-100 transition-opacity">
                                                                        {['rank1', 'rank2', 'rank3'].map((r, idx) => {
                                                                            const userIdStr = (p.userId as any)?._id || p.userId;
                                                                            const isSelected = (winners as any)[r] === userIdStr;
                                                                            const isTaken = (winners as any)[r] && !isSelected;
                                                                            return (
                                                                                <button
                                                                                    key={r}
                                                                                    onClick={() => setWinners(prev => ({ ...prev, [r]: (prev as any)[r] === userIdStr ? '' : userIdStr }))}
                                                                                    disabled={isTaken}
                                                                                    className={`px-3 py-1.5 rounded-lg text-[10px] font-bold border transition-all ${isSelected
                                                                                        ? 'bg-primary text-primary-foreground border-primary shadow-sm scale-105'
                                                                                        : 'bg-transparent border-border hover:bg-primary/10 hover:border-primary/30 text-muted-foreground'}`}
                                                                                    title={`Select as Rank ${idx + 1}`}
                                                                                >
                                                                                    #{idx + 1}
                                                                                </button>
                                                                            )
                                                                        })}
                                                                    </div>
                                                                </td>
                                                            </tr>
                                                        ))
                                                    ) : (
                                                        <tr>
                                                            <td colSpan={3} className="px-4 py-8 text-center text-muted-foreground">
                                                                {searchTerm ? 'No matches found.' : 'No participants joined yet.'}
                                                            </td>
                                                        </tr>
                                                    )}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </div>
        </div>
    );
}

// Helper: Winner Select Dropdown
function WinnerSelect({ rank, prize, value, onChange, participants, color }: any) {
    return (
        <div className="flex items-center gap-4 bg-background p-3 rounded-lg border border-input">
            <div className={`w-32 text-sm font-bold ${color}`}>{rank}</div>
            <div className="text-xs text-muted-foreground font-mono w-16 text-right">+${prize}</div>
            <select
                value={value}
                onChange={e => onChange(e.target.value)}
                className="flex-1 bg-transparent text-foreground outline-none border-none text-sm cursor-pointer"
            >
                <option value="" className="bg-background text-muted-foreground">Select Player...</option>
                {participants.map((p: any) => (
                    <option key={p.userId} value={p.userId} className="bg-background text-foreground">
                        {p.inGameName} {p.uid ? `(${p.uid})` : ''}
                    </option>
                ))}
            </select>
        </div>
    );
}

// Helper: Status Badge
function StatusBadge({ status, size = 'sm' }: { status: string, size?: 'sm' | 'lg' }) {
    const styles: any = {
        Open: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
        Live: 'bg-green-500/10 text-green-500 border-green-500/20 animate-pulse',
        Completed: 'bg-muted text-muted-foreground border-border',
        Cancelled: 'bg-red-500/10 text-red-500 border-red-500/20'
    };

    const icons: any = {
        Open: <Clock size={size === 'lg' ? 18 : 14} />,
        Live: <Swords size={size === 'lg' ? 18 : 14} />,
        Completed: <CheckCircle size={size === 'lg' ? 18 : 14} />,
        Cancelled: <XCircle size={size === 'lg' ? 18 : 14} />
    };

    return (
        <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 font-medium ${size === 'lg' ? 'text-sm px-4 py-1.5' : 'text-xs'} ${styles[status] || styles.Open}`}>
            {icons[status]}
            {status.toUpperCase()}
        </span>
    );
}

// Helper: Input Group
function InputGroup({ label, icon, children }: any) {
    return (
        <div className="space-y-2">
            <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-1.5">
                {icon && <span className="text-primary">{icon}</span>}
                {label}
            </label>
            {children}
        </div>
    );
}
