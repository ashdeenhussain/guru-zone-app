import { X, ShieldAlert, PlusCircle, MinusCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useState } from 'react';

interface TrustScoreInfoModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export default function TrustScoreInfoModal({ isOpen, onClose }: TrustScoreInfoModalProps) {
    const [activeTab, setActiveTab] = useState<'increase' | 'decrease'>('increase');

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                    />

                    {/* Modal Content */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 20 }}
                        className="relative w-full max-w-md bg-card/95 backdrop-blur-xl border border-border/50 rounded-2xl shadow-2xl overflow-hidden"
                    >
                        {/* Header */}
                        <div className="flex items-center justify-between p-4 border-b border-border/50 bg-muted/20">
                            <h2 className="text-lg font-black tracking-tight text-foreground">
                                Understanding Your Trust Score
                            </h2>
                            <button
                                onClick={onClose}
                                className="p-1.5 text-muted-foreground hover:text-foreground hover:bg-muted rounded-full transition-colors"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        {/* Critical Warning */}
                        <div className="p-4 bg-red-500/10 border-b border-red-500/20">
                            <div className="flex items-start gap-3">
                                <ShieldAlert className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
                                <p className="text-sm font-medium text-red-500/90 leading-relaxed">
                                    <strong className="text-red-500">⚠️ If your score drops below 80</strong>, you will be banned from creating tournaments and can only join existing ones.
                                </p>
                            </div>
                        </div>

                        {/* Interactive Section */}
                        <div className="p-4">
                            {/* Tabs / Toggle Buttons */}
                            <div className="flex bg-muted/50 p-1 rounded-xl border border-border/50 mb-4">
                                <button
                                    onClick={() => setActiveTab('increase')}
                                    className={`flex-1 flex items-center justify-center gap-2 py-2 text-xs font-bold rounded-lg transition-all ${
                                        activeTab === 'increase'
                                            ? 'bg-green-500/20 text-green-500 shadow-sm border border-green-500/20'
                                            : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                                    }`}
                                >
                                    <PlusCircle size={14} />
                                    How to Increase
                                </button>
                                <button
                                    onClick={() => setActiveTab('decrease')}
                                    className={`flex-1 flex items-center justify-center gap-2 py-2 text-xs font-bold rounded-lg transition-all ${
                                        activeTab === 'decrease'
                                            ? 'bg-red-500/20 text-red-500 shadow-sm border border-red-500/20'
                                            : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                                    }`}
                                >
                                    <MinusCircle size={14} />
                                    How it Decreases
                                </button>
                            </div>

                            {/* Content based on Tab */}
                            <div className="min-h-[80px] flex items-center justify-center text-center p-4 bg-muted/20 rounded-xl border border-border/30">
                                <AnimatePresence mode="wait">
                                    {activeTab === 'increase' ? (
                                        <motion.div
                                            key="increase"
                                            initial={{ opacity: 0, y: 5 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0, y: -5 }}
                                            transition={{ duration: 0.2 }}
                                            className="text-sm font-medium text-foreground leading-relaxed"
                                        >
                                            Play fair matches <strong className="text-green-500">(+2 points)</strong><br />
                                            Win a disputed match <strong className="text-green-500">(+5 points)</strong>.
                                        </motion.div>
                                    ) : (
                                        <motion.div
                                            key="decrease"
                                            initial={{ opacity: 0, y: 5 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0, y: -5 }}
                                            transition={{ duration: 0.2 }}
                                            className="text-sm font-medium text-foreground leading-relaxed"
                                        >
                                            Upload fake screenshots / Lose a dispute <strong className="text-red-500">(-15 points)</strong><br />
                                            No response in 30 mins <strong className="text-red-500">(-10 points)</strong>.
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}
