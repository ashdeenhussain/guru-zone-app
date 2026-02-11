'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, User, Users, Shield, Check, AlertCircle } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface JoinTournamentModalProps {
    isOpen: boolean;
    onClose: () => void;
    tournament: {
        _id: string;
        title: string;
        entryFee: number;
        format: 'Solo' | 'Duo' | 'Squad';
    };
    user: {
        walletBalance: number;
        inGameName?: string;
        freeFireUid?: string;
    };
    onJoinSuccess?: () => void;
}

export default function JoinTournamentModal({ isOpen, onClose, tournament, user, onJoinSuccess }: JoinTournamentModalProps) {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [formData, setFormData] = useState({
        inGameName: user.inGameName || '',
        uid: user.freeFireUid || '',
        partnerName: '',
        partnerUid: '',
        squadName: '',
        leaderName: user.inGameName || '', // If user is leader
        player2Name: '',
        player2Uid: '',
        player3Name: '',
        player3Uid: '',
        player4Name: '',
        player4Uid: '',
    });

    // Update formData if user prop changes or on mount (though state initializer handles mount)
    useEffect(() => {
        if (isOpen) {
            setFormData(prev => ({
                ...prev,
                inGameName: user.inGameName || prev.inGameName,
                uid: user.freeFireUid || prev.uid
            }));
        }
    }, [isOpen, user]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setLoading(true);

        try {
            // Construct payload based on format
            let payload: any = {
                tournamentId: tournament._id,
                inGameName: formData.inGameName,
                uid: formData.uid,
                teammates: []
            };

            if (tournament.format === 'Duo') {
                payload.teamName = `Duo: ${formData.inGameName} & ${formData.partnerName}`; // Auto-generate or ask? Let's use partner name or just "Duo Team" if not asked. 
                // Wait, requirements said "Team Name" MUST be asked.
                // The current UI for Duo doesn't ask for a Team Name, only Partner Name.
                // For now, I'll generate it or just leave it empty if not strictly required by my previous finding (Validation said required).
                // Let's add a "Team Name" input for Duo as well in the UI first, or just use "Team ${Leader}"
                // actually, I'll update the UI to ask for Team Name in Duo as well. 
                // For now in payload:
                payload.teamName = formData.squadName || `${formData.inGameName}'s Team`;
                payload.teammates.push({ name: formData.partnerName, uid: formData.partnerUid });
            } else if (tournament.format === 'Squad') {
                payload.teamName = formData.squadName;
                if (formData.player2Name) payload.teammates.push({ name: formData.player2Name, uid: formData.player2Uid });
                if (formData.player3Name) payload.teammates.push({ name: formData.player3Name, uid: formData.player3Uid });
                if (formData.player4Name) payload.teammates.push({ name: formData.player4Name, uid: formData.player4Uid });
            }

            const res = await fetch('/api/tournaments/join', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.message || 'Failed to join tournament');
            }

            if (onJoinSuccess) onJoinSuccess();
            onClose();
            router.refresh();

        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 bg-black/60 backdrop-blur-sm">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.9 }}
                        className="relative w-full max-w-lg mx-auto bg-[#0F172A] border border-blue-500/30 rounded-2xl shadow-2xl overflow-hidden"
                    >
                        {/* Header */}
                        <div className="flex items-center justify-between p-6 border-b border-white/10 bg-gradient-to-r from-blue-900/20 to-purple-900/20">
                            <div>
                                <h2 className="text-xl font-bold text-white">Join {tournament.format} Match</h2>
                                <p className="text-sm text-gray-400">Entry Fee: <span className="text-yellow-400 font-semibold">{tournament.entryFee} Coins</span></p>
                            </div>
                            <button onClick={onClose} className="p-2 text-gray-400 hover:text-white bg-white/5 hover:bg-white/10 rounded-full transition-colors">
                                <X size={20} />
                            </button>
                        </div>

                        {/* Form */}
                        <form onSubmit={handleSubmit} className="p-6 max-h-[75vh] sm:max-h-[70vh] overflow-y-auto custom-scrollbar">
                            {error && (
                                <div className="mb-6 p-3 bg-red-500/10 border border-red-500/50 rounded-lg flex items-center gap-2 text-red-200 text-sm">
                                    <AlertCircle size={16} />
                                    {error}
                                </div>
                            )}

                            <div className="space-y-4">
                                {/* Common Fields */}
                                <div>
                                    <label className="block text-xs font-medium text-gray-400 mb-1 uppercase tracking-wider">My Details</label>
                                    <div className="grid grid-cols-2 gap-3">
                                        <div className="relative">
                                            <User className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={16} />
                                            <input
                                                type="text"
                                                name="inGameName"
                                                placeholder="In-Game Name"
                                                required
                                                value={formData.inGameName}
                                                onChange={handleChange}
                                                className="w-full bg-black/40 border border-white/10 rounded-lg pl-10 pr-4 py-2.5 text-white placeholder-gray-600 focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/50 transition-all"
                                            />
                                        </div>
                                        <div className="relative">
                                            <Shield className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={16} />
                                            <input
                                                type="text"
                                                name="uid"
                                                placeholder="Free Fire UID"
                                                required
                                                value={formData.uid}
                                                onChange={handleChange}
                                                className="w-full bg-black/40 border border-white/10 rounded-lg pl-10 pr-4 py-2.5 text-white placeholder-gray-600 focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/50 transition-all"
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* Duo Fields */}
                                {tournament.format === 'Duo' && (
                                    <div className="space-y-3">
                                        <div>
                                            <label className="block text-xs font-medium text-gray-400 mb-1 uppercase tracking-wider">Team Name</label>
                                            <input
                                                type="text"
                                                name="squadName" // Reuse squadName state for simplicity
                                                placeholder="Team Name"
                                                required
                                                value={formData.squadName}
                                                onChange={handleChange}
                                                className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-2.5 text-white placeholder-gray-600 focus:outline-none focus:border-blue-500/50 transition-all"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-medium text-gray-400 mb-1 uppercase tracking-wider">Teammate Details</label>
                                            <div className="grid grid-cols-2 gap-3">
                                                <input
                                                    type="text"
                                                    name="partnerName"
                                                    placeholder="Partner Name"
                                                    required
                                                    value={formData.partnerName}
                                                    onChange={handleChange}
                                                    className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-2.5 text-white placeholder-gray-600 focus:outline-none focus:border-blue-500/50 transition-all"
                                                />
                                                <input
                                                    type="text"
                                                    name="partnerUid"
                                                    placeholder="Partner UID"
                                                    required
                                                    value={formData.partnerUid}
                                                    onChange={handleChange}
                                                    className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-2.5 text-white placeholder-gray-600 focus:outline-none focus:border-blue-500/50 transition-all"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* Squad Fields */}
                                {tournament.format === 'Squad' && (
                                    <div className="space-y-3">
                                        <div className="grid grid-cols-1 gap-3">
                                            <label className="block text-xs font-medium text-gray-400 uppercase tracking-wider">Squad Name</label>
                                            <input
                                                type="text"
                                                name="squadName"
                                                placeholder="Squad Name"
                                                required
                                                value={formData.squadName}
                                                onChange={handleChange}
                                                className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-2.5 text-white placeholder-gray-600 focus:outline-none focus:border-blue-500/50 transition-all"
                                            />
                                        </div>

                                        <label className="block text-xs font-medium text-gray-400 uppercase tracking-wider mt-2">Squad Members</label>
                                        {[2, 3, 4].map((num) => (
                                            <div key={num} className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                                <input
                                                    type="text"
                                                    name={`player${num}Name`}
                                                    placeholder={`Player ${num} Name`}
                                                    required
                                                    // @ts-ignore
                                                    value={formData[`player${num}Name`]}
                                                    onChange={handleChange}
                                                    className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-2.5 text-white placeholder-gray-600 focus:outline-none focus:border-blue-500/50 transition-all"
                                                />
                                                <input
                                                    type="text"
                                                    name={`player${num}Uid`}
                                                    placeholder={`Player ${num} UID`}
                                                    required
                                                    // @ts-ignore
                                                    value={formData[`player${num}Uid`]}
                                                    onChange={handleChange}
                                                    className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-2.5 text-white placeholder-gray-600 focus:outline-none focus:border-blue-500/50 transition-all"
                                                />
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* Footer / Submit */}
                            <div className="mt-8">
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold py-3 px-6 rounded-xl shadow-lg transform transition-all active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                >
                                    {loading ? (
                                        <>
                                            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                            Processing...
                                        </>
                                    ) : (
                                        <>
                                            Confirm & Pay {tournament.entryFee} Coins
                                        </>
                                    )}
                                </button>
                                <p className="text-center text-xs text-gray-500 mt-3">
                                    By joining, you agree to the tournament rules.
                                </p>
                            </div>
                        </form>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}
