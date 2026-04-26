"use client";
import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import PageHeader from '@/components/PageHeader';
import { 
    Swords, Trophy, Users, Calendar, Coins, Loader2, MapPin, 
    Shield, Crosshair, ArrowLeft, MessageSquare, Gamepad2, Info 
} from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import TournamentChat from '@/components/battle-zone/TournamentChat';
import HostControls from '@/components/battle-zone/HostControls';
import PlayerControls from '@/components/battle-zone/PlayerControls';
import JoinTournamentModal from '@/components/JoinTournamentModal';

type TabType = 'info' | 'teams' | 'room' | 'chat';

export default function TournamentDetailsPage({ params }: { params: Promise<{ id: string }> }) {
    const router = useRouter();
    const { id } = use(params);
    const { data: session } = useSession();

    const [tournament, setTournament] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [userData, setUserData] = useState<any>(null);
    const [activeTab, setActiveTab] = useState<TabType>('info');
    const [prevTournament, setPrevTournament] = useState<any>(null);
    const [notifications, setNotifications] = useState({
        info: false,
        teams: false,
        room: false,
        chat: false
    });

    const userId = (session?.user as any)?.id;
    const isJoined = !!(session?.user && userId && tournament?.participants?.some((p: any) =>
        (p.userId?._id || p.userId)?.toString() === userId?.toString()
    ));

    const isHost = !!(session?.user && userId && tournament?.createdBy && (tournament?.createdBy?._id || tournament?.createdBy)?.toString() === userId?.toString());
    const isAdmin = (session?.user as any)?.role === 'admin';

    const fetchTournament = async (isInitial = false) => {
        try {
            const res = await fetch(`/api/tournaments/${id}`);
            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.error || 'Failed to fetch tournament details');
            }

            const newTournament = data.data;

            // Redirect if official tournament (should use premium layout)
            if (newTournament.isOfficial) {
                router.replace(`/tournaments/${id}`);
                return;
            }

            // Notification Logic (only if not initial load)
            if (!isInitial && tournament) {
                // Check for new participants
                if (newTournament.participants?.length > (tournament.participants?.length || 0) && activeTab !== 'teams') {
                    setNotifications(prev => ({ ...prev, teams: true }));
                }

                // Check for Room IDs or Result declarations
                const roomDetailsReleased = (newTournament.roomID && !tournament.roomID);
                const resultDeclared = newTournament.results?.declaredAt && !tournament.results?.declaredAt;
                
                if ((roomDetailsReleased || resultDeclared) && activeTab !== 'room') {
                    setNotifications(prev => ({ ...prev, room: true }));
                }
            }

            setTournament(newTournament);
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

    useEffect(() => {
        fetchTournament(true);
        fetchUserProfile();

        // Polling for real-time updates
        const interval = setInterval(() => fetchTournament(), 3000);
        return () => clearInterval(interval);
    }, [id, session, tournament?.participants?.length, activeTab]); // Include length and tab in deps for correct comparison

    // Handle initial auto-tab switching
    useEffect(() => {
        if (isJoined && activeTab === 'info' && tournament?.status !== 'Completed') {
            setActiveTab('room');
        }
    }, [isJoined, tournament?.status]);

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
                    <Loader2 className="w-10 h-10 animate-spin text-primary" />
                    <p className="text-sm text-muted-foreground animate-pulse">Loading Battle Zone...</p>
                </div>
            </div>
        );
    }

    if (error || !tournament) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-background p-4 text-center">
                <div className="bg-destructive/10 p-4 rounded-full mb-4">
                    <Shield className="w-8 h-8 text-destructive" />
                </div>
                <h2 className="text-xl font-bold mb-2">Error Loading Match</h2>
                <p className="text-muted-foreground mb-6">{error || 'Tournament not found'}</p>
                <Link 
                    href="/battle-zone" 
                    className="bg-primary text-primary-foreground px-6 py-2 rounded-lg font-bold hover:opacity-90 transition-all"
                >
                    Back to Battle Zone
                </Link>
            </div>
        );
    }

    const isFull = tournament?.participants?.length >= tournament?.maxSlots;
    const canChat = isJoined || isAdmin;

    const tabs: { id: TabType, label: string, icon: any, disabled?: boolean, hasNotification?: boolean }[] = [
        { id: 'info', label: 'Match Info', icon: Info, hasNotification: notifications.info },
        { id: 'teams', label: 'Teams', icon: Users, hasNotification: notifications.teams },
        { id: 'room', label: 'Match Room', icon: Gamepad2, disabled: !isJoined && !isAdmin, hasNotification: notifications.room },
        { id: 'chat', label: 'Lobby Chat', icon: MessageSquare, disabled: !canChat, hasNotification: notifications.chat }
    ];

    return (
        <div className="min-h-screen bg-background pb-24 lg:pb-8 flex flex-col">
            <div className="pt-2 pb-3 px-4 border-b border-border/40 bg-background/50 backdrop-blur-md sticky top-0 z-30 mb-6 flex items-center gap-3">
                <Link href="/battle-zone" className="p-2 hover:bg-muted rounded-xl transition-colors">
                    <ArrowLeft className="w-5 h-5" />
                </Link>
                <div className="flex-1 min-w-0">
                    <h1 className="font-bold text-base leading-tight truncate">{tournament.title}</h1>
                    <div className="flex items-center gap-2">
                        <span className={`w-2 h-2 rounded-full ${tournament.status === 'Open' ? 'bg-green-500' : 'bg-yellow-500'}`} />
                        <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest leading-none">
                            {tournament.status} • {tournament.format}
                        </span>
                    </div>
                </div>
                    <div className="flex items-center gap-1.5 bg-primary/10 border border-primary/20 px-2.5 py-1 rounded-full">
                        <Shield className="w-3 h-3 text-primary" />
                        <span className="text-[10px] font-bold text-primary italic uppercase tracking-tighter">
                            {tournament.createdBy?.name || 'ADMIN'}
                        </span>
                    </div>
            </div>

            <main className="flex-1 max-w-2xl mx-auto w-full p-4 space-y-6">
                
                {/* Visual Stats Banner */}
                <div className="relative overflow-hidden bg-gradient-to-br from-card to-muted rounded-3xl border border-border p-6 shadow-xl shadow-primary/5">
                    <div className="absolute top-0 right-0 p-8 opacity-10">
                        <Trophy className="w-32 h-32" />
                    </div>
                    
                    <div className="flex flex-col md:flex-row items-center gap-6 relative z-10">
                        <div className="grid grid-cols-2 gap-8 flex-1 w-full">
                            <div className="space-y-1 text-center md:text-left">
                                <span className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em]">Prize Pool</span>
                                <div className="flex items-center justify-center md:justify-start gap-2">
                                    <Trophy className="w-6 h-6 text-yellow-500" />
                                    <span className="text-3xl font-black text-foreground">{tournament.prizePool}</span>
                                </div>
                            </div>
                            <div className="space-y-1 text-center md:text-left">
                                <span className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em]">Entry Fee</span>
                                <div className="flex items-center justify-center md:justify-start gap-2">
                                    <Coins className="w-6 h-6 text-primary" />
                                    <span className="text-3xl font-black text-foreground">{tournament.entryFee || 'FREE'}</span>
                                </div>
                            </div>
                        </div>

                        {!isJoined && !isFull && (
                            <button
                                onClick={handleJoinClick}
                                className="group bg-foreground text-background w-full md:w-auto px-8 py-4 rounded-2xl font-black uppercase tracking-wider text-sm flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-[0.98] transition-all shadow-xl shadow-foreground/10"
                            >
                                <Swords className="w-5 h-5" />
                                Join Match
                            </button>
                        )}
                        {isJoined && (
                            <div className="bg-green-500/10 border border-green-500/20 px-6 py-3 rounded-2xl flex items-center gap-2">
                                <Shield className="w-5 h-5 text-green-500" />
                                <span className="text-sm font-bold text-green-500 uppercase tracking-wide">Joined Successfully</span>
                            </div>
                        )}
                        {isFull && !isJoined && (
                            <div className="bg-muted px-8 py-4 rounded-2xl flex items-center gap-2 grayscale border border-border">
                                <span className="text-sm font-bold text-muted-foreground uppercase tracking-wide italic">Tournament Full</span>
                            </div>
                        )}
                    </div>
                </div>

                {/* Tab Switcher */}
                <div className="grid grid-cols-4 bg-muted/40 p-1.5 rounded-2xl border border-border sticky top-[4.5rem] z-40 backdrop-blur-xl">
                    {tabs.map((tab) => {
                        const Icon = tab.icon;
                        const isActive = activeTab === tab.id;
                        return (
                            <button
                                key={tab.id}
                                onClick={() => {
                                    if (!tab.disabled) {
                                        setActiveTab(tab.id);
                                        setNotifications(prev => ({ ...prev, [tab.id]: false }));
                                    }
                                }}
                                disabled={tab.disabled}
                                className={`
                                    relative flex flex-col items-center gap-1.5 py-3 rounded-xl transition-all duration-300
                                    ${isActive ? 'text-primary' : tab.disabled ? 'text-muted-foreground opacity-30 grayscale' : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'}
                                `}
                            >
                                {isActive && (
                                    <motion.div 
                                        layoutId="activeTabBg"
                                        className="absolute inset-0 bg-background border border-border rounded-xl shadow-sm"
                                    />
                                )}
                                <Icon className={`w-5 h-5 relative z-10 transition-transform ${isActive ? 'scale-110' : ''}`} />
                                <span className="text-[10px] font-black uppercase tracking-tighter relative z-10 leading-none text-center">
                                    {tab.label}
                                </span>

                                {tab.hasNotification && (
                                    <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border-2 border-background animate-pulse z-20" />
                                )}
                            </button>
                        );
                    })}
                </div>

                {/* Content Sections */}
                <div className="relative min-h-[400px]">
                    <AnimatePresence mode="wait">
                        
                        {/* Tab 1: Match Info */}
                        {activeTab === 'info' && (
                            <motion.div
                                key="info"
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                className="space-y-6"
                            >
                                {/* Rules Grid */}
                                <section className="grid grid-cols-2 gap-4">
                                    <div className="bg-card border border-border p-4 rounded-2xl space-y-1">
                                        <div className="flex items-center gap-2 text-muted-foreground">
                                            <MapPin className="w-3.5 h-3.5" />
                                            <span className="text-[10px] font-bold uppercase tracking-wider">Map</span>
                                        </div>
                                        <p className="font-extrabold text-sm">{tournament.customRules?.map || tournament.map || 'Bermuda'}</p>
                                    </div>
                                    <div className="bg-card border border-border p-4 rounded-2xl space-y-1">
                                        <div className="flex items-center gap-2 text-muted-foreground">
                                            <Crosshair className="w-3.5 h-3.5" />
                                            <span className="text-[10px] font-bold uppercase tracking-wider">Mode</span>
                                        </div>
                                        <p className="font-extrabold text-sm">{tournament.customRules?.mode || 'Classic'}</p>
                                    </div>
                                    <div className="bg-card border border-border p-4 rounded-2xl space-y-1">
                                        <div className="flex items-center gap-2 text-muted-foreground">
                                            <Shield className="w-3.5 h-3.5" />
                                            <span className="text-[10px] font-bold uppercase tracking-wider">Gloo Wall</span>
                                        </div>
                                        <p className="font-extrabold text-sm">{tournament.customRules?.glooWall || 'Limited'}</p>
                                    </div>
                                    <div className="bg-card border border-border p-4 rounded-2xl space-y-1">
                                        <div className="flex items-center gap-2 text-muted-foreground">
                                            <Swords className="w-3.5 h-3.5" />
                                            <span className="text-[10px] font-bold uppercase tracking-wider">Gun Specs</span>
                                        </div>
                                        <p className="font-extrabold text-sm">
                                            {tournament.customRules?.gunProperties ? 'Skins ON' : 'Skins OFF'}
                                        </p>
                                    </div>
                                </section>

                                {/* Host Description */}
                                {tournament.customRules?.description && (
                                    <div className="bg-primary/5 border border-primary/10 p-5 rounded-2xl space-y-2">
                                        <h3 className="font-black text-[10px] text-primary uppercase tracking-[0.2em] flex items-center gap-2">
                                            <Info className="w-4 h-4" />
                                            Host Instructions
                                        </h3>
                                        <p className="text-sm leading-relaxed whitespace-pre-wrap font-medium">
                                            {tournament.customRules.description}
                                        </p>
                                    </div>
                                )}

                                {/* System Rules */}
                                <div className="bg-card border border-border p-5 rounded-2xl">
                                    <h3 className="font-black text-[10px] text-muted-foreground uppercase tracking-[0.2em] mb-4">Match Protocols</h3>
                                    <ul className="space-y-3">
                                        {[
                                            'No Hacking / Scripts / Third-party tools.',
                                            'Respect the Host and other Captains.',
                                            'Wait for the Host to start the match.'
                                        ].map((rule, i) => (
                                            <li key={i} className="flex items-start gap-3">
                                                <div className="mt-1 w-1.5 h-1.5 rounded-full bg-primary shrink-0" />
                                                <span className="text-[13px] text-muted-foreground font-medium">{rule}</span>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            </motion.div>
                        )}

                        {/* Tab 2: Teams */}
                        {activeTab === 'teams' && (
                            <motion.div
                                key="teams"
                                initial={{ opacity: 0, scale: 0.98 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 1.02 }}
                                className="space-y-4"
                            >
                                <div className="flex items-center justify-between mb-2">
                                    <h3 className="font-black text-xs uppercase tracking-widest text-muted-foreground">Joined Participants</h3>
                                    <span className="bg-primary/10 text-primary text-[10px] font-black px-2.5 py-1 rounded-lg">
                                        {tournament.participants.length} / {tournament.maxSlots} SLOTS
                                    </span>
                                </div>
                                
                                {tournament.participants.length === 0 ? (
                                    <div className="flex flex-col items-center justify-center p-12 bg-card rounded-2xl border border-dashed border-border text-center space-y-4">
                                        <div className="p-4 bg-muted rounded-full">
                                            <Users className="w-8 h-8 opacity-20" />
                                        </div>
                                        <p className="text-sm font-bold text-muted-foreground">No teams joined yet.</p>
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-1 gap-3">
                                        {tournament.participants.map((p: any, i: number) => {
                                            const pName = p.inGameName || p.userId?.inGameName || p.userId?.username || 'Player';
                                            const pUid = p.uid || p.userId?.uid || 'N/A';
                                            const isMe = String(p.userId?._id || p.userId) === String(userId);

                                            return (
                                                <motion.div 
                                                    key={i}
                                                    initial={{ opacity: 0, x: -10 }}
                                                    animate={{ opacity: 1, x: 0 }}
                                                    transition={{ delay: i * 0.05 }}
                                                    className={`
                                                        flex items-center gap-4 p-4 rounded-2xl border transition-all
                                                        ${isMe ? 'bg-primary/10 border-primary shadow-lg shadow-primary/10' : 'bg-card border-border hover:border-muted-foreground/30'}
                                                    `}
                                                >
                                                    <div className={`
                                                        w-12 h-12 rounded-xl flex items-center justify-center font-black text-lg
                                                        ${isMe ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}
                                                    `}>
                                                        {pName[0]?.toUpperCase()}
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <div className="flex items-center gap-2">
                                                            <p className="font-extrabold truncate text-sm">{pName}</p>
                                                            {isMe && <span className="bg-primary/20 text-primary text-[8px] font-black px-1.5 py-0.5 rounded uppercase">You</span>}
                                                        </div>
                                                        <p className="text-[10px] font-bold text-muted-foreground font-mono">UID: {pUid}</p>
                                                    </div>
                                                    <div className="w-2 h-2 rounded-full bg-green-500/40" />
                                                </motion.div>
                                            );
                                        })}
                                    </div>
                                )}
                            </motion.div>
                        )}

                        {/* Tab 3: Room & Actions */}
                        {activeTab === 'room' && (
                            <motion.div
                                key="room"
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                className="space-y-6"
                            >
                                {/* Host Controls Section */}
                                {isHost && (
                                    <div className="animate-in slide-in-from-top duration-500">
                                        <HostControls
                                            tournament={tournament}
                                            onUpdate={fetchTournament}
                                        />
                                    </div>
                                )}

                                {/* Player Action Section */}
                                {isJoined && !isHost && (
                                    <div className="animate-in slide-in-from-top duration-500">
                                        <PlayerControls
                                            tournament={tournament}
                                            userId={(session?.user as any).id}
                                            onUpdate={fetchTournament}
                                        />
                                    </div>
                                )}
                                
                                {/* Admin specific controls could go here if needed, or handled via components */}
                                {isAdmin && !isJoined && (
                                    <p className="text-center text-xs text-muted-foreground italic py-8 border border-dashed rounded-2xl">
                                        Admin view enabled. No player actions available for this match.
                                    </p>
                                )}
                            </motion.div>
                        )}

                        {/* Tab 4: Chat */}
                        {activeTab === 'chat' && (
                            <motion.div
                                key="chat"
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.95 }}
                                className="h-full"
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

            {/* Bottom Floating Join Prompt (Mobile Only) */}
            {!isJoined && !isFull && (
                <div className="lg:hidden fixed bottom-0 left-0 right-0 p-4 bg-background/80 backdrop-blur-xl border-t border-border z-40 animate-in slide-in-from-bottom flex gap-3 items-center">
                    <div className="flex-1">
                        <p className="text-[10px] font-black text-muted-foreground uppercase opacity-70">Entry Required</p>
                        <p className="text-xl font-black">{tournament.entryFee || 'FREE'}</p>
                    </div>
                    <button
                        onClick={handleJoinClick}
                        className="bg-primary text-primary-foreground px-8 py-3 rounded-xl font-black text-sm shadow-xl shadow-primary/20 active:scale-95 transition-all"
                    >
                        JOIN NOW
                    </button>
                </div>
            )}

            {/* Modals */}
            {(isModalOpen && session?.user) && (
                <JoinTournamentModal
                    isOpen={isModalOpen}
                    onClose={() => setIsModalOpen(false)}
                    tournament={tournament}
                    user={{
                        walletBalance: (session.user as any).walletBalance || userData?.walletBalance || 0,
                        inGameName: userData?.inGameName || '',
                        freeFireUid: userData?.freeFireUid || '',
                    }}
                    onJoinSuccess={() => {
                        fetchTournament();
                        setActiveTab('room');
                    }}
                />
            )}
        </div>
    );
}
