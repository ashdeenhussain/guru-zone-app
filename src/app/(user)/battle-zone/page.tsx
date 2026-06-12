'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Swords, Plus, Users, Calendar, Trophy, Coins, Loader2, ShieldAlert, Info, RotateCw, X, Copy } from 'lucide-react';
import Link from 'next/link';
import { format } from 'date-fns';
import { useSession } from 'next-auth/react';
import HostTournamentModal from '@/components/battle-zone/HostTournamentModal';
import MaintenanceWrapper from '@/components/shared/MaintenanceWrapper';
import TrustScoreInfoModal from '@/components/battle-zone/TrustScoreInfoModal';
import { useGuest } from '@/context/GuestContext';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';

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
    const { isGuest, requireAuth } = useGuest();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [tournaments, setTournaments] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [joinedIds, setJoinedIds] = useState<string[]>([]);
    const [activeTab, setActiveTab] = useState<'all' | 'my'>(initialTab);
    const [isHostModalOpen, setIsHostModalOpen] = useState(false);
    const [isTrustInfoModalOpen, setIsTrustInfoModalOpen] = useState(false);
    const [balance, setBalance] = useState<number | null>(null);
    const [now, setNow] = useState<number>(Date.now());
    const [isRefreshing, setIsRefreshing] = useState(false);

    const [whatsappAdmins, setWhatsappAdmins] = useState<any[]>([]);
    const [settings, setSettings] = useState<any>(null);
    const [isShareModalOpen, setIsShareModalOpen] = useState(false);
    const [selectedMatch, setSelectedMatch] = useState<any>(null);

    const [searchQuery, setSearchQuery] = useState('');
    const [formatFilter, setFormatFilter] = useState('all');
    const [modeFilter, setModeFilter] = useState('all');
    const [feeFilter, setFeeFilter] = useState('all');

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

    const fetchSettings = async () => {
        try {
            const res = await fetch('/api/admin/settings');
            if (res.ok) {
                const data = await res.json();
                setSettings(data);
                if (data.whatsappAdmins) {
                    setWhatsappAdmins(data.whatsappAdmins.filter((admin: any) => admin.isActive));
                }
            }
        } catch (error) {
            console.error("Failed to fetch settings:", error);
        }
    };

    const [unreadCounts, setUnreadCounts] = useState<Record<string, any>>({});

    const getMatchUnreadCount = (mId: any) => {
        if (!mId || !unreadCounts) return 0;
        const searchId = mId.toString().trim();
        // Robust lookup: check all keys in case of string/object mismatch
        const key = Object.keys(unreadCounts).find(k => k.toString().trim() === searchId);
        if (!key) return 0;
        const data = unreadCounts[key];
        return Number(data.chat || 0) + Number(data.system || 0);
    };

    const fetchUnreadCounts = async (force = false) => {
        if (!force && typeof document !== 'undefined' && document.visibilityState !== 'visible') {
            return;
        }
        if (!session) return;
        try {
            const res = await fetch('/api/notifications/unread-count');
            const data = await res.json();
            if (data.success && data.counts.breakdown) {
                setUnreadCounts(data.counts.breakdown);
            }
        } catch (e) {}
    };

    const handleRefresh = async () => {
        setIsRefreshing(true);
        try {
            await Promise.all([
                fetchTournaments(),
                fetchJoinedTournaments(),
                fetchBalance(),
                fetchUnreadCounts(true),
                fetchSettings()
            ]);
        } catch (error) {
            console.error('Failed to refresh data', error);
        } finally {
            setIsRefreshing(false);
        }
    };

    useEffect(() => {
        fetchTournaments();
        fetchJoinedTournaments();
        fetchBalance();
        fetchUnreadCounts(true);
        fetchSettings();

        const poll = setInterval(() => fetchUnreadCounts(false), 60000);
        return () => clearInterval(poll);
    }, [session]);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const userId = (session?.user as any)?.id;

    const openWhatsApp = async (number: string, match: any) => {
        try {
            const response = await fetch(`/api/battle-zone/matches/${match._id}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ number })
            });
            if (response.ok) {
                const resData = await response.json();
                if (resData.success && resData.data) {
                    setTournaments(prev => prev.map(t => t._id === match._id ? resData.data : t));
                }
            }
        } catch (error) {
            console.error("Failed to log share event", error);
        }

        let formattedNumber = number.replace(/[^0-9]/g, '');
        
        const title = match.title || 'Untitled Match';
        const entryFee = match.entryFee || '0';
        const prizePool = match.prizePool || '0';
        const formatType = match.format || '1v1';
        const gameMode = match.gameMode || 'CS';
        
        const matchExpiresAt = match.expiresAt || new Date(new Date(match.createdAt).getTime() + 60 * 60 * 1000).toISOString();
        const expiryTime = new Date(matchExpiresAt).getTime();
        const diff = expiryTime - Date.now();
        let durationText = '1 hour';
        if (diff > 0) {
            const minutes = Math.floor(diff / (1000 * 60));
            durationText = `${minutes} minutes`;
        }
        
        const battleZoneUrl = `${window.location.origin}/battle-zone`;
        
        const text = `⚔️ *GURU ZONE - 1vs1 CHALLENGE* ⚔️\n━━━━━━━━━━━━━━━━━━━━━━━━━\n🏆 *Title:* ${title}\n🎮 *Format:* ${formatType} (${gameMode})\n🪙 *Entry Fee:* ${entryFee} Coins\n🎁 *Winner Prize:* ${prizePool} Coins\n⏳ *Time Remaining:* ${durationText}\n━━━━━━━━━━━━━━━━━━━━━━━━━\n📢 *Battle Zone mein ja kar abhi join karen:*\n👉 ${battleZoneUrl}`;
        
        const encodedText = encodeURIComponent(text);
        const whatsappUrl = `https://wa.me/${formattedNumber}?text=${encodedText}`;
        
        window.open(whatsappUrl, '_blank');
    };

    const handleShareClick = (match: any) => {
        if (whatsappAdmins.length === 0) {
            const fallbackNumber = settings?.supportLink?.replace(/[^0-9]/g, '');
            if (fallbackNumber) {
                openWhatsApp(fallbackNumber, match);
            } else {
                toast.error("No WhatsApp Admins configured at the moment.");
            }
            return;
        }

        if (whatsappAdmins.length === 1) {
            const admin = whatsappAdmins[0];
            const sharedLogs = match.sharedWithAdmins || [];
            const log = sharedLogs.find((item: any) => item.number === admin.number);
            const lastSharedTime = log ? new Date(log.sharedAt).getTime() : 0;
            const cooldownDuration = 30 * 60 * 1000;
            if (lastSharedTime && Date.now() - lastSharedTime < cooldownDuration) {
                const remainingMin = Math.ceil((cooldownDuration - (Date.now() - lastSharedTime)) / (60 * 1000));
                toast.error(`You shared this match recently. Please wait ${remainingMin}m before sharing with this admin again.`);
                return;
            }

            openWhatsApp(admin.number, match);
            return;
        }

        setSelectedMatch(match);
        setIsShareModalOpen(true);
    };

    const filteredTournaments = (tournaments || []).filter(t => {
        if (!t) return false;
        const hostId = (t.createdBy?._id || t.createdBy)?.toString();
        const isHost = hostId === userId;
        const isParticipant = t.participants?.some((p: any) => {
            const pId = (p?.userId?._id || p?.userId)?.toString();
            return pId === userId;
        });

        const status = (t.status || '').toLowerCase();

        // Check activeTab filter
        let tabMatch = false;
        if (activeTab === 'my') {
            if (!session) return false;
            tabMatch = isHost || isParticipant;
        } else {
            const isOpen = status === 'open';
            const isWaitingForOpponent = (t.joinedCount || 0) < (t.maxSlots || 2);
            const matchExpiresAt = t.expiresAt || (t.createdAt ? new Date(new Date(t.createdAt).getTime() + 60 * 60 * 1000).toISOString() : new Date().toISOString());
            const isExpired = new Date(matchExpiresAt).getTime() <= now;
            tabMatch = isOpen && isWaitingForOpponent && !isExpired;
        }

        if (!tabMatch) return false;

        // Apply Search query (search by Match ID, Title, or Host Name)
        if (searchQuery.trim()) {
            const query = searchQuery.toLowerCase().trim();
            const matchId = (t._id || '').toString().toLowerCase();
            const matchTitle = (t.title || '').toLowerCase();
            const hostName = (t.createdBy?.name || t.createdBy?.username || '').toLowerCase();
            if (!matchId.includes(query) && !matchTitle.includes(query) && !hostName.includes(query)) {
                return false;
            }
        }

        // Apply Format Filter (1v1, 2v2, 4v4)
        if (formatFilter !== 'all') {
            if (t.format !== formatFilter) return false;
        }

        // Apply Game Mode Filter (Clash Squad, Lone Wolf)
        if (modeFilter !== 'all') {
            if (t.gameMode !== modeFilter) return false;
        }

        // Apply Entry Fee Filter (Coin ranges)
        if (feeFilter !== 'all') {
            const entryFee = Number(t.entryFee || 0);
            if (feeFilter === 'under20' && entryFee > 20) return false;
            if (feeFilter === '20to50' && (entryFee < 20 || entryFee > 50)) return false;
            if (feeFilter === 'above50' && entryFee <= 50) return false;
        }

        return true;
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
                                    <button
                                        onClick={handleRefresh}
                                        disabled={isRefreshing}
                                        className="p-2 bg-muted/40 hover:bg-muted border border-border/50 rounded-xl transition-all active:scale-95 flex items-center justify-center shrink-0"
                                        title="Refresh matches"
                                    >
                                        <RotateCw className={`w-4 h-4 text-muted-foreground hover:text-foreground ${isRefreshing ? 'animate-spin text-primary' : ''}`} />
                                    </button>
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
                                        <Link href="/dashboard/wallet" className="w-full sm:w-auto">
                                            <div className="flex items-center gap-1.5 px-3 py-2 bg-muted/50 rounded-lg border border-border/50 w-full sm:w-auto cursor-pointer hover:bg-muted/80 transition-all hover:scale-[1.02] active:scale-95 group">
                                                <Coins className="w-4 h-4 text-yellow-500 shrink-0 group-hover:scale-110 transition-transform" />
                                                <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider truncate">
                                                    Balance: <span className="text-yellow-500">{balance !== null ? balance : '...'} Coins</span>
                                                </span>
                                            </div>
                                        </Link>
                                    </div>
                                )}
                            </div>

                            {/* Right Section: Action Button */}
                            <div className="flex flex-col items-stretch md:items-end gap-2 shrink-0 w-full md:w-auto mt-2 md:mt-0">
                                <button 
                                    onClick={() => requireAuth(() => setIsHostModalOpen(true))} 
                                    disabled={!isGuest && session?.user && (session.user as any).trustScore < 80}
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
                                {Object.values(unreadCounts).reduce((a, b: any) => a + Number(b.chat || 0) + Number(b.system || 0), 0) > 0 && (
                                    <span className="bg-red-600 text-white text-[10px] w-5 h-5 flex items-center justify-center rounded-full animate-pulse shadow-lg">
                                        {Object.values(unreadCounts).reduce((a, b: any) => a + Number(b.chat || 0) + Number(b.system || 0), 0)}
                                    </span>
                                )}
                            </button>
                        </div>
                    )}

                    {/* Search & Filters Bar */}
                    <div className="bg-card border border-border rounded-[2rem] p-4 md:p-5 space-y-3.5 shadow-xl shadow-black/5">
                        <div className="flex flex-col gap-3.5 w-full">
                            {/* Search bar */}
                            <div className="relative w-full">
                                <span className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                    <svg className="h-4 w-4 text-muted-foreground/60" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                    </svg>
                                </span>
                                <input
                                    type="text"
                                    placeholder="Search by Title, Match ID, or Host..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="w-full bg-muted/50 hover:bg-muted border border-border/50 focus:border-primary/50 focus:ring-1 focus:ring-primary/20 rounded-xl pl-11 pr-10 py-3 text-sm font-bold placeholder-muted-foreground/60 outline-none transition-all text-foreground"
                                />
                                {searchQuery && (
                                    <button
                                        onClick={() => setSearchQuery('')}
                                        className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-muted-foreground hover:text-foreground active:scale-90 transition-transform"
                                    >
                                        <X className="w-4 h-4" />
                                    </button>
                                )}
                            </div>

                            {/* Filters container: Grid on mobile, Flex on desktop */}
                            <div className="grid grid-cols-3 gap-2 w-full md:flex md:items-center md:justify-end md:gap-3">
                                {/* Format selector */}
                                <div className="min-w-0 flex-1 md:flex-initial md:min-w-[120px]">
                                    <select
                                        value={formatFilter}
                                        onChange={(e) => setFormatFilter(e.target.value)}
                                        className="w-full bg-muted/50 hover:bg-muted border border-border/50 focus:border-primary/50 rounded-xl px-2 py-2.5 md:px-4 md:py-3 text-[11px] md:text-sm font-black uppercase tracking-wider outline-none cursor-pointer transition-all text-foreground text-center"
                                    >
                                        <option value="all">Formats</option>
                                        <option value="1v1">1v1</option>
                                        <option value="2v2">2v2</option>
                                        <option value="4v4">4v4</option>
                                    </select>
                                </div>

                                {/* Mode selector */}
                                <div className="min-w-0 flex-1 md:flex-initial md:min-w-[140px]">
                                    <select
                                        value={modeFilter}
                                        onChange={(e) => setModeFilter(e.target.value)}
                                        className="w-full bg-muted/50 hover:bg-muted border border-border/50 focus:border-primary/50 rounded-xl px-2 py-2.5 md:px-4 md:py-3 text-[11px] md:text-sm font-black uppercase tracking-wider outline-none cursor-pointer transition-all text-foreground text-center"
                                    >
                                        <option value="all">Modes</option>
                                        <option value="Clash Squad">Clash Squad</option>
                                        <option value="Lone Wolf">Lone Wolf</option>
                                    </select>
                                </div>

                                {/* Fee selector */}
                                <div className="min-w-0 flex-1 md:flex-initial md:min-w-[120px]">
                                    <select
                                        value={feeFilter}
                                        onChange={(e) => setFeeFilter(e.target.value)}
                                        className="w-full bg-muted/50 hover:bg-muted border border-border/50 focus:border-primary/50 rounded-xl px-2 py-2.5 md:px-4 md:py-3 text-[11px] md:text-sm font-black uppercase tracking-wider outline-none cursor-pointer transition-all text-foreground text-center"
                                    >
                                        <option value="all">Fees</option>
                                        <option value="under20">≤ 20</option>
                                        <option value="20to50">20 - 50</option>
                                        <option value="above50">&gt; 50</option>
                                    </select>
                                </div>
                            </div>
                        </div>
                    </div>

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
                                {searchQuery || formatFilter !== 'all' || modeFilter !== 'all' || feeFilter !== 'all'
                                    ? "Try adjusting your filters or search keywords."
                                    : activeTab === 'my' 
                                        ? "You haven't created or joined any battles yet." 
                                        : "No one is hosting at the moment. Be the first to start a challenge!"}
                            </p>
                            {activeTab !== 'my' && (
                                <button onClick={() => requireAuth(() => setIsHostModalOpen(true))} className="bg-primary text-primary-foreground px-8 py-3 rounded-xl font-black text-xs uppercase tracking-widest hover:scale-105 active:scale-95 transition-all shadow-xl shadow-primary/20">
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
                                const showShareBtn = isHost && match.status?.toLowerCase() === 'open' && (match.joinedCount || 1) === 1;

                                return (
                                <div key={match._id} className="bg-card/50 border border-border hover:border-primary/40 rounded-[2rem] p-6 shadow-xl shadow-primary/5 transition-all group relative overflow-hidden backdrop-blur-sm">
                                    <div className="absolute -top-6 -right-6 p-2 opacity-[0.03] group-hover:opacity-10 transition-opacity">
                                        <Swords className="w-40 h-40 rotate-12" />
                                    </div>

                                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 relative z-10">
                                        <div className="flex-1 min-w-0">
                                            <div className="flex flex-wrap items-center gap-1.5 mb-3">
                                                <span className="px-2.5 py-1 bg-primary/10 text-primary text-[9px] font-black rounded-lg uppercase tracking-[0.1em] border border-primary/10">
                                                    {match.format}
                                                </span>
                                                <span className={`px-2.5 py-1 text-[9px] font-black rounded-lg uppercase tracking-[0.1em] border ${
                                                    match.privacy === 'Private'
                                                        ? 'bg-blue-500/10 text-blue-500 border-blue-500/10'
                                                        : 'bg-muted text-muted-foreground border-border'
                                                }`}>
                                                    {match.privacy === 'Private' ? '🔒 Private' : '🌐 Public'}
                                                </span>
                                                {['open', 'full'].includes(match.status?.toLowerCase()) && (
                                                    <span className="px-2.5 py-1 bg-green-500/10 text-green-500 text-[9px] font-black rounded-lg animate-pulse uppercase tracking-[0.1em] border border-green-500/10">
                                                        {match.status?.toLowerCase() === 'full' ? 'FULL' : 'WAITING'}
                                                    </span>
                                                )}
                                                {match.mapName && (
                                                    <span className="px-2.5 py-1 bg-muted text-muted-foreground text-[9px] font-black rounded-lg uppercase tracking-[0.1em] border border-border">
                                                        🗺️ {match.mapName}
                                                    </span>
                                                )}
                                                {match.advancedRules?.limitedAmmo === false && (
                                                    <span className="px-2.5 py-1 bg-amber-500/10 text-amber-500 text-[9px] font-black rounded-lg uppercase tracking-[0.1em] border border-amber-500/10">
                                                        ⚡ Unlimited Ammo
                                                    </span>
                                                )}
                                                {match.advancedRules?.headshotOnly && (
                                                    <span className="px-2.5 py-1 bg-red-500/10 text-red-500 text-[9px] font-black rounded-lg uppercase tracking-[0.1em] border border-red-500/10">
                                                        🎯 HS Only
                                                    </span>
                                                )}
                                                {/* Prominent Match Badge */}
                                                {getMatchUnreadCount(match._id) > 0 && (
                                                    <div className="absolute top-4 right-4 z-20 flex items-center justify-center">
                                                        <div className="bg-red-600 text-white text-[11px] font-black w-7 h-7 rounded-full flex items-center justify-center shadow-[0_0_20px_rgba(220,38,38,0.6)] animate-bounce border-2 border-background">
                                                            {getMatchUnreadCount(match._id)}
                                                        </div>
                                                    </div>
                                                )}
                                                {['active', 'live'].includes(match.status?.toLowerCase()) && (
                                                    <span className="px-2.5 py-1 bg-blue-500/10 text-blue-500 text-[9px] font-black rounded-lg uppercase tracking-[0.1em] border border-blue-500/10">
                                                        LIVE
                                                    </span>
                                                )}
                                                {['disputed'].includes(match.status?.toLowerCase()) && (
                                                    <span className="px-2.5 py-1 bg-red-500/10 text-red-500 text-[9px] font-black rounded-lg uppercase tracking-[0.1em] border border-red-500/10">
                                                        DISPUTED
                                                    </span>
                                                )}
                                                {['completed'].includes(match.status?.toLowerCase()) && (
                                                    <span className="px-2.5 py-1 bg-muted text-muted-foreground text-[9px] font-black rounded-lg uppercase tracking-[0.1em] border border-border">
                                                        FINISHED
                                                    </span>
                                                )}
                                                {['cancelled'].includes(match.status?.toLowerCase()) && (
                                                    <div className="flex flex-col items-start gap-1">
                                                        <span className="px-2.5 py-1 bg-red-500/10 text-red-500 text-[9px] font-black rounded-lg uppercase tracking-[0.1em] border border-red-500/10">
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

                                        <div className="flex items-center justify-between md:justify-end gap-4 md:gap-8 w-full md:w-auto mt-4 md:mt-0 shrink-0">
                                            {/* Prize Pool */}
                                            <div className="space-y-1 flex-1 md:flex-initial text-center md:text-right">
                                                <div className="flex items-center justify-center md:justify-end gap-2 text-yellow-500 font-black text-xl md:text-2xl tracking-tighter">
                                                    <Trophy className="w-5 h-5 text-yellow-500 shrink-0" />
                                                    {match.prizePool || '0'}
                                                </div>
                                                <p className="text-[10px] text-muted-foreground font-black uppercase tracking-widest">Prize Pool</p>
                                            </div>

                                            <div className="h-8 w-px bg-border/50" />

                                            {/* Entry Fee */}
                                            <div className="space-y-1 flex-1 md:flex-initial text-center md:text-right">
                                                <div className="flex items-center justify-center md:justify-end gap-2 text-primary font-black text-xl md:text-2xl tracking-tighter">
                                                    <Coins className="w-5 h-5 text-primary shrink-0" />
                                                    {match.entryFee || '0'}
                                                </div>
                                                <p className="text-[10px] text-muted-foreground font-black uppercase tracking-widest">Entry Fee</p>
                                            </div>

                                            <div className="h-8 w-px bg-border/50" />

                                            {/* Teams */}
                                            <div className="space-y-1 flex-1 md:flex-initial text-center md:text-right">
                                                <div className="flex items-center justify-center md:justify-end gap-2 text-foreground font-black text-xl md:text-2xl tracking-tighter">
                                                    <Users className="w-5 h-5 text-muted-foreground shrink-0" />
                                                    {match.joinedCount || 1}/{match.maxSlots || 2}
                                                </div>
                                                <p className="text-[10px] text-muted-foreground font-black uppercase tracking-widest">Teams</p>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="mt-8 flex flex-col sm:flex-row items-center gap-3 relative z-10 w-full">
                                        <div className="flex-1 flex flex-wrap items-center gap-2 text-[10px] md:text-[11px] font-black uppercase tracking-widest">
                                            {/* Date Pill */}
                                            <div className="flex items-center gap-2 bg-muted/40 border border-border/50 px-4 py-2.5 rounded-xl text-muted-foreground">
                                                <Calendar className="w-3.5 h-3.5 text-primary shrink-0" />
                                                <span>{match?.createdAt ? format(new Date(match.createdAt), 'MMM d, h:mm a') : 'Recently'}</span>
                                            </div>
                                            
                                            {/* Game Mode Pill */}
                                            <div className="flex items-center gap-2 bg-muted/40 border border-border/50 px-4 py-2.5 rounded-xl text-muted-foreground">
                                                <Swords className="w-3.5 h-3.5 text-primary shrink-0" />
                                                <span>{match?.gameMode || 'CS'} Match</span>
                                            </div>
                                        </div>
                                        
                                        <div className="flex items-center gap-3 w-full sm:w-auto shrink-0">
                                            {showShareBtn && (
                                                match.privacy === 'Private' ? (
                                                    <button 
                                                        onClick={() => {
                                                            const inviteUrl = `${window.location.origin}/battle-zone/${match._id}`;
                                                            navigator.clipboard.writeText(inviteUrl);
                                                            toast.success("Match invite link copied!");
                                                        }}
                                                        className="flex-1 sm:flex-initial bg-blue-600 hover:bg-blue-700 text-white font-black px-4 sm:px-6 py-3.5 rounded-2xl text-[10px] sm:text-xs uppercase tracking-wider hover:scale-105 active:scale-95 transition-all shadow-xl shadow-blue-600/25 flex items-center justify-center gap-2 cursor-pointer whitespace-nowrap"
                                                        title="Copy Invite Link"
                                                    >
                                                        <Copy className="w-4 h-4 text-white shrink-0" />
                                                        <span>Copy Link</span>
                                                    </button>
                                                ) : (
                                                    <button 
                                                        onClick={() => handleShareClick(match)}
                                                        className="flex-1 sm:flex-initial bg-green-600 hover:bg-green-700 text-white font-black px-4 sm:px-6 py-3.5 rounded-2xl text-[10px] sm:text-xs uppercase tracking-wider hover:scale-105 active:scale-95 transition-all shadow-xl shadow-green-600/25 flex items-center justify-center gap-2 cursor-pointer whitespace-nowrap"
                                                        title="Share to WhatsApp Admin"
                                                    >
                                                        <svg className="w-5 h-5 fill-current shrink-0 text-white" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                                            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L0 24l6.335-1.662c1.72.937 3.659 1.432 5.623 1.433h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.415-8.423"/>
                                                        </svg>
                                                        <span>WhatsApp</span>
                                                    </button>
                                                )
                                            )}
                                            
                                            <button 
                                                onClick={() => {
                                                    if (isGuest) {
                                                        requireAuth();
                                                    } else {
                                                        router.push(`/battle-zone/${match._id}`);
                                                    }
                                                }} 
                                                className={`${showShareBtn ? 'flex-1 sm:flex-initial' : 'w-full'} sm:w-auto bg-foreground text-background font-black px-4 sm:px-6 py-3.5 rounded-2xl text-[10px] sm:text-xs uppercase tracking-wider hover:scale-105 active:scale-95 transition-all shadow-xl shadow-foreground/10 flex items-center justify-center gap-3 cursor-pointer whitespace-nowrap`}
                                            >
                                                <span>{isHost || isParticipant ? 'Match Room' : 'Join Battle'}</span>
                                                <Swords className="w-4 h-4 text-background shrink-0" />
                                            </button>
                                        </div>
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

                <WhatsAppShareModal
                    isOpen={isShareModalOpen}
                    onClose={() => setIsShareModalOpen(false)}
                    admins={whatsappAdmins}
                    match={selectedMatch}
                    onSelectAdmin={(number) => {
                        openWhatsApp(number, selectedMatch);
                        setIsShareModalOpen(false);
                    }}
                />
            </div>
    );

}

interface WhatsAppShareModalProps {
    isOpen: boolean;
    onClose: () => void;
    admins: any[];
    match: any;
    onSelectAdmin: (number: string) => void;
}

function WhatsAppShareModal({ isOpen, onClose, admins, match, onSelectAdmin }: WhatsAppShareModalProps) {
    const [now, setNow] = useState(Date.now());

    useEffect(() => {
        const interval = setInterval(() => {
            setNow(Date.now());
        }, 1000);
        return () => clearInterval(interval);
    }, []);

    if (!isOpen || !match) return null;

    const sharedLogs = match.sharedWithAdmins || [];
    const mostRecentSharedTime = sharedLogs.length > 0
        ? Math.max(...sharedLogs.map((item: any) => new Date(item.sharedAt).getTime()))
        : 0;

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm"
            >
                <motion.div
                    initial={{ scale: 0.95, y: 15 }}
                    animate={{ scale: 1, y: 0 }}
                    exit={{ scale: 0.95, y: 15 }}
                    className="bg-card border border-border w-full max-w-md rounded-[2rem] shadow-2xl overflow-hidden flex flex-col max-h-[85vh] text-foreground"
                >
                    {/* Modal Header */}
                    <div className="flex items-center justify-between px-6 py-5 border-b border-border bg-muted/10">
                        <div className="flex items-center gap-2.5">
                            <div className="p-2 bg-green-500/10 rounded-xl">
                                <svg className="w-5 h-5 text-green-500 fill-current" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L0 24l6.335-1.662c1.72.937 3.659 1.432 5.623 1.433h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.415-8.423"/>
                                </svg>
                            </div>
                            <h3 className="font-black text-base text-foreground uppercase tracking-tight">Share to WhatsApp Admin</h3>
                        </div>
                        <button
                            onClick={onClose}
                            className="p-2 text-muted-foreground hover:text-foreground hover:bg-muted/50 rounded-xl transition-all cursor-pointer"
                        >
                            <span className="sr-only">Close</span>
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>

                    {/* Modal Content */}
                    <div className="flex-1 overflow-y-auto p-6 space-y-4">
                        <p className="text-xs text-muted-foreground font-medium leading-relaxed">
                            Select an Admin from the list below to share the match details. A WhatsApp chat will open with a pre-filled template.
                        </p>

                        <div className="space-y-2.5">
                            {admins.map((admin, idx) => {
                                const log = sharedLogs.find((item: any) => item.number === admin.number);
                                const lastSharedTime = log ? new Date(log.sharedAt).getTime() : 0;
                                
                                const cooldown30 = lastSharedTime ? (30 * 60 * 1000 - (now - lastSharedTime)) : 0;
                                const cooldown5 = mostRecentSharedTime ? (5 * 60 * 1000 - (now - mostRecentSharedTime)) : 0;

                                let remainingTime = 0;
                                if (cooldown30 > 0) {
                                    remainingTime = cooldown30;
                                } else if (cooldown5 > 0 && lastSharedTime !== mostRecentSharedTime) {
                                    remainingTime = cooldown5;
                                }

                                const onCooldown = remainingTime > 0;
                                
                                const formatRemaining = (ms: number) => {
                                    const min = Math.floor(ms / 60000);
                                    const sec = Math.floor((ms % 60000) / 1000);
                                    return `${min}m ${sec}s`;
                                };

                                return (
                                    <button
                                        key={idx}
                                        onClick={() => !onCooldown && onSelectAdmin(admin.number)}
                                        disabled={onCooldown}
                                        className={`w-full flex items-center justify-between p-4 border rounded-2xl transition-all text-left group ${
                                            onCooldown 
                                                ? 'bg-muted/10 border-border opacity-50 cursor-not-allowed'
                                                : 'bg-muted/20 hover:bg-primary/5 border-border hover:border-primary/30 cursor-pointer'
                                        }`}
                                    >
                                        <div className="min-w-0">
                                            <p className={`font-bold text-sm transition-colors ${onCooldown ? 'text-muted-foreground' : 'text-foreground group-hover:text-primary'}`}>{admin.name}</p>
                                            <p className="font-mono text-[10px] text-muted-foreground mt-0.5">{admin.number}</p>
                                        </div>
                                        {onCooldown ? (
                                            <span className="text-[10px] font-black uppercase tracking-wider text-amber-500 bg-amber-500/10 px-3 py-1.5 rounded-xl border border-amber-500/10 shrink-0">
                                                Wait {formatRemaining(remainingTime)}
                                            </span>
                                        ) : (
                                            <span className="text-[10px] font-black uppercase tracking-wider text-green-500 bg-green-500/10 px-3 py-1.5 rounded-xl border border-green-500/10 group-hover:scale-105 transition-transform shrink-0">
                                                Chat
                                            </span>
                                        )}
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* Modal Footer */}
                    <div className="px-6 py-4 border-t border-border bg-muted/10 flex justify-end shrink-0">
                        <button
                            onClick={onClose}
                            className="px-5 py-2.5 bg-muted border border-border text-foreground font-black uppercase tracking-wider text-xs rounded-xl transition-all hover:bg-muted/80 active:scale-95 cursor-pointer"
                        >
                            Cancel
                        </button>
                    </div>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
}
