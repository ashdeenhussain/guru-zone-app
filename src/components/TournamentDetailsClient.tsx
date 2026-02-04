'use client';

import { useState, useEffect } from 'react';
import { Crown, Trophy, Calendar, Users, Swords, Shield, AlertTriangle, CheckCircle2, Clock, ArrowLeft, MapPin, Coins, Check, ChevronRight, Copy, Lock, Unlock, Bell } from 'lucide-react';
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
    prizeDistribution: {
        first: number;
        second: number;
        third: number;
    };
    winners?: {
        rank1: string;
        rank2: string;
        rank3: string;
    };
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

            {/* Custom Fixed Header (Overlays Layout Header) */}
            <div className="fixed top-0 left-0 right-0 z-50 h-16 px-4 bg-background/80 backdrop-blur-xl border-b border-border flex items-center justify-between shadow-sm">
                <div className="flex items-center gap-3">
                    <div className="relative h-9 w-9 overflow-hidden rounded-xl border border-border shadow-sm">
                        <img src="/logo.png" alt="ZP" className="h-full w-full object-cover" />
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <ThemeToggle />
                    <Link href="/dashboard/settings" className="relative p-2 rounded-xl bg-muted/50 border border-border text-foreground hover:bg-muted transition-all">
                        <Bell size={20} />
                        <span className="absolute top-2 right-2 h-2 w-2 bg-red-500 rounded-full animate-pulse ring-2 ring-background"></span>
                    </Link>
                </div>
            </div>

            <div className="container mx-auto px-4 pt-20 relative z-10 max-w-4xl space-y-6">

                {/* Title Section */}
                <div className="flex flex-col gap-4">
                    <div className="flex items-start justify-between gap-4">
                        <div>
                            <div className="flex items-center gap-3 mb-2">
                                <h1 className="text-3xl md:text-4xl font-black text-foreground tracking-tight">{tournament.title}</h1>
                                <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider border ${tournament.status === 'Open' ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' :
                                    tournament.status === 'Live' ? 'bg-red-500/10 text-red-500 border-red-500/20 animate-pulse' :
                                        'bg-muted text-muted-foreground border-border'
                                    }`}>
                                    {tournament.status}
                                </span>
                            </div>

                            <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-muted-foreground font-medium">
                                <div className="flex items-center gap-2">
                                    <Calendar size={16} className="text-primary" />
                                    <span>{new Date(tournament.startTime).toLocaleString()}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <MapPin size={16} className="text-purple-500" />
                                    <span>{tournament.map}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Users size={16} className="text-blue-500" />
                                    <span>{tournament.format}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Main Stats Grid */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="relative overflow-hidden bg-card/50 backdrop-blur-xl border border-border/50 p-4 rounded-2xl group hover:border-yellow-500/30 transition-all shadow-sm">
                        <div className="absolute right-0 bottom-0 w-16 h-16 bg-yellow-500/10 blur-[40px] rounded-full pointer-events-none" />
                        <Coins className="text-yellow-500 mb-2" size={24} />
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

                {/* --- WINNER'S PODIUM (When Completed) --- */}
                {tournament.status === 'Completed' && tournament.winners && (
                    <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
                        <div className="relative bg-gradient-to-b from-yellow-500/10 to-transparent border border-yellow-500/20 rounded-3xl p-8 text-center overflow-hidden">
                            {/* Visual Effects */}
                            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-yellow-500/20 via-transparent to-transparent pointer-events-none" />

                            <div className="relative z-10">
                                <h2 className="text-3xl font-black text-yellow-500 uppercase tracking-tight mb-8 drop-shadow-[0_0_15px_rgba(234,179,8,0.5)]">
                                    Champions Declared
                                </h2>

                                <div className="flex flex-row items-end justify-center gap-2 md:gap-8 pb-4 w-full px-2">
                                    {['rank2', 'rank1', 'rank3'].map((rankKey) => {
                                        const rank = rankKey === 'rank1' ? 1 : rankKey === 'rank2' ? 2 : 3;
                                        const winnerId = (tournament.winners as any)[rankKey];
                                        const winner = tournament.participants?.find((p: any) => (p.userId as any)?._id?.toString() === winnerId?.toString() || p.userId === winnerId);
                                        const prize = rank === 1 ? tournament.prizeDistribution.first : rank === 2 ? tournament.prizeDistribution.second : tournament.prizeDistribution.third;

                                        // Responsive Heights: Smaller on Mobile
                                        const heightClass = rank === 1 ? 'h-32 md:h-64 border-yellow-500/50 from-yellow-500/20 to-yellow-900/20' :
                                            rank === 2 ? 'h-24 md:h-52 border-zinc-400/50 from-zinc-400/20 to-zinc-800/20' :
                                                'h-20 md:h-44 border-orange-700/50 from-orange-700/20 to-orange-900/20';

                                        const iconColor = rank === 1 ? 'text-yellow-400 drop-shadow-[0_0_10px_rgba(250,204,21,0.5)]' :
                                            rank === 2 ? 'text-zinc-300' : 'text-orange-600';

                                        if (!winnerId) return null;

                                        return (
                                            <div key={rank} className={`relative group flex flex-col items-center justify-end w-1/3 max-w-[200px] order-${rank === 1 ? 2 : rank === 2 ? 1 : 3}`}>
                                                {rank === 1 && (
                                                    <div className="mb-2 md:mb-4 animate-bounce duration-[2000ms]">
                                                        <Trophy className="w-8 h-8 md:w-12 md:h-12 text-yellow-400 drop-shadow-[0_0_20px_rgba(250,204,21,0.8)]" />
                                                    </div>
                                                )}

                                                <div className="mb-2 md:mb-3 text-center w-full">
                                                    <div className="w-10 h-10 md:w-16 md:h-16 mx-auto bg-gradient-to-br from-white/10 to-white/5 rounded-full border-2 border-white/20 flex items-center justify-center text-sm md:text-xl font-bold text-foreground mb-1 md:mb-2 shadow-xl overflow-hidden">
                                                        {(winner?.userId as any)?.avatarId ? (
                                                            <img src={AVATARS.find(a => a.id === (winner.userId as any).avatarId)?.src || AVATARS[0].src} alt="Winner" className="w-full h-full object-cover" />
                                                        ) : (winner?.userId as any)?.image ? (
                                                            <img src={(winner.userId as any).image} alt="Winner" className="w-full h-full object-cover" />
                                                        ) : (
                                                            (winner?.userId as any)?.name?.[0]?.toUpperCase() || winner?.username?.[0]?.toUpperCase() || 'U'
                                                        )}
                                                    </div>
                                                    <div className="font-bold text-foreground text-xs md:text-sm leading-tight text-center w-full px-1 line-clamp-2 break-words">
                                                        {(winner?.userId as any)?.name || winner?.username || 'Unknown'}
                                                    </div>
                                                    <div className="hidden md:block text-[10px] font-mono text-muted-foreground mt-1 truncate w-full">{winner?.inGameName || winner?.ign || 'ID: ' + winnerId.slice(-4)}</div>
                                                </div>

                                                <div className={`w-full ${heightClass} rounded-t-2xl border-t border-x bg-gradient-to-b backdrop-blur-md flex flex-col items-center justify-start pt-2 md:pt-4 relative shadow-[0_10px_40px_-10px_rgba(0,0,0,0.5)] transition-all group-hover:brightness-125`}>
                                                    <div className={`text-2xl md:text-4xl font-black ${iconColor}`}>{rank}</div>
                                                    <div className="mt-1 md:mt-2 font-mono font-bold text-white text-xs md:text-lg tracking-wider bg-black/30 px-2 py-0.5 md:py-1 rounded-lg border border-white/10">
                                                        {prize}
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Main Action Section (Split Layout) */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Left: Registration Status */}
                    <div className="md:col-span-2 bg-gradient-to-br from-card/80 to-card/40 backdrop-blur-xl border border-border/50 rounded-3xl p-6 md:p-8 shadow-sm relative overflow-hidden group">
                        <div className="absolute top-0 right-0 w-48 h-48 bg-blue-500/10 rounded-bl-full -mr-12 -mt-12 pointer-events-none transition-opacity" />

                        <div className="relative z-10">
                            <h2 className="text-2xl font-bold text-foreground mb-4 flex items-center gap-3">
                                <span className="p-2 bg-blue-500/10 text-blue-500 rounded-xl border border-blue-500/20">
                                    <Shield size={24} />
                                </span>
                                Registration
                            </h2>

                            {hasJoined ? (
                                <div className="space-y-4">
                                    <div className="flex items-center gap-3 bg-emerald-500/10 text-emerald-500 px-5 py-4 rounded-2xl border border-emerald-500/20 w-full animate-in fade-in zoom-in-95">
                                        <div className="p-1 bg-emerald-500/20 rounded-full"><Check size={20} /></div>
                                        <div>
                                            <span className="font-bold text-lg block">Registered Successfully</span>
                                            <span className="text-sm opacity-80">You are on the participant list. Good luck!</span>
                                        </div>
                                    </div>
                                    <p className="text-sm text-muted-foreground pl-1">
                                        Credentials will appear in the "Room Details" section when available.
                                    </p>
                                </div>
                            ) : tournament.joinedCount >= tournament.maxSlots ? (
                                <div className="bg-red-500/10 text-red-500 px-5 py-6 rounded-2xl border border-red-500/20 w-full text-center">
                                    <span className="font-bold text-xl block mb-1">Tournament Full</span>
                                    <span className="text-sm opacity-80">Better luck next time! Check back for new events.</span>
                                </div>
                            ) : (
                                <div className="flex flex-col gap-6">
                                    <p className="text-muted-foreground text-lg leading-relaxed max-w-lg">
                                        Join this battle to compete for <span className="text-yellow-500 font-bold">{tournament.prizePool} Coins</span>.
                                        Ensure you have at least <span className="text-foreground font-bold">{tournament.entryFee} Coins</span> in your wallet.
                                    </p>
                                    <div className="flex flex-wrap gap-4">
                                        <button
                                            onClick={handleJoinClick}
                                            className="flex-1 min-w-[200px] bg-primary hover:bg-primary/90 text-primary-foreground text-lg font-bold py-4 px-8 rounded-xl shadow-lg shadow-primary/25 transition-all active:scale-[0.98] flex items-center justify-center gap-2 group/btn"
                                        >
                                            Join Now
                                            <ChevronRight className="group-hover/btn:translate-x-1 transition-transform" />
                                        </button>
                                        <Link href="/dashboard/wallet" className="flex-1 min-w-[200px] bg-muted hover:bg-muted/80 text-foreground font-bold py-4 px-8 rounded-xl border border-border transition-all flex items-center justify-center gap-2">
                                            Add Funds
                                        </Link>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Right: Room Credentials */}
                    <div className="bg-card/30 backdrop-blur-xl border border-border/50 rounded-3xl p-6 shadow-sm relative flex flex-col h-full">
                        <div className="absolute inset-0 bg-gradient-to-b from-purple-500/5 to-transparent pointer-events-none rounded-3xl" />

                        <h2 className="text-xl font-bold text-foreground mb-6 flex items-center gap-3 relative z-10">
                            <span className="p-2 bg-purple-500/10 text-purple-500 rounded-xl border border-purple-500/20">
                                <Lock size={20} />
                            </span>
                            Room Details
                        </h2>

                        <div className="flex-1 flex flex-col justify-center relative z-10">
                            {!hasJoined ? (
                                <div className="flex flex-col items-center justify-center text-center text-muted-foreground py-8 border-2 border-dashed border-border/50 rounded-2xl bg-muted/20">
                                    <div className="p-4 bg-muted/50 rounded-full mb-3">
                                        <Lock size={32} className="opacity-50" />
                                    </div>
                                    <span className="font-medium">Join to view details</span>
                                </div>
                            ) : (
                                <div className="flex flex-col gap-4 w-full">
                                    {!canShowCredentials ? (
                                        <div className="bg-muted/30 rounded-2xl p-6 text-center border border-border/50">
                                            <p className="text-xs text-muted-foreground font-bold uppercase tracking-wider mb-2">Revealing In</p>
                                            <p className="text-3xl font-mono text-foreground font-black tracking-widest">{timeLeft}</p>
                                        </div>
                                    ) : (
                                        <>
                                            {!credentials ? (
                                                <button
                                                    onClick={fetchCredentials}
                                                    disabled={loadingCredentials}
                                                    className="w-full bg-purple-600 hover:bg-purple-500 text-white font-bold py-4 rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg shadow-purple-500/20"
                                                >
                                                    {loadingCredentials ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Unlock size={20} />}
                                                    Reveal Credentials
                                                </button>
                                            ) : (
                                                <div className="space-y-3 animate-in fade-in zoom-in-95">
                                                    <div className="bg-background/80 rounded-xl p-4 border border-border shadow-sm">
                                                        <div className="text-xs text-muted-foreground font-semibold mb-1 uppercase">Room ID</div>
                                                        <div className="flex justify-between items-center">
                                                            <span className="font-mono text-foreground text-xl font-bold tracking-wider">{credentials.roomID}</span>
                                                            <button onClick={() => copyToClipboard(credentials.roomID!, 'id')} className="p-2 hover:bg-muted rounded-lg transition-colors">
                                                                {copiedId ? <Check size={18} className="text-emerald-500" /> : <Copy size={18} className="text-muted-foreground" />}
                                                            </button>
                                                        </div>
                                                    </div>
                                                    <div className="bg-background/80 rounded-xl p-4 border border-border shadow-sm">
                                                        <div className="text-xs text-muted-foreground font-semibold mb-1 uppercase">Password</div>
                                                        <div className="flex justify-between items-center">
                                                            <span className="font-mono text-foreground text-xl font-bold tracking-wider">{credentials.roomPassword}</span>
                                                            <button onClick={() => copyToClipboard(credentials.roomPassword!, 'pass')} className="p-2 hover:bg-muted rounded-lg transition-colors">
                                                                {copiedPass ? <Check size={18} className="text-emerald-500" /> : <Copy size={18} className="text-muted-foreground" />}
                                                            </button>
                                                        </div>
                                                    </div>
                                                    <div className="text-center text-xs text-emerald-500 font-bold mt-2 flex items-center justify-center gap-2 bg-emerald-500/5 py-2 rounded-lg">
                                                        <span className="relative flex h-2 w-2">
                                                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                                            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                                                        </span>
                                                        Active Session
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

                {/* Prize Breakdown (Bottom) */}
                <div className="bg-card/30 backdrop-blur-xl border border-border/50 rounded-3xl p-6 md:p-8 shadow-sm">
                    <h2 className="text-lg font-bold text-foreground mb-6 flex items-center gap-2">
                        <Trophy size={20} className="text-yellow-500" />
                        Prize Distribution
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="bg-gradient-to-br from-yellow-500/10 to-transparent border border-yellow-500/20 p-4 rounded-2xl flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <span className="text-2xl font-black text-yellow-500/50">#1</span>
                                <span className="font-bold text-yellow-500">Winner</span>
                            </div>
                            <span className="text-xl font-bold text-foreground">{tournament.prizeDistribution.first} <span className="text-sm font-normal text-muted-foreground">coins</span></span>
                        </div>
                        <div className="bg-gradient-to-br from-zinc-400/10 to-transparent border border-zinc-400/20 p-4 rounded-2xl flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <span className="text-2xl font-black text-zinc-400/50">#2</span>
                                <span className="font-bold text-zinc-400">Runner Up</span>
                            </div>
                            <span className="text-xl font-bold text-foreground">{tournament.prizeDistribution.second} <span className="text-sm font-normal text-muted-foreground">coins</span></span>
                        </div>
                        <div className="bg-gradient-to-br from-orange-700/10 to-transparent border border-orange-700/20 p-4 rounded-2xl flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <span className="text-2xl font-black text-orange-700/50">#3</span>
                                <span className="font-bold text-orange-600">Third</span>
                            </div>
                            <span className="text-xl font-bold text-foreground">{tournament.prizeDistribution.third} <span className="text-sm font-normal text-muted-foreground">coins</span></span>
                        </div>
                    </div>
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
