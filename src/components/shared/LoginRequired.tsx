'use client';

import React from 'react';
import Link from 'next/link';
import { Lock, LogIn, UserPlus } from 'lucide-react';
import { motion } from 'framer-motion';

interface LoginRequiredProps {
    title?: string;
    description?: string;
}

export default function LoginRequired({
    title = 'Login Required',
    description = 'To access this feature, please log in to your account or register a new one.',
}: LoginRequiredProps) {
    return (
        <div className="flex items-center justify-center p-4 min-h-[60vh] max-w-md mx-auto w-full">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4 }}
                className="w-full glass-card border border-border/80 p-8 rounded-3xl text-center shadow-xl relative overflow-hidden group"
            >
                {/* Decorative glow */}
                <div className="absolute -top-10 -left-10 w-40 h-40 bg-primary/10 blur-[80px] rounded-full pointer-events-none group-hover:bg-primary/20 transition-colors duration-500" />
                <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-blue-500/10 blur-[80px] rounded-full pointer-events-none group-hover:bg-blue-500/20 transition-colors duration-500" />

                {/* Animated Lock Icon */}
                <div className="relative z-10 w-20 h-20 bg-primary/10 text-primary border border-primary/20 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-[0_0_20px_rgba(255,215,0,0.15)]">
                    <Lock size={36} className="animate-pulse" />
                </div>

                <h2 className="relative z-10 text-2xl font-black text-foreground mb-3 tracking-tight">
                    {title}
                </h2>
                <p className="relative z-10 text-muted-foreground text-sm mb-8 leading-relaxed">
                    {description}
                </p>

                {/* Action Buttons */}
                <div className="relative z-10 flex flex-col sm:flex-row items-center gap-3">
                    <Link
                        href="/login"
                        className="w-full sm:flex-1 inline-flex items-center justify-center gap-2 bg-primary hover:brightness-110 text-primary-foreground py-3.5 px-6 rounded-2xl font-bold transition-all shadow-lg shadow-primary/20 active:scale-95 text-sm"
                    >
                        <LogIn size={16} />
                        Sign In
                    </Link>
                    <Link
                        href="/signup"
                        className="w-full sm:flex-1 inline-flex items-center justify-center gap-2 bg-card hover:bg-muted border border-border text-foreground py-3.5 px-6 rounded-2xl font-bold transition-all active:scale-95 text-sm"
                    >
                        <UserPlus size={16} />
                        Sign Up
                    </Link>
                </div>
            </motion.div>
        </div>
    );
}
