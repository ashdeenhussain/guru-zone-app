'use client';

import { useState, useEffect } from 'react';
import { Crown, Trophy, Calendar, Users, Swords, Shield, AlertTriangle, CheckCircle2, Clock, ArrowLeft, MapPin, Coins, Check, ChevronRight, Copy, Lock, Unlock, Bell, Share2 } from 'lucide-react';
import { AVATARS } from '@/lib/avatars';
import JoinTournamentModal from '@/components/JoinTournamentModal';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import ThemeToggle from '@/components/ThemeToggle';

interface Tournament {
    _id: string;
    title: string;
    format: 'Solo' | 'Duo' | 'Squad';
    gameType: string;
    map: string;
    entryFee: number;
    prizePool: number;
    maxSlots: number;
    joinedCount: number;
    startTime: string; // ISO string
    autoReleaseTime?: string; // ISO string
    participants: any[];
    status: string;
    description?: string;
    rules?: string;
    prizeType?: 'TOP 3' | 'TOP 5' | 'TOP 10';
    prizeDistribution: {
        first: number;
        second: number;
        third: number;
        fourth: number;
        fifth: number;
        sixth: number;
        seventh: number;
        eighth: number;
        ninth: number;
        tenth: number;
    };
    winners?: {
        rank1?: string;
        rank2?: string;
        rank3?: string;
        rank4?: string;
        rank5?: string;
        rank6?: string;
        rank7?: string;
        rank8?: string;
        rank9?: string;
        rank10?: string;
    };
    cancellationReason?: string;
    isRoomReady?: boolean; // Injected from server
}

interface User {
    _id: string;
    walletBalance: number;
    name?: string;
    avatarId?: number;
    inGameName?: string;
    freeFireUid?: string;
}

interface TournamentDetailsClientProps {
    tournament: Tournament;
    user: User | null;
}

