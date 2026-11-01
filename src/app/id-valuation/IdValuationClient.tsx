"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ValuationAnswers, ValuationResult, calculateIdValuation } from "@/lib/valuation";
import ValuationWizard from "@/components/valuation/ValuationWizard";
import ValuationResultView from "@/components/valuation/ValuationResultView";
import ValuationFAQ from "@/components/valuation/ValuationFAQ";
import ThemeToggle from "@/components/ThemeToggle";
import Image from "next/image";
import Link from "next/link";
import {
    Sparkles,
    Flame,
    Shield,
    TrendingUp,
    CheckCircle2,
    Users,
    Gem,
    ArrowLeft,
    Clock,
    Lock
} from "lucide-react";

export default function IdValuationClient() {
    const [answers, setAnswers] = useState<ValuationAnswers | null>(null);
    const [result, setResult] = useState<ValuationResult | null>(null);
    const [isCalculating, setIsCalculating] = useState(false);

    const handleComplete = (completedAnswers: ValuationAnswers) => {
        setAnswers(completedAnswers);
        setIsCalculating(true);

        // Dramatic brief loading animation for gamer delight
        setTimeout(() => {
            const calculated = calculateIdValuation(completedAnswers);
            setResult(calculated);
            setIsCalculating(false);
            window.scrollTo({ top: 0, behavior: "smooth" });
        }, 800);
    };

    const handleReset = () => {
        setResult(null);
    };

    return (
        <main className="min-h-screen relative overflow-hidden bg-background text-foreground selection:bg-primary/30 font-sans pb-24 pt-24 px-4 sm:px-6 lg:px-8">
            {/* Background elements */}
            <div className="absolute inset-0 z-0 select-none fixed pointer-events-none">
                <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-primary/5 rounded-full blur-3xl" />
                <div className="absolute bottom-1/3 right-1/4 w-[400px] h-[400px] bg-amber-500/5 rounded-full blur-3xl" />
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/10 via-transparent to-transparent opacity-30" />
            </div>

            {/* Fixed Theme Toggle (Bottom Right) */}
            <div className="fixed bottom-6 right-6 z-50 shadow-2xl rounded-xl">
                <ThemeToggle />
            </div>

            <div className="max-w-5xl mx-auto relative z-10">
                {/* Back to Home / Navigation */}
                <div className="flex items-center justify-between mb-8">
                    <Link
                        href="/"
                        className="inline-flex items-center gap-2 text-xs md:text-sm font-bold text-muted-foreground hover:text-primary transition-colors bg-card/80 px-3 py-1.5 rounded-xl border border-border/60"
                    >
                        <ArrowLeft size={16} />
                        <span>Back to Home</span>
                    </Link>

                    <div className="flex items-center gap-2 text-xs text-muted-foreground font-semibold">
                        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                        <span>Live Valuation Engine Active</span>
                    </div>
                </div>

                {/* Main Hero Header */}
                {!result && !isCalculating && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-center max-w-3xl mx-auto mb-10 space-y-4"
                    >
                        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-primary text-xs md:text-sm font-black uppercase tracking-wider shadow-sm">
                            <Flame className="w-4 h-4 text-orange-500 fill-current animate-pulse" />
                            <span>Free Fire ID Market Price Estimator</span>
                        </div>

                        <h1 className="text-3xl sm:text-4xl md:text-5xl font-black text-foreground tracking-tight leading-tight">
                            How Much is Your <span className="text-primary">Free Fire ID</span> Worth?
                        </h1>

                        <p className="text-sm md:text-base text-muted-foreground leading-relaxed max-w-2xl mx-auto">
                            Answer 8 quick interactive questions about your Evo Guns, rare outfits, and player stats to get an instant market valuation in Pakistan Rupees (PKR). <strong>100% Free & No Login Required.</strong>
                        </p>

                        {/* Feature trust tags */}
                        <div className="pt-2 flex flex-wrap items-center justify-center gap-4 text-xs font-semibold text-muted-foreground">
                            <span className="flex items-center gap-1.5 text-foreground/90">
                                <CheckCircle2 size={15} className="text-primary" /> Live 2026 PK Market Rates
                            </span>
                            <span>•</span>
                            <span className="flex items-center gap-1.5 text-foreground/90">
                                <Clock size={15} className="text-primary" /> Takes 45 Seconds
                            </span>
                            <span>•</span>
                            <span className="flex items-center gap-1.5 text-foreground/90">
                                <Lock size={15} className="text-primary" /> No Password / Account Needed
                            </span>
                        </div>
                    </motion.div>
                )}

                {/* Loading State Animation */}
                {isCalculating && (
                    <div className="min-h-[400px] flex flex-col items-center justify-center space-y-6 text-center">
                        <div className="relative w-20 h-20 flex items-center justify-center">
                            <div className="absolute inset-0 rounded-full border-4 border-primary/20 border-t-primary animate-spin" />
                            <Sparkles className="w-8 h-8 text-primary animate-pulse" />
                        </div>
                        <div>
                            <h3 className="text-xl font-black text-foreground mb-1">
                                Calculating Free Fire ID Market Value...
                            </h3>
                            <p className="text-xs md:text-sm text-muted-foreground">
                                Analyzing Evo Gun levels, vintage badges, and live buyer demand in Pakistan.
                            </p>
                        </div>
                    </div>
                )}

                {/* Content Area: Wizard OR Result */}
                {!isCalculating && (
                    <>
                        {result ? (
                            <ValuationResultView
                                result={result}
                                answers={answers!}
                                onReset={handleReset}
                            />
                        ) : (
                            <ValuationWizard
                                onComplete={handleComplete}
                                initialAnswers={answers || undefined}
                            />
                        )}
                    </>
                )}

                {/* SEO and Educational FAQ Section */}
                <ValuationFAQ />
            </div>
        </main>
    );
}
