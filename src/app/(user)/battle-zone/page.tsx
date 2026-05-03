'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Swords, Plus, Users, Calendar, Trophy, Coins, Loader2, ShieldAlert, Info } from 'lucide-react';
import Link from 'next/link';
import { format } from 'date-fns';
import { useSession } from 'next-auth/react';
import HostTournamentModal from '@/components/battle-zone/HostTournamentModal';
import MaintenanceWrapper from '@/components/shared/MaintenanceWrapper';
import TrustScoreInfoModal from '@/components/battle-zone/TrustScoreInfoModal';

const MatchCountdown = ({ expiresAt, nowTime }: { expiresAt: string, nowTime: number }) => {
    if (!expiresAt) return null;

    const expiryTime = new Date(expiresAt).getTime();
    const diff = expiryTime - nowTime;

    if (diff <= 0) return null;

    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((diff % (1000 * 60)) / 1000);

    const timeLeft = hours > 0 
        ? `${hours}h ${minutes}m ${seconds}s` 
        : `${minutes}m ${seconds}s`;

    return (
        <div className="flex items-center gap-1.5 mt-2 mb-3">
            <span className="text-[11px] font-black uppercase tracking-widest text-yellow-500 bg-yellow-500/10 px-3 py-1.5 rounded-lg border border-yellow-500/20 flex items-center gap-2 shadow-[0_0_15px_rgba(234,179,8,0.15)]">
                <span>🕒</span> Host Active For: {timeLeft}
            </span>
        </div>
    );
};

