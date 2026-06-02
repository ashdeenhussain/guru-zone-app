"use client";
/* eslint-disable */
import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import PageHeader from '@/components/PageHeader';
import { 
    Swords, Trophy, Users, Calendar, Coins, Loader2, MapPin, 
    Shield, Crosshair, ArrowLeft, MessageSquare, Gamepad2, Info,
    User, Crown, AlertCircle, RotateCw
} from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import TournamentChat from '@/components/battle-zone/TournamentChat';
import HostControls from '@/components/battle-zone/HostControls';
import PlayerControls from '@/components/battle-zone/PlayerControls';
import JoinTournamentModal from '@/components/JoinTournamentModal';

const MatchCountdown = ({ expiresAt }: { expiresAt: string }) => {
    const [timeLeft, setTimeLeft] = useState<string>('');

    useEffect(() => {
        if (!expiresAt) return;

        const updateCountdown = () => {
            const now = Date.now();
            const expiryTime = new Date(expiresAt).getTime();
            const diff = expiryTime - now;

            if (diff <= 0) {
                setTimeLeft('Expired');
                return;
            }

            const hours = Math.floor(diff / (1000 * 60 * 60));
            const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
            const seconds = Math.floor((diff % (1000 * 60)) / 1000);

            if (hours > 0) {
                setTimeLeft(`${hours}h ${minutes}m ${seconds}s`);
            } else {
                setTimeLeft(`${minutes}m ${seconds}s`);
            }
        };

        updateCountdown();
        const interval = setInterval(updateCountdown, 1000);

        return () => clearInterval(interval);
    }, [expiresAt]);

    if (!timeLeft) return null;

    return (
        <div className={`mt-4 px-4 py-3 rounded-xl border flex items-center justify-center gap-2 font-black uppercase tracking-widest text-sm ${timeLeft === 'Expired' ? 'bg-destructive/10 border-destructive/20 text-destructive' : 'bg-primary/10 border-primary/20 text-primary'}`}>
            {timeLeft === 'Expired' ? 'Match Expired' : `Expires in: ${timeLeft}`}
        </div>
    );
};

type TabType = 'info' | 'teams' | 'room' | 'chat';

