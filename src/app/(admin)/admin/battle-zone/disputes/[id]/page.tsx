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
    disputeProof: string;
    adminNote?: string;
    createdAt: string;
    updatedAt: string;
    createdBy: { _id: string; name: string; username: string; inGameName: string; freeFireUid: string; image?: string };
    participants: Participant[];
    winners: { rank1?: { _id: string; name: string; inGameName: string; freeFireUid: string; image?: string } };
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
                    fetch(`/api/tournaments/${id}`),
                    fetch(`/api/tournaments/${id}/chat`)
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

                    {/* Dispute Evidence */}
                    <div className="bg-card border border-red-500/20 rounded-xl p-4 space-y-3">
                        <h3 className="font-bold text-sm flex items-center gap-2 text-red-500">
                            <AlertTriangle className="w-4 h-4" />
                            Dispute Evidence
                        </h3>
                        {match.disputeReason && (
                            <div className="bg-muted/30 rounded-lg p-3 border border-border/50">
                                <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold mb-1">Dispute Reason</p>
                                <p className="text-sm">{match.disputeReason}</p>
                            </div>
                        )}
                        {match.disputeProof ? (
                            <div className="space-y-2">
                                <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold">Proof Screenshot</p>
                                <a href={match.disputeProof} target="_blank" rel="noreferrer" className="block">
                                    <img
                                        src={match.disputeProof}
                                        alt="Dispute proof"
                                        className="w-full rounded-lg border border-border object-contain max-h-80 hover:opacity-90 transition-opacity cursor-zoom-in bg-muted"
                                    />
                                </a>
                                <a
                                    href={match.disputeProof}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="text-xs text-primary underline"
                                >
                                    Open Full Image ↗
                                </a>
                            </div>
                        ) : (
                            <div className="bg-muted/20 rounded-lg p-4 text-center text-muted-foreground text-sm border border-dashed border-border">
                                No proof screenshot uploaded
                            </div>
                        )}
                    </div>

                    {/* Chat Logs */}
                    <div className="bg-card border border-border rounded-xl overflow-hidden">
                        <div className="bg-muted/50 px-4 py-2.5 border-b border-border flex items-center gap-2">
                            <MessageSquare className="w-4 h-4 text-primary" />
                            <h3 className="font-bold text-sm">Match Chat Log</h3>
                            <span className="ml-auto text-xs text-muted-foreground">{chats.length} messages</span>
                        </div>
                        <div className="p-4 max-h-80 overflow-y-auto space-y-3">
                            {chats.length === 0 ? (
                                <p className="text-sm text-muted-foreground text-center py-4">No chat messages</p>
                            ) : (
                                chats.map(msg => (
                                    <div key={msg._id} className="flex gap-2">
                                        <div className="w-6 h-6 rounded-full bg-muted flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">
                                            {msg.senderName?.[0]?.toUpperCase() || '?'}
                                        </div>
                                        <div className="flex-1 bg-muted/30 rounded-lg px-3 py-2">
                                            <div className="flex items-center gap-2 mb-0.5">
                                                <span className="text-xs font-bold">{msg.senderName || 'Unknown'}</span>
                                                <span className="text-[10px] text-muted-foreground">
                                                    {format(new Date(msg.createdAt), 'HH:mm')}
                                                </span>
                                            </div>
                                            <p className="text-sm">{msg.content}</p>
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
                                🟢 Host Wins — Pay {netPrize} 🪙
                            </button>

                            {/* Force Win — Joiner */}
                            <button
                                onClick={() => handleResolve('force_win_joiner')}
                                disabled={isResolving}
                                className="w-full bg-blue-500/10 hover:bg-blue-500/20 text-blue-600 dark:text-blue-400 border border-blue-500/20 font-bold py-2.5 rounded-lg text-sm flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
                            >
                                {isResolving ? <Loader2 className="w-4 h-4 animate-spin" /> : <User className="w-4 h-4" />}
                                🔵 Joiner Wins — Pay {netPrize} 🪙
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
