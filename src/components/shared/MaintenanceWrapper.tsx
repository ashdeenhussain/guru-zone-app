import { Lock, Info, X } from "lucide-react";
import React, { useState } from 'react';
import { motion, AnimatePresence } from "framer-motion";

interface MaintenanceWrapperProps {
    children: React.ReactNode;
    isActive: boolean;
    title?: string;
    description?: string;
    improvementDetails?: string[];
}

export default function MaintenanceWrapper({ 
    children, 
    isActive, 
    title = "Coming Soon", 
    description = "This feature is currently under maintenance or being improved. We'll be live shortly!",
    improvementDetails = [
        "UI/UX Enhancements for better navigation",
        "Performance optimizations for real-time updates",
        "Advanced match verification protocols",
        "Anti-cheat & Fair Play systems integration"
    ]
}: MaintenanceWrapperProps) {
    const [showInfo, setShowInfo] = useState(false);

    if (!isActive) {
        return <>{children}</>;
    }

    return (
        <div className="relative w-full h-full min-h-[500px]">
            {/* Blurred Content */}
            <div className="filter blur-xl pointer-events-none select-none opacity-30 transition-all duration-700">
                {children}
            </div>

            {/* Overlay */}
            <div className="absolute inset-0 z-50 flex flex-col items-center justify-center p-6 text-center">
                <div className="bg-background/90 backdrop-blur-2xl border border-border p-8 rounded-[2.5rem] shadow-2xl max-w-md w-full animate-in fade-in zoom-in duration-500 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity">
                        <Lock className="w-32 h-32 rotate-12" />
                    </div>

                    <div className="w-20 h-20 bg-primary/10 text-primary rounded-[2rem] flex items-center justify-center mx-auto mb-6 border border-primary/20 shadow-inner group-hover:scale-110 transition-transform duration-500">
                        <Lock size={40} className="drop-shadow-[0_0_15px_rgba(255,215,0,0.5)]" />
                    </div>
                    
                    <h2 className="text-3xl font-black mb-3 text-foreground tracking-tight">{title}</h2>
                    <p className="text-muted-foreground font-medium text-sm leading-relaxed mb-8">
                        {description}
                    </p>

                    <div className="flex flex-col gap-3">
                        <button 
                            onClick={() => setShowInfo(true)}
                            className="bg-primary hover:bg-primary/90 text-primary-foreground font-black py-4 px-8 rounded-2xl transition-all shadow-xl shadow-primary/25 flex items-center justify-center gap-2 active:scale-95 translate-y-0 hover:-translate-y-1"
                        >
                            <Info size={20} />
                            Improvement Details
                        </button>
                        
                        <div className="mt-2 text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/50">
                            Stay Tuned for the Update
                        </div>
                    </div>
                </div>
            </div>

            {/* Info Modal Overlay */}
            <AnimatePresence>
                {showInfo && (
                    <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-background/40 backdrop-blur-md"
                        onClick={() => setShowInfo(false)}
                    >
                        <motion.div 
                            initial={{ scale: 0.9, y: 20 }}
                            animate={{ scale: 1, y: 0 }}
                            exit={{ scale: 0.9, y: 20 }}
                            className="bg-card/95 backdrop-blur-xl border border-border p-8 rounded-[2rem] shadow-3xl max-w-sm w-full relative"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <button 
                                onClick={() => setShowInfo(false)}
                                className="absolute top-6 right-6 p-2 bg-muted hover:bg-muted-foreground/10 rounded-full text-muted-foreground transition-colors"
                            >
                                <X size={20} />
                            </button>

                            <div className="flex items-center gap-3 mb-6">
                                <div className="p-3 bg-primary/10 text-primary rounded-xl">
                                    <Info size={24} />
                                </div>
                                <h3 className="text-xl font-black text-foreground">What's New?</h3>
                            </div>

                            <ul className="space-y-4">
                                {improvementDetails.map((detail, idx) => (
                                    <li key={idx} className="flex items-start gap-3">
                                        <div className="mt-1.5 w-1.5 h-1.5 rounded-full bg-primary shrink-0 shadow-[0_0_8px_rgba(255,215,0,1)]" />
                                        <span className="text-sm font-medium text-muted-foreground leading-snug">{detail}</span>
                                    </li>
                                ))}
                            </ul>

                            <button 
                                onClick={() => setShowInfo(false)}
                                className="w-full mt-8 bg-muted hover:bg-muted-foreground/10 text-foreground font-bold py-3 rounded-xl transition-all"
                            >
                                Close Details
                            </button>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
