'use client';

import { useState, useEffect } from 'react';
import { 
    Eye, EyeOff, CheckCircle, XCircle, AlertTriangle, 
    Loader2, Trophy, Shield, Copy, Calendar, Timer, 
    ExternalLink, MapPin, Lock
} from 'lucide-react';
import { toast } from 'sonner';
import ImageUpload from '@/components/admin/ImageUpload';
import { motion, AnimatePresence } from 'framer-motion';

interface PlayerControlsProps {
    tournament: any;
    userId: string;
    onUpdate: () => void;
}

export default function PlayerControls({ tournament, userId, onUpdate }: PlayerControlsProps) {
    // Existing State
    const [showCreds, setShowCreds] = useState(false);
    const [creds, setCreds] = useState<{ roomID?: string, roomPassword?: string } | null>(null);
    const [isLoadingCreds, setIsLoadingCreds] = useState(false);
    const [isVerifying, setIsVerifying] = useState(false);

    // New State for Disputes & Timer
    const [timeLeft, setTimeLeft] = useState<string>('');
    const [showDisputeModal, setShowDisputeModal] = useState(false);
    const [disputeReason, setDisputeReason] = useState('');
    const [proofUrl, setProofUrl] = useState('');
    const [isSubmittingDispute, setIsSubmittingDispute] = useState(false);

    // Force Dispute State
    const [forceDisputeTime, setForceDisputeTime] = useState<string>('');
    const [isForceDisputeLoading, setIsForceDisputeLoading] = useState(false);

    // Poll for status updates every 3 seconds
    useEffect(() => {
        if (!tournament || 
            ['completed', 'Completed', 'disputed', 'Disputed', 'cancelled', 'Cancelled'].includes(tournament?.status || '')
        ) return;

        const interval = setInterval(() => {
            onUpdate();
        }, 3000);

        return () => clearInterval(interval);
    }, [tournament?.status, onUpdate]);

    // ── UPGRADED FORCE DISPUTE TIMER LOGIC ──
    const [disputeState, setDisputeState] = useState<'locked' | 'grace' | 'ready'>('locked');
    const [disputeTimer, setDisputeTimer] = useState<string>('');
    const [unlockAtFormatted, setUnlockAtFormatted] = useState<string>('');

    useEffect(() => {
        if (tournament?.status !== 'active') return;

        const expiresAt = new Date(tournament?.expiresAt || tournament?.createdAt || Date.now()).getTime();
        const unlockTime = expiresAt + (30 * 60 * 1000); // 30 mins after expiry

        // Format the static unlock time once
        setUnlockAtFormatted(new Date(unlockTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));

        const interval = setInterval(() => {
            const now = Date.now();
            
            if (now < expiresAt) {
                setDisputeState('locked');
            } else if (now < unlockTime) {
                setDisputeState('grace');
                const diff = unlockTime - now;
                const minutes = Math.floor(diff / 60000);
                const seconds = Math.floor((diff % 60000) / 1000);
                setDisputeTimer(`${minutes}:${seconds.toString().padStart(2, '0')}`);
            } else {
                setDisputeState('ready');
                setDisputeTimer('READY');
            }
        }, 1000);

        return () => clearInterval(interval);
    }, [tournament?.status, tournament?.expiresAt, tournament?.createdAt]);

    // Result Verification Timer Logic (30 mins from host declaration)
    useEffect(() => {
        if (tournament?.status !== 'pending_verification' || !tournament?.verificationStartedAt) return;

        const interval = setInterval(() => {
            const startTime = new Date(tournament.verificationStartedAt as any).getTime();
            const now = Date.now();
            const diff = (startTime + 30 * 60 * 1000) - now; // 30 mins

            if (diff <= 0) {
                setTimeLeft('EXPIRED');
                clearInterval(interval);
            } else {
                const minutes = Math.floor(diff / 60000);
                const seconds = Math.floor((diff % 60000) / 1000);
                setTimeLeft(`${minutes}:${seconds.toString().padStart(2, '0')}`);
            }
        }, 1000);

        return () => clearInterval(interval);
    }, [tournament?.status, tournament?.verificationStartedAt]);

    const handleViewCreds = async () => {
        if (showCreds) {
            setShowCreds(false);
            return;
        }

        setIsLoadingCreds(true);
        try {
            const res = await fetch(`/api/battle-zone/matches/${tournament._id}/room`);
            const data = await res.json();
            if (data.success) {
                setCreds(data.data);
                setShowCreds(true);
            } else {
                toast.error(data.error || 'Failed to fetch credentials');
            }
        } catch (error) {
            toast.error('Failed to load room details');
        } finally {
            setIsLoadingCreds(false);
        }
    };

    const handleVerifyParams = async (action: 'confirm' | 'reject') => {
        if (!confirm(`Are you sure you want to ${action} this result?`)) return;

        setIsVerifying(true);
        try {
            const res = await fetch(`/api/battle-zone/matches/${tournament._id}/result`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action }),
            });
            const data = await res.json();

            if (data.success) {
                toast.success(data.message);
                onUpdate();
            } else {
                toast.error(data.error);
            }

        } catch (error) {
            toast.error('Failed to verify result');
        } finally {
            setIsVerifying(false);
        }
    };

    const handleDisputeSubmit = async () => {
        if (!disputeReason) return toast.error('Please provide a reason');
        if (!proofUrl) return toast.error('Please upload proof');

        setIsSubmittingDispute(true);
        try {
            const res = await fetch(`/api/battle-zone/matches/${tournament._id}/result`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'reject',
                    reason: disputeReason,
                    proofUrl
                }),
            });
            const data = await res.json();
            if (data.success) {
                toast.success('Dispute submitted for review');
                setShowDisputeModal(false);
                onUpdate();
            } else {
                toast.error(data.error);
            }
        } catch (error) {
            toast.error('Failed to submit dispute');
        } finally {
            setIsSubmittingDispute(false);
        }
    };

    const handleForceDispute = async () => {
        if (!confirm("Are you sure? This will force the match into a Disputed state because the host hasn't declared a result. Abuse of this button will result in a ban.")) return;

        setIsForceDisputeLoading(true);
        try {
            const res = await fetch(`/api/battle-zone/matches/${tournament._id}/force-dispute`, {
                method: 'POST'
            });
            const data = await res.json();
            if (data.success) {
                toast.success('Match successfully moved to Disputed state.');
                onUpdate();
            } else {
                toast.error(data.error || 'Failed to trigger force-dispute');
            }
        } catch (error) {
            toast.error('Server error during force-dispute');
        } finally {
            setIsForceDisputeLoading(false);
        }
    };

    const isHost = (tournament?.createdBy?._id || tournament?.createdBy) === userId;
    // Derive winner info
    const winnerData = tournament?.winners?.rank1;
    const winnerId = String(winnerData?._id || winnerData || '');
    const winnerName = winnerData?.inGameName || winnerData?.username || winnerData?.name || 'Player';
    const winnerUid = winnerData?.freeFireUid || winnerData?.uid || '---';

    const isDeclaredWinner = !!winnerId && String(userId) === winnerId;
    const canVerify = tournament?.status === 'pending_verification' && !!winnerId;

    return (
        <div className="space-y-6">
            
            {/* Header / Room Info Section */}
            <div className="flex items-center justify-between mb-2">
                <div className="space-y-1">
                    <h3 className="font-black text-xl uppercase tracking-tight flex items-center gap-2">
                        <Shield className="w-6 h-6 text-primary" />
                        Match Room
                    </h3>
                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest leading-none">
                        Joined Participant Access
                    </p>
                </div>
                <div className="bg-primary/10 border border-primary/20 px-3 py-1 rounded-full flex items-center gap-2">
                    <Timer className="w-3 h-3 text-primary" />
                    <span className="text-[10px] font-black text-primary uppercase">
                        {tournament.status === 'Open' ? 'WAITING' : tournament.status}
                    </span>
                </div>
            </div>

            {/* Dispute Banner Lock */}
            {tournament.status === 'disputed' && (
                <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-orange-500/10 border-2 border-orange-500/20 rounded-[2.5rem] p-10 text-center space-y-6 shadow-2xl shadow-orange-500/5"
                >
                    <div className="w-20 h-20 bg-orange-500 rounded-full flex items-center justify-center mx-auto shadow-xl shadow-orange-500/20">
                        <AlertTriangle className="w-12 h-12 text-white" />
                    </div>
                    <div className="space-y-3">
                        <h3 className="text-3xl font-black text-orange-600 dark:text-orange-400 uppercase tracking-tighter">Match Disputed ⚠️</h3>
                        <p className="text-sm font-bold text-muted-foreground max-w-md mx-auto leading-relaxed">
                            Admin review is in progress. Both sides' proofs are being analyzed. 
                            Resolution may take 24-48 working hours. Please hold tight.
                        </p>
                    </div>
                </motion.div>
            )}

            {/* Room Credentials Card */}
            {tournament.status !== 'disputed' && (
                <section className="bg-card border border-border rounded-[2rem] p-6 shadow-xl shadow-black/5 overflow-hidden relative group">
                    <div className="absolute top-0 right-0 p-8 opacity-[0.03] group-hover:opacity-[0.05] transition-opacity">
                        <Lock className="w-24 h-24" />
                    </div>
                    
                    <div className="space-y-6 relative z-10">
                        <div className="flex items-center gap-2">
                            <Shield className="w-4 h-4 text-green-500" />
                            <h4 className="font-black text-xs uppercase tracking-widest text-muted-foreground italic">Room Credentials</h4>
                        </div>

                        <AnimatePresence mode="wait">
                            {showCreds ? (
                                <motion.div 
                                    key="creds"
                                    initial={{ opacity: 0, scale: 0.95 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0, scale: 0.95 }}
                                    className="space-y-3 bg-muted/30 p-4 rounded-2xl border border-border/50"
                                >
                                    <div className="flex justify-between items-center py-2 border-b border-border/10">
                                        <span className="text-[10px] font-black text-muted-foreground uppercase">Room ID</span>
                                        <span className="text-sm font-black font-mono select-all bg-background px-3 py-1 rounded-lg border border-border">
                                            {creds?.roomID || 'WAITING...'}
                                        </span>
                                    </div>
                                    <div className="flex justify-between items-center py-2">
                                        <span className="text-[10px] font-black text-muted-foreground uppercase">Password</span>
                                        <span className="text-sm font-black font-mono select-all bg-background px-3 py-1 rounded-lg border border-border">
                                            {creds?.roomPassword || 'WAITING...'}
                                        </span>
                                    </div>
                                </motion.div>
                            ) : (
                                <div className="py-2">
                                    <p className="text-sm font-bold text-muted-foreground bg-muted/20 p-4 rounded-2xl border border-dashed border-border/50 text-center italic">
                                        Click below to reveal secure room details
                                    </p>
                                </div>
                            )}
                        </AnimatePresence>

                        <button
                            onClick={handleViewCreds}
                            disabled={isLoadingCreds}
                            className={`
                                w-full h-14 rounded-2xl font-black text-xs uppercase tracking-widest transition-all shadow-lg flex items-center justify-center gap-2 active:scale-[0.98]
                                ${showCreds 
                                    ? 'bg-secondary text-secondary-foreground hover:bg-secondary/80' 
                                    : 'bg-foreground text-background hover:opacity-90'
                                }
                            `}
                        >
                            {isLoadingCreds ? (
                                <Loader2 className="w-5 h-5 animate-spin" />
                            ) : showCreds ? (
                                <>
                                    <EyeOff className="w-5 h-5" /> Hide Room Data
                                </>
                            ) : (
                                <>
                                    <Eye className="w-5 h-5" /> View Room Details
                                </>
                            )}
                        </button>
                        
                        <p className="text-[9px] text-center text-muted-foreground font-black uppercase tracking-tighter opacity-50">
                            Room details are only visible to captains of joined teams
                        </p>
                    </div>
                </section>
            )}

            {/* Match Result / Progress Card */}
            {tournament.status !== 'disputed' && (
                <section className="bg-card border border-border rounded-[2rem] p-6 shadow-xl shadow-black/5 overflow-hidden">
                    <div className="flex items-center justify-between mb-8">
                        <div className="flex items-center gap-2">
                            <Trophy className="w-4 h-4 text-yellow-500" />
                            <h4 className="font-black text-xs uppercase tracking-widest text-muted-foreground italic">Live Match Outcome</h4>
                        </div>
                        {timeLeft && tournament.status === 'pending_verification' && (
                            <div className="flex items-center gap-1.5 bg-orange-500/10 px-3 py-1 rounded-full border border-orange-500/20">
                               <Timer className="w-3 h-3 text-orange-500" />
                               <span className="text-[10px] font-black text-orange-500">AUTO-ACCEPT: {timeLeft}</span>
                            </div>
                        )}
                    </div>

                    <div className="space-y-8">
                        {tournament.status === 'pending_verification' || tournament.status === 'completed' || tournament.status === 'Completed' ? (
                            <>
                                {/* winner Banner */}
                                <div className={`
                                    p-6 rounded-3xl border text-center space-y-4 relative overflow-hidden
                                    ${tournament.status === 'Completed' || tournament.status === 'completed'
                                        ? 'bg-green-500/5 border-green-500/20' 
                                        : 'bg-amber-500/5 border-amber-500/20'
                                    }
                                `}>
                                    <div className={`
                                        w-14 h-14 rounded-2xl mx-auto flex items-center justify-center shadow-lg transition-transform group-hover:scale-110
                                        ${tournament.status === 'Completed' || tournament.status === 'completed' ? 'bg-green-500 text-white' : 'bg-yellow-500 text-white'}
                                    `}>
                                        <Trophy className="w-8 h-8" />
                                    </div>
                                    
                                    <div className="space-y-1">
                                        <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">
                                            {tournament.status === 'Completed' || tournament.status === 'completed' ? 'Official Winner' : 'Host Declaration'}
                                        </p>
                                        <h5 className="text-xl font-black truncate px-4">{winnerName}</h5>
                                        <p className="text-xs font-mono font-bold text-muted-foreground">UID: {winnerUid}</p>
                                    </div>

                                    {isDeclaredWinner && (
                                        <div className="bg-primary/20 text-primary text-[10px] font-black py-1 px-4 rounded-full inline-block border border-primary/20 uppercase tracking-widest">
                                            You Win 👑
                                        </div>
                                    )}
                                </div>

                                {/* Evidence Preview */}
                                {tournament.winnerScreenshot && (
                                    <div className="space-y-4">
                                        <h5 className="text-[10px] font-black text-muted-foreground uppercase flex items-center gap-2 px-1">
                                            <Eye className="w-4 h-4" /> Victory Proof
                                        </h5>
                                        <div className="relative group aspect-video rounded-[1.5rem] overflow-hidden border border-border shadow-2xl">
                                            <img 
                                                src={tournament.winnerScreenshot} 
                                                alt="Match Proof" 
                                                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                                            />
                                            <a 
                                                href={tournament.winnerScreenshot} 
                                                target="_blank" 
                                                className="absolute inset-0 bg-black/40 backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2"
                                            >
                                                <div className="p-3 bg-white/20 rounded-full border border-white/40">
                                                    <ExternalLink className="w-6 h-6 text-white" />
                                                </div>
                                                <span className="text-xs font-black text-white uppercase tracking-widest">Expand Proof</span>
                                            </a>
                                        </div>
                                    </div>
                                )}

                                {/* Player verification Buttons */}
                                {tournament.status === 'pending_verification' && (
                                    <div className="pt-4 space-y-4">
                                        {canVerify ? (
                                            <div className="space-y-4">
                                                <div className="text-center p-4 bg-muted/30 rounded-2xl border border-border/50">
                                                    <p className="text-xs font-bold text-muted-foreground italic">
                                                        {isDeclaredWinner 
                                                            ? "Host has declared you the champion. Confirm to finalize."
                                                            : "Do you acknowledge this result as accurate?"}
                                                    </p>
                                                </div>
                                                <div className="grid grid-cols-2 gap-4">
                                                    <button
                                                        onClick={() => handleVerifyParams('confirm')}
                                                        disabled={isVerifying}
                                                        className="h-14 bg-green-600 hover:bg-green-700 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-green-600/20 flex items-center justify-center gap-2 transition-all active:scale-95"
                                                    >
                                                        {isVerifying ? <Loader2 className="w-5 h-5 animate-spin" /> : <CheckCircle className="w-5 h-5" />}
                                                        Confirm
                                                    </button>
                                                    <button
                                                        onClick={() => setShowDisputeModal(true)}
                                                        disabled={isVerifying}
                                                        className="h-14 bg-red-500/10 hover:bg-red-500/15 text-red-500 border border-red-500/20 rounded-2xl font-black text-xs uppercase tracking-widest flex items-center justify-center gap-2 transition-all active:scale-95"
                                                    >
                                                        <AlertTriangle className="w-5 h-5" />
                                                        Disagree
                                                    </button>
                                                </div>
                                            </div>
                                        ) : isDeclaredWinner ? (
                                            <div className="bg-yellow-500/5 rounded-3xl p-8 text-center border border-yellow-500/20 space-y-4">
                                                <Loader2 className="w-8 h-8 animate-spin mx-auto text-yellow-500" />
                                                <div className="space-y-1">
                                                    <p className="text-sm font-black text-yellow-600">WAITING FOR ACKNOWLEDGMENT</p>
                                                    <p className="text-[10px] font-bold text-muted-foreground uppercase">Opponent must confirm their defeat</p>
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="bg-muted/20 border border-dashed border-border/50 rounded-3xl p-8 text-center">
                                                {timeLeft === 'EXPIRED' ? (
                                                    <div className="text-red-500 font-black text-sm uppercase flex items-center justify-center gap-2">
                                                        <AlertTriangle className="w-5 h-5" />
                                                        Resolution Timeout
                                                    </div>
                                                ) : (
                                                    <p className="text-xs font-black text-muted-foreground uppercase opacity-40">Awaiting Host Verdict...</p>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                )}
                            </>
                        ) : (
                            <div className="p-8 bg-muted/20 rounded-[2.5rem] border border-dashed border-border/50 text-center space-y-6">
                                <div className="space-y-4 grayscale opacity-60">
                                    <div className="p-4 bg-background border border-border inline-block rounded-3xl shadow-sm">
                                        <Timer className="w-10 h-10 opacity-30" />
                                    </div>
                                    <div className="space-y-1">
                                        <p className="text-sm font-black uppercase tracking-widest">Match In Progress</p>
                                        <p className="text-[10px] font-bold italic">Check back here once the host declares the result.</p>
                                    </div>
                                </div>

                                {/* UPGRADED Force Dispute UI for Joiners */}
                                {!isHost && tournament.status === 'active' && (
                                    <div className="pt-6 border-t border-border/50 space-y-4">
                                        <div className="flex flex-col items-center gap-3">
                                            <div className="flex items-center gap-2">
                                                <Shield className="w-3 h-3 text-muted-foreground" />
                                                <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">
                                                    Host Inactivity Protection
                                                </p>
                                            </div>

                                            {disputeState === 'locked' && (
                                                <div className="w-full flex items-center justify-center gap-3 px-6 py-4 bg-muted/50 rounded-2xl border border-border opacity-60">
                                                    <Lock className="w-4 h-4 text-muted-foreground" />
                                                    <span className="text-xs font-black text-muted-foreground uppercase tracking-tight">
                                                        Dispute Unlocks at {unlockAtFormatted}
                                                    </span>
                                                </div>
                                            )}

                                            {disputeState === 'grace' && (
                                                <div className="w-full space-y-3">
                                                    <div className="flex items-center justify-center gap-3 px-6 py-4 bg-orange-500/5 rounded-2xl border border-orange-500/20 animate-pulse">
                                                        <Timer className="w-4 h-4 text-orange-500" />
                                                        <span className="text-xs font-black text-orange-500 uppercase tracking-tight">
                                                            Dispute Unlocks in {disputeTimer}
                                                        </span>
                                                    </div>
                                                    <p className="text-[9px] font-bold text-orange-500/70 text-center uppercase leading-tight">
                                                        Host deadline reached. You can force a dispute/refund soon.
                                                    </p>
                                                </div>
                                            )}

                                            {disputeState === 'ready' && (
                                                <button
                                                    onClick={handleForceDispute}
                                                    disabled={isForceDisputeLoading}
                                                    className="w-full h-14 bg-red-500 hover:bg-red-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest transition-all flex items-center justify-center gap-2 shadow-xl shadow-red-500/20 active:scale-95"
                                                >
                                                    {isForceDisputeLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <AlertTriangle className="w-5 h-5" />}
                                                    Report Host / Force Refund
                                                </button>
                                            )}
                                        </div>
                                        
                                        <p className="text-[9px] font-bold text-muted-foreground/40 leading-relaxed text-center uppercase max-w-[240px] mx-auto">
                                            Auto-refund available after deadline if Room ID is missing. Dispute case opened if Room ID exists but host is AFK.
                                        </p>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </section>
            )}

            {/* Dispute Modal */}
            <AnimatePresence>
                {showDisputeModal && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center px-4">
                        <motion.div 
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setShowDisputeModal(false)}
                            className="absolute inset-0 bg-background/80 backdrop-blur-md"
                        />
                        <motion.div 
                            initial={{ scale: 0.9, opacity: 0, y: 20 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.9, opacity: 0, y: 20 }}
                            className="bg-card w-full max-w-sm rounded-[2.5rem] border border-border shadow-2xl p-8 space-y-6 relative z-10"
                        >
                            <div className="flex justify-between items-start">
                                <div className="space-y-1">
                                    <h3 className="font-black text-xl text-destructive uppercase tracking-tight flex items-center gap-2">
                                        <AlertTriangle className="w-6 h-6" />
                                        Dispute Result
                                    </h3>
                                    <p className="text-[10px] font-black text-muted-foreground uppercase opacity-70">Official Protest</p>
                                </div>
                                <button onClick={() => setShowDisputeModal(false)} className="p-2 hover:bg-muted rounded-full transition-colors">
                                    <XCircle className="w-6 h-6 text-muted-foreground" />
                                </button>
                            </div>

                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase text-muted-foreground ml-1">Protest Reason</label>
                                    <textarea
                                        value={disputeReason}
                                        onChange={(e) => setDisputeReason(e.target.value)}
                                        placeholder="Detail why this result is incorrect..."
                                        className="w-full bg-muted border border-border rounded-2xl p-4 text-sm font-medium min-h-[120px] focus:ring-2 focus:ring-destructive/20 outline-none"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase text-muted-foreground ml-1">Counter Evidence</label>
                                    <ImageUpload
                                        value={proofUrl}
                                        onChange={setProofUrl}
                                        label="Upload Counter Screenshot"
                                    />
                                </div>
                            </div>

                            <button
                                onClick={handleDisputeSubmit}
                                disabled={isSubmittingDispute || !disputeReason || !proofUrl}
                                className={`
                                    w-full font-black py-4 rounded-2xl text-xs uppercase tracking-widest transition-all flex items-center justify-center gap-2 shadow-xl
                                    ${isSubmittingDispute || !disputeReason || !proofUrl 
                                        ? 'bg-muted text-muted-foreground grayscale cursor-not-allowed' 
                                        : 'bg-destructive text-destructive-foreground hover:bg-destructive/90 shadow-destructive/20'
                                    }
                                `}
                            >
                                {isSubmittingDispute ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Log Formal Dispute'}
                            </button>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}
