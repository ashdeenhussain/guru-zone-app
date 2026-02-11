"use client";

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, CheckCircle, AlertCircle, Plus, Minus, Loader2 } from 'lucide-react';

interface WalletAdjustmentModalProps {
    isOpen: boolean;
    onClose: () => void;
    userId: string;
    userName: string;
    onSuccess: () => void;
}

export default function WalletAdjustmentModal({ isOpen, onClose, userId, userName, onSuccess }: WalletAdjustmentModalProps) {
    const [amount, setAmount] = useState('');
    const [reason, setReason] = useState('');
    const [type, setType] = useState<'CREDIT' | 'DEBIT'>('CREDIT');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [successMsg, setSuccessMsg] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setSuccessMsg('');
        setIsLoading(true);

        try {
            const res = await fetch('/api/admin/wallet/adjust', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    userId,
                    amount: Number(amount),
                    type,
                    reason
                })
            });

            const data = await res.json();

            if (res.ok) {
                setSuccessMsg(`Successfully ${type === 'CREDIT' ? 'credited' : 'deducted'} ${amount} coins.`);
                setTimeout(() => {
                    onSuccess();
                    onClose();
                    // Reset form
                    setAmount('');
                    setReason('');
                    setSuccessMsg('');
                }, 1500);
            } else {
                setError(data.error || 'Failed to adjust wallet');
            }
        } catch (err) {
            setError('Something went wrong. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
                    />
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 20 }}
                        className="fixed inset-0 m-auto max-w-md h-fit p-6 bg-card border border-border rounded-2xl z-50 shadow-2xl"
                    >
                        <div className="flex justify-between items-center mb-6">
                            <div>
                                <h2 className="text-lg font-bold text-foreground">Adjust Wallet Balance</h2>
                                <p className="text-xs text-muted-foreground">For user: <span className="font-semibold text-primary">{userName}</span></p>
                            </div>
                            <button onClick={onClose} className="text-muted-foreground hover:text-foreground transition-colors">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {error && (
                            <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg flex items-center gap-2 text-red-500 text-sm">
                                <AlertCircle className="w-4 h-4 shrink-0" />
                                {error}
                            </div>
                        )}

                        {successMsg && (
                            <div className="mb-4 p-3 bg-green-500/10 border border-green-500/20 rounded-lg flex items-center gap-2 text-green-500 text-sm">
                                <CheckCircle className="w-4 h-4 shrink-0" />
                                {successMsg}
                            </div>
                        )}

                        <form onSubmit={handleSubmit} className="space-y-4">

                            {/* Type Selection */}
                            <div className="grid grid-cols-2 gap-3">
                                <button
                                    type="button"
                                    onClick={() => setType('CREDIT')}
                                    className={`p-3 rounded-xl border flex flex-col items-center gap-2 transition-all ${type === 'CREDIT'
                                            ? 'bg-green-500/10 border-green-500 text-green-500 shadow-sm'
                                            : 'bg-muted/50 border-input text-muted-foreground hover:bg-muted'
                                        }`}
                                >
                                    <Plus className="w-5 h-5" />
                                    <span className="text-sm font-bold">Add Funds</span>
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setType('DEBIT')}
                                    className={`p-3 rounded-xl border flex flex-col items-center gap-2 transition-all ${type === 'DEBIT'
                                            ? 'bg-red-500/10 border-red-500 text-red-500 shadow-sm'
                                            : 'bg-muted/50 border-input text-muted-foreground hover:bg-muted'
                                        }`}
                                >
                                    <Minus className="w-5 h-5" />
                                    <span className="text-sm font-bold">Deduct Funds</span>
                                </button>
                            </div>

                            {/* Amount Input */}
                            <div>
                                <label className="block text-xs font-medium text-muted-foreground mb-1">Amount (Coins)</label>
                                <div className="relative">
                                    <input
                                        type="number"
                                        required
                                        min="1"
                                        value={amount}
                                        onChange={(e) => setAmount(e.target.value)}
                                        className="w-full bg-background border border-input rounded-xl px-4 py-3 text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 font-mono font-bold"
                                        placeholder="0.00"
                                    />
                                </div>
                            </div>

                            {/* Reason Input */}
                            <div>
                                <label className="block text-xs font-medium text-muted-foreground mb-1">Reason (Required)</label>
                                <textarea
                                    required
                                    rows={3}
                                    value={reason}
                                    onChange={(e) => setReason(e.target.value)}
                                    className="w-full bg-background border border-input rounded-xl px-4 py-3 text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 text-sm"
                                    placeholder="e.g., Bonus for tournament win, Correction of error..."
                                ></textarea>
                            </div>

                            <button
                                type="submit"
                                disabled={isLoading || successMsg !== ''}
                                className="w-full py-3 rounded-xl bg-primary text-primary-foreground font-bold hover:bg-primary/90 transition-all disabled:opacity-70 disabled:cursor-not-allowed flex justify-center items-center gap-2 mt-2"
                            >
                                {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Confirm Adjustment'}
                            </button>
                        </form>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}
