'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
    Shield, Trophy, User, MessageSquare, CheckCircle, XCircle,
    Loader2, ArrowLeft, AlertTriangle, FileText, Users, Gavel
} from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';

interface Participant {
    userId: { _id: string; name: string; username: string; inGameName: string; freeFireUid: string; image?: string };
    inGameName: string;
    uid: string;
}

interface MatchDetail {
    _id: string;
    title: string;
    format: string;
    entryFee: number;
    prizePool: number;
    status: string;
    disputeReason: string;
    adminNote?: string;
    createdAt: string;
    updatedAt: string;
    createdBy: { _id: string; name: string; username: string; inGameName: string; freeFireUid: string; image?: string };
    participants: Participant[];
    winners: { rank1?: { _id: string; name: string; inGameName: string; freeFireUid: string; image?: string } };
    winnerScreenshot?: string;
    disputeProof?: string;
    disputedBy?: { _id: string; name: string; username: string; inGameName: string; freeFireUid: string; image?: string };
}

interface ChatMessage {
    _id: string;
    sender: string;
    senderName: string;
    content: string;
    isSystem: boolean;
    createdAt: string;
}

const PLATFORM_FEE = 0.1;

export default function DisputeDetailPage() {
    const { id } = useParams<{ id: string }>();
    const router = useRouter();

    const [match, setMatch] = useState<MatchDetail | null>(null);
    const [chats, setChats] = useState<ChatMessage[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isResolving, setIsResolving] = useState(false);
    const [adminNote, setAdminNote] = useState('');

    useEffect(() => {
        async function load() {
            try {
                const [matchRes, chatRes] = await Promise.all([
                    fetch(`/api/battle-zone/matches/${id}`),
                    fetch(`/api/battle-zone/matches/${id}/chat`)
                ]);
                const matchData = await matchRes.json();
                const chatData = await chatRes.json();
                if (matchData.success) setMatch(matchData.data);
                if (chatData.success) setChats(chatData.data);
            } catch {
                toast.error('Failed to load match details');
            } finally {
                setIsLoading(false);
            }
        }
        load();
    }, [id]);

    const handleResolve = async (action: 'force_win_host' | 'force_win_joiner' | 'cancel_refund_both') => {
        if (!adminNote.trim()) {
            toast.error('Please add an Admin Note before resolving.');
            return;
        }

        const labels: Record<string, string> = {
            force_win_host: 'Force Win — Host',
            force_win_joiner: 'Force Win — Joiner',
            cancel_refund_both: 'Cancel & Refund Both',
        };

        if (!confirm(`Are you sure you want to: "${labels[action]}"? This cannot be undone.`)) return;

        setIsResolving(true);
        try {
            const res = await fetch('/api/admin/battle-zone/resolve', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ tournamentId: id, action, adminNote }),
            });
            const data = await res.json();
            if (data.success) {
                toast.success(data.message);
                router.push('/admin/battle-zone/disputes');
            } else {
                toast.error(data.error || 'Failed to resolve');
            }
        } catch {
            toast.error('Network error');
        } finally {
            setIsResolving(false);
        }
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-[50vh]">
                <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
            </div>
        );
    }

    if (!match) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[50vh] gap-3 text-destructive">
                <XCircle className="w-10 h-10" />
                <p className="font-bold">Match not found</p>
            </div>
        );
    }

    const hostId = match.createdBy?._id;
    const joinerParticipant = match.participants.find(p => {
        const pId = (p.userId as any)?._id || p.userId;
        return String(pId) !== String(hostId);
    });
    const host = match.createdBy;
    const joiner = joinerParticipant?.userId;
    const declaredWinner = match.winners?.rank1;

    const hostName = host?.inGameName || host?.name || host?.username || 'Host';
    const joinerName = joiner?.inGameName || joiner?.name || joiner?.username || 'Joiner';

    const isDisputedByHost = match.disputedBy
        ? String(match.disputedBy._id || match.disputedBy) === String(hostId)
        : (!!match.winnerScreenshot && !!match.disputeProof && match.winnerScreenshot === match.disputeProof);

    const disputeInitiatorName = isDisputedByHost
        ? `Host (${hostName}) — Due to Joiner Inactivity`
        : `Joiner (${joinerName}) — Defeat Contested`;

    const grossPrize = match.prizePool;
    const platformFee = Math.floor(grossPrize * PLATFORM_FEE);
    const netPrize = grossPrize - platformFee;

    return (
        <div className="space-y-6 max-w-5xl mx-auto pb-16">
            {/* Back + Header */}
            <div className="flex items-start gap-4">
                <button
                    onClick={() => router.back()}
                    className="mt-1 p-1.5 rounded-lg hover:bg-muted/50 text-muted-foreground transition-colors"
                >
                    <ArrowLeft className="w-5 h-5" />
                </button>
                <div className="flex-1">
                    <div className="flex items-center gap-3 flex-wrap">
                        <h1 className="text-xl font-bold">{match.title}</h1>
                        <span className="bg-red-500/20 text-red-500 border border-red-500/20 px-2 py-0.5 rounded-full text-xs font-bold">
                            {match.status}
                        </span>
                    </div>
                    <p className="text-sm text-muted-foreground">
                        Last updated: {format(new Date(match.updatedAt), 'MMM d, yyyy — HH:mm')} ·
                        {' '}Match ID: <span className="font-mono">{match._id}</span>
                    </p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                {/* ── Left Column: Evidence + Chat ────────────────────────────── */}
                <div className="lg:col-span-2 space-y-5">

                    {/* Prize Summary */}
                    <div className="grid grid-cols-3 gap-3">
                        {[
                            { label: 'Entry Fee', value: `${match.entryFee} 🪙`, color: 'text-foreground' },
                            { label: 'Gross Prize Pool', value: `${grossPrize} 🪙`, color: 'text-yellow-500' },
                            { label: 'Winner Gets (−10%)', value: `${netPrize} 🪙`, color: 'text-green-500' },
                        ].map(item => (
                            <div key={item.label} className="bg-card border border-border rounded-xl p-3 text-center">
                                <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">{item.label}</p>
                                <p className={`text-base font-bold ${item.color}`}>{item.value}</p>
                            </div>
                        ))}
                    </div>

                    {/* Players */}
                    <div className="bg-card border border-border rounded-xl p-4 space-y-3">
                        <h3 className="font-bold text-sm flex items-center gap-2">
                            <Users className="w-4 h-4 text-primary" />
                            Players
                        </h3>
                        <div className="grid grid-cols-2 gap-3">
                            {/* Host */}
                            <div className="bg-muted/30 rounded-lg p-3 border border-border/50">
                                <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold mb-2">🎮 Host</p>
                                <p className="font-bold text-sm">{host?.inGameName || host?.name || host?.username || 'Unknown'}</p>
                                <p className="text-xs text-muted-foreground font-mono">UID: {host ? (host as any).freeFireUid || '—' : '—'}</p>
                                {declaredWinner && String(declaredWinner._id) === String(hostId) && (
                                    <span className="inline-flex items-center gap-1 mt-2 text-[10px] font-bold bg-yellow-500/20 text-yellow-600 px-2 py-0.5 rounded-full">
                                        <Trophy className="w-2.5 h-2.5" /> Declared Winner
                                    </span>
                                )}
                            </div>
                            {/* Joiner */}
                            <div className="bg-muted/30 rounded-lg p-3 border border-border/50">
                                <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold mb-2">🎮 Joiner</p>
                                {joiner ? (
                                    <>
                                        <p className="font-bold text-sm">{joiner.inGameName || joiner.name || joiner.username}</p>
                                        <p className="text-xs text-muted-foreground font-mono">UID: {joiner.freeFireUid || '—'}</p>
                                    </>
                                ) : (
                                    <p className="text-sm text-muted-foreground italic">No joiner found</p>
                                )}
                                {declaredWinner && joiner && String(declaredWinner._id) === String(joiner._id) && (
                                    <span className="inline-flex items-center gap-1 mt-2 text-[10px] font-bold bg-yellow-500/20 text-yellow-600 px-2 py-0.5 rounded-full">
                                        <Trophy className="w-2.5 h-2.5" /> Declared Winner
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Dispute Evidence — Side-by-Side Comparison */}
                    <div className="bg-card border border-border rounded-[2rem] p-6 space-y-6 shadow-xl shadow-black/5">
                        <div className="flex items-center justify-between">
                            <h3 className="font-black text-xs uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                                <Shield className="w-4 h-4 text-primary" />
                                Evidence Comparison
                            </h3>
                            <div className="bg-destructive/10 text-destructive text-[10px] font-black px-3 py-1 rounded-full border border-destructive/20 uppercase tracking-widest">
                                Conflict Review
                            </div>
                        </div>

                        {/* Dispute Source Info */}
                        <div className="bg-muted/30 p-4 rounded-2xl border border-border/50 flex flex-wrap items-center justify-between gap-4">
                            <div>
                                <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Dispute Initiator</span>
                                <p className="text-sm font-black text-foreground mt-0.5">{disputeInitiatorName}</p>
                            </div>
                            <span className={`px-3 py-1 text-[10px] font-black uppercase tracking-wider rounded-lg border ${
                                isDisputedByHost
                                    ? 'bg-amber-500/10 text-amber-500 border-amber-500/20'
                                    : 'bg-red-500/10 text-red-500 border-red-500/20'
                            }`}>
                                {isDisputedByHost ? 'Host Force Dispute' : 'Joiner Dispute'}
                            </span>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Host Side */}
                            <div className="space-y-4">
                                <div className="flex items-center gap-2 px-1">
                                    <div className="w-2 h-2 rounded-full bg-green-500" />
                                    <h4 className="text-[10px] font-black uppercase text-muted-foreground">Host's Victory Claim</h4>
                                </div>
                                {match.winnerScreenshot ? (
                                    <div className="group relative aspect-video rounded-3xl border-2 border-border overflow-hidden bg-muted shadow-2xl">
                                        <img 
                                            src={match.winnerScreenshot} 
                                            alt="Host Proof" 
                                            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" 
                                        />
                                        <a 
                                            href={match.winnerScreenshot} 
                                            target="_blank" 
                                            className="absolute inset-0 bg-black/60 backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2"
                                        >
                                            <div className="p-3 bg-white/20 rounded-full border border-white/40">
                                                <FileText className="w-6 h-6 text-white" />
                                            </div>
                                            <span className="text-[10px] font-black text-white uppercase tracking-widest">View Full Proof</span>
                                        </a>
                                    </div>
                                ) : (
                                    <div className="aspect-video rounded-3xl border-2 border-dashed border-border flex items-center justify-center bg-muted/30 text-xs font-bold text-muted-foreground italic px-6 text-center">
                                        Host provided no victory screenshot
                                    </div>
                                )}
                            </div>

                            {/* Joiner Side */}
                            <div className="space-y-4">
                                <div className="flex items-center gap-2 px-1">
                                    <div className="w-2 h-2 rounded-full bg-destructive" />
                                    <h4 className="text-[10px] font-black uppercase text-muted-foreground">
                                        {isDisputedByHost ? "Host's Dispute Evidence" : "Joiner's Dispute Proof"}
                                    </h4>
                                </div>
                                {match.disputeProof ? (
                                    <div className="group relative aspect-video rounded-3xl border-2 border-border overflow-hidden bg-muted shadow-2xl">
                                        <img 
                                            src={match.disputeProof} 
                                            alt="Joiner Proof" 
                                            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" 
                                        />
                                        <a 
                                            href={match.disputeProof} 
                                            target="_blank" 
                                            className="absolute inset-0 bg-black/60 backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2"
                                        >
                                            <div className="p-3 bg-white/20 rounded-full border border-white/40">
                                                <FileText className="w-6 h-6 text-white" />
                                            </div>
                                            <span className="text-[10px] font-black text-white uppercase tracking-widest">View Counter Proof</span>
                                        </a>
                                    </div>
                                ) : (
                                    <div className="aspect-video rounded-3xl border-2 border-dashed border-border flex items-center justify-center bg-muted/30 text-xs font-bold text-muted-foreground italic px-6 text-center">
                                        {isDisputedByHost ? "No additional dispute proof submitted" : "Joiner provided no counter-evidence"}
                                    </div>
                                )}
                            </div>
                        </div>

                        {match.disputeReason && (
                            <div className="bg-destructive/5 border border-destructive/10 rounded-2xl p-5 space-y-2">
                                <p className="text-[10px] font-black text-destructive uppercase tracking-widest flex items-center gap-2">
                                    <MessageSquare className="w-3 h-3" /> Dispute Statement
                                </p>
                                <p className="text-sm font-medium leading-relaxed">{match.disputeReason}</p>
                            </div>
                        )}
                    </div>

                    {/* Chat Logs */}
                    <div className="bg-card border border-border rounded-[2rem] overflow-hidden shadow-xl shadow-black/5">
                        <div className="bg-muted/30 px-6 py-4 border-b border-border flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <MessageSquare className="w-4 h-4 text-primary" />
                                <h3 className="font-black text-xs uppercase tracking-widest text-muted-foreground">Match Chat Log</h3>
                            </div>
                            <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest bg-background px-3 py-1 rounded-full border border-border">
                                {chats.length} Messages
                            </span>
                        </div>
                        <div className="p-6 max-h-[400px] overflow-y-auto space-y-4 bg-muted/10">
                            {chats.length === 0 ? (
                                <div className="text-center py-12 space-y-3 opacity-40">
                                    <MessageSquare className="w-12 h-12 mx-auto" />
                                    <p className="text-xs font-black uppercase">No communication history</p>
                                </div>
                            ) : (
                                chats.map(msg => (
                                    <div key={msg._id} className="flex gap-3">
                                        <div className="w-8 h-8 rounded-xl bg-background border border-border flex items-center justify-center text-xs font-black shrink-0 shadow-sm">
                                            {msg.senderName?.[0]?.toUpperCase() || '?'}
                                        </div>
                                        <div className="flex-1 space-y-1">
                                            <div className="flex items-center justify-between">
                                                <span className="text-[10px] font-black uppercase tracking-tight text-primary">{msg.senderName || 'System'}</span>
                                                <span className="text-[9px] font-bold text-muted-foreground uppercase">
                                                    {format(new Date(msg.createdAt), 'HH:mm:ss')}
                                                </span>
                                            </div>
                                            <div className="bg-background border border-border/50 rounded-2xl rounded-tl-none px-4 py-2.5 shadow-sm">
                                                <p className="text-sm font-medium">{msg.content}</p>
                                            </div>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>

                {/* ── Right Column: Verdict Panel ─────────────────────────────── */}
                <div className="space-y-4">
                    <div className="bg-card border border-border rounded-xl p-4 space-y-4 sticky top-8">
                        <h3 className="font-bold text-sm flex items-center gap-2">
                            <Gavel className="w-4 h-4 text-primary" />
                            Admin Verdict
                        </h3>

                        {match.adminNote && (
                            <div className="bg-primary/10 border border-primary/20 rounded-lg p-3">
                                <p className="text-[10px] uppercase tracking-wider font-bold text-primary mb-1">Previous Note</p>
                                <p className="text-xs">{match.adminNote}</p>
                            </div>
                        )}

                        {/* Admin Note */}
                        <div className="space-y-1.5">
                            <label className="text-xs font-bold text-muted-foreground flex items-center gap-1.5">
                                <FileText className="w-3.5 h-3.5" />
                                Admin Note (required)
                            </label>
                            <textarea
                                value={adminNote}
                                onChange={e => setAdminNote(e.target.value)}
                                placeholder="Describe your reasoning for this decision..."
                                className="w-full bg-muted/50 border border-border rounded-lg px-3 py-2 text-sm resize-none h-24 focus:ring-2 focus:ring-primary/50 outline-none transition-all"
                            />
                        </div>

                        {/* Payout Preview */}
                        <div className="bg-muted/30 rounded-lg p-3 border border-border/50 space-y-1.5 text-xs">
                            <p className="font-bold text-muted-foreground uppercase tracking-wider text-[10px]">Payout Preview</p>
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">Gross Prize Pool</span>
                                <span className="font-bold">{grossPrize} 🪙</span>
                            </div>
                            <div className="flex justify-between text-red-500">
                                <span>Platform Fee (10%)</span>
                                <span>−{platformFee} 🪙</span>
                            </div>
                            <div className="flex justify-between text-green-500 font-bold border-t border-border pt-1.5 mt-1">
                                <span>Net Payout to Winner</span>
                                <span>{netPrize} 🪙</span>
                            </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="space-y-2 pt-1">
                            {/* Force Win — Host */}
                            <button
                                onClick={() => handleResolve('force_win_host')}
                                disabled={isResolving}
                                className="w-full bg-green-500/10 hover:bg-green-500/20 text-green-600 dark:text-green-400 border border-green-500/20 font-bold py-2.5 rounded-lg text-sm flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
                            >
                                {isResolving ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
                                🟢 Host: {hostName} Wins — Pay {netPrize} 🪙
                            </button>

                            {/* Force Win — Joiner */}
                            <button
                                onClick={() => handleResolve('force_win_joiner')}
                                disabled={isResolving}
                                className="w-full bg-blue-500/10 hover:bg-blue-500/20 text-blue-600 dark:text-blue-400 border border-blue-500/20 font-bold py-2.5 rounded-lg text-sm flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
                            >
                                {isResolving ? <Loader2 className="w-4 h-4 animate-spin" /> : <User className="w-4 h-4" />}
                                🔵 Joiner: {joinerName} Wins — Pay {netPrize} 🪙
                            </button>

                            {/* Cancel & Refund Both */}
                            <button
                                onClick={() => handleResolve('cancel_refund_both')}
                                disabled={isResolving}
                                className="w-full bg-destructive/10 hover:bg-destructive/20 text-destructive border border-destructive/20 font-bold py-2.5 rounded-lg text-sm flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
                            >
                                {isResolving ? <Loader2 className="w-4 h-4 animate-spin" /> : <XCircle className="w-4 h-4" />}
                                🔴 Cancel — Refund {match.entryFee} 🪙 Each
                            </button>
                        </div>

                        <p className="text-[10px] text-muted-foreground text-center leading-relaxed">
                            ⚠️ All actions are <strong>irreversible</strong> once submitted.
                            The admin note will be saved to the match record.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