export default function BattleMatchDetailsPage({ params }: { params: Promise<{ id: string }> }) {
    const router = useRouter();
    const { id } = use(params);
    const { data: session } = useSession();

    const [match, setMatch] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [userData, setUserData] = useState<any>(null);
    const [activeTab, setActiveTab] = useState<TabType>('info');
    const [notifications, setNotifications] = useState({
        info: false,
        teams: false,
        room: false,
        chat: false
    });

    const userId = (session?.user as any)?.id;
    const isJoined = !!(session?.user && userId && match?.participants?.some((p: any) =>
        (p.userId?._id || p.userId)?.toString() === userId?.toString()
    ));

    const isHost = !!(session?.user && userId && match?.createdBy && (match?.createdBy?._id || match?.createdBy)?.toString() === userId?.toString());
    const isAdmin = (session?.user as any)?.role === 'admin';

    // Extract current user participant data for WhatsApp message
    const currentUserParticipant = match?.participants?.find((p: any) => 
        (p.userId?._id || p.userId)?.toString() === userId?.toString()
    );
    const inGameName = currentUserParticipant?.inGameName || userData?.inGameName || (session?.user as any)?.name || "N/A";
    const uid = currentUserParticipant?.uid || userData?.freeFireUid || "N/A";

    // WhatsApp Message Formatting
    const adminWhatsapp = "923306414313"; // Target admin number
    const matchDetails = `${match?.title} (${match?.gameMode} ${match?.format})`;
    const whatsappMessage = `Hello Admin, I am reporting a Disputed Match.

Match Name: ${matchDetails}
Match ID: ${match?._id}
My Role: ${isHost ? 'Host' : 'Joiner'}
My In-Game Name/UID: ${inGameName} / ${uid}

Here is my video proof:`;

    const whatsappUrl = `https://wa.me/${adminWhatsapp}?text=${encodeURIComponent(whatsappMessage)}`;

    const [isRefreshing, setIsRefreshing] = useState(false);

    const fetchMatch = async (isInitial = false, force = false) => {
        if (!force && !isInitial && typeof document !== 'undefined' && document.visibilityState !== 'visible') {
            return;
        }
        try {
            const res = await fetch(`/api/battle-zone/matches/${id}`);
            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.error || 'Failed to fetch match details');
            }

            const newMatch = data.data;

            if (newMatch.isOfficial) {
                router.replace(`/tournaments/${id}`);
                return;
            }

            if (!isInitial && match) {
                if (newMatch.participants?.length > (match.participants?.length || 0) && activeTab !== 'teams') {
                    setNotifications(prev => ({ ...prev, teams: true }));
                }
                const roomDetailsReleased = (newMatch.roomID && !match.roomID);
                if (roomDetailsReleased && activeTab !== 'room') {
                    setNotifications(prev => ({ ...prev, room: true }));
                }
            }

            setMatch(newMatch);
        } catch (err: any) {
            setError(err.message);
        } finally {
            if (isInitial) setIsLoading(false);
        }
    };

    const fetchUserProfile = async () => {
        if (!session?.user) return;
        try {
            const res = await fetch('/api/user/profile');
            const data = await res.json();
            if (data.success) {
                setUserData(data.user);
            }
        } catch (e) {
            console.error("Failed to fetch user profile", e);
        }
    };

    const [unreadCounts, setUnreadCounts] = useState<any>(null);

    const fetchUnreadCounts = async (force = false) => {
        if (!force && typeof document !== 'undefined' && document.visibilityState !== 'visible') {
            return;
        }
        if (!session) return;
        try {
            const res = await fetch('/api/notifications/unread-count');
            const data = await res.json();
            if (data.success && data.counts.breakdown) {
                const searchId = id.toString().trim();
                const key = Object.keys(data.counts.breakdown).find(k => k.toString().trim() === searchId);
                if (key) {
                    const counts = data.counts.breakdown[key];
                    
                    // If we are currently active on a tab that has unread counts,
                    // proactively mark as read and zero out local state to prevent flicker
                    if ((activeTab === 'chat' && counts.chat > 0) || (activeTab === 'room' && counts.system > 0)) {
                        fetch('/api/notifications/read-chat', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ tournamentId: match?._id || id }),
                        }).catch(() => {});
                        
                        if (activeTab === 'chat') counts.chat = 0;
                        if (activeTab === 'room') counts.system = 0;
                    }

                    setUnreadCounts(counts);
                } else {
                    setUnreadCounts({ chat: 0, system: 0 });
                }
            }
        } catch (e) {}
    };

    const handleRefresh = async () => {
        setIsRefreshing(true);
        try {
            await Promise.all([
                fetchMatch(false, true),
                fetchUnreadCounts(true),
                fetchUserProfile()
            ]);
            toast.success("Match details updated!");
        } catch (e) {
            console.error(e);
        } finally {
            setIsRefreshing(false);
        }
    };

    useEffect(() => {
        fetchMatch(true, true);
        fetchUserProfile();
        fetchUnreadCounts(true);
        const interval = setInterval(() => {
            fetchMatch(false, false);
            fetchUnreadCounts(false);
        }, 45000);
        return () => clearInterval(interval);
    }, [id, session]);

    useEffect(() => {
        if (isJoined && activeTab === 'info' && match?.status !== 'completed') {
            setActiveTab('room');
        }
    }, [isJoined, match?.status]);

    const handleJoinClick = () => {
        if (!session) {
            toast.error('Please login to join');
            router.push('/auth/login');
            return;
        }
        setIsModalOpen(true);
    };

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-background">
                <div className="flex flex-col items-center gap-4">
                    <Loader2 className="w-12 h-12 animate-spin text-[#F5C518]" />
                    <p className="text-sm text-muted-foreground animate-pulse font-bold tracking-widest uppercase">Loading Battle...</p>
                </div>
            </div>
        );
    }

    if (error || !match) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-background p-4 text-center">
                <div className="bg-destructive/10 p-4 rounded-full mb-4">
                    <Shield className="w-8 h-8 text-destructive" />
                </div>
                <h2 className="text-xl font-bold mb-2 text-white">Match Not Found</h2>
                <p className="text-muted-foreground mb-6">{error || 'This battle does not exist or has been removed.'}</p>
                <Link 
                    href="/battle-zone" 
                    className="bg-primary text-primary-foreground px-8 py-3 rounded-xl font-black uppercase tracking-wider hover:scale-105 transition-all shadow-lg shadow-primary/20"
                >
                    Back to Battle Zone
                </Link>
            </div>
        );
    }

    const isFull = match?.joinedCount >= match?.maxSlots;
    const canChat = isJoined || isAdmin;

    const tabs: { id: TabType, label: string, icon: any, disabled?: boolean, count?: number }[] = [
        { id: 'info', label: 'MATCH INFO', icon: Info },
        { id: 'teams', label: 'TEAMS', icon: Users },
        { id: 'room', label: 'MATCH ROOM', icon: Gamepad2, disabled: !isJoined && !isAdmin, count: unreadCounts?.system },
        { id: 'chat', label: 'LOBBY CHAT', icon: MessageSquare, disabled: !canChat, count: unreadCounts?.chat }
    ];

    return (
        <div className="min-h-screen bg-background text-foreground pb-24 lg:pb-8 flex flex-col">
            {/* Navbar Header */}
            <div className="pt-4 pb-4 px-4 border-b border-border bg-card/80 backdrop-blur-xl sticky top-0 z-50 flex items-center gap-4 shadow-2xl">
                <Link href="/battle-zone" className="p-2 hover:bg-muted rounded-xl transition-all group">
                    <ArrowLeft className="w-6 h-6 group-hover:-translate-x-1 transition-transform" />
                </Link>
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                        <h1 className="font-black text-lg leading-tight truncate tracking-tight">{match.title}</h1>
                        <button
                            onClick={handleRefresh}
                            disabled={isRefreshing}
                            className="p-1.5 bg-muted/40 hover:bg-muted border border-border/50 rounded-lg transition-all active:scale-95 flex items-center justify-center shrink-0"
                            title="Refresh Match Room"
                        >
                            <RotateCw className={`w-3.5 h-3.5 text-muted-foreground hover:text-foreground ${isRefreshing ? 'animate-spin text-primary' : ''}`} />
                        </button>
                    </div>
                    <div className="flex items-center gap-2 mt-0.5">
                        <span className={`w-2 h-2 rounded-full animate-pulse ${match.status === 'open' ? 'bg-green-500' : 'bg-yellow-500'}`} />
                        <span className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] leading-none">
                            {match.status} • {match.format}
                        </span>
                    </div>
                </div>
                <div className="flex items-center gap-2 bg-primary/10 border border-primary/20 px-4 py-1.5 rounded-full">
                    <Crown className="w-4 h-4 text-primary" />
                    <span className="text-[11px] font-black text-primary uppercase tracking-tighter">
                        {match.createdBy?.name || 'HOST'}
                    </span>
                </div>
            </div>

            <main className="flex-1 max-w-2xl mx-auto w-full p-4 space-y-6">
                
                {/* Admin Resolution Comment */}
                {match.resolutionComment && (
                    <motion.div 
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-blue-500/10 border border-blue-500/20 rounded-[2.5rem] p-8 space-y-4 shadow-xl shadow-blue-500/5"
                    >
                        <div className="flex items-center gap-3 text-blue-500">
                            <Shield className="w-6 h-6" />
                            <span className="text-sm font-black uppercase tracking-[0.2em]">Admin Decision</span>
                        </div>
                        <div className="bg-muted/50 p-6 rounded-2xl border border-border">
                            <p className="text-base font-bold text-foreground leading-relaxed italic">
                                "{match.resolutionComment}"
                            </p>
                        </div>
                        {match.resolvedAt && (
                            <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest text-center">
                                Verdict issued on {format(new Date(match.resolvedAt), "MMMM d, yyyy 'at' h:mm a")}
                            </p>
                        )}
                    </motion.div>
                )}

                {/* Disputed Match Alert Banner */}
                {match.status?.toLowerCase() === 'disputed' && !match.resolutionComment && (
                    <motion.div 
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="relative overflow-hidden bg-gradient-to-br from-orange-500/20 to-red-500/10 border-2 border-orange-500/30 rounded-[2.5rem] p-8 shadow-2xl"
                    >
                        <div className="absolute top-0 right-0 p-8 opacity-10">
                            <AlertCircle className="w-24 h-24 text-orange-500" />
                        </div>
                        
                        <div className="relative z-10 flex flex-col items-center text-center space-y-6">
                            <div className="w-16 h-16 bg-orange-500 rounded-2xl flex items-center justify-center shadow-lg shadow-orange-500/40 rotate-3">
                                <AlertCircle className="w-10 h-10 text-white" />
                            </div>
                            
                            <div className="space-y-2">
                                <h2 className="text-2xl font-black text-foreground uppercase tracking-tight">Match Disputed</h2>
                                <p className="text-sm font-bold text-muted-foreground max-w-sm mx-auto leading-relaxed">
                                    Our administrators are reviewing this match. To speed up the process, please send your video proof via WhatsApp.
                                </p>
                            </div>

                            <a 
                                href={whatsappUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="group relative w-full md:w-auto flex items-center justify-center gap-4 bg-[#25D366] hover:bg-[#128C7E] text-white px-10 py-5 rounded-2xl font-black uppercase tracking-wider text-sm transition-all hover:scale-[1.02] active:scale-95 shadow-xl shadow-green-500/30"
                            >
                                <svg viewBox="0 0 24 24" fill="currentColor" className="w-7 h-7 group-hover:rotate-12 transition-transform">
                                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L0 24l6.335-1.662c1.72.937 3.659 1.432 5.623 1.433h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.415-8.423"/>
                                </svg>
                                Send Video Proof to Admin
                            </a>
                        </div>
                    </motion.div>
                )}
                
                {/* Created At Display */}
                <div className="flex justify-center -mt-2 mb-2">
                    <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest bg-muted/50 px-4 py-2 rounded-xl border border-border flex items-center gap-2">
                        <Calendar className="w-3 h-3" />
                        Created on: {match.createdAt ? format(new Date(match.createdAt), "MMMM d, yyyy, 'at' h:mm a") : 'Unknown'}
                    </span>
                </div>

                {/* Expiry Countdown */}
                {['open'].includes(match.status?.toLowerCase()) && (
                    <MatchCountdown expiresAt={match.expiresAt || new Date(new Date(match.createdAt).getTime() + 60 * 60 * 1000).toISOString()} />
                )}

                {/* Prize & Entry Stats */}
                <div className="relative overflow-hidden bg-card rounded-[2.5rem] border border-border p-8 shadow-2xl">
                    <div className="absolute -top-10 -right-10 opacity-5">
                        <Trophy className="w-64 h-64 rotate-12 text-yellow-500" />
                    </div>
                    
                    <div className="flex flex-col md:flex-row items-center gap-8 relative z-10">
                        <div className="grid grid-cols-2 gap-12 flex-1 w-full">
                            <div className="space-y-2 text-center md:text-left">
                                <span className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.3em]">Prize Pool</span>
                                <div className="flex items-center justify-center md:justify-start gap-3">
                                    <Trophy className="w-8 h-8 text-primary drop-shadow-[0_0_10px_rgba(245,197,24,0.4)]" />
                                    <span className="text-4xl font-black text-foreground">{match.prizePool}</span>
                                </div>
                            </div>
                            <div className="space-y-2 text-center md:text-left">
                                <span className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.3em]">Entry Fee</span>
                                <div className="flex items-center justify-center md:justify-start gap-3">
                                    <Coins className="w-8 h-8 text-primary" />
                                    <span className="text-4xl font-black text-foreground">{match.entryFee || 'FREE'}</span>
                                </div>
                            </div>
                        </div>

                        {!isJoined && !isFull && (
                            <button
                                onClick={handleJoinClick}
                                className="group bg-primary text-primary-foreground w-full md:w-auto px-10 py-5 rounded-2xl font-black uppercase tracking-[0.1em] text-sm flex items-center justify-center gap-3 hover:scale-105 active:scale-95 transition-all shadow-xl shadow-primary/20"
                            >
                                <Swords className="w-6 h-6" />
                                Join Match
                            </button>
                        )}
                        {isJoined && (
                            <div className="bg-green-500/10 border border-green-500/20 px-8 py-4 rounded-2xl flex items-center gap-3">
                                <Shield className="w-6 h-6 text-green-500" />
                                <span className="text-sm font-black text-green-500 uppercase tracking-widest">Enrolled</span>
                            </div>
                        )}
                        {isFull && !isJoined && (
                            <div className="bg-muted/50 px-8 py-4 rounded-2xl flex items-center gap-3 border border-border opacity-50">
                                <AlertCircle className="w-6 h-6 text-muted-foreground" />
                                <span className="text-sm font-black text-muted-foreground uppercase tracking-widest italic">Full Match</span>
                            </div>
                        )}
                    </div>
                </div>

                {/* Battle Zone Tab Switcher */}
                <div className="grid grid-cols-4 bg-muted/50 p-1.5 rounded-[2rem] border border-border sticky top-24 z-40 backdrop-blur-xl shadow-2xl">
                    {tabs.map((tab) => {
                        const Icon = tab.icon;
                        const isActive = activeTab === tab.id;
                        return (
                            <button
                                key={tab.id}
                                onClick={() => {
                                    if (!tab.disabled) {
                                        setActiveTab(tab.id);
                                        // Smart Clearing: Update local state immediately
                                        if (tab.id === 'chat' || tab.id === 'room') {
                                            if (tab.id === 'chat') {
                                                setUnreadCounts((prev: any) => ({ ...prev, chat: 0 }));
                                            } else {
                                                setUnreadCounts((prev: any) => ({ ...prev, system: 0 }));
                                            }
                                            
                                            // Back up with server call
                                            fetch('/api/notifications/read-chat', {
                                                method: 'POST',
                                                headers: { 'Content-Type': 'application/json' },
                                                body: JSON.stringify({ tournamentId: match?._id || id }),
                                            }).catch(() => {});
                                        }
                                    }
                                }}
                                disabled={tab.disabled}
                                className={`
                                    relative flex flex-col items-center gap-2 py-4 rounded-2xl transition-all duration-500
                                    ${isActive ? 'text-primary-foreground' : tab.disabled ? 'text-muted-foreground/20 opacity-20' : 'text-muted-foreground hover:text-foreground hover:bg-muted'}
                                `}
                            >
                                {isActive && (
                                    <motion.div 
                                        layoutId="activeTabBg"
                                        className="absolute inset-0 bg-primary rounded-2xl shadow-[0_0_20px_rgba(245,197,24,0.3)]"
                                        transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                                    />
                                )}
                                <Icon className={`w-5 h-5 relative z-10 transition-transform ${isActive ? 'scale-110' : ''}`} />
                                <span className="text-[9px] font-black uppercase tracking-widest relative z-10 leading-none text-center">
                                    {tab.label}
                                </span>

                                {(tab.count ?? 0) > 0 && !isActive && (
                                    <span className="absolute top-2 right-2 min-w-[20px] h-[20px] px-1.5 bg-red-600 text-white text-[10px] font-black rounded-full flex items-center justify-center shadow-[0_0_15px_rgba(220,38,38,0.5)] animate-pulse border-2 border-background z-20">
                                        {tab.count}
                                    </span>
                                )}
                            </button>
                        );
                    })}
                </div>

                {/* Content Sections */}
                <div className="relative min-h-[500px]">
                    <AnimatePresence mode="wait">
                        
                        {/* Tab 1: MATCH INFO */}
                        {activeTab === 'info' && (
                            <motion.div
                                key="info"
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -20 }}
                                className="space-y-6"
                            >
                                <section className="grid grid-cols-2 gap-4">
                                    {[
                                        { icon: MapPin, label: 'Map', value: match.mapName || 'Bermuda' },
                                        { icon: Crosshair, label: 'Mode', value: match.gameMode || 'Clash Squad' },
                                        { icon: Shield, label: 'Gloo Wall', value: match.advancedRules?.limitedAmmo === false ? 'Unlimited' : 'Limited' },
                                        { icon: Swords, label: 'Gun Specs', value: match.advancedRules?.headshotOnly ? 'HS Only' : 'Skins ON' }
                                    ].map((item, i) => (
                                        <div key={i} className="bg-muted/20 border border-border p-5 rounded-3xl space-y-2 hover:bg-muted/40 transition-colors">
                                            <div className="flex items-center gap-3 text-muted-foreground">
                                                <item.icon className="w-4 h-4" />
                                                <span className="text-[10px] font-black uppercase tracking-widest">{item.label}</span>
                                            </div>
                                            <p className="font-black text-base text-foreground tracking-tight">{item.value}</p>
                                        </div>
                                    ))}
                                </section>

                                <div className="bg-muted/10 border border-border p-6 rounded-3xl space-y-4">
                                    <h3 className="font-black text-[10px] text-muted-foreground uppercase tracking-[0.3em] flex items-center gap-3">
                                        <Info className="w-4 h-4 text-primary" />
                                        Match Protocols
                                    </h3>
                                    <ul className="space-y-4">
                                        {[
                                            { text: 'Winner MUST upload screenshot within 15 minutes of completion.', highlight: true },
                                            { text: 'Using emulator or third-party scripts is strictly prohibited.', highlight: false },
                                            { text: 'Wait for the host to provide Room ID/Password in the Match Room tab.', highlight: false },
                                            { text: 'Entry fee is held in Escrow and will be released to the winner.', highlight: true }
                                        ].map((protocol, i) => (
                                            <li key={i} className="flex items-start gap-4 group">
                                                <div className={`mt-1.5 w-1.5 h-1.5 rounded-full shrink-0 ${protocol.highlight ? 'bg-primary shadow-[0_0_5px_rgba(245,197,24,0.5)]' : 'bg-muted-foreground/30'}`} />
                                                <span className={`text-[13px] font-medium leading-relaxed ${protocol.highlight ? 'text-foreground' : 'text-muted-foreground'}`}>
                                                    {protocol.text}
                                                </span>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            </motion.div>
                        )}

                        {/* Tab 2: TEAMS (VS Layout) */}
                        {activeTab === 'teams' && (
                            <motion.div
                                key="teams"
                                initial={{ opacity: 0, scale: 0.98 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 1.02 }}
                                className="space-y-12 py-8"
                            >
                                <div className="flex flex-col items-center gap-8 relative">
                                    <div className="absolute top-1/2 left-0 right-0 h-px bg-gradient-to-r from-transparent via-border to-transparent -translate-y-1/2" />
                                    <div className="bg-background border border-border px-6 py-2 rounded-full relative z-10">
                                        <span className="text-4xl font-black italic tracking-tighter text-primary opacity-20">VS</span>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-12 w-full">
                                        {/* Team A: Host */}
                                        <div className="flex flex-col items-center space-y-6">
                                            <span className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.3em]">Host / Team A</span>
                                            <div className="relative group">
                                                <div className="absolute -inset-4 bg-primary/10 rounded-full blur-2xl group-hover:bg-primary/20 transition-all duration-500" />
                                                <div className="w-24 h-24 rounded-3xl bg-gradient-to-br from-primary to-primary/60 p-[2px] shadow-2xl relative">
                                                    <div className="w-full h-full bg-background rounded-[calc(1.5rem-2px)] flex items-center justify-center overflow-hidden">
                                                        <User className="w-12 h-12 text-primary/50" />
                                                    </div>
                                                </div>
                                                <Crown className="absolute -top-3 -right-3 w-8 h-8 text-primary drop-shadow-lg" />
                                            </div>
                                            <div className="text-center">
                                                <h4 className="font-black text-xl text-foreground tracking-tight">{match.createdBy?.name || 'Waiting...'}</h4>
                                                <p className="text-[10px] font-black text-primary/50 uppercase tracking-widest mt-1">Match Captain</p>
                                            </div>
                                        </div>

                                        {/* Team B: Opponent */}
                                        <div className="flex flex-col items-center space-y-6">
                                            <span className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.3em]">Opponent / Team B</span>
                                            <div className="relative group">
                                                {match.participants?.length > 1 ? (
                                                    <>
                                                        <div className="absolute -inset-4 bg-blue-500/10 rounded-full blur-2xl group-hover:bg-blue-500/20 transition-all duration-500" />
                                                        <div className="w-24 h-24 rounded-3xl bg-gradient-to-br from-blue-500 to-indigo-700 p-[2px] shadow-2xl relative">
                                                            <div className="w-full h-full bg-background rounded-[calc(1.5rem-2px)] flex items-center justify-center overflow-hidden">
                                                                <User className="w-12 h-12 text-blue-500/50" />
                                                            </div>
                                                        </div>
                                                    </>
                                                ) : (
                                                    <div className="w-24 h-24 rounded-3xl border-2 border-dashed border-border flex items-center justify-center">
                                                        <Loader2 className="w-8 h-8 text-muted-foreground/30 animate-spin" />
                                                    </div>
                                                )}
                                            </div>
                                            <div className="text-center">
                                                <h4 className="font-black text-xl text-foreground tracking-tight">
                                                    {match.participants?.length > 1 ? match.participants[1].inGameName : 'Searching...'}
                                                </h4>
                                                <p className="text-[10px] font-black text-blue-500/50 uppercase tracking-widest mt-1">Challenger</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        )}

                        {/* Tab 3: MATCH ROOM */}
                        {activeTab === 'room' && (
                            <motion.div
                                key="room"
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -20 }}
                                className="space-y-6"
                            >
                                {isHost ? (
                                    <HostControls
                                        tournament={match}
                                        onUpdate={fetchMatch}
                                    />
                                ) : isJoined ? (
                                    <PlayerControls
                                        tournament={match}
                                        userId={userId}
                                        onUpdate={fetchMatch}
                                    />
                                ) : (
                                    <div className="flex flex-col items-center justify-center p-12 bg-muted/10 rounded-[3rem] border border-border text-center space-y-6">
                                        <div className="w-20 h-20 bg-muted/30 rounded-full flex items-center justify-center">
                                            <Gamepad2 className="w-10 h-10 text-muted-foreground/50" />
                                        </div>
                                        <div className="space-y-2">
                                            <h3 className="text-xl font-black text-foreground">Private Room Details</h3>
                                            <p className="text-sm text-muted-foreground max-w-xs mx-auto">
                                                Only match participants can access the Room ID and Password once the host releases them.
                                            </p>
                                        </div>
                                        <button 
                                            onClick={handleJoinClick}
                                            className="bg-muted hover:bg-muted/80 text-foreground px-8 py-3 rounded-2xl font-black uppercase text-xs transition-all"
                                        >
                                            Join Battle to Unlock
                                        </button>
                                    </div>
                                )}
                            </motion.div>
                        )}

                        {/* Tab 4: LOBBY CHAT */}
                        {activeTab === 'chat' && (
                            <motion.div
                                key="chat"
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.95 }}
                                className="h-full min-h-[500px]"
                            >
                                <TournamentChat
                                    tournamentId={id}
                                    isHost={isHost}
                                    isParticipant={isJoined}
                                    isAdmin={isAdmin}
                                    onNewMessage={() => {
                                        if (activeTab !== 'chat') {
                                            setNotifications(prev => ({ ...prev, chat: true }));
                                        }
                                    }}
                                />
                            </motion.div>
                        )}

                    </AnimatePresence>
                </div>
            </main>

            {/* Modals */}
            {isModalOpen && session?.user && (
                <JoinTournamentModal
                    isOpen={isModalOpen}
                    onClose={() => setIsModalOpen(false)}
                    tournament={match}
                    joinApiUrl={`/api/battle-zone/matches/${id}/join`}
                    user={{
                        walletBalance: (session.user as any).walletBalance || userData?.walletBalance || 0,
                        inGameName: userData?.inGameName || '',
                        freeFireUid: userData?.freeFireUid || '',
                    }}
                    onJoinSuccess={() => {
                        fetchMatch();
                        setActiveTab('room');
                    }}
                />
            )}
        </div>
    );
}

