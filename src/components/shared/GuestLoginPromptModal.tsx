'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { X, Swords, Trophy, Coins, Zap, Star } from 'lucide-react';
import Link from 'next/link';

interface GuestLoginPromptModalProps {
    isOpen: boolean;
    onClose: () => void;
}

const features = [
    { icon: Trophy, text: 'Join & win real tournaments', color: 'text-yellow-400', bg: 'bg-yellow-400/10' },
    { icon: Swords, text: 'Host Battle Zone matches', color: 'text-rose-400', bg: 'bg-rose-400/10' },
    { icon: Coins, text: 'Earn & withdraw coins', color: 'text-emerald-400', bg: 'bg-emerald-400/10' },
    { icon: Zap, text: 'Top up Free Fire diamonds', color: 'text-blue-400', bg: 'bg-blue-400/10' },
];

export default function GuestLoginPromptModal({ isOpen, onClose }: GuestLoginPromptModalProps) {
    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="absolute inset-0 bg-black/70 backdrop-blur-md"
                        onClick={onClose}
                    />

                    {/* Modal */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.85, y: 30 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.85, y: 20 }}
                        transition={{ type: 'spring', damping: 22, stiffness: 280 }}
                        className="relative w-full max-w-md bg-card border border-border/60 rounded-3xl shadow-2xl overflow-hidden z-10"
                    >
                        {/* Decorative background glows */}
                        <div className="absolute -top-20 -right-20 w-48 h-48 bg-primary/20 rounded-full blur-[60px] pointer-events-none" />
                        <div className="absolute -bottom-20 -left-20 w-48 h-48 bg-blue-500/15 rounded-full blur-[60px] pointer-events-none" />

                        {/* Close Button */}
                        <button
                            onClick={onClose}
                            className="absolute top-4 right-4 z-20 p-2 bg-muted/60 hover:bg-muted rounded-full text-muted-foreground hover:text-foreground transition-all"
                        >
                            <X size={18} />
                        </button>

                        {/* Hero Section */}
                        <div className="relative pt-10 pb-6 px-8 text-center border-b border-border/50">
                            {/* Animated icon stack */}
                            <div className="relative w-24 h-24 mx-auto mb-5">
                                <div className="absolute inset-0 bg-primary/20 rounded-full blur-2xl animate-pulse" />
                                <div className="relative w-24 h-24 rounded-full bg-gradient-to-br from-primary/30 to-primary/5 border-2 border-primary/30 flex items-center justify-center shadow-[0_0_30px_rgba(var(--primary),0.3)]">
                                    <Trophy className="w-11 h-11 text-primary" strokeWidth={1.5} />
                                </div>
                                {/* Floating stars */}
                                <motion.div
                                    animate={{ y: [-4, 4, -4], rotate: [0, 15, 0] }}
                                    transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
                                    className="absolute -top-1 -right-1"
                                >
                                    <Star className="w-5 h-5 text-yellow-400 fill-yellow-400" />
                                </motion.div>
                                <motion.div
                                    animate={{ y: [4, -4, 4], rotate: [0, -15, 0] }}
                                    transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut', delay: 0.5 }}
                                    className="absolute -bottom-1 -left-1"
                                >
                                    <Star className="w-4 h-4 text-primary fill-primary" />
                                </motion.div>
                            </div>

                            <h2 className="text-2xl font-black text-foreground tracking-tight leading-tight mb-2">
                                Ready to Join the<br />
                                <span className="text-primary">Action?</span>
                            </h2>
                            <p className="text-sm text-muted-foreground leading-relaxed max-w-xs mx-auto">
                                Create a free <span className="text-foreground font-bold">Guru Zone</span> account to join tournaments, host matches, and earn real rewards.
                            </p>
                        </div>

                        {/* Features List */}
                        <div className="px-8 py-5 space-y-3">
                            {features.map(({ icon: Icon, text, color, bg }, i) => (
                                <motion.div
                                    key={i}
                                    initial={{ opacity: 0, x: -16 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: 0.1 + i * 0.07 }}
                                    className="flex items-center gap-3"
                                >
                                    <div className={`p-2 rounded-xl ${bg} shrink-0`}>
                                        <Icon className={`w-4 h-4 ${color}`} />
                                    </div>
                                    <span className="text-sm font-semibold text-foreground/90">{text}</span>
                                </motion.div>
                            ))}
                        </div>

                        {/* CTA Buttons */}
                        <div className="px-8 pb-8 pt-2 space-y-3">
                            <Link
                                href="/auth/signin"
                                onClick={onClose}
                                className="flex items-center justify-center gap-2 w-full bg-primary hover:bg-primary/90 text-primary-foreground font-black py-4 rounded-2xl text-base shadow-[0_8px_30px_rgba(var(--primary),0.35)] hover:shadow-[0_12px_40px_rgba(var(--primary),0.45)] transition-all active:scale-[0.98] group"
                            >
                                <Zap className="w-5 h-5 group-hover:animate-pulse" />
                                Sign Up / Log In — It's Free
                            </Link>

                            <button
                                onClick={onClose}
                                className="w-full py-3 text-sm font-semibold text-muted-foreground hover:text-foreground transition-colors"
                            >
                                Continue Browsing as Guest
                            </button>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}
