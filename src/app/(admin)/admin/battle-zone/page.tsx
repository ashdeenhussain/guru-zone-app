'use client';

import React, { useState, useEffect } from 'react';
import {
    Swords,
    Search,
    Clock,
    DollarSign,
    Gamepad2,
    ShieldAlert,
    Ban,
    Loader2,
    RefreshCw,
    ChevronLeft,
    ChevronRight,
    Trophy
} from 'lucide-react';
import { format } from 'date-fns';

interface Participant {
    userId: { _id: string; name: string; inGameName: string; email: string };
    inGameName: string;
}

interface Tournament {
    _id: string;
    title: string;
    format: string;
    gameType: string;
    entryFee: number;
    prizePool: number;
    maxSlots: number;
    joinedCount: number;
    startTime: string;
    status: string;
    createdBy?: { _id: string; name: string; inGameName: string };
    participants?: Participant[];
}

export default function AdminBattleZonePage() {
    const [tournaments, setTournaments] = useState<Tournament[]>([]);
    const [loading, setLoading] = useState(true);
    const [cancellingId, setCancellingId] = useState<string | null>(null);

    // Pagination
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalMatches, setTotalMatches] = useState(0);

    const fetchTournaments = async (p = page) => {
        setLoading(true);
        try {
            const res = await fetch(`/api/admin/battle-zone/matches?page=${p}&limit=20`);
            const data = await res.json();
            if (data.success) {
                setTournaments(data.data);
                setTotalPages(data.pagination.pages);
                setTotalMatches(data.pagination.total);
            }
        } catch (error) {
            console.error('Failed to fetch battle zone matches', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchTournaments(page);
    }, [page]);

    const handleCancel = async (id: string, entryFee: number) => {
        const confirmMsg = `Are you sure? This will cancel the match and refund ${entryFee} coins to all joined players.`;
        if (!confirm(confirmMsg)) return;

        setCancellingId(id);
        try {
            const res = await fetch(`/api/admin/battle-zone/matches/${id}/cancel`, {
                method: 'POST'
            });
            const data = await res.json();
            if (data.success) {
                alert('Match successfully cancelled and refunded.');
                fetchTournaments(); // Refresh
            } else {
                alert('Error: ' + data.error);
            }
        } catch (error) {
            alert('Failed to cancel match.');
        } finally {
            setCancellingId(null);
        }
    };

    const StatusBadge = ({ status }: { status: string }) => {
        const s = status.toLowerCase();
        let colorClass = 'bg-muted text-muted-foreground';

        if (['upcoming', 'full', 'open'].includes(s)) {
            colorClass = 'bg-yellow-500/10 text-yellow-500 border border-yellow-500/20';
        } else if (['active', 'completed', 'live'].includes(s)) {
            colorClass = 'bg-green-500/10 text-green-500 border border-green-500/20';
        } else if (['cancelled', 'disputed'].includes(s)) {
            colorClass = 'bg-red-500/10 text-red-500 border border-red-500/20';
        }

        return (
            <span className={`px-2.5 py-1 text-[10px] uppercase font-bold tracking-wider rounded-md ${colorClass}`}>
                {status}
            </span>
        );
    };

    return (
        <div className="-m-4 lg:-m-8">
            {/* Sticky Header */}
            <div className="sticky top-16 lg:top-0 z-30 border-b border-border/40 bg-background/80 backdrop-blur-xl px-4 lg:px-6 py-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-primary/10 rounded-xl shrink-0">
                        <Swords className="w-6 h-6 text-primary" />
                    </div>
                    <div>
                        <h1 className="text-xl font-bold text-foreground leading-none">
                            Battle Zone Matches
                        </h1>
                        <p className="text-xs text-muted-foreground font-medium mt-1">
                            P2P Escrow Match Management ({totalMatches} Total)
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => fetchTournaments()}
                        className="p-2 border border-border rounded-lg bg-card hover:bg-muted transition-colors"
                        disabled={loading}
                    >
                        <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                    </button>
                    <div className="flex items-center gap-1 border border-border rounded-lg bg-card p-1">
                        <button
                            disabled={page === 1 || loading}
                            onClick={() => setPage(page - 1)}
                            className="p-1 rounded hover:bg-muted disabled:opacity-50"
                        >
                            <ChevronLeft className="w-5 h-5" />
                        </button>
                        <span className="text-xs font-bold px-3">
                            Page {page} of {totalPages || 1}
                        </span>
                        <button
                            disabled={page === totalPages || loading || totalPages === 0}
                            onClick={() => setPage(page + 1)}
                            className="p-1 rounded hover:bg-muted disabled:opacity-50"
                        >
                            <ChevronRight className="w-5 h-5" />
                        </button>
                    </div>
                </div>
            </div>

            <div className="p-4 lg:p-6">
                <div className="overflow-x-auto rounded-xl border border-border bg-card shadow-sm">
                    <table className="w-full text-sm text-left">
                        <thead className="text-xs text-muted-foreground uppercase bg-muted/50 border-b border-border">
                            <tr>
                                <th className="px-6 py-4 font-bold">Match ID</th>
                                <th className="px-6 py-4 font-bold">Host</th>
                                <th className="px-6 py-4 font-bold">Format</th>
                                <th className="px-6 py-4 font-bold">Entry Fee</th>
                                <th className="px-6 py-4 font-bold">Prize Pool</th>
                                <th className="px-6 py-4 font-bold">Created/Time</th>
                                <th className="px-6 py-4 font-bold">Status</th>
                                <th className="px-6 py-4 font-bold text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr>
                                    <td colSpan={8} className="px-6 py-20 text-center">
                                        <Loader2 className="w-8 h-8 animate-spin mx-auto text-primary" />
                                        <p className="text-sm mt-3 text-muted-foreground">Loading matches...</p>
                                    </td>
                                </tr>
                            ) : tournaments.length === 0 ? (
                                <tr>
                                    <td colSpan={8} className="px-6 py-20 text-center">
                                        <Swords className="w-12 h-12 text-muted-foreground mx-auto mb-3 opacity-20" />
                                        <p className="text-muted-foreground">No matches found in the database.</p>
                                    </td>
                                </tr>
                            ) : (
                                tournaments.map((t) => {
                                    const isCancellable = !['completed', 'cancelled'].includes(t.status.toLowerCase());
                                    const isCancelling = cancellingId === t._id;

                                    return (
                                        <tr key={t._id} className="border-b border-border hover:bg-muted/30 transition-colors">
                                            <td className="px-6 py-4 font-mono text-xs text-muted-foreground">
                                                ...{t._id.slice(-6)}
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="font-bold flex items-center gap-2">
                                                    {t.createdBy?.inGameName || t.createdBy?.name || 'Unknown'}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className="bg-primary/10 text-primary px-2 py-0.5 rounded text-[10px] font-bold">
                                                    {t.format}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 font-bold text-foreground">
                                                {t.entryFee} <span className="text-xs text-muted-foreground">C</span>
                                            </td>
                                            <td className="px-6 py-4 font-bold text-yellow-500 flex items-center gap-1.5 mt-0.5">
                                                <Trophy className="w-3.5 h-3.5" />
                                                {t.prizePool}
                                            </td>
                                            <td className="px-6 py-4 text-xs text-muted-foreground">
                                                {format(new Date(t.startTime), 'MMM d, h:mm a')}
                                            </td>
                                            <td className="px-6 py-4">
                                                <StatusBadge status={t.status} />
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                {isCancellable ? (
                                                    <button
                                                        onClick={() => handleCancel(t._id, t.entryFee)}
                                                        disabled={isCancelling}
                                                        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-red-500 bg-red-500/10 hover:bg-red-500/20 rounded-lg transition-colors disabled:opacity-50"
                                                    >
                                                        {isCancelling ? (
                                                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                                        ) : (
                                                            <Ban className="w-3.5 h-3.5" />
                                                        )}
                                                        Cancel & Refund
                                                    </button>
                                                ) : (
                                                    <span className="text-xs text-muted-foreground italic px-3 py-1.5">
                                                        Locked
                                                    </span>
                                                )}
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
