'use client';

import { useState, useEffect } from 'react';
import { 
    AlertTriangle, 
    CheckCircle, 
    XCircle, 
    Eye, 
    Trophy, 
    User as UserIcon, 
    Calendar,
    Coins,
    Loader2,
    ShieldAlert
} from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import Link from 'next/link';

export default function AdminDisputesPage() {
    const [disputes, setDisputes] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isResolving, setIsResolving] = useState<string | null>(null);

    const fetchDisputes = async () => {
        setIsLoading(true);
        try {
            const res = await fetch('/api/admin/battle-zone/disputes');
            const data = await res.json();
            if (data.success) {
                setDisputes(data.data);
            } else {
                toast.error(data.error || 'Failed to fetch disputes');
            }
        } catch (error) {
            toast.error('Network error fetching disputes');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchDisputes();
    }, []);

    const handleResolve = async (tournamentId: string, action: 'force_win_host' | 'force_refund') => {
        const confirmMsg = action === 'force_win_host' 
            ? 'Are you sure you want to award the prize to the Host\'s declared winner?' 
            : 'Are you sure you want to refund all participants and cancel this match?';
            
        if (!confirm(confirmMsg)) return;

        setIsResolving(tournamentId);
        try {
            const res = await fetch('/api/admin/battle-zone/disputes', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ tournamentId, action }),
            });
            const data = await res.json();
            if (data.success) {
                toast.success(data.message);
                fetchDisputes(); // Refresh list
            } else {
                toast.error(data.error);
            }
        } catch (error) {
            toast.error('Failed to resolve dispute');
        } finally {
            setIsResolving(null);
        }
    };

    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
                <p className="text-sm text-muted-foreground font-medium">Loading disputes...</p>
            </div>
        );
    }

    return (
        <div className="p-6 space-y-8 animate-in fade-in duration-500">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-black text-foreground flex items-center gap-3">
                        <ShieldAlert className="w-8 h-8 text-destructive" />
                        Dispute Resolution Centre
                    </h1>
                    <p className="text-muted-foreground text-sm mt-1">
                        Review and resolve contested Battle Zone matches.
                    </p>
                </div>
                <div className="bg-destructive/10 border border-destructive/20 rounded-xl px-4 py-2 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-destructive animate-pulse" />
                    <span className="text-xs font-bold text-destructive uppercase tracking-wider">
                        {disputes.length} Pending Disputes
                    </span>
                </div>
            </div>

            {disputes.length === 0 ? (
                <div className="bg-card border border-dashed border-border rounded-2xl p-12 text-center flex flex-col items-center">
                    <CheckCircle className="w-12 h-12 text-green-500/50 mb-4" />
                    <h3 className="text-lg font-bold">Safe & Sound</h3>
                    <p className="text-muted-foreground text-sm max-w-xs mx-auto mt-1">
                        No active disputes found. All Battle Zone matches are either verified or auto-resolved.
                    </p>
                </div>
            ) : (
                <div className="grid grid-cols-1 gap-6">
                    {disputes.map((dispute) => (
                        <div key={dispute._id} className="bg-card border border-border rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                            {/* Header Section */}
                            <div className="bg-muted/30 p-4 border-b border-border flex flex-wrap justify-between items-center gap-4">
                                <div className="flex items-center gap-3">
                                    <div className="bg-primary/10 p-2 rounded-lg text-primary">
                                        <Trophy className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-base leading-none">{dispute.title}</h3>
                                        <p className="text-[10px] text-muted-foreground mt-1 flex items-center gap-1.5 uppercase font-bold tracking-tighter">
                                            <Calendar className="w-3 h-3" />
                                            Started: {format(new Date(dispute.startTime || dispute.createdAt), 'MMM d, h:mm a')}
                                            <span className="mx-1">•</span>
                                            <Coins className="w-3 h-3" />
                                            Prize: {dispute.prizePool} Coins
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-4 bg-background px-4 py-2 rounded-xl border border-border/50">
                                    <div className="flex flex-col">
                                        <span className="text-[10px] font-bold text-muted-foreground uppercase opacity-70">Host</span>
                                        <span className="text-xs font-black">{dispute.createdBy?.username || 'Admin'}</span>
                                    </div>
                                    <div className="h-6 w-px bg-border/50" />
                                    <div className="flex flex-col">
                                        <span className="text-[10px] font-bold text-muted-foreground uppercase opacity-70 text-right">Format</span>
                                        <span className="text-xs font-black text-primary text-right">{dispute.format}</span>
                                    </div>
                                </div>
                            </div>

                            {/* Content Body */}
                            <div className="p-6 grid grid-cols-1 lg:grid-cols-2 gap-8">
                                {/* Dispute Information */}
                                <div className="space-y-6">
                                    <div className="bg-destructive/5 border border-destructive/10 rounded-xl p-4">
                                        <h4 className="text-xs font-black text-destructive uppercase tracking-widest flex items-center gap-2 mb-3">
                                            <AlertTriangle className="w-4 h-4" />
                                            Dispute Evidence
                                        </h4>
                                        <p className="text-sm font-medium leading-relaxed italic text-foreground/90">
                                            &quot;{dispute.disputeReason || 'No specific reason provided.'}&quot;
                                        </p>
                                    </div>

                                    <div className="space-y-4">
                                        <h4 className="text-xs font-black text-muted-foreground uppercase tracking-widest flex items-center gap-2">
                                            <Trophy className="w-4 h-4 text-yellow-500" />
                                            Declared Winner (by Host)
                                        </h4>
                                        <div className="bg-muted/30 p-3 rounded-xl border border-border/50 flex items-center justify-between">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-full bg-yellow-500/20 flex items-center justify-center border border-yellow-500/30">
                                                    <UserIcon className="w-4 h-4 text-yellow-600" />
                                                </div>
                                                <div>
                                                    <p className="text-sm font-bold">{dispute.winners?.rank1?.inGameName || dispute.winners?.rank1?.username || 'Player'}</p>
                                                    <p className="text-[10px] text-muted-foreground font-mono">UID: {dispute.winners?.rank1?.freeFireUid || 'N/A'}</p>
                                                </div>
                                            </div>
                                            <span className="text-[10px] font-bold bg-yellow-500/10 text-yellow-600 px-2 py-0.5 rounded-full border border-yellow-500/10">
                                                WINNER
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                {/* Proof Files */}
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-muted-foreground uppercase flex items-center gap-1.5">
                                            <Eye className="w-3 h-3 text-green-500" />
                                            Host Proof
                                        </label>
                                        <div className="aspect-video bg-muted rounded-xl border border-border overflow-hidden relative group">
                                            {dispute.winnerScreenshot ? (
                                                <>
                                                    <img src={dispute.winnerScreenshot} className="w-full h-full object-cover transition-transform group-hover:scale-105" alt="Host proof" />
                                                    <a href={dispute.winnerScreenshot} target="_blank" className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                                        <span className="text-[10px] font-bold text-white bg-black/50 px-3 py-1 rounded-full border border-white/20">Open File</span>
                                                    </a>
                                                </>
                                            ) : (
                                                <div className="flex items-center justify-center h-full text-[10px] text-muted-foreground font-bold italic">No File Uploaded</div>
                                            )}
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-muted-foreground uppercase flex items-center gap-1.5">
                                            <Eye className="w-3 h-3 text-destructive" />
                                            Joiner Proof
                                        </label>
                                        <div className="aspect-video bg-muted rounded-xl border border-border overflow-hidden relative group">
                                            {dispute.disputeProof ? (
                                                <>
                                                    <img src={dispute.disputeProof} className="w-full h-full object-cover transition-transform group-hover:scale-105" alt="Joiner proof" />
                                                    <a href={dispute.disputeProof} target="_blank" className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                                        <span className="text-[10px] font-bold text-white bg-black/50 px-3 py-1 rounded-full border border-white/20">Open File</span>
                                                    </a>
                                                </>
                                            ) : (
                                                <div className="flex items-center justify-center h-full text-[10px] text-muted-foreground font-bold italic">No File Uploaded</div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Actions Footer */}
                            <div className="bg-muted/20 p-4 border-t border-border flex justify-end gap-3">
                                <Link
                                    href={`/admin/battle-zone/disputes/${dispute._id}`}
                                    className="flex items-center gap-2 text-xs font-bold bg-primary/10 text-primary hover:bg-primary/20 px-4 py-2.5 rounded-xl border border-primary/20 transition-all"
                                >
                                    <Eye className="w-3.5 h-3.5" />
                                    Review Case
                                </Link>
                                <button
                                    onClick={() => handleResolve(dispute._id, 'force_refund')}
                                    disabled={!!isResolving}
                                    className="flex items-center gap-2 text-xs font-bold text-muted-foreground hover:text-foreground transition-colors bg-muted/50 px-4 py-2.5 rounded-xl border border-border/50"
                                >
                                    {isResolving === dispute._id ? <Loader2 className="w-3 h-3 animate-spin" /> : <XCircle className="w-3.5 h-3.5" />}
                                    Force Refund
                                </button>
                                <button
                                    onClick={() => handleResolve(dispute._id, 'force_win_host')}
                                    disabled={!!isResolving}
                                    className="flex items-center gap-2 text-xs font-bold bg-green-500 text-white hover:bg-green-600 px-6 py-2.5 rounded-xl shadow-lg shadow-green-500/20 transition-all border border-green-400/20"
                                >
                                    {isResolving === dispute._id ? <Loader2 className="w-3 h-3 animate-spin" /> : <CheckCircle className="w-3.5 h-3.5" />}
                                    Force Win Host
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
