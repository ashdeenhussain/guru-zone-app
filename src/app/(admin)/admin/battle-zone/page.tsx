'use client';

import React, { useState, useEffect, useMemo } from 'react';
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
    Trophy,
    Eye,
    Users,
    Filter,
    Calendar,
    ArrowUpRight,
    Coins
} from 'lucide-react';
import { format } from 'date-fns';
import Link from 'next/link';

interface Participant {
    userId: { _id: string; name: string; inGameName: string; email: string };
    inGameName: string;
}

interface BattleMatch {
    _id: string;
    title: string;
    format: string;
    gameMode?: string;
    mapName?: string;
    entryFee: number;
    prizePool: number;
    maxSlots: number;
    joinedCount: number;
    createdAt: string;
    status: string;
    createdBy?: { _id: string; name: string; inGameName: string; email: string };
    participants?: Participant[];
    expiresAt?: string;
}

interface Stats {
    total: number;
    active: number;
    open: number;
    disputed: number;
    completed: number;
    totalEscrow: number;
}

export default function AdminBattleZonePage() {
    const [matches, setMatches] = useState<BattleMatch[]>([]);
    const [loading, setLoading] = useState(true);
    const [cancellingId, setCancellingId] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState<string>('all');

    // Pagination
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalMatches, setTotalMatches] = useState(0);
    const [stats, setStats] = useState<Stats>({ total: 0, active: 0, open: 0, disputed: 0, completed: 0, totalEscrow: 0 });
    const [now, setNow] = useState(Date.now());
    const [sortConfig, setSortConfig] = useState<{ key: string, direction: 'asc' | 'desc' } | null>(null);

    useEffect(() => {
        const interval = setInterval(() => setNow(Date.now()), 1000);
        return () => clearInterval(interval);
    }, []);

    const handleSort = (key: string) => {
        let direction: 'asc' | 'desc' = 'asc';
        if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
            direction = 'desc';
        }
        setSortConfig({ key, direction });
    };

    const fetchStats = async () => {
        try {
            const res = await fetch('/api/admin/battle-zone/stats');
            const data = await res.json();
            if (data.success) setStats(data.data);
        } catch (err) { console.error(err); }
    };

    const fetchMatches = async (p = page) => {
        setLoading(true);
        try {
            const res = await fetch(`/api/admin/battle-zone/matches?page=${p}&limit=50`);
            const data = await res.json();
            if (data.success) {
                setMatches(data.data);
                setTotalPages(data.pagination.pages);
                setTotalMatches(data.pagination.total);
            }
            fetchStats();
        } catch (error) {
            console.error('Failed to fetch battle zone matches', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchMatches(page);
    }, [page]);

    const filteredAndSortedMatches = useMemo(() => {
        let result = matches.filter(m => {
            const matchesSearch = 
                m.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                m._id.toLowerCase().includes(searchQuery.toLowerCase()) ||
                m.createdBy?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                m.createdBy?.inGameName?.toLowerCase().includes(searchQuery.toLowerCase());
            
            const matchesStatus = statusFilter === 'all' || (m.status || '').toLowerCase() === statusFilter.toLowerCase();
            
            return matchesSearch && matchesStatus;
        });

        if (sortConfig !== null) {
            result.sort((a: any, b: any) => {
                const valA = a[sortConfig.key] || '';
                const valB = b[sortConfig.key] || '';
                if (valA < valB) return sortConfig.direction === 'asc' ? -1 : 1;
                if (valA > valB) return sortConfig.direction === 'asc' ? 1 : -1;
                return 0;
            });
        }
        return result;
    }, [matches, searchQuery, statusFilter, sortConfig]);


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
                fetchMatches(); // Refresh
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
        const s = (status || '').toLowerCase();
        let colorClass = 'bg-muted text-muted-foreground';

        if (['upcoming', 'open'].includes(s)) {
            colorClass = 'bg-blue-500/10 text-blue-500 border border-blue-500/20';
        } else if (s === 'full') {
            colorClass = 'bg-orange-500/10 text-orange-500 border border-orange-500/20';
        } else if (['active', 'live'].includes(s)) {
            colorClass = 'bg-green-500/10 text-green-500 border border-green-500/20 animate-pulse';
        } else if (s === 'completed') {
            colorClass = 'bg-gray-500/10 text-gray-500 border border-gray-500/20';
        } else if (s === 'disputed') {
            colorClass = 'bg-red-500/10 text-red-500 border border-red-500/20';
        } else if (s === 'cancelled') {
            colorClass = 'bg-red-500/5 text-red-500/50 border border-red-500/10';
        }

        return (
            <span className={`px-2.5 py-1 text-[10px] uppercase font-black tracking-widest rounded-lg ${colorClass}`}>
                {status}
            </span>
        );
    };

    const formatTimeLeft = (expiresAt?: string) => {
        if (!expiresAt) return 'No Expiry';
        const diff = new Date(expiresAt).getTime() - now;
        if (diff <= 0) return <span className="text-destructive font-black">EXPIRED</span>;

        const hours = Math.floor(diff / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((diff % (1000 * 60)) / 1000);

        return (
            <span className={`font-mono text-xs font-bold ${diff < 300000 ? 'text-amber-500 animate-pulse' : 'text-primary'}`}>
                {hours > 0 ? `${hours}h ` : ''}{minutes}m {seconds}s
            </span>
        );
    };

    return (
        <div className="space-y-6">
            {/* Header section with Stats */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                    <div className="p-3 bg-primary/10 rounded-2xl shrink-0">
                        <Swords className="w-8 h-8 text-primary" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-black text-foreground tracking-tight">
                            Battle Zone Center
                        </h1>
                        <p className="text-sm text-muted-foreground font-medium">
                            Monitoring {totalMatches} community-hosted matches
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => fetchMatches()}
                        className="p-2.5 border border-border rounded-xl bg-card hover:bg-muted transition-all active:scale-95 shadow-sm"
                        disabled={loading}
                        title="Refresh Matches"
                    >
                        <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
                    </button>
                    <Link
                        href="/admin/battle-zone/disputes"
                        className="flex items-center gap-2 px-4 py-2.5 bg-red-500 text-white rounded-xl font-bold text-sm shadow-lg shadow-red-500/20 hover:bg-red-600 transition-all active:scale-95"
                    >
                        <ShieldAlert className="w-4 h-4" />
                        Manage Disputes
                    </Link>
                </div>
            </div>

            {/* Quick Stats Grid */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-card border border-border p-5 rounded-3xl shadow-sm space-y-3">
                    <div className="flex items-center justify-between">
                        <div className="p-2 bg-blue-500/10 rounded-xl">
                            <Gamepad2 className="w-5 h-5 text-blue-500" />
                        </div>
                        <span className="text-[10px] font-black text-blue-500 uppercase tracking-widest bg-blue-500/5 px-2 py-1 rounded-md">Live Now</span>
                    </div>
                    <div>
                        <div className="text-3xl font-black text-foreground tracking-tighter">{stats.active}</div>
                        <div className="text-xs text-muted-foreground font-medium">Ongoing Matches</div>
                    </div>
                </div>
                
                <div className="bg-card border border-border p-5 rounded-3xl shadow-sm space-y-3">
                    <div className="flex items-center justify-between">
                        <div className="p-2 bg-yellow-500/10 rounded-xl">
                            <Clock className="w-5 h-5 text-yellow-500" />
                        </div>
                        <span className="text-[10px] font-black text-yellow-500 uppercase tracking-widest bg-yellow-500/5 px-2 py-1 rounded-md">Waiting</span>
                    </div>
                    <div>
                        <div className="text-3xl font-black text-foreground tracking-tighter">{stats.open}</div>
                        <div className="text-xs text-muted-foreground font-medium">Open Challenges</div>
                    </div>
                </div>

                <div className="bg-card border border-border p-5 rounded-3xl shadow-sm space-y-3">
                    <div className="flex items-center justify-between">
                        <div className="p-2 bg-red-500/10 rounded-xl">
                            <ShieldAlert className="w-5 h-5 text-red-500" />
                        </div>
                        <span className="text-[10px] font-black text-red-500 uppercase tracking-widest bg-red-500/5 px-2 py-1 rounded-md">Critical</span>
                    </div>
                    <div>
                        <div className="text-3xl font-black text-foreground tracking-tighter">{stats.disputed}</div>
                        <div className="text-xs text-muted-foreground font-medium">Pending Disputes</div>
                    </div>
                </div>

                <div className="bg-card border border-border p-5 rounded-3xl shadow-sm space-y-3">
                    <div className="flex items-center justify-between">
                        <div className="p-2 bg-green-500/10 rounded-xl">
                            <DollarSign className="w-5 h-5 text-green-500" />
                        </div>
                        <span className="text-[10px] font-black text-green-500 uppercase tracking-widest bg-green-500/5 px-2 py-1 rounded-md">Escrow</span>
                    </div>
                    <div>
                        <div className="text-3xl font-black text-foreground tracking-tighter">{stats.totalEscrow.toLocaleString()}</div>
                        <div className="text-xs text-muted-foreground font-medium">Total Coins in Play</div>
                    </div>
                </div>
            </div>

            {/* Filters & Search */}
            <div className="bg-card border border-border p-4 rounded-2xl shadow-sm flex flex-col md:flex-row gap-4">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <input
                        type="text"
                        placeholder="Search by Title, ID, or Host Name..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 bg-muted/50 border-none rounded-xl text-sm focus:ring-2 focus:ring-primary/20 transition-all outline-none"
                    />
                </div>
                <div className="flex items-center gap-2">
                    <Filter className="w-4 h-4 text-muted-foreground ml-2" />
                    <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className="bg-muted/50 border-none rounded-xl text-sm px-4 py-2.5 focus:ring-2 focus:ring-primary/20 transition-all outline-none min-w-[150px] font-bold"
                    >
                        <option value="all">All Statuses</option>
                        <option value="open">Open</option>
                        <option value="full">Full</option>
                        <option value="active">Active/Live</option>
                        <option value="disputed">Disputed</option>
                        <option value="completed">Completed</option>
                        <option value="cancelled">Cancelled</option>
                    </select>
                </div>
            </div>

            {/* Main Table */}
            <div className="bg-card border border-border rounded-3xl shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="text-[10px] text-muted-foreground uppercase font-black tracking-[0.2em] bg-muted/30 border-b border-border">
                            <tr>
                                <th className="px-6 py-5">Match Details</th>
                                <th className="px-6 py-5">Host Information</th>
                                <th className="px-6 py-5">Economics</th>
                                <th className="px-6 py-5">Participation</th>
                                <th className="px-6 py-5">Timeline</th>
                                <th className="px-6 py-5">Remaining Time</th>
                                <th 
                                    className="px-6 py-5 cursor-pointer hover:text-primary transition-colors select-none"
                                    onClick={() => handleSort('status')}
                                >
                                    <div className="flex items-center gap-1">
                                        Status
                                        <Filter className="w-3 h-3 opacity-50" />
                                    </div>
                                </th>
                                <th className="px-6 py-5 text-right">Operations</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border/50">
                            {loading ? (
                                <tr>
                                    <td colSpan={8} className="px-6 py-24 text-center">
                                        <div className="flex flex-col items-center gap-3">
                                            <Loader2 className="w-10 h-10 animate-spin text-primary opacity-50" />
                                            <p className="text-xs font-black uppercase tracking-widest text-muted-foreground">Synchronizing matches...</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : filteredAndSortedMatches.length === 0 ? (
                                <tr>
                                    <td colSpan={8} className="px-6 py-24 text-center">
                                        <div className="flex flex-col items-center gap-3 opacity-30">
                                            <Swords className="w-16 h-16 text-muted-foreground" />
                                            <p className="text-sm font-bold">No matching battles found.</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                filteredAndSortedMatches.map((match) => {
                                    const isCancellable = !['completed', 'cancelled'].includes((match.status || '').toLowerCase());
                                    const isCancelling = cancellingId === match._id;

                                    return (
                                        <tr key={match._id} className="hover:bg-muted/30 transition-colors group">
                                            <td className="px-6 py-5">
                                                <div className="flex flex-col">
                                                    <span className="font-black text-foreground text-sm line-clamp-1 group-hover:text-primary transition-colors">
                                                        {match.title}
                                                    </span>
                                                    <span className="text-[10px] font-mono text-muted-foreground mt-1">
                                                        ID: {match._id}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-5">
                                                <div className="flex flex-col">
                                                    <div className="flex items-center gap-2">
                                                        <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center text-[10px] font-black text-primary">
                                                            {(match.createdBy?.name || 'U')[0]}
                                                        </div>
                                                        <span className="font-bold text-foreground">
                                                            {match.createdBy?.inGameName || match.createdBy?.name || 'Unknown'}
                                                        </span>
                                                    </div>
                                                    <span className="text-[10px] text-muted-foreground mt-1 ml-8">
                                                        {match.createdBy?.email}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-5">
                                                <div className="flex flex-col gap-1">
                                                    <div className="flex items-center gap-1.5 font-black text-foreground">
                                                        <Coins className="w-3.5 h-3.5 text-yellow-500" />
                                                        {match.entryFee}
                                                        <span className="text-[10px] text-muted-foreground font-bold ml-1">Entry</span>
                                                    </div>
                                                    <div className="flex items-center gap-1.5 font-black text-yellow-600">
                                                        <Trophy className="w-3.5 h-3.5" />
                                                        {match.prizePool}
                                                        <span className="text-[10px] text-muted-foreground font-bold ml-1">Prize</span>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-5">
                                                <div className="flex flex-col gap-1.5">
                                                    <div className="flex items-center gap-2">
                                                        <Users className="w-3.5 h-3.5 text-muted-foreground" />
                                                        <div className="w-24 h-1.5 bg-muted rounded-full overflow-hidden">
                                                            <div 
                                                                className="h-full bg-primary transition-all duration-1000" 
                                                                style={{ width: `${(match.joinedCount / match.maxSlots) * 100}%` }}
                                                            />
                                                        </div>
                                                        <span className="text-[11px] font-black">
                                                            {match.joinedCount}/{match.maxSlots}
                                                        </span>
                                                    </div>
                                                    <span className="text-[10px] font-bold text-primary uppercase tracking-wider bg-primary/5 px-2 py-0.5 rounded w-fit">
                                                        {match.format}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-5">
                                                <div className="flex flex-col text-[11px] font-medium text-muted-foreground">
                                                    <div className="flex items-center gap-1.5">
                                                        <Calendar className="w-3.5 h-3.5 opacity-50" />
                                                        {format(new Date(match.createdAt), 'MMM d, yyyy')}
                                                    </div>
                                                    <div className="flex items-center gap-1.5 mt-1">
                                                        <Clock className="w-3.5 h-3.5 opacity-50" />
                                                        {format(new Date(match.createdAt), 'h:mm a')}
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-5">
                                                {['open', 'full'].includes((match.status || '').toLowerCase()) ? (
                                                    formatTimeLeft(match.expiresAt)
                                                ) : (
                                                    <span className="text-[10px] font-black text-muted-foreground uppercase opacity-30">N/A</span>
                                                )}
                                            </td>
                                            <td className="px-6 py-5">
                                                <StatusBadge status={match.status} />
                                            </td>
                                            <td className="px-6 py-5 text-right">
                                                <div className="flex items-center justify-end gap-2">
                                                    <Link
                                                        href={`/battle-zone/${match._id}`}
                                                        target="_blank"
                                                        className="p-2 text-muted-foreground hover:text-primary hover:bg-primary/10 rounded-xl transition-all"
                                                        title="View Match Page"
                                                    >
                                                        <Eye className="w-4 h-4" />
                                                    </Link>
                                                    {isCancellable ? (
                                                        <button
                                                            onClick={() => handleCancel(match._id, match.entryFee)}
                                                            disabled={isCancelling}
                                                            className="flex items-center gap-1.5 px-3 py-2 text-[10px] font-black uppercase tracking-widest text-red-500 bg-red-500/10 hover:bg-red-500/20 rounded-xl transition-all active:scale-95 disabled:opacity-50"
                                                        >
                                                            {isCancelling ? (
                                                                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                                            ) : (
                                                                <Ban className="w-3.5 h-3.5" />
                                                            )}
                                                            Void Match
                                                        </button>
                                                    ) : (
                                                        <span className="text-[10px] text-muted-foreground font-black uppercase tracking-widest px-3 py-2 bg-muted/50 rounded-xl">
                                                            LOCKED
                                                        </span>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Footer Pagination */}
                <div className="px-6 py-5 bg-muted/20 border-t border-border flex flex-col sm:flex-row items-center justify-between gap-4">
                    <p className="text-[11px] font-black text-muted-foreground uppercase tracking-widest">
                        Showing <span className="text-foreground">{filteredAndSortedMatches.length}</span> of <span className="text-foreground">{totalMatches}</span> matches
                    </p>
                    <div className="flex items-center gap-1.5">
                        <button
                            disabled={page === 1 || loading}
                            onClick={() => setPage(page - 1)}
                            className="p-2 rounded-xl border border-border bg-card hover:bg-muted transition-all active:scale-90 disabled:opacity-30"
                        >
                            <ChevronLeft className="w-5 h-5" />
                        </button>
                        <div className="flex items-center gap-1 px-4">
                            <span className="text-xs font-black">Page {page}</span>
                            <span className="text-xs font-medium text-muted-foreground">of {totalPages || 1}</span>
                        </div>
                        <button
                            disabled={page === totalPages || loading || totalPages === 0}
                            onClick={() => setPage(page + 1)}
                            className="p-2 rounded-xl border border-border bg-card hover:bg-muted transition-all active:scale-90 disabled:opacity-30"
                        >
                            <ChevronRight className="w-5 h-5" />
                        </button>
                    </div>
                </div>
            </div>

            {/* Admin Insights Footer */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pb-8">
                <div className="bg-gradient-to-br from-primary/5 to-transparent border border-primary/10 rounded-[2.5rem] p-8 flex items-center justify-between group overflow-hidden relative">
                    <div className="absolute -bottom-10 -right-10 opacity-5 group-hover:scale-110 transition-transform duration-700">
                        <ShieldAlert className="w-40 h-40 text-primary" />
                    </div>
                    <div className="space-y-4 relative z-10">
                        <h3 className="text-lg font-black text-foreground uppercase tracking-tight">Security & Trust</h3>
                        <p className="text-sm text-muted-foreground max-w-sm font-medium leading-relaxed">
                            Monitor community behavior and trust scores. High dispute rates on specific hosts should be investigated immediately.
                        </p>
                        <button className="flex items-center gap-2 text-primary font-black text-xs uppercase tracking-widest hover:gap-3 transition-all">
                            Review Host Audit Logs
                            <ArrowUpRight className="w-4 h-4" />
                        </button>
                    </div>
                </div>

                <div className="bg-gradient-to-br from-green-500/5 to-transparent border border-green-500/10 rounded-[2.5rem] p-8 flex items-center justify-between group overflow-hidden relative">
                    <div className="absolute -bottom-10 -right-10 opacity-5 group-hover:scale-110 transition-transform duration-700">
                        <Trophy className="w-40 h-40 text-green-500" />
                    </div>
                    <div className="space-y-4 relative z-10">
                        <h3 className="text-lg font-black text-foreground uppercase tracking-tight">Growth & Revenue</h3>
                        <p className="text-sm text-muted-foreground max-w-sm font-medium leading-relaxed">
                            Track popular match formats and peak hosting times. Community matches drive platform engagement and token circulation.
                        </p>
                        <button className="flex items-center gap-2 text-green-500 font-black text-xs uppercase tracking-widest hover:gap-3 transition-all">
                            View Detailed Reports
                            <ArrowUpRight className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
