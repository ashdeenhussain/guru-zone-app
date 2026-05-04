'use client';

import { Shield, Info, Coins } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useState } from 'react';

interface TrustScoreBadgeProps {
    score: number;
    balance?: number;
}

export default function TrustScoreBadge({ score, balance }: TrustScoreBadgeProps) {
    const [showTooltip, setShowTooltip] = useState(false);

    // Badging Logic
    const getBadgeStyle = () => {
        if (score >= 90) {
            return {
                bg: 'bg-emerald-500/10',
                text: 'text-emerald-500',
                border: 'border-emerald-500/20',
                shadow: 'shadow-[0_0_15px_rgba(16,185,129,0.1)]',
                label: 'Excellent',
                dot: 'bg-emerald-500'
            };
        } else if (score >= 80) {
            return {
                bg: 'bg-amber-500/10',
                text: 'text-amber-500',
                border: 'border-amber-500/20',
                shadow: 'shadow-[0_0_15px_rgba(245,158,11,0.1)]',
                label: 'Warning',
                dot: 'bg-amber-500'
            };
        } else {
            return {
                bg: 'bg-rose-500/10',
                text: 'text-rose-500',
                border: 'border-rose-500/20',
                shadow: 'shadow-[0_0_15px_rgba(244,63,94,0.1)]',
                label: 'Restricted',
                dot: 'bg-rose-500'
            };
        }
    };

    const style = getBadgeStyle();

    return (
        <div className="flex items-center gap-2 p-1 bg-muted/30 rounded-full border border-border/50 shadow-inner">
            {/* Wallet Balance Pill */}
            {balance !== undefined && (
                <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 bg-muted/40 rounded-full border border-border/50 shadow-sm">
                    <div className="p-1 bg-yellow-500/10 rounded-full">
                        <Coins className="w-3.5 h-3.5 text-yellow-500" />
                    </div>
                    <span className="text-[11px] font-black text-foreground">
                        {balance.toLocaleString()}
                    </span>
                    <span className="text-[9px] font-bold text-muted-foreground uppercase opacity-70">
                        Coins
                    </span>
                </div>
            )}

            {/* Trust Score Pill */}
            <div className="relative">
                <motion.div
                    onHoverStart={() => setShowTooltip(true)}
                    onHoverEnd={() => setShowTooltip(false)}
                    onClick={() => setShowTooltip(!showTooltip)}
                    className={`
                        flex items-center gap-2 px-3 py-1.5 rounded-full border cursor-help transition-all duration-300
                        ${style.bg} ${style.text} ${style.border} ${style.shadow}
                        hover:brightness-125 active:scale-95
                    `}
                >
                    <div className="relative">
                        <Shield className="w-3.5 h-3.5" />
                        <motion.div 
                            animate={{ scale: [1, 1.2, 1] }}
                            transition={{ repeat: Infinity, duration: 2 }}
                            className={`absolute -top-0.5 -right-0.5 w-1.5 h-1.5 rounded-full border border-background ${style.dot}`} 
                        />
                    </div>
                    
                    <div className="flex flex-col leading-none">
                        <span className="text-[11px] font-black tracking-tight">{score}% Trust</span>
                        <span className="text-[8px] font-bold uppercase opacity-80">{style.label}</span>
                    </div>

                    <Info className="w-3 h-3 opacity-40 ml-1" />
                </motion.div>

                {/* Tooltip */}
                <AnimatePresence>
                    {showTooltip && (
                        <motion.div
                            initial={{ opacity: 0, y: 10, scale: 0.95 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: 10, scale: 0.95 }}
                            className="absolute right-0 top-full mt-3 w-64 z-[100]"
                        >
                            <div className="bg-card/95 backdrop-blur-xl p-4 rounded-2xl border border-border shadow-2xl overflow-hidden relative">
                                {/* Decor */}
                                <div className={`absolute -top-10 -right-10 w-24 h-24 blur-[40px] opacity-20 rounded-full ${style.dot}`} />
                                
                                <div className="relative z-10 space-y-3">
                                    <h4 className="flex items-center gap-2 font-bold text-sm text-foreground">
                                        <div className={`p-1 rounded-md ${style.bg} ${style.text}`}>
                                            <Shield className="w-3.5 h-3.5" />
                                        </div>
                                        Community Trust
                                    </h4>
                                    
                                    <p className="text-[11px] text-muted-foreground leading-relaxed">
                                        Maintain <strong className="text-foreground">80%+</strong> Score to host matches. Cheating or ghosting will severely drop your standing.
                                    </p>

                                    <div className="grid grid-cols-2 gap-2 pt-1 border-t border-border/50 mt-2">
                                        <div className="flex flex-col p-2 bg-emerald-500/5 rounded-xl border border-emerald-500/10">
                                            <span className="text-[9px] text-emerald-500 font-bold uppercase">Fair Play</span>
                                            <span className="text-xs font-black text-foreground">+2 Score</span>
                                        </div>
                                        <div className="flex flex-col p-2 bg-rose-500/5 rounded-xl border border-rose-500/10">
                                            <span className="text-[9px] text-rose-500 font-bold uppercase">Cheating</span>
                                            <span className="text-xs font-black text-foreground">-10 Score</span>
                                        </div>
                                    </div>
                                    
                                    <div className="text-[9px] text-muted-foreground pt-1 flex items-center gap-1 opacity-60 italic">
                                        <Info className="w-2.5 h-2.5" />
                                        Updated after every match
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
}
