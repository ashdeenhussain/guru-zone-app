'use client';

import { useState, useEffect } from 'react';
import { Settings, Shield, Trophy, Loader2, Save, Send, AlertTriangle, XCircle, Users, Copy, Lock, Radio, Timer } from 'lucide-react';
import { toast } from 'sonner';
import ImageUpload from '@/components/admin/ImageUpload';
import { motion, AnimatePresence } from 'framer-motion';

interface HostControlsProps {
    tournament: any;
    onUpdate: () => void;
}

export default function HostControls({ tournament, onUpdate }: HostControlsProps) {
    // Existing State
    const [roomId, setRoomId] = useState(tournament.roomID || '');
    const [roomPass, setRoomPass] = useState(tournament.roomPassword || '');
    const [selectedWinner, setSelectedWinner] = useState('');
    const [isUpdating, setIsUpdating] = useState(false);
    const [isDeclaring, setIsDeclaring] = useState(false);
    const [isEditingRoom, setIsEditingRoom] = useState(false);

    // New State for Timer & Disputes
    const [timeLeft, setTimeLeft] = useState<string>('');
    const [showDisputeModal, setShowDisputeModal] = useState(false);
    const [disputeReason, setDisputeReason] = useState('');
    const [proofUrl, setProofUrl] = useState(''); 
    const [winnerProofUrl, setWinnerProofUrl] = useState(''); 
    const [isSubmittingDispute, setIsSubmittingDispute] = useState(false);

    // Timer Logic for Host
    const [afkTimeLeft, setAfkTimeLeft] = useState<string>('');

    useEffect(() => {
        if (tournament.status !== 'active' || tournament.roomID || !tournament.activatedAt) {
            setAfkTimeLeft('');
            return;
        }

        const interval = setInterval(() => {
            const startTime = new Date(tournament.activatedAt).getTime();
            const now = Date.now();
            const diff = (startTime + 15 * 60 * 1000) - now; // 15 mins

            if (diff <= 0) {
                setAfkTimeLeft('EXPIRED');
                clearInterval(interval);
            } else {
                const minutes = Math.floor(diff / 60000);
                const seconds = Math.floor((diff % 60000) / 1000);
                setAfkTimeLeft(`${minutes}:${seconds.toString().padStart(2, '0')}`);
            }
        }, 1000);

        return () => clearInterval(interval);
    }, [tournament.status, tournament.roomID, tournament.activatedAt]);

    useEffect(() => {
        if (tournament.status !== 'pending_verification' || !tournament.verificationStartedAt) return;

        const interval = setInterval(() => {
            const startTime = new Date(tournament.verificationStartedAt).getTime();
            const now = Date.now();
            const diff = (startTime + 30 * 60 * 1000) - now;

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
    }, [tournament.status, tournament.verificationStartedAt]);

    // Poll for status updates every 3 seconds to catch disputes
    useEffect(() => {
        if (!tournament || 
            ['completed', 'Completed', 'disputed', 'Disputed', 'cancelled', 'Cancelled'].includes(tournament.status)
        ) return;

        const interval = setInterval(() => {
            onUpdate();
        }, 3000);

        return () => clearInterval(interval);
    }, [tournament?.status, onUpdate]);

    const handleUpdateRoom = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!roomId || !roomPass) return toast.error('Please fill both ID and Password');
        
        setIsUpdating(true);
        try {
            const res = await fetch(`/api/battle-zone/matches/${tournament._id}/room`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ roomID: roomId, roomPassword: roomPass }),
            });
            const data = await res.json();
            if (data.success) {
                toast.success('Room details updated');
                onUpdate();
            } else {
                toast.error(data.error);
            }
        } catch (error) {
            toast.error('Failed to update');
        } finally {
            setIsUpdating(false);
        }
    };

    const handleDeclareWinner = async () => {
        if (!selectedWinner) return toast.error('Please select a winner');
        if (!winnerProofUrl) return toast.error('Please upload a victory screenshot');

        setIsDeclaring(true);
        try {
            const res = await fetch(`/api/battle-zone/matches/${tournament._id}/result`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    winnerId: selectedWinner,
                    winnerScreenshot: winnerProofUrl
                }),
            });
            const data = await res.json();
            if (data.success) {
                toast.success('Winner declared! Waiting for their confirmation.');
                setWinnerProofUrl('');
                onUpdate();
            } else {
                toast.error(data.error);
            }
        } catch (error) {
            toast.error('Failed to declare winner');
        } finally {
            setIsDeclaring(false);
        }
    };

    const handleForceDispute = async () => {
        if (!disputeReason) return toast.error('Please provide a reason');
        if (!proofUrl) return toast.error('Please upload proof');

        setIsSubmittingDispute(true);
        try {
            const res = await fetch(`/api/battle-zone/matches/${tournament._id}/result`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'host_force_dispute',
                    reason: disputeReason,
                    proofUrl // Using proofUrl for force dispute
                }),
            });
            const data = await res.json();
            if (data.success) {
                toast.success('Claim submitted to Admin');
                setShowDisputeModal(false);
                onUpdate();
            } else {
                toast.error(data.error);
            }
        } catch (error) {
            toast.error('Failed to submit claim');
        } finally {
            setIsSubmittingDispute(false);
        }
    };

    return (
        <div className="space-y-8">
            
            {/* Header Section */}
            <div className="flex items-center justify-between">
                <div className="space-y-1">
                    <h3 className="font-black text-xl flex items-center gap-2 uppercase tracking-tight">
                        <Settings className="w-6 h-6 text-primary" />
                        Match Center
                    </h3>
                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Host Management Dashboard</p>
                </div>
                <div className="flex items-center gap-2 bg-green-500/10 px-3 py-1.5 rounded-full border border-green-500/20">
                    <Radio className="w-3 h-3 text-green-500 animate-pulse" />
                    <span className="text-[10px] font-black text-green-500 uppercase">Live Hosting</span>
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

            {/* Step 1: Manage Room Credentials */}
            {tournament.status !== 'disputed' && (
                <section className="relative overflow-hidden bg-card border border-border rounded-[2rem] p-6 shadow-xl shadow-black/5">
                    <div className="absolute top-0 right-0 p-8 opacity-[0.03]">
                        <Shield className="w-24 h-24" />
                    </div>
                    
                    <h4 className="font-black text-xs mb-6 flex items-center gap-2 uppercase tracking-widest text-muted-foreground">
                        <Lock className="w-4 h-4 text-green-500" />
                        Match Room Details
                    </h4>
                    
                    {!isEditingRoom && !tournament.roomID ? (
                        <div className="space-y-4">
                            {afkTimeLeft && (
                                <div className={`p-4 rounded-2xl border flex flex-col items-center gap-2 text-center animate-pulse ${afkTimeLeft === 'EXPIRED' ? 'bg-destructive/10 border-destructive/20 text-destructive' : 'bg-yellow-500/10 border-yellow-500/20 text-yellow-600'}`}>
                                    <div className="flex items-center gap-2">
                                        <Timer className="w-5 h-5" />
                                        <span className="text-sm font-black uppercase tracking-widest">Action Required: Share Room ID</span>
                                    </div>
                                    <p className="text-[10px] font-bold uppercase tracking-tight opacity-80">
                                        You must provide Room Details within 15 minutes or the match will be cancelled with a penalty.
                                    </p>
                                    <div className="text-2xl font-black font-mono">
                                        {afkTimeLeft === 'EXPIRED' ? 'AFK - PENALTY IMMINENT' : afkTimeLeft}
                                    </div>
                                </div>
                            )}
                            <button 
                                onClick={() => setIsEditingRoom(true)}
                                className="w-full bg-primary/10 hover:bg-primary/20 text-primary border border-primary/20 font-black py-4 rounded-2xl text-xs uppercase tracking-widest flex items-center justify-center gap-2 transition-all shadow-lg active:scale-95"
                            >
                                <Radio className="w-5 h-5" />
                                Share Room Details
                            </button>
                        </div>
                    ) : (
                        <form onSubmit={handleUpdateRoom} className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-muted-foreground uppercase tracking-wider ml-1">Room ID</label>
                                    <input
                                        type="text"
                                        value={roomId}
                                        onChange={(e) => setRoomId(e.target.value)}
                                        className="w-full bg-muted/50 border border-border rounded-2xl px-5 py-3 text-sm font-bold focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                                        placeholder="12345678"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-muted-foreground uppercase tracking-wider ml-1">Password</label>
                                    <input
                                        type="text"
                                        value={roomPass}
                                        onChange={(e) => setRoomPass(e.target.value)}
                                        className="w-full bg-muted/50 border border-border rounded-2xl px-5 py-3 text-sm font-bold focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                                        placeholder="pass123"
                                    />
                                </div>
                            </div>
                            
                            <button
                                type="submit"
                                disabled={isUpdating}
                                className="w-full bg-primary text-primary-foreground hover:bg-primary/90 font-black py-4 rounded-2xl text-xs uppercase tracking-[0.1em] transition-all flex items-center justify-center gap-2 shadow-lg shadow-primary/20 active:scale-[0.98]"
                            >
                                {isUpdating ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                                Save & Share Details
                            </button>
                            
                            <div className="bg-muted/30 p-3 rounded-xl border border-border/50">
                                <p className="text-[10px] text-muted-foreground text-center font-bold italic">
                                    Details are securely encrypted and shared only with joined participants.
                                </p>
                            </div>
                        </form>
                    )}
                </section>
            )}

            {/* Step 2: Declare Result */}
            {tournament.status !== 'disputed' && (
                <section className="relative overflow-hidden bg-card border border-border rounded-[2rem] p-6 shadow-xl shadow-black/5">
                    <div className="absolute top-0 right-0 p-8 opacity-[0.03]">
                        <Trophy className="w-24 h-24" />
                    </div>

                    <h4 className="font-black text-xs mb-6 flex items-center gap-2 uppercase tracking-widest text-muted-foreground">
                        <Trophy className="w-4 h-4 text-yellow-500" />
                        2. Outcome Declaration
                    </h4>

                    {tournament.status === 'completed' || tournament.status === 'Completed' ? (
                        <motion.div 
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="text-center p-8 bg-green-500/5 rounded-3xl border border-green-500/20 shadow-inner"
                        >
                            <div className="bg-green-500 text-white w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg shadow-green-500/20">
                                <Trophy className="w-6 h-6" />
                            </div>
                            <p className="font-black text-green-600 dark:text-green-400 text-lg">MATCH COMPLETED</p>
                            <p className="text-xs text-muted-foreground mt-1 font-bold">Prize pool has been distributed.</p>
                        </motion.div>
                    ) : tournament.status === 'pending_verification' ? (
                        <div className="space-y-6">
                            <div className="text-center p-6 bg-yellow-500/5 rounded-3xl border border-yellow-500/20 relative">
                                <p className="text-yellow-600 dark:text-yellow-400 font-black text-sm uppercase tracking-widest flex items-center justify-center gap-2">
                                    <Loader2 className="w-4 h-4 animate-spin text-yellow-500" />
                                    Awaiting Confirmation
                                </p>

                                {tournament.winners?.rank1 && (
                                    <motion.div 
                                        initial={{ y: 10, opacity: 0 }}
                                        animate={{ y: 0, opacity: 1 }}
                                        className="my-6 p-5 bg-background/50 rounded-2xl border border-border shadow-sm flex items-center gap-4 text-left"
                                    >
                                        <div className="w-12 h-12 bg-yellow-500/20 rounded-xl flex items-center justify-center text-yellow-600 border border-yellow-500/30">
                                            <Trophy className="w-6 h-6" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-[10px] font-black text-muted-foreground uppercase opacity-70 leading-none mb-1">Declared Winner</p>
                                            <p className="text-base font-black truncate">
                                                {(() => {
                                                    const winnerId = tournament.winners.rank1?._id || tournament.winners.rank1;
                                                    const winner = tournament.participants.find((p: any) => (p.userId._id || p.userId).toString() === winnerId.toString());
                                                    return winner ? (winner.inGameName || winner.userId.inGameName || winner.userId.username || 'Player') : 'Unknown';
                                                })()}
                                            </p>
                                        </div>
                                    </motion.div>
                                )}

                                {timeLeft && (
                                    <div className="inline-flex items-center gap-2 bg-muted px-4 py-2 rounded-full border border-border">
                                        <span className="text-[10px] font-bold text-muted-foreground uppercase">Auto-resolve in</span>
                                        <span className={`text-xs font-black font-mono ${timeLeft === 'EXPIRED' ? 'text-destructive' : 'text-primary'}`}>
                                            {timeLeft}
                                        </span>
                                    </div>
                                )}
                            </div>

                            {timeLeft === 'EXPIRED' && (
                                <motion.div 
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="space-y-3"
                                >
                                    <button
                                        onClick={() => setShowDisputeModal(true)}
                                        className="w-full bg-destructive/10 hover:bg-destructive/15 text-destructive border border-destructive/20 font-black py-4 rounded-2xl text-xs uppercase tracking-widest flex items-center justify-center gap-2 transition-all shadow-lg active:scale-[0.98]"
                                    >
                                        <AlertTriangle className="w-4 h-4" />
                                        No Response? Request Verdict
                                    </button>
                                    <p className="text-[10px] text-muted-foreground text-center font-bold bg-muted/30 p-2 rounded-lg">
                                        Admins will verify your proof and distribute the prize manually.
                                    </p>
                                </motion.div>
                            )}
                        </div>
                    ) : (
                        <div className="space-y-6">
                            <div className="space-y-3">
                                <label className="text-[10px] font-black text-muted-foreground uppercase tracking-wider ml-1">Select Winner</label>
                                <div className="grid grid-cols-1 gap-2">
                                    {tournament.participants.map((p: any) => {
                                        const pId = (p.userId && typeof p.userId === 'object' && '_id' in p.userId) ? p.userId._id : p.userId;
                                        const pName = p.inGameName || (typeof p.userId === 'object' ? (p.userId.inGameName || p.userId.username) : 'Player');
                                        const pUid = p.uid || (typeof p.userId === 'object' ? p.userId.freeFireUid : '---');
                                        const isSelected = String(selectedWinner) === String(pId);

                                        return (
                                            <button
                                                key={pId}
                                                onClick={() => setSelectedWinner(pId)}
                                                className={`
                                                    flex items-center justify-between p-4 rounded-2xl border transition-all text-left group
                                                    ${isSelected 
                                                        ? 'bg-primary/10 border-primary shadow-lg shadow-primary/5' 
                                                        : 'bg-muted/30 border-border hover:border-muted-foreground/30 hover:bg-muted/50'
                                                    }
                                                `}
                                            >
                                                <div className="flex items-center gap-4">
                                                    <div className={`
                                                        w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all
                                                        ${isSelected ? 'border-primary bg-primary' : 'border-muted-foreground/30'}
                                                    `}>
                                                        {isSelected && <div className="w-2 h-2 rounded-full bg-primary-foreground" />}
                                                    </div>
                                                    <div className="min-w-0">
                                                        <p className="text-sm font-black truncate">{pName}</p>
                                                        <p className="text-[10px] font-bold text-muted-foreground font-mono">UID: {pUid}</p>
                                                    </div>
                                                </div>
                                                {isSelected && <Trophy className="w-5 h-5 text-primary" />}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>

                            <div className="space-y-3">
                                <label className="text-[10px] font-black text-muted-foreground uppercase tracking-wider ml-1">Victory Proof (Required)</label>
                                <ImageUpload
                                    value={winnerProofUrl}
                                    onChange={setWinnerProofUrl}
                                    label="Upload Booyah Screenshot"
                                />
                            </div>

                            <button
                                onClick={handleDeclareWinner}
                                disabled={isDeclaring || !selectedWinner || !winnerProofUrl}
                                className={`
                                    w-full font-black py-4 rounded-2xl text-xs uppercase tracking-widest transition-all flex items-center justify-center gap-2 shadow-xl active:scale-[0.98]
                                    ${isDeclaring || !selectedWinner || !winnerProofUrl 
                                        ? 'bg-muted text-muted-foreground grayscale cursor-not-allowed' 
                                        : 'bg-green-600 text-white hover:bg-green-700 shadow-green-600/20'
                                    }
                                `}
                            >
                                {isDeclaring ? (
                                    <Loader2 className="w-5 h-5 animate-spin" />
                                ) : (
                                    <>
                                        <Trophy className="w-5 h-5" />
                                        Declare Winner & End Match
                                    </>
                                )}
                            </button>
                        </div>
                    )}
                </section>
            )}

            {/* Cancel Tournament Button */}
            {(tournament.status === 'Open' || tournament.status === 'Full' || tournament.status === 'Upcoming') && (
                <section className="bg-destructive/5 border border-destructive/20 rounded-[2rem] p-6 lg:grayscale hover:grayscale-0 transition-all duration-500">
                    <div className="space-y-1 mb-4 flex items-center gap-3">
                        <AlertTriangle className="w-5 h-5 text-destructive" />
                        <div>
                            <h4 className="font-black text-xs uppercase tracking-wider text-destructive">Termination Protocol</h4>
                            <p className="text-[10px] font-bold text-muted-foreground uppercase opacity-70">Irreversible Action</p>
                        </div>
                    </div>
                    <button
                        onClick={async () => {
                            if (!confirm("Are you sure? This will refund all players immediately.")) return;
                            try {
                                const res = await fetch(`/api/battle-zone/matches/${tournament._id}/cancel`, { method: 'POST' });
                                const data = await res.json();
                                if (data.success) {
                                    toast.success("Tournament cancelled and refunded");
                                    onUpdate();
                                } else {
                                    toast.error(data.error);
                                }
                            } catch (e) {
                                toast.error("Failed to cancel");
                            }
                        }}
                        className="w-full bg-destructive text-destructive-foreground hover:bg-destructive/90 font-black py-3 px-6 rounded-xl text-[10px] uppercase tracking-widest shadow-lg shadow-destructive/20 transition-all"
                    >
                        ABORT TOURNAMENT
                    </button>
                </section>
            )}

            {/* Host Dispute Modal */}
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
                            className="bg-card w-full max-sm rounded-[2.5rem] border border-border shadow-2xl p-8 space-y-6 relative z-10"
                        >
                            <div className="flex justify-between items-start">
                                <div className="space-y-1">
                                    <h3 className="font-black text-xl text-destructive uppercase tracking-tight flex items-center gap-2">
                                        <AlertTriangle className="w-6 h-6" />
                                        Resolution
                                    </h3>
                                    <p className="text-[10px] font-black text-muted-foreground uppercase opacity-70">Admin Review Required</p>
                                </div>
                                <button onClick={() => setShowDisputeModal(false)} className="p-2 hover:bg-muted rounded-full transition-colors">
                                    <XCircle className="w-6 h-6 text-muted-foreground" />
                                </button>
                            </div>

                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase text-muted-foreground ml-1">Case Explanation</label>
                                    <textarea
                                        value={disputeReason}
                                        onChange={(e) => setDisputeReason(e.target.value)}
                                        placeholder="Explain why the opponent is unresponsive..."
                                        className="w-full bg-muted border border-border rounded-2xl p-4 text-sm font-medium min-h-[100px] focus:ring-2 focus:ring-destructive/20 outline-none"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase text-muted-foreground ml-1">Scoreboard Evidence</label>
                                    <ImageUpload
                                        value={proofUrl}
                                        onChange={setProofUrl}
                                        label="Final Scoreboard Screenshot"
                                    />
                                </div>
                            </div>

                            <button
                                onClick={handleForceDispute}
                                disabled={isSubmittingDispute || !disputeReason || !proofUrl}
                                className={`
                                    w-full font-black py-4 rounded-2xl text-xs uppercase tracking-widest transition-all flex items-center justify-center gap-2 shadow-xl
                                    ${isSubmittingDispute || !disputeReason || !proofUrl 
                                        ? 'bg-muted text-muted-foreground grayscale cursor-not-allowed' 
                                        : 'bg-destructive text-destructive-foreground hover:bg-destructive/90 shadow-destructive/20'
                                    }
                                `}
                            >
                                {isSubmittingDispute ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Submit Case to Admin'}
                            </button>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}