export default function BattleZonePage() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const initialTab = searchParams.get('tab') === 'my' ? 'my' : 'all';

    const { data: session } = useSession();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [tournaments, setTournaments] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [joinedIds, setJoinedIds] = useState<string[]>([]);
    const [activeTab, setActiveTab] = useState<'all' | 'my'>(initialTab);
    const [isHostModalOpen, setIsHostModalOpen] = useState(false);
    const [isTrustInfoModalOpen, setIsTrustInfoModalOpen] = useState(false);
    const [balance, setBalance] = useState<number | null>(null);
    const [now, setNow] = useState<number>(Date.now());

    useEffect(() => {
        const interval = setInterval(() => setNow(Date.now()), 1000);
        return () => clearInterval(interval);
    }, []);

    const fetchBalance = async () => {
        if (session) {
            try {
                const res = await fetch('/api/user/balance');
                if (res.ok) {
                    const data = await res.json();
                    if (data.success) {
                        setBalance(data.balance);
                    }
                }
            } catch (error) {
                console.error('Failed to fetch balance', error);
            }
        }
    };

    const fetchTournaments = async () => {
        try {
            // Fetch from dedicated BattleMatch API with userId for personalized filtering
            const url = new URL('/api/battle-zone/matches', window.location.origin);
            if (session?.user) {
                url.searchParams.append('userId', (session.user as any).id);
            }
            
            const res = await fetch(url.toString());
            const data = await res.json();
            if (data.success) {
                setTournaments(data.data);
            }
        } catch (error) {
            console.error("Failed to fetch battle zone matches", error);
        } finally {
            setIsLoading(false);
        }
    };

    const fetchJoinedTournaments = async () => {
        if (session) {
            try {
                const res = await fetch('/api/user/tournaments');
                if (res.ok) {
                    const data = await res.json();
                    if (data.success) {
                        setJoinedIds(data.joined);
                    }
                }
            } catch (error) {
                console.error('Failed to fetch joined tournaments', error);
            }
        }
    };

    useEffect(() => {
        fetchTournaments();
        fetchJoinedTournaments();
        fetchBalance();
    }, [session]);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const userId = (session?.user as any)?.id;

    const filteredTournaments = (tournaments || []).filter(t => {
        if (!t) return false;
        const hostId = (t.createdBy?._id || t.createdBy)?.toString();
        const isHost = hostId === userId;
        const isParticipant = t.participants?.some((p: any) => {
            const pId = (p?.userId?._id || p?.userId)?.toString();
            return pId === userId;
        });

        const status = (t.status || '').toLowerCase();

        if (activeTab === 'my') {
            if (!session) return false;
            // My Battles: Show everything the user is involved in (Host or Joiner)
            // Regardless of status (so we can see history/refunded/cancelled matches)
            return isHost || isParticipant;
        }

        // Browse Battles Tab (Public Feed)
        // Strictly show only matches that are 'Open' and waiting for an opponent.
        // We now allow hosts to see their own matches here so they know it's publicly listed.
        const isOpen = status === 'open';
        const isWaitingForOpponent = (t.joinedCount || 0) < (t.maxSlots || 2);
        
        // Dynamic hiding if expired
        const matchExpiresAt = t.expiresAt || (t.createdAt ? new Date(new Date(t.createdAt).getTime() + 60 * 60 * 1000).toISOString() : new Date().toISOString());
        const isExpired = new Date(matchExpiresAt).getTime() <= now;
        
        return isOpen && isWaitingForOpponent && !isExpired;
    });

    const handleCreateSuccess = (newMatchId: string) => {
        setIsHostModalOpen(false);
        if (newMatchId) {
            router.push(`/battle-zone/${newMatchId}`);
        } else {
            fetchTournaments();
            setActiveTab('my');
        }
    };

    const userTrustScore = session?.user ? ((session.user as any).trustScore ?? 100) : 100;
    
    let trustScoreColor = 'text-green-500';
    let trustScoreBg = 'bg-green-500/10 border-green-500/20';
    if (userTrustScore < 80) {
        trustScoreColor = 'text-red-500';
        trustScoreBg = 'bg-red-500/10 border-red-500/20';
    } else if (userTrustScore <= 90) {
        trustScoreColor = 'text-yellow-500';
        trustScoreBg = 'bg-yellow-500/10 border-yellow-500/20';
    }

    return (
            <div className="min-h-screen bg-background pb-24 w-full overflow-x-hidden">
                <div className="bg-card/40 border-b border-border/50 backdrop-blur-xl sticky top-0 z-30 w-full">
                    <div className="max-w-4xl mx-auto px-4 md:px-6 py-4 md:py-6">
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 md:gap-6 w-full">
                            {/* Left Section: Title & Stats */}
                            <div className="flex-1 space-y-3 w-full">
                                <div className="flex items-center gap-3">
                                    <div className="p-2.5 bg-primary/10 rounded-xl shrink-0">
                                        <Swords className="w-6 h-6 text-primary" />
                                    </div>
                                    <h1 className="text-xl md:text-3xl font-black tracking-tight text-foreground leading-tight">
                                        Battle Zone Community Challenge
                                    </h1>
                                </div>
                                
                                {session?.user && (
                                    <div className="flex flex-col sm:flex-row flex-wrap items-start sm:items-center gap-2 md:gap-4 md:pl-[3.25rem] w-full">
                                        <div className={`flex items-center gap-1.5 px-3 py-2 rounded-lg border w-full sm:w-auto ${trustScoreBg}`}>
                                            <ShieldAlert className={`w-4 h-4 shrink-0 ${trustScoreColor}`} />
                                            <span className={`text-xs font-bold uppercase tracking-wider truncate ${trustScoreColor}`}>
                                                Trust Score: {userTrustScore}%
                                            </span>
                                            <Info 
                                                size={16} 
                                                className={`ml-1 cursor-pointer transition-transform hover:scale-110 active:scale-95 opacity-80 hover:opacity-100 ${trustScoreColor}`} 
                                                onClick={() => setIsTrustInfoModalOpen(true)}
                                            />
                                        </div>
                                        <div className="flex items-center gap-1.5 px-3 py-2 bg-muted/50 rounded-lg border border-border/50 w-full sm:w-auto">
                                            <Coins className="w-4 h-4 text-yellow-500 shrink-0" />
                                            <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider truncate">
                                                Balance: <span className="text-yellow-500">{balance !== null ? balance : '...'} Coins</span>
                                            </span>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Right Section: Action Button */}
                            <div className="flex flex-col items-stretch md:items-end gap-2 shrink-0 w-full md:w-auto mt-2 md:mt-0">
                                <button 
                                    onClick={() => setIsHostModalOpen(true)} 
                                    disabled={session?.user && (session.user as any).trustScore < 80}
                                    className={`px-6 py-3.5 md:py-3 rounded-xl text-sm font-black flex items-center justify-center gap-2 transition-all shadow-lg active:scale-95 w-full md:w-auto
                                        ${session?.user && (session.user as any).trustScore < 80 
                                            ? 'bg-muted text-muted-foreground grayscale cursor-not-allowed border border-border/50' 
                                            : 'bg-primary text-primary-foreground hover:bg-primary/90 shadow-primary/20'
                                        }
                                    `}
                                >
                                    <Plus className="w-5 h-5" />
                                    Host Tournament
                                </button>
                                {session?.user && (session.user as any).trustScore < 80 && (
                                    <span className="text-[10px] font-black text-destructive uppercase tracking-tighter text-center">
                                        Trust Score &lt; 80%
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                <div className="p-4 md:p-6 space-y-6 max-w-4xl mx-auto">
                    {/* Trust Score Warning Banner */}
                    {session?.user && (session.user as any).trustScore < 80 && (
                        <div className="bg-destructive/10 border border-destructive/20 rounded-[1.5rem] p-4 flex items-center gap-4 animate-in slide-in-from-top-4 duration-500">
                            <div className="p-3 bg-destructive/10 rounded-xl">
                                <ShieldAlert className="w-6 h-6 text-destructive" />
                            </div>
                            <div className="flex-1">
                                <p className="text-sm font-black text-destructive uppercase tracking-tight">Hosting Restricted</p>
                                <p className="text-xs font-medium text-muted-foreground leading-relaxed mt-0.5">
                                    Your Trust Score is <span className="font-bold text-destructive">{(session.user as any).trustScore}%</span>. 
                                    You need 80%+ to host matches. Join matches and resolve them fairly to rebuild your reputation.
                                </p>
                            </div>
                        </div>
                    )}

                    {/* Tabs Selector */}
                    {session && (
                        <div className="grid grid-cols-2 p-1.5 bg-muted/40 rounded-2xl border border-border/50 backdrop-blur-xl">
                            <button
                                onClick={() => setActiveTab('all')}
                                className={`py-3 text-sm font-black rounded-xl transition-all duration-300 tracking-wider uppercase ${activeTab === 'all'
                                    ? 'bg-primary text-primary-foreground shadow-xl shadow-primary/25 scale-[1.02]'
                                    : 'text-muted-foreground hover:bg-muted/50 hover:text-foreground'
                                    }`}
                            >
                                Browse Battles
                            </button>
                            <button
                                onClick={() => setActiveTab('my')}
                                className={`py-3 text-sm font-black rounded-xl transition-all duration-300 flex items-center justify-center gap-2 tracking-wider uppercase ${activeTab === 'my'
                                    ? 'bg-primary text-primary-foreground shadow-xl shadow-primary/25 scale-[1.02]'
                                    : 'text-muted-foreground hover:bg-muted/50 hover:text-foreground'
                                    }`}
                            >
                                My Battles
                            </button>
                        </div>
                    )}

                    {isLoading ? (
                        <div className="flex justify-center py-20">
                            <Loader2 className="w-10 h-10 animate-spin text-primary opacity-50" />
                        </div>
                    ) : filteredTournaments.length === 0 ? (
                        <div className="text-center py-20 bg-card/30 rounded-[2.5rem] border border-dashed border-border/50 flex flex-col items-center">
                            <div className="p-5 bg-muted/50 rounded-full mb-4">
                                <Swords className="w-10 h-10 text-muted-foreground opacity-20" />
                            </div>
                            <h3 className="font-black text-xl text-foreground uppercase tracking-tight">No Matches Found</h3>
                            <p className="text-sm text-muted-foreground mt-2 mb-8 max-w-xs font-medium">
                                {activeTab === 'my' 
                                    ? "You haven't created or joined any battles yet." 
                                    : "No one is hosting at the moment. Be the first to start a challenge!"}
                            </p>
                            {activeTab !== 'my' && (
                                <button onClick={() => setIsHostModalOpen(true)} className="bg-primary text-primary-foreground px-8 py-3 rounded-xl font-black text-xs uppercase tracking-widest hover:scale-105 active:scale-95 transition-all shadow-xl shadow-primary/20">
                                    Create Challenge
                                </button>
                            )}
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 gap-6">
                            {filteredTournaments.map((match) => {
                                const hostId = (match.createdBy?._id || match.createdBy)?.toString();
                                const isHost = hostId === userId;
                                const isParticipant = match.participants?.some((p: any) => {
                                    const pId = (p.userId?._id || p.userId)?.toString();
                                    return pId === userId;
                                });

                                return (
                                <div key={match._id} className="bg-card/50 border border-border hover:border-primary/40 rounded-[2rem] p-6 shadow-xl shadow-primary/5 transition-all group relative overflow-hidden backdrop-blur-sm">
                                    <div className="absolute -top-6 -right-6 p-2 opacity-[0.03] group-hover:opacity-10 transition-opacity">
                                        <Swords className="w-40 h-40 rotate-12" />
                                    </div>

                                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 relative z-10">
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 mb-3">
                                                <span className="px-3 py-1 bg-primary/10 text-primary text-[10px] font-black rounded-lg uppercase tracking-[0.15em] border border-primary/10">
                                                    {match.format}
                                                </span>
                                                {['open', 'full'].includes(match.status?.toLowerCase()) && (
                                                    <span className="px-3 py-1 bg-green-500/10 text-green-500 text-[10px] font-black rounded-lg animate-pulse uppercase tracking-[0.15em] border border-green-500/10">
                                                        {match.status?.toLowerCase() === 'full' ? 'FULL' : 'WAITING'}
                                                    </span>
                                                )}
                                                {['active', 'live'].includes(match.status?.toLowerCase()) && (
                                                    <span className="px-3 py-1 bg-blue-500/10 text-blue-500 text-[10px] font-black rounded-lg uppercase tracking-[0.15em] border border-blue-500/10">
                                                        LIVE
                                                    </span>
                                                )}
                                                {['disputed'].includes(match.status?.toLowerCase()) && (
                                                    <span className="px-3 py-1 bg-red-500/10 text-red-500 text-[10px] font-black rounded-lg uppercase tracking-[0.15em] border border-red-500/10">
                                                        DISPUTED
                                                    </span>
                                                )}
                                                {['completed'].includes(match.status?.toLowerCase()) && (
                                                    <span className="px-3 py-1 bg-muted text-muted-foreground text-[10px] font-black rounded-lg uppercase tracking-[0.15em] border border-border">
                                                        FINISHED
                                                    </span>
                                                )}
                                                {['cancelled'].includes(match.status?.toLowerCase()) && (
                                                    <div className="flex flex-col items-start gap-1">
                                                        <span className="px-3 py-1 bg-red-500/10 text-red-500 text-[10px] font-black rounded-lg uppercase tracking-[0.15em] border border-red-500/10">
                                                            CANCELLED
                                                        </span>
                                                        <span className="text-[9px] font-bold text-red-500/60 uppercase tracking-tighter ml-1">
                                                            Refunded to Wallet
                                                        </span>
                                                    </div>
                                                )}
                                            </div>

                                            {['open', 'full'].includes(match.status?.toLowerCase()) && (
                                                <MatchCountdown 
                                                    expiresAt={match.expiresAt || new Date(new Date(match.createdAt).getTime() + 60 * 60 * 1000).toISOString()} 
                                                    nowTime={now} 
                                                />
                                            )}

                                            <h3 className={`font-black text-xl text-foreground tracking-tight truncate mb-1 ${!['open', 'full'].includes(match.status?.toLowerCase() || '') ? 'mt-3' : ''}`}>
                                                {match?.title || 'Untitled Match'}
                                            </h3>
                                            <p className="text-xs text-muted-foreground font-bold uppercase tracking-widest flex items-center gap-2">
                                                Hosted by <span className="text-foreground">{match?.createdBy?.name || match?.createdBy?.inGameName || 'Guru Player'}</span>
                                            </p>
                                        </div>

                                        <div className="flex items-center gap-8 w-full md:w-auto">
                                            <div className="space-y-1">
                                                <div className="flex items-center gap-2 text-primary font-black text-2xl tracking-tighter">
                                                    <Coins className="w-5 h-5" />
                                                    {match.entryFee || '0'}
                                                </div>
                                                <p className="text-[10px] text-muted-foreground font-black uppercase tracking-widest text-right">Entry Fee</p>
                                            </div>

                                            <div className="h-10 w-px bg-border/50 hidden md:block" />

                                            <div className="space-y-1">
                                                <div className="flex items-center gap-2 text-foreground font-black text-2xl tracking-tighter">
                                                    <Users className="w-5 h-5 text-muted-foreground" />
                                                    {match.joinedCount || 1}/{match.maxSlots || 2}
                                                </div>
                                                <p className="text-[10px] text-muted-foreground font-black uppercase tracking-widest text-right">Teams</p>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="mt-8 flex flex-col sm:flex-row items-center gap-3 relative z-10">
                                        <div className="flex-1 flex items-center gap-4 text-[11px] font-bold text-muted-foreground uppercase tracking-widest bg-muted/30 px-6 py-3 rounded-2xl w-full">
                                            <div className="flex items-center gap-2">
                                                <Calendar className="w-4 h-4 text-primary" />
                                                {match?.createdAt ? format(new Date(match.createdAt), 'MMM d, h:mm a') : 'Recently'}
                                            </div>
                                            <div className="w-1.5 h-1.5 rounded-full bg-border" />
                                            <div className="truncate">{match?.gameMode || 'CS'} Match</div>
                                        </div>
                                        
                                        <button 
                                            onClick={() => router.push(`/battle-zone/${match._id}`)} 
                                            className="w-full sm:w-auto bg-foreground text-background font-black px-8 py-3.5 rounded-2xl text-xs uppercase tracking-[0.2em] hover:scale-105 active:scale-95 transition-all shadow-xl shadow-foreground/10 flex items-center justify-center gap-3"
                                        >
                                            {isHost || isParticipant ? 'Match Room' : 'Join Battle'}
                                            <Swords className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                                );
                            })}
                        </div>
                    )}
                </div>

                <HostTournamentModal
                    isOpen={isHostModalOpen}
                    onClose={() => setIsHostModalOpen(false)}
                    onSuccess={handleCreateSuccess}
                />

                <TrustScoreInfoModal
                    isOpen={isTrustInfoModalOpen}
                    onClose={() => setIsTrustInfoModalOpen(false)}
                />
            </div>
    );

}
