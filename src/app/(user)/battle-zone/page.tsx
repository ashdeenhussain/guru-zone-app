'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import PageHeader from '@/components/PageHeader';
import { Swords, Plus, Users, Calendar, Trophy, Coins, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { format } from 'date-fns';

export default function BattleZonePage() {
    const [tournaments, setTournaments] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchTournaments = async () => {
            try {
                // Fetch only community tournaments
                const res = await fetch('/api/tournaments?type=community');
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

        fetchTournaments();
    }, []);

    return (
        <div className="min-h-screen bg-background pb-24">
            <PageHeader
                title="Battle Zone"
                description="Community hosted challenges & custom rooms."
                icon={Swords}
                customElement={
                    <Link href="/battle-zone/create" className="bg-primary text-primary-foreground px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 hover:bg-primary/90 transition-colors shadow-lg shadow-primary/20">
                        <Plus className="w-3.5 h-3.5" />
                        Host Match
                    </Link>
                }
            />

            <div className="px-4 space-y-4">
                {isLoading ? (
                    <div className="flex justify-center py-10">
                        <Loader2 className="w-8 h-8 animate-spin text-primary" />
                    </div>
                ) : tournaments.length === 0 ? (
                    <div className="text-center py-10 bg-card/50 rounded-xl border border-dashed border-border">
                        <Swords className="w-10 h-10 text-muted-foreground mx-auto mb-3 opacity-50" />
                        <h3 className="font-bold text-foreground">No Active Battles</h3>
                        <p className="text-xs text-muted-foreground mt-1 mb-4">Be the first to host a challenge!</p>
                        <Link href="/battle-zone/create" className="inline-flex items-center gap-2 text-primary font-bold text-sm bg-primary/10 px-4 py-2 rounded-lg hover:bg-primary/20 transition-colors">
                            <Plus className="w-4 h-4" />
                            Create Challenge
                        </Link>
                    </div>
                ) : (
                    tournaments.map((tournament) => (
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
                                        {tournament.status === 'Open' && (
                                            <span className="px-2 py-0.5 bg-green-500/10 text-green-500 text-[10px] font-bold rounded-md animate-pulse">
                                                OPEN
                                            </span>
                                        )}
                                    </div>
                                    <h3 className="font-bold text-foreground line-clamp-1">{tournament.title}</h3>
                                    <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                                        Hosted by <span className="text-foreground font-medium">Player</span>
                                    </p>
                                </div>
                                <div className="text-right">
                                    <div className="flex items-center gap-1 text-primary font-black text-lg leading-none">
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
                                        {tournament.joinedCount || 0} / {tournament.maxSlots} Players
                                    </span>
                                </div>
                            </div>

                            <button className="w-full mt-3 bg-foreground text-background font-bold py-2.5 rounded-lg text-sm hover:opacity-90 transition-opacity relative z-10 flex items-center justify-center gap-2">
                                Join Battle
                                <Trophy className="w-3.5 h-3.5" />
                            </button>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}
