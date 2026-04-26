'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import PageHeader from '@/components/PageHeader';
import { Swords, Plus, Users, Calendar, Trophy, Coins, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { format } from 'date-fns';
import { useSession } from 'next-auth/react';
import HostTournamentModal from '@/components/battle-zone/HostTournamentModal';
import TrustScoreBadge from '@/components/battle-zone/TrustScoreBadge';
import MaintenanceWrapper from '@/components/shared/MaintenanceWrapper';

export default function BattleZonePage() {
    const searchParams = useSearchParams();
    const initialTab = searchParams.get('tab') === 'my' ? 'my' : 'all';

    const { data: session } = useSession();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [tournaments, setTournaments] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [userStats, setUserStats] = useState<any>(null);
    const [joinedIds, setJoinedIds] = useState<string[]>([]);
    const [activeTab, setActiveTab] = useState<'all' | 'my'>(initialTab);
    const [isHostModalOpen, setIsHostModalOpen] = useState(false);

    const fetchTournaments = async () => {
        try {
            // Fetch only community tournaments
            const res = await fetch('/api/tournaments?type=community', { cache: 'no-store' });
            const data = await res.json();
            if (data.success) {
                setTournaments(data.data);
            }
        } catch (error) {
            console.error("Failed to fetch battle zone tournaments", error);
        } finally {
            setIsLoading(false);
        }
    };

    const fetchUserStats = async () => {
        try {
            const res = await fetch('/api/user/balance');
            if (res.ok) {
                const data = await res.json();
                if (data.success) setUserStats(data);
            }
        } catch (err) { console.error(err); }
    };

    const fetchJoinedTournaments = async () => {
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
    };

    useEffect(() => {
        fetchTournaments();
        fetchUserStats();
        fetchJoinedTournaments();
    }, []);

    const isRestricted = userStats && (userStats.trustScore || 100) < 80;
    const trustScore = userStats?.trustScore || 100;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const userId = (session?.user as any)?.id;

    const filteredTournaments = tournaments.filter(t => {
        if (activeTab === 'my') {
            // Include if joined OR created by the user
            const isJoined = joinedIds.includes(t._id);
            const isCreator = t.createdBy === userId;
            return isJoined || isCreator;
        }
        return true; // Show all for 'Browse'
    });

    const handleCreateSuccess = () => {
        setIsHostModalOpen(false);
        fetchTournaments(); // Refresh list to show new match
        setActiveTab('my'); // Switch to "My Battles"
    };

    return (
        <MaintenanceWrapper
            isActive={true}
            title="Match Center - Coming Soon"
            description="We're currently finalizing the Battle Zone with new features and a premium match center experience. Stay tuned!"
            improvementDetails={[
                "Integrated Tabbed Match Center UI",
                "Real-time Notification Dot System",
                "Secure Room Credential Reveal Mechanism",
                "Advanced Dispute & Verification Center",
                "High-performance Match Polling & WebSockets"
            ]}
        >
            <div className="min-h-screen bg-background pb-24">
                <PageHeader
                    title="Battle Zone"
                    description="Community hosted challenges & custom rooms."
                    icon={Swords}
                    customElement={
                        <div className="flex items-center gap-3">
                            <TrustScoreBadge score={trustScore} balance={userStats?.balance} />

                            {!isRestricted ? (
                                <button onClick={() => setIsHostModalOpen(true)} className="bg-primary text-primary-foreground px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 hover:bg-primary/90 transition-colors shadow-lg shadow-primary/20">
                                    <Plus className="w-3.5 h-3.5" />
                                    Host Match
                                </button>
                            ) : (
                                <div className="bg-muted text-muted-foreground px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 opacity-50 cursor-not-allowed border border-border">
                                    <Plus className="w-3.5 h-3.5" />
                                    Host Disabled
                                </div>
                            )}
                        </div>
                    }
                />

                {isRestricted && activeTab === 'all' && (
                    <div className="mx-4 md:mx-auto max-w-4xl mb-4 p-4 bg-red-500/10 border border-red-500/20 rounded-xl flex items-start gap-3 animate-in fade-in slide-in-from-top-2 duration-300">
                        <div className="p-2 bg-red-500/20 rounded-lg text-red-500">
                            <Swords className="w-5 h-5" />
                        </div>
                        <div>
                            <h4 className="text-sm font-bold text-red-500">Hosting Restricted</h4>
                            <p className="text-xs text-red-500/80 leading-relaxed mt-0.5">
                                ⚠️ Your Trust Score is below 80% ({trustScore}%). You can only <strong>JOIN</strong> matches to improve your score. Hosting is temporarily disabled.
                            </p>
                        </div>
                    </div>
                )}

                <div className="p-4 md:p-6 space-y-6 max-w-4xl mx-auto">
                    {/* Tabs Selector */}
                    <div className="grid grid-cols-2 p-1.5 bg-muted/40 rounded-xl border border-border/50">
                        <button
                            onClick={() => setActiveTab('all')}
                            className={`py-2.5 text-sm font-bold rounded-lg transition-all duration-300 ${activeTab === 'all'
                                ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/25 scale-[1.02]'
                                : 'text-muted-foreground hover:bg-muted/50 hover:text-foreground'
                                }`}
                        >
                            Browse Battles
                        </button>
                        <button
                            onClick={() => setActiveTab('my')}
                            className={`py-2.5 text-sm font-bold rounded-lg transition-all duration-300 flex items-center justify-center gap-2 ${activeTab === 'my'
                                ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/25 scale-[1.02]'
                                : 'text-muted-foreground hover:bg-muted/50 hover:text-foreground'
                                }`}
                        >
                            My Battles
                        </button>
                    </div>
                    {isLoading ? (
                        <div className="flex justify-center py-10">
                            <Loader2 className="w-8 h-8 animate-spin text-primary" />
                        </div>
                    ) : filteredTournaments.length === 0 ? (
                        <div className="text-center py-10 bg-card/50 rounded-xl border border-dashed border-border flex flex-col items-center">
                            <Swords className="w-10 h-10 text-muted-foreground mx-auto mb-3 opacity-50" />
                            <h3 className="font-bold text-foreground">No Active Battles</h3>
                            <p className="text-xs text-muted-foreground mt-1 mb-4">Be the first to host a challenge!</p>
                            {!isRestricted ? (
                                <button onClick={() => setIsHostModalOpen(true)} className="inline-flex items-center gap-2 text-primary font-bold text-sm bg-primary/10 px-4 py-2 rounded-lg hover:bg-primary/20 transition-colors">
                                    <Plus className="w-4 h-4" />
                                    Create Challenge
                                </button>
                            ) : (
                                <div className="inline-flex items-center gap-2 text-muted-foreground font-bold text-sm bg-muted px-4 py-2 rounded-lg cursor-not-allowed">
                                    Hosting Disabled
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 gap-6">
                            {filteredTournaments.map((tournament) => (
                                <div key={tournament._id} className="bg-card border border-border rounded-xl p-4 shadow-sm hover:border-primary/50 transition-all group relative overflow-hidden">
                                    <div className="absolute top-0 right-0 p-2 opacity-10 group-hover:opacity-20 transition-opacity">
                                        <Swords className="w-24 h-24 rotate-12" />
                                    </div>

                                    <div className="flex justify-between items-start mb-3 relative z-10">
                                        <div>
                                            <div className="flex items-center gap-2 mb-1">
                                                <span className="px-2 py-0.5 bg-primary/10 text-primary text-[10px] font-bold rounded-md uppercase tracking-wide">
                                                    {tournament.format}
                                                </span>
                                                {(tournament.status === 'Open' || tournament.status === 'upcoming') && (
                                                    <span className="px-2 py-0.5 bg-green-500/10 text-green-500 text-[10px] font-bold rounded-md animate-pulse uppercase">
                                                        OPEN
                                                    </span>
                                                )}
                                                {tournament.status === 'Live' && (
                                                    <span className="px-2 py-0.5 bg-red-500/10 text-red-500 text-[10px] font-bold rounded-md animate-pulse uppercase">
                                                        LIVE
                                                    </span>
                                                )}
                                            </div>
                                            <h3 className="font-bold text-foreground line-clamp-1">{tournament.title}</h3>
                                            <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                                                Hosted by <span className="text-foreground font-medium">Player</span>
                                            </p>
                                        </div>
                                        <div className="text-right">
                                            <div className="flex items-center gap-1 text-primary font-black text-lg leading-none justify-end">
                                                <Coins className="w-4 h-4" />
                                                {tournament.entryFee > 0 ? tournament.entryFee : 'FREE'}
                                            </div>
                                            <p className="text-[10px] text-muted-foreground font-medium">Entry Fee</p>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-2 text-xs relative z-10">
                                        <div className="bg-muted/50 rounded-lg p-2.5 flex items-center gap-2">
                                            <Calendar className="w-3.5 h-3.5 text-muted-foreground" />
                                            <span className="font-medium">
                                                {format(new Date(tournament.startTime), 'MMM d, h:mm a')}
                                            </span>
                                        </div>
                                        <div className="bg-muted/50 rounded-lg p-2.5 flex items-center gap-2">
                                            <Users className="w-3.5 h-3.5 text-muted-foreground" />
                                            <span className="font-medium">
                                                {tournament.joinedCount || 0} / {tournament.maxSlots} Teams
                                            </span>
                                        </div>
                                    </div>

                                    <Link 
                                        href={tournament.isOfficial ? `/tournaments/${tournament._id}` : `/battle-zone/${tournament._id}`} 
                                        className="w-full mt-3 bg-foreground text-background font-bold py-2.5 rounded-lg text-sm hover:opacity-90 transition-opacity relative z-10 flex items-center justify-center gap-2"
                                    >
                                        Join Battle
                                        <Trophy className="w-3.5 h-3.5" />
                                    </Link>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                <HostTournamentModal
                    isOpen={isHostModalOpen}
                    onClose={() => setIsHostModalOpen(false)}
                    onSuccess={handleCreateSuccess}
                />
            </div>
        </MaintenanceWrapper>
    );

}