export default function TournamentDetailsClient({ tournament, user }: TournamentDetailsClientProps) {
    const router = useRouter();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [hasJoined, setHasJoined] = useState(false);
    const [credentials, setCredentials] = useState<{ roomID?: string; roomPassword?: string } | null>(null);
    const [timeLeft, setTimeLeft] = useState<string>('');
    const [canShowCredentials, setCanShowCredentials] = useState(false);
    const [copiedId, setCopiedId] = useState(false);
    const [copiedPass, setCopiedPass] = useState(false);
    const [loadingCredentials, setLoadingCredentials] = useState(false);
    const [activeTab, setActiveTab] = useState<'registration' | 'room' | 'prizes' | 'teams' | 'winners'>('registration');
    const [showRoomDot, setShowRoomDot] = useState(false);

    // Default to winners tab if tournament is completed
    useEffect(() => {
        if (tournament.status === 'Completed' || tournament.status === 'completed') {
            setActiveTab('winners');
        }
    }, [tournament.status]);

    useEffect(() => {
        if (user && tournament.participants) {
            const isParticipant = tournament.participants.some((p: any) => p.userId === user._id || p.userId?._id === user._id);
            setHasJoined(isParticipant);
        }
    }, [user, tournament]);

    useEffect(() => {
        // Countdown timer for Room Credentials
        const releaseTime = new Date(tournament.autoReleaseTime || tournament.startTime).getTime();

        const timer = setInterval(() => {
            const now = new Date().getTime();
            const difference = releaseTime - now;

            if (difference <= 0 || tournament.status === 'Live') {
                setCanShowCredentials(true);
                setTimeLeft('Available Now');
                clearInterval(timer);
            } else {
                const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
                const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
                const seconds = Math.floor((difference % (1000 * 60)) / 1000);
                setTimeLeft(`${hours}h ${minutes}m ${seconds}s`);
            }
        }, 1000);

        return () => clearInterval(timer);
    }, [tournament]);

    // Handle Room Notification Dot
    useEffect(() => {
        if (hasJoined && (tournament as any).isRoomReady) {
            const seenKey = `seen_room_${tournament._id}`;
            const isSeen = localStorage.getItem(seenKey);
            
            if (!isSeen && activeTab !== 'room') {
                setShowRoomDot(true);
            }
        }
    }, [hasJoined, (tournament as any).isRoomReady, tournament._id, activeTab]);

    // Mark as seen when switching to Room tab
    useEffect(() => {
        if (activeTab === 'room' && showRoomDot) {
            setShowRoomDot(false);
            localStorage.setItem(`seen_room_${tournament._id}`, 'true');
        }
    }, [activeTab, showRoomDot, tournament._id]);

    const handleJoinClick = () => {
        if (!user) {
            alert('Please login to join');
            return;
        }
        if (user.walletBalance < tournament.entryFee) {
            alert('Insufficient Balance! Please recharge your wallet.');
            return;
        }
        setIsModalOpen(true);
    };

    const fetchCredentials = async () => {
        if (!hasJoined || !canShowCredentials) return;
        setLoadingCredentials(true);
        try {
            const res = await fetch(`/api/tournaments/${tournament._id}/credentials`);
            const data = await res.json();
            if (res.ok) {
                setCredentials(data);
            } else {
                alert(data.message);
            }
        } catch (err) {
            console.error(err);
        } finally {
            setLoadingCredentials(false);
        }
    };

    const copyToClipboard = (text: string, type: 'id' | 'pass') => {
        navigator.clipboard.writeText(text);
        if (type === 'id') {
            setCopiedId(true);
            setTimeout(() => setCopiedId(false), 2000);
        } else {
            setCopiedPass(true);
            setTimeout(() => setCopiedPass(false), 2000);
        }
    };

    return (
        <div className="min-h-screen bg-background pb-24 relative overflow-hidden">
            {/* Background Effects matching Dashboard */}
            <div className="fixed top-0 left-0 w-full h-[500px] bg-gradient-to-b from-primary/10 to-transparent pointer-events-none" />
            <div className="fixed top-[-10%] right-[-10%] w-[500px] h-[500px] bg-primary/5 rounded-full blur-[100px] pointer-events-none" />

            {/* Standard Sub-Header with Back Navigation */}
            <div className="pt-3 pb-3 px-4 border-b border-white/5 bg-background/60 backdrop-blur-xl sticky top-0 z-50 mb-0 flex items-center gap-4 relative z-10">
                <Link href="/dashboard/tournaments" className="p-2.5 hover:bg-white/10 rounded-2xl transition-all active:scale-90 border border-transparent hover:border-white/5">
                    <ArrowLeft className="w-5 h-5 text-foreground" />
                </Link>
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                        <span className={`w-2 h-2 rounded-full shadow-[0_0_8px] ${tournament.status === 'Open' ? 'bg-emerald-500 shadow-emerald-500/50' :
                                tournament.status === 'Live' ? 'bg-red-500 shadow-red-500/50 animate-pulse' :
                                    'bg-amber-500 shadow-amber-500/50'
                            }`} />
                        <h1 className="font-black text-sm uppercase tracking-tighter italic truncate text-foreground/90">
                            {tournament.title}
                        </h1>
                    </div>
                    <div className="flex items-center gap-2 opacity-50 px-0.5">
                        <span className="text-[9px] font-black uppercase tracking-[0.2em] leading-none">
                            {tournament.status} • {tournament.format} • {tournament.map}
                        </span>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <button className="p-2.5 bg-white/5 rounded-xl border border-white/5 hover:bg-white/10 transition-colors">
                        <Share2 size={16} className="text-foreground/70" />
                    </button>
                </div>
            </div>

            <div className="container mx-auto px-4 relative z-10 max-w-4xl pt-2 space-y-4">

                {/* Title Section - Premium Match Header */}
                <div className="flex flex-col gap-2 relative pt-2">
                    <div className="absolute -left-4 top-2 w-1 h-16 bg-gradient-to-b from-primary via-primary/50 to-transparent rounded-full opacity-50" />

                    <div className="flex flex-col gap-2">
                        <div className="flex flex-wrap items-center gap-2">
                            <span className={`px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-[0.1em] border-2 shadow-sm ${tournament.status === 'Open' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' :
                                    tournament.status === 'Live' ? 'bg-red-500/10 text-red-500 border-red-500/30' :
                                        'bg-amber-500/10 text-amber-500 border-amber-500/30'
                                }`}>
                                {tournament.status === 'Open' ? 'Registration Open' : tournament.status}
                            </span>
                            <div className="flex items-center gap-1.5 px-2 py-0.5 bg-white/5 border border-white/10 rounded-full text-[9px] font-bold text-muted-foreground uppercase tracking-widest">
                                <Clock size={10} className="text-primary" />
                                {tournament.startTime ? "Starts Soon" : "Concluded"}
                            </div>
                        </div>

                        <h1 className="text-2xl md:text-4xl font-black text-foreground tracking-[-0.04em] uppercase leading-[0.85] italic py-0.5">
                            {tournament.title.split(' ').map((word, i) => (
                                <span key={i} className={i % 2 === 1 ? 'text-primary' : ''}>{word}{' '}</span>
                            ))}
                        </h1>

                        <div className="flex flex-wrap items-center gap-2 mt-1">
                            {[
                                { icon: Calendar, text: new Date(tournament.startTime).toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }), color: 'text-amber-500', bg: 'bg-amber-500/10' },
                                { icon: MapPin, text: tournament.map, color: 'text-indigo-500', bg: 'bg-indigo-500/10' },
                                { icon: Users, text: tournament.format, color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
                            ].map((item, i) => (
                                <div key={i} className="flex items-center gap-1.5 px-2 py-1 bg-card/40 backdrop-blur-md rounded-lg border border-white/5 shadow-sm group hover:border-white/10 transition-colors">
                                    <div className={`p-0.5 ${item.bg} ${item.color} rounded group-hover:scale-110 transition-transform`}>
                                        <item.icon size={12} />
                                    </div>
                                    <span className="text-[10px] font-black uppercase tracking-wider text-foreground/80">{item.text}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* --- MODERN TABS NAVIGATION --- */}
                <div className="sticky top-16 z-20 -mx-4 px-4 py-1.5 bg-background/80 backdrop-blur-xl border-y border-border/40">
                    <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-hide no-scrollbar px-1">
                        {[
                            { id: 'registration', label: 'Join', icon: Shield, show: tournament.status !== 'Completed' && tournament.status !== 'completed' },
                            { id: 'winners', label: 'Winners', icon: Trophy, show: tournament.status === 'Completed' || tournament.status === 'completed' },
                            { id: 'room', label: 'Room Details', icon: Lock, show: true },
                            { id: 'prizes', label: 'Prize Pool', icon: Trophy, show: true },
                            { id: 'teams', label: 'Joined Teams', icon: Users, show: true },
                        ].filter(t => t.show).map((tab) => {
                            const Icon = tab.icon;
                            const isActive = activeTab === tab.id;
                            return (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id as any)}
                                    className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-xs transition-all whitespace-nowrap border-2 relative ${isActive
                                            ? 'bg-primary/10 border-primary text-primary shadow-[0_0_15px_rgba(var(--primary),0.1)] scale-105'
                                            : 'bg-muted/50 border-transparent text-muted-foreground hover:bg-muted hover:border-border/50'
                                        }`}
                                >
                                    <Icon size={16} className={isActive ? 'animate-pulse' : ''} />
                                    {tab.label}
                                    {tab.id === 'room' && showRoomDot && (
                                        <span className="absolute -top-1 -right-1 flex h-4 w-4">
                                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                                            <span className="relative inline-flex rounded-full h-4 w-4 bg-red-500 border-2 border-background"></span>
                                        </span>
                                    )}
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* CANCELLATION NOTICE */}
                {tournament.status === 'Cancelled' && (
                    <div className="bg-red-500/5 border border-red-500/20 rounded-2xl p-6 shadow-sm animate-in fade-in slide-in-from-top-4 relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-red-500/10 rounded-full blur-[40px] pointer-events-none" />
                        <div className="relative z-10 flex flex-col md:flex-row items-center md:items-start gap-4 text-center md:text-left">
                            <div className="p-3 bg-red-500/10 rounded-xl text-red-600">
                                <AlertTriangle size={32} />
                            </div>
                            <div className="space-y-1">
                                <h3 className="text-xl font-bold text-red-600 flex flex-col md:flex-row items-center gap-2">
                                    Tournament Cancelled
                                </h3>
                                <p className="text-foreground/80 font-medium">
                                    Reason: <span className="text-foreground italic">"{tournament.cancellationReason || 'Administrative Decision'}"</span>
                                </p>
                                <p className="text-sm text-muted-foreground mt-2">
                                    Entry fees have been automatically refunded to all joined participants.
                                </p>
                            </div>
                        </div>
                    </div>
                )}

                {/* Main Stats Grid */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <div className="relative overflow-hidden bg-card/50 backdrop-blur-xl border border-border/50 p-3 rounded-2xl group hover:border-yellow-500/30 transition-all shadow-sm">
                        <div className="absolute right-0 bottom-0 w-16 h-16 bg-yellow-500/10 blur-[40px] rounded-full pointer-events-none" />
                        <Coins className="text-yellow-500 mb-1" size={20} />
                        <div className="text-xs text-muted-foreground font-semibold uppercase tracking-wider">Prize Pool</div>
                        <div className="text-xl font-bold text-foreground">{tournament.prizePool} <span className="text-sm font-normal text-muted-foreground">Coins</span></div>
                    </div>

                    <div className="relative overflow-hidden bg-card/50 backdrop-blur-xl border border-border/50 p-4 rounded-2xl group hover:border-indigo-500/30 transition-all shadow-sm">
                        <div className="absolute right-0 bottom-0 w-16 h-16 bg-indigo-500/10 blur-[40px] rounded-full pointer-events-none" />
                        <Trophy className="text-indigo-500 mb-2" size={24} />
                        <div className="text-xs text-muted-foreground font-semibold uppercase tracking-wider">Entry Fee</div>
                        <div className="text-xl font-bold text-foreground">{tournament.entryFee} <span className="text-sm font-normal text-muted-foreground">Coins</span></div>
                    </div>

                    <div className="relative overflow-hidden bg-card/50 backdrop-blur-xl border border-border/50 p-4 rounded-2xl group hover:border-cyan-500/30 transition-all shadow-sm">
                        <div className="absolute right-0 bottom-0 w-16 h-16 bg-cyan-500/10 blur-[40px] rounded-full pointer-events-none" />
                        <Users className="text-cyan-500 mb-2" size={24} />
                        <div className="text-xs text-muted-foreground font-semibold uppercase tracking-wider">Slots</div>
                        <div className="text-xl font-bold text-foreground">{tournament.joinedCount}<span className="text-muted-foreground">/</span>{tournament.maxSlots}</div>
                    </div>

                    <div className="relative overflow-hidden bg-card/50 backdrop-blur-xl border border-border/50 p-4 rounded-2xl group hover:border-emerald-500/30 transition-all shadow-sm">
                        <div className="absolute right-0 bottom-0 w-16 h-16 bg-emerald-500/10 blur-[40px] rounded-full pointer-events-none" />
                        <Clock className="text-emerald-500 mb-2" size={24} />
                        <div className="text-xs text-muted-foreground font-semibold uppercase tracking-wider">Mode</div>
                        <div className="text-xl font-bold text-foreground">{tournament.gameType}</div>
                    </div>
                </div>


                {/* --- TAB CONTENT AREA --- */}
                <div className="min-h-[400px]">
                    {activeTab === 'winners' && (
                        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-6 duration-700">
                             {/* Champions Podium Section */}
                             <div className="relative pt-6 md:pt-12 pb-4 md:pb-8">
                                 {/* Background Aura */}
                                 <div className="absolute inset-x-0 top-0 h-96 bg-gradient-to-b from-primary/10 via-transparent to-transparent blur-[120px] pointer-events-none" />
                                 
                                 <div className="relative text-center mb-6 md:mb-12">
                                     <h2 className="text-3xl md:text-6xl font-black text-foreground tracking-tighter uppercase italic leading-[0.8] mb-2">
                                         Champions <span className="text-primary italic">Declared</span>
                                     </h2>
                                     <p className="text-muted-foreground font-bold tracking-[0.2em] md:tracking-[0.3em] uppercase text-[8px] md:text-[10px]">Victory Has Been Claimed</p>
                                     <div className="flex justify-center mt-4 md:mt-6">
                                         <div className="px-4 md:px-6 py-1.5 md:py-2 bg-primary/10 border border-primary/20 rounded-full flex items-center gap-2">
                                             <Trophy size={14} className="text-primary animate-bounce md:w-[18px] md:h-[18px]" />
                                             <span className="text-[10px] md:text-sm font-black text-primary uppercase">Elite Match Hall of Fame</span>
                                         </div>
                                     </div>
                                 </div>

                                 <div className="flex items-end justify-center gap-1.5 md:gap-4 px-1 md:px-2 max-w-4xl mx-auto">
                                     {tournament.winners?.rank2 && (
                                     <div className="flex-1 order-1 group animate-in slide-in-from-bottom-12 duration-700 delay-100">
                                         <div className="flex flex-col items-center">
                                             <div className="relative mb-2 md:mb-4">
                                                 <div className="absolute inset-0 bg-slate-400/20 blur-2xl rounded-full scale-150 rotate-12 opacity-0 group-hover:opacity-100 transition-opacity" />
                                                 <div className="relative w-16 h-16 sm:w-20 s:h-20 md:w-28 md:h-28 rounded-full p-0.5 md:p-1 bg-gradient-to-tr from-slate-500 to-slate-200 border-2 border-white/20 shadow-2xl overflow-hidden backdrop-blur-xl">
                                                     <div className="w-full h-full rounded-full overflow-hidden bg-background/50">
                                                        <img 
                                                            src={AVATARS.find(a => a.id === (tournament.winners?.rank2 as any)?.avatarId)?.src || AVATARS[0].src} 
                                                            className="w-full h-full object-cover" 
                                                            alt="Winner"
                                                        />
                                                     </div>
                                                 </div>
                                                 <div className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 bg-slate-500 text-white text-[7px] md:text-[9px] font-black px-2 md:px-3 py-0.5 md:py-1 rounded-full shadow-lg border border-white/10 uppercase tracking-tighter whitespace-nowrap">Silver</div>
                                             </div>
                                             <div className="w-full h-[100px] md:h-[200px] bg-slate-500/10 backdrop-blur-xl border-x border-t border-slate-500/20 rounded-t-[1.5rem] md:rounded-t-[2.5rem] flex flex-col items-center p-2 md:p-4 transition-all group-hover:bg-slate-500/20">
                                                 <span className="text-[10px] md:text-base font-black text-foreground truncate w-full text-center">{(tournament.winners?.rank2 as any)?.name || "Challenger"}</span>
                                                 <span className="text-[8px] md:text-[10px] text-muted-foreground font-bold mt-0.5 md:mt-1">ID: {(tournament.winners?.rank2 as any)?.freeFireUid || "—"}</span>
                                                 <div className="mt-auto px-2 md:px-4 py-1 md:py-2 bg-slate-500/20 rounded-xl md:rounded-2xl flex items-center gap-1 border border-slate-500/30">
                                                     <Coins size={10} className="text-slate-400 md:w-3.5 md:h-3.5" />
                                                     <span className="text-[9px] md:text-xs font-black text-slate-300">{tournament.prizeDistribution.second}</span>
                                                 </div>
                                             </div>
                                         </div>
                                     </div>
                                     )}

                                     {/* Rank 1 - Gold */}
                                     {tournament.winners?.rank1 && (
                                     <div className="flex-1 order-2 z-10 group animate-in slide-in-from-bottom-16 duration-700">
                                         <div className="flex flex-col items-center">
                                             <div className="relative mb-3 md:mb-6">
                                                 <div className="absolute inset-0 bg-primary/30 blur-[40px] rounded-full scale-150 animate-pulse" />
                                                 <div className="relative w-20 h-20 sm:w-24 s:h-24 md:w-40 md:h-40 rounded-full p-1 md:p-1.5 bg-gradient-to-tr from-primary to-yellow-200 border-2 md:border-4 border-primary/40 shadow-[0_0_50px_rgba(var(--primary),0.3)] overflow-hidden backdrop-blur-xl">
                                                     <div className="w-full h-full rounded-full overflow-hidden bg-background">
                                                        <img 
                                                            src={AVATARS.find(a => a.id === (tournament.winners?.rank1 as any)?.avatarId)?.src || AVATARS[0].src} 
                                                            className="w-full h-full object-cover scale-110 group-hover:scale-125 transition-transform duration-700" 
                                                            alt="Winner"
                                                        />
                                                     </div>
                                                 </div>
                                                 <div className="absolute -top-3 md:-top-4 left-1/2 -translate-x-1/2 scale-110 md:scale-150 drop-shadow-lg">👑</div>
                                                 <div className="absolute -bottom-2 md:-bottom-3 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground text-[7px] md:text-xs font-black px-2 md:px-5 py-1 md:py-1.5 rounded-full shadow-2xl border md:border-2 border-white/20 whitespace-nowrap uppercase tracking-tighter">Grand Champion</div>
                                             </div>
                                             <div className="w-full h-[130px] md:h-[260px] bg-primary/10 backdrop-blur-3xl border-x border-t border-primary/30 rounded-t-[2rem] md:rounded-t-[3rem] flex flex-col items-center p-3 md:p-6 transition-all group-hover:bg-primary/15 shadow-[0_-20px_50px_-10px_rgba(var(--primary),0.1)]">
                                                 <span className="text-[12px] md:text-2xl font-black text-foreground truncate w-full text-center">{(tournament.winners?.rank1 as any)?.name || "Alpha Player"}</span>
                                                 <span className="text-[8px] md:text-xs text-primary/70 font-black mt-0.5 md:mt-1 tracking-wider uppercase">ID: {(tournament.winners?.rank1 as any)?.freeFireUid || "—"}</span>
                                                 <div className="mt-auto px-3 md:px-6 py-1.5 md:py-3 bg-primary text-primary-foreground rounded-xl md:rounded-[1.5rem] flex items-center gap-1 md:gap-2 shadow-[0_10px_20px_rgba(var(--primary),0.3)] border border-white/20">
                                                     <Coins size={12} className="md:w-4.5 md:h-4.5" />
                                                     <span className="text-[11px] md:text-xl font-black">{tournament.prizeDistribution.first}</span>
                                                 </div>
                                             </div>
                                         </div>
                                     </div>
                                     )}

                                     {/* Rank 3 - Bronze/Orange */}
                                     {tournament.winners?.rank3 && (
                                     <div className="flex-1 order-3 group animate-in slide-in-from-bottom-12 duration-700 delay-200">
                                         <div className="flex flex-col items-center">
                                             <div className="relative mb-2 md:mb-4">
                                                 <div className="absolute inset-0 bg-orange-500/20 blur-2xl rounded-full scale-150 -rotate-12 opacity-0 group-hover:opacity-100 transition-opacity" />
                                                 <div className="relative w-14 h-14 sm:w-18 s:h-18 md:w-28 md:h-28 rounded-full p-0.5 md:p-1 bg-gradient-to-tr from-orange-700 to-orange-400 border-2 border-white/20 shadow-2xl overflow-hidden backdrop-blur-xl">
                                                     <div className="w-full h-full rounded-full overflow-hidden bg-background/50">
                                                        <img 
                                                            src={AVATARS.find(a => a.id === (tournament.winners?.rank3 as any)?.avatarId)?.src || AVATARS[0].src} 
                                                            className="w-full h-full object-cover" 
                                                            alt="Winner"
                                                        />
                                                     </div>
                                                 </div>
                                                 <div className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 bg-orange-600 text-white text-[7px] md:text-[9px] font-black px-2 md:px-3 py-0.5 md:py-1 rounded-full shadow-lg border border-white/10 uppercase tracking-tighter whitespace-nowrap">Bronze</div>
                                             </div>
                                             <div className="w-full h-[80px] md:h-[160px] bg-orange-500/10 backdrop-blur-xl border-x border-t border-orange-500/20 rounded-t-[1.5rem] md:rounded-t-[2.5rem] flex flex-col items-center p-2 md:p-4 transition-all group-hover:bg-orange-500/20">
                                                 <span className="text-[10px] md:text-base font-black text-foreground truncate w-full text-center">{(tournament.winners?.rank3 as any)?.name || "Elite Pro"}</span>
                                                 <span className="text-[8px] md:text-[10px] text-muted-foreground font-bold mt-0.5 md:mt-1">ID: {(tournament.winners?.rank3 as any)?.freeFireUid || "—"}</span>
                                                 <div className="mt-auto px-2 md:px-4 py-1 md:py-2 bg-orange-500/20 rounded-xl md:rounded-2xl flex items-center gap-1 border border-orange-500/30">
                                                     <Coins size={10} className="text-orange-400 md:w-3.5 md:h-3.5" />
                                                     <span className="text-[9px] md:text-xs font-black text-orange-300">{tournament.prizeDistribution.third}</span>
                                                 </div>
                                             </div>
                                         </div>
                                     </div>
                                     )}
                                 </div>
                             </div>

                             {/* Elite Contenders (Top 4-10) */}
                             <div className="bg-card/30 backdrop-blur-xl border border-white/5 rounded-[1.5rem] md:rounded-[2.5rem] p-4 md:p-6 mb-8 md:mb-12">
                                 <div className="flex items-center gap-4 mb-4 md:mb-6">
                                     <div className="h-[1px] flex-1 bg-gradient-to-r from-transparent to-border/40" />
                                     <span className="text-[8px] md:text-[10px] font-black text-muted-foreground uppercase tracking-[0.4em] opacity-40">Elite Contenders</span>
                                     <div className="h-[1px] flex-1 bg-gradient-to-l from-transparent to-border/40" />
                                 </div>
                                 
                                 <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
                                     {[
                                         { key: 'rank4', label: '4TH', prize: tournament.prizeDistribution.fourth },
                                         { key: 'rank5', label: '5TH', prize: tournament.prizeDistribution.fifth },
                                         { key: 'rank6', label: '6TH', prize: tournament.prizeDistribution.sixth },
                                         { key: 'rank7', label: '7TH', prize: tournament.prizeDistribution.seventh },
                                         { key: 'rank8', label: '8TH', prize: tournament.prizeDistribution.eighth },
                                         { key: 'rank9', label: '9TH', prize: tournament.prizeDistribution.ninth },
                                         { key: 'rank10', label: '10TH', prize: tournament.prizeDistribution.tenth },
                                     ].map((rank, i) => {
                                         const winner = (tournament.winners as any)?.[rank.key];
                                         if (!rank.prize && !winner) return null;
                                         return (
                                             <div key={rank.key} className="relative group bg-muted/30 border border-white/5 rounded-2xl p-3 flex flex-col items-center gap-2 hover:bg-muted/50 transition-all hover:scale-105">
                                                 <div className="w-10 h-10 rounded-full border border-border/50 overflow-hidden bg-background/50">
                                                     {winner ? (
                                                         <img src={AVATARS.find(a => a.id === (winner as any).avatarId)?.src || AVATARS[0].src} className="w-full h-full object-cover" alt="Contender" />
                                                     ) : <Users size={16} className="text-muted-foreground m-auto h-full" />}
                                                 </div>
                                                 <div className="text-center">
                                                     <div className="text-[9px] font-black text-primary/70">{rank.label}</div>
                                                     <div className="text-[10px] font-bold text-foreground truncate max-w-[80px]">{(winner as any)?.name || "Elite Player"}</div>
                                                 </div>
                                                 <div className="mt-auto px-2 py-1 bg-primary/10 rounded-lg flex items-center gap-1 border border-primary/10">
                                                     <Coins size={10} className="text-primary" />
                                                     <span className="text-[10px] font-black text-primary">{rank.prize}</span>
                                                 </div>
                                             </div>
                                         );
                                     })}
                                 </div>
                             </div>
                        </div>
                    )}

                    {activeTab === 'registration' && (
                        <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4">
                            {/* Registration Status Section */}
                            <div className="bg-gradient-to-br from-card/80 to-card/40 backdrop-blur-xl border border-border/50 rounded-3xl p-5 md:p-8 shadow-sm relative overflow-hidden group">
                                <div className="absolute top-0 right-0 w-48 h-48 bg-blue-500/10 rounded-bl-full -mr-12 -mt-12 pointer-events-none transition-opacity" />
                                <div className="relative z-10">
                                    <h2 className="text-xl font-bold text-foreground mb-3 flex items-center gap-2">
                                        <div className="p-1.5 bg-blue-500/10 text-blue-500 rounded-lg border border-blue-500/20">
                                            <Shield size={20} />
                                        </div>
                                        Registration
                                    </h2>
                                    {hasJoined ? (
                                        <div className="space-y-4">
                                            <div className="flex items-center gap-3 bg-emerald-500/10 text-emerald-500 px-4 py-3 rounded-xl border border-emerald-500/20 w-full">
                                                <div className="p-1 bg-emerald-500/20 rounded-full"><Check size={20} /></div>
                                                <div>
                                                    <span className="font-bold text-base block">Registration Confirmed</span>
                                                    <span className="text-xs opacity-80">You are ready for the battle. Good luck!</span>
                                                </div>
                                            </div>
                                            <p className="text-xs text-muted-foreground pl-1">
                                                Go to the <span className="text-foreground font-bold">Room Details</span> tab when the timer hits zero.
                                            </p>
                                        </div>
                                    ) : tournament.joinedCount >= tournament.maxSlots ? (
                                        <div className="bg-red-500/10 text-red-500 px-5 py-6 rounded-2xl border border-red-500/20 w-full text-center">
                                            <span className="font-bold text-xl block mb-1">Registration Full</span>
                                            <span className="text-sm opacity-80">All slots are occupied. Catch the next one!</span>
                                        </div>
                                    ) : (
                                        <div className="flex flex-col gap-4">
                                            <p className="text-muted-foreground text-base leading-relaxed max-w-lg">
                                                Participate in this tournament to win <span className="text-yellow-500 font-bold">{tournament.prizePool} Coins</span>.
                                                Entry fee of <span className="text-foreground font-bold">{tournament.entryFee} Coins</span> will be deducted.
                                            </p>
                                            <div className="flex flex-wrap gap-4">
                                                <button
                                                    onClick={handleJoinClick}
                                                    className="flex-1 min-w-[160px] bg-primary hover:bg-primary/90 text-primary-foreground text-base font-bold py-3.5 px-6 rounded-xl shadow-lg shadow-primary/25 transition-all active:scale-[0.98] flex items-center justify-center gap-2 group/btn"
                                                >
                                                    Join Match
                                                    <ChevronRight className="group-hover/btn:translate-x-1 transition-transform" />
                                                </button>
                                                <Link href="/dashboard/wallet" className="flex-1 min-w-[160px] bg-muted hover:bg-muted/80 text-foreground text-sm font-bold py-3.5 px-6 rounded-xl border border-border transition-all flex items-center justify-center gap-2">
                                                    Add Funds
                                                </Link>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'room' && (
                        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
                            {/* Room Credentials Section */}
                            <div className="bg-card/30 backdrop-blur-xl border border-border/50 rounded-3xl p-6 md:p-8 shadow-sm relative flex flex-col group min-h-[300px]">
                                <div className="absolute inset-0 bg-gradient-to-b from-purple-500/5 to-transparent pointer-events-none rounded-3xl" />
                                <h2 className="text-2xl font-bold text-foreground mb-6 flex items-center gap-3 relative z-10">
                                    <span className="p-2 bg-purple-500/10 text-purple-500 rounded-xl border border-purple-500/20">
                                        <Lock size={24} />
                                    </span>
                                    Room Credentials
                                </h2>

                                <div className="flex-1 flex flex-col justify-center relative z-10 max-w-md mx-auto w-full">
                                    {!hasJoined ? (
                                        <div className="flex flex-col items-center justify-center text-center text-muted-foreground py-12 border-2 border-dashed border-border/50 rounded-3xl bg-muted/20">
                                            <div className="p-4 bg-muted/50 rounded-full mb-4">
                                                <Lock size={40} className="opacity-50" />
                                            </div>
                                            <span className="font-bold text-lg">Access Denied</span>
                                            <span className="text-sm opacity-60">You must register to view room details</span>
                                        </div>
                                    ) : (
                                        <div className="flex flex-col gap-6 w-full">
                                            {!canShowCredentials ? (
                                                <div className="bg-muted/30 rounded-3xl p-8 text-center border border-border/50 relative overflow-hidden group">
                                                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-primary/5 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
                                                    <p className="text-xs text-muted-foreground font-black uppercase tracking-[0.3em] mb-3">Locked Until Reveal</p>
                                                    <p className="text-4xl font-mono text-foreground font-black tracking-[0.15em]">{timeLeft}</p>
                                                    <div className="mt-4 flex items-center justify-center gap-2 text-[10px] font-bold text-muted-foreground/60 uppercase">
                                                        <Clock size={12} />
                                                        Refreshes Automatically
                                                    </div>
                                                </div>
                                            ) : (
                                                <>
                                                    {!credentials ? (
                                                        <button
                                                            onClick={fetchCredentials}
                                                            disabled={loadingCredentials}
                                                            className="w-full bg-purple-600 hover:bg-purple-500 text-white font-bold py-5 rounded-2xl transition-all flex items-center justify-center gap-3 shadow-xl shadow-purple-500/20 active:scale-[0.98]"
                                                        >
                                                            {loadingCredentials ? <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Unlock size={24} />}
                                                            REVEAL ROOM ID & PASS
                                                        </button>
                                                    ) : (
                                                        <div className="space-y-4 animate-in zoom-in-95">
                                                            <div className="bg-background/80 rounded-2xl p-5 border border-border shadow-sm">
                                                                <div className="text-[10px] text-muted-foreground font-black mb-1 uppercase tracking-widest">Room ID</div>
                                                                <div className="flex justify-between items-center">
                                                                    <span className="font-mono text-foreground text-3xl font-black tracking-widest">{credentials.roomID}</span>
                                                                    <button onClick={() => copyToClipboard(credentials.roomID!, 'id')} className="p-3 hover:bg-muted rounded-xl transition-colors border border-transparent hover:border-border">
                                                                        {copiedId ? <Check size={20} className="text-emerald-500" /> : <Copy size={20} className="text-muted-foreground" />}
                                                                    </button>
                                                                </div>
                                                            </div>
                                                            <div className="bg-background/80 rounded-2xl p-5 border border-border shadow-sm">
                                                                <div className="text-[10px] text-muted-foreground font-black mb-1 uppercase tracking-widest">Password</div>
                                                                <div className="flex justify-between items-center">
                                                                    <span className="font-mono text-foreground text-3xl font-black tracking-widest">{credentials.roomPassword}</span>
                                                                    <button onClick={() => copyToClipboard(credentials.roomPassword!, 'pass')} className="p-3 hover:bg-muted rounded-xl transition-colors border border-transparent hover:border-border">
                                                                        {copiedPass ? <Check size={20} className="text-emerald-500" /> : <Copy size={20} className="text-muted-foreground" />}
                                                                    </button>
                                                                </div>
                                                            </div>
                                                            <div className="text-center text-[10px] text-emerald-500 font-black mt-2 flex items-center justify-center gap-3 bg-emerald-500/5 py-3 rounded-xl border border-emerald-500/10 uppercase tracking-widest">
                                                                <span className="relative flex h-3 w-3">
                                                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                                                    <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
                                                                </span>
                                                                Room is now live
                                                            </div>
                                                        </div>
                                                    )}
                                                </>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'prizes' && (
                        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
                             {/* Prize Breakdown Section */}
                            <div className="bg-card/40 backdrop-blur-xl border border-border/50 rounded-[2rem] p-6 md:p-8 shadow-2xl relative overflow-hidden group">
                                <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-[80px] -mr-32 -mt-32 pointer-events-none group-hover:bg-primary/10 transition-colors duration-700" />

                                <div className="flex items-center justify-between mb-8 relative z-10">
                                    <h2 className="text-2xl font-black text-foreground tracking-tight flex items-center gap-3">
                                        <div className="p-2 bg-yellow-500/10 text-yellow-500 rounded-xl border border-yellow-500/20 shadow-sm">
                                            <Trophy size={24} />
                                        </div>
                                        Prize Allocation
                                    </h2>
                                    <div className="flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 text-primary border border-primary/20 text-[10px] font-black uppercase tracking-widest">
                                        {tournament.prizeType || 'TOP 3'}
                                    </div>
                                </div>

                                <div className={`grid gap-2 relative z-10 ${(tournament.prizeType || 'TOP 3').toString().toUpperCase().trim() === 'TOP 3' ? 'grid-cols-3' :
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
                                                    <div className={`absolute -top-2.5 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full text-[8px] md:text-[9px] font-black uppercase tracking-tighter shadow-lg z-20 ${idx === 0 ? 'bg-yellow-500 text-white shadow-yellow-500/30' :
                                                            idx === 1 ? 'bg-slate-400 text-white' :
                                                                'bg-orange-500 text-white'
                                                        }`}>
                                                        {idx === 0 ? 'WINNER' : idx === 1 ? 'ELITE' : 'PRO'}
                                                    </div>
                                                )}
                                                <span className={`text-[9px] md:text-[10px] font-bold uppercase tracking-wider ${!isTop3 ? 'opacity-60' : 'opacity-80'}`}>{item.label}</span>
                                                <span className={`font-black ${isTop3 ? 'text-xl md:text-2xl' : 'text-base md:text-lg'} leading-tight`}>
                                                    {item.val}
                                                </span>
                                                <span className={`text-[8px] md:text-[9px] font-bold opacity-40`}>
                                                    ({Math.round(((item.val || 0) / tournament.prizePool) * 100)}%)
                                                </span>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'teams' && (
                        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
                            {/* Joined Teams Section */}
                            <div className="bg-card/40 backdrop-blur-xl border border-border/50 rounded-3xl p-6 md:p-8 shadow-sm">
                                <div className="flex items-center justify-between mb-8">
                                    <h2 className="text-2xl font-bold text-foreground flex items-center gap-3">
                                        <span className="p-2 bg-blue-500/10 text-blue-500 rounded-xl border border-blue-500/20">
                                            <Users size={24} />
                                        </span>
                                        Joined Participants
                                    </h2>
                                    <div className="bg-muted/50 px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-widest text-muted-foreground border border-border/50">
                                        {tournament.joinedCount} / {tournament.maxSlots}
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                                    {tournament.participants?.length > 0 ? (
                                        tournament.participants.map((player: any, idx: number) => {
                                            const playerUser = player.userId || {};
                                            return (
                                                <div
                                                    key={idx}
                                                    className="flex items-center gap-4 p-4 rounded-2xl bg-background/50 border border-border/40 hover:border-primary/30 transition-all group"
                                                >
                                                    <div className="relative">
                                                        <div className="w-12 h-12 rounded-full overflow-hidden bg-muted border-2 border-border group-hover:border-primary/50 transition-colors">
                                                            {playerUser.avatarId ? (
                                                                <img
                                                                    src={AVATARS.find(a => a.id === playerUser.avatarId)?.src || AVATARS[0].src}
                                                                    alt="Player"
                                                                    className="w-full h-full object-cover"
                                                                />
                                                            ) : (
                                                                <div className="w-full h-full flex items-center justify-center text-lg font-black uppercase">
                                                                    {playerUser.name?.[0] || 'P'}
                                                                </div>
                                                            )}
                                                        </div>
                                                        <div className="absolute -bottom-1 -right-1 bg-background border border-border rounded-full w-5 h-5 flex items-center justify-center text-[10px] font-black text-muted-foreground">
                                                            {idx + 1}
                                                        </div>
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <div className="font-bold text-foreground truncate">{playerUser.name || "Mystery Player"}</div>
                                                        <div className="flex flex-col gap-0.5 mt-0.5">
                                                            <div className="text-[10px] text-primary/80 font-black uppercase tracking-wider flex items-center gap-1">
                                                                <span className="opacity-50 text-[8px]">IGN:</span> {player.inGameName || "—"}
                                                            </div>
                                                            <div className="text-[9px] text-muted-foreground font-black uppercase tracking-widest flex items-center gap-1">
                                                                <span className="opacity-40 text-[7px]">UID:</span> {player.uid || "—"}
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div className="p-2 text-primary opacity-0 group-hover:opacity-100 transition-opacity">
                                                        <CheckCircle2 size={16} />
                                                    </div>
                                                </div>
                                            );
                                        })
                                    ) : (
                                        <div className="col-span-full py-16 text-center text-muted-foreground bg-muted/20 border-2 border-dashed border-border rounded-3xl">
                                            <Users size={48} className="mx-auto mb-4 opacity-20" />
                                            <p className="font-bold text-lg">No one here yet</p>
                                            <p className="text-sm opacity-60">Be the first to join this epic battle!</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}
                </div>

            </div>

            {user && (
                <JoinTournamentModal
                    isOpen={isModalOpen}
                    onClose={() => setIsModalOpen(false)}
                    tournament={tournament}
                    user={user}
                    onJoinSuccess={() => {
                        setHasJoined(true);
                        router.refresh();
                    }}
                />
            )}
        </div>
    );
}
