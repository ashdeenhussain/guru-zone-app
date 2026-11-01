"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { ValuationResult, ValuationAnswers } from "@/lib/valuation";
import Link from "next/link";
import {
    Trophy,
    Share2,
    RotateCcw,
    Sparkles,
    CheckCircle2,
    ShieldCheck,
    ArrowUpRight,
    Flame,
    Copy,
    Gem,
    MessageCircle,
    Swords,
    ChevronRight,
    TrendingUp,
    Lock
} from "lucide-react";
import { toast } from "sonner";

interface ValuationResultViewProps {
    result: ValuationResult;
    answers: ValuationAnswers;
    onReset: () => void;
}

export default function ValuationResultView({ result, answers, onReset }: ValuationResultViewProps) {
    const [displayMin, setDisplayMin] = useState(0);
    const [displayMax, setDisplayMax] = useState(0);

    // Animated counter effect on mount
    useEffect(() => {
        const duration = 1200; // ms
        const steps = 30;
        const stepTime = duration / steps;
        let currentStep = 0;

        const timer = setInterval(() => {
            currentStep++;
            const progress = currentStep / steps;
            // Ease out cubic
            const easeProgress = 1 - Math.pow(1 - progress, 3);

            setDisplayMin(Math.round(result.minPrice * easeProgress));
            setDisplayMax(Math.round(result.maxPrice * easeProgress));

            if (currentStep >= steps) {
                setDisplayMin(result.minPrice);
                setDisplayMax(result.maxPrice);
                clearInterval(timer);
            }
        }, stepTime);

        return () => clearInterval(timer);
    }, [result.minPrice, result.maxPrice]);

    const formatPKR = (num: number) => {
        return num.toLocaleString("en-PK");
    };

    // Format pre-filled WhatsApp message
    const getWhatsAppUrl = () => {
        const text = `Hi Guru Zone Team! 🎮\n\nI just checked my Free Fire ID Valuation on your site:\n🏆 Quality Tier: ${result.tierTitle}\n💰 Estimated Market Value: Rs. ${formatPKR(result.minPrice)} - Rs. ${formatPKR(result.maxPrice)} PKR\n✨ Key Highlights: ${result.highlights.slice(0, 3).join(", ")}\n\nI would like to verify and sell my ID safely with a middleman!`;
        return `https://wa.me/923000000000?text=${encodeURIComponent(text)}`;
    };

    const handleCopyResult = () => {
        const text = `🔥 Free Fire ID Valuation Result (Guru Zone):\n🏆 Tier: ${result.tierTitle}\n💰 Estimated Market Price: Rs. ${formatPKR(result.minPrice)} - Rs. ${formatPKR(result.maxPrice)} PKR\n💎 Estimated In-Game Investment: ~${formatPKR(result.estimatedDiamondsSpent)} Diamonds\n\nCheck yours at: https://www.guru-zone.com/id-valuation`;
        navigator.clipboard.writeText(text);
        toast.success("Valuation summary copied to clipboard!");
    };

    // Calculate maximum breakdown item for relative bar sizing
    const totalBreakdown =
        result.breakdown.levelAndAge +
        result.breakdown.evoGuns +
        result.breakdown.rareBundles +
        result.breakdown.collectionsAndEmotes +
        result.breakdown.rankAndReputation || 1;

    return (
        <div className="w-full max-w-4xl mx-auto space-y-6">
            {/* Top Celebration Banner */}
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5 }}
                className="relative overflow-hidden rounded-3xl bg-gradient-to-b from-card via-card to-card/90 border border-primary/40 shadow-2xl p-6 md:p-10 text-center"
            >
                {/* Ambient dynamic glow */}
                <div className="absolute -top-32 left-1/2 -translate-x-1/2 w-96 h-96 bg-gradient-to-b from-primary/20 via-amber-500/10 to-transparent rounded-full blur-3xl pointer-events-none" />
                
                {/* Account Tier Badge */}
                <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 border border-primary/30 text-primary text-xs md:text-sm font-black uppercase tracking-wider mb-4 shadow-sm">
                    <Sparkles className="w-4 h-4 text-yellow-400 animate-spin-slow" />
                    <span>{result.tierBadge}</span>
                </div>

                <h1 className="text-2xl md:text-4xl font-black text-foreground mb-2 tracking-tight">
                    Estimated Market Value
                </h1>
                <p className="text-xs md:text-sm text-muted-foreground max-w-lg mx-auto mb-6">
                    Based on verified live market trends, buyer demand, and recent Free Fire ID sales in Pakistan.
                </p>

                {/* Big Price Counter Card */}
                <div className="my-6 p-6 md:p-8 rounded-3xl bg-gradient-to-r from-amber-500/10 via-yellow-500/15 to-amber-500/10 border-2 border-primary/50 shadow-[0_0_40px_rgba(255,215,0,0.15)] relative">
                    <div className="text-xs uppercase font-bold tracking-widest text-primary/90 mb-1">
                        Verified Fair Market Range (PKR)
                    </div>
                    <div className="text-3xl sm:text-5xl md:text-6xl font-black tracking-tight text-foreground flex items-center justify-center gap-2 flex-wrap drop-shadow-md">
                        <span className="text-primary">Rs. {formatPKR(displayMin)}</span>
                        <span className="text-muted-foreground text-2xl md:text-4xl font-light">to</span>
                        <span className="text-primary">Rs. {formatPKR(displayMax)}</span>
                    </div>

                    <div className="mt-3 flex items-center justify-center gap-4 text-xs font-semibold text-muted-foreground">
                        <span className="flex items-center gap-1 text-emerald-400">
                            <CheckCircle2 size={14} /> {result.confidenceScore}% Confidence Score
                        </span>
                        <span>•</span>
                        <span className="flex items-center gap-1 text-amber-400">
                            <Gem size={14} /> ~{formatPKR(result.estimatedDiamondsSpent)} 💎 Total Spend
                        </span>
                    </div>
                </div>

                {/* Highlight Summary Pills */}
                <div className="flex flex-wrap items-center justify-center gap-2 max-w-2xl mx-auto my-6">
                    {result.highlights.map((highlight, idx) => (
                        <span
                            key={idx}
                            className="px-3 py-1 rounded-xl bg-card border border-border/80 text-xs font-semibold text-foreground/90 shadow-sm"
                        >
                            {highlight}
                        </span>
                    ))}
                </div>

                {/* Explanation text */}
                <p className="text-xs md:text-sm text-muted-foreground/90 leading-relaxed max-w-2xl mx-auto bg-card/60 p-4 rounded-2xl border border-border/50">
                    💡 <strong className="text-foreground">Valuation Insight:</strong> {result.summaryText}
                </p>

                {/* Quick Share & Recalculate Toolbar */}
                <div className="mt-6 pt-6 border-t border-border/60 flex flex-wrap items-center justify-center gap-3">
                    <button
                        type="button"
                        onClick={handleCopyResult}
                        className="px-4 py-2 rounded-xl bg-muted/80 hover:bg-muted text-foreground text-xs font-bold transition-all flex items-center gap-1.5 border border-border"
                    >
                        <Copy size={14} />
                        <span>Copy Valuation Card</span>
                    </button>
                    <button
                        type="button"
                        onClick={onReset}
                        className="px-4 py-2 rounded-xl bg-muted/80 hover:bg-muted text-foreground text-xs font-bold transition-all flex items-center gap-1.5 border border-border"
                    >
                        <RotateCcw size={14} />
                        <span>Modify Answers / Re-calculate</span>
                    </button>
                </div>
            </motion.div>

            {/* Value Breakdown & Analysis Section */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Breakdown Progress Bars */}
                <div className="p-6 rounded-3xl bg-card border border-border shadow-lg space-y-4">
                    <div className="flex items-center justify-between mb-2">
                        <h3 className="font-black text-lg text-foreground flex items-center gap-2">
                            <TrendingUp className="w-5 h-5 text-primary" />
                            Value Breakdown Analysis
                        </h3>
                        <span className="text-xs text-muted-foreground font-mono">Weighted PKR</span>
                    </div>

                    <div className="space-y-3.5">
                        {[
                            {
                                label: "Level & Vintage Age",
                                value: result.breakdown.levelAndAge,
                                color: "from-amber-500 to-yellow-400",
                                icon: "⭐",
                            },
                            {
                                label: "Evo Guns Arsenal",
                                value: result.breakdown.evoGuns,
                                color: "from-red-500 to-orange-400",
                                icon: "⚡",
                            },
                            {
                                label: "Rare Bundles & Outfits",
                                value: result.breakdown.rareBundles,
                                color: "from-purple-500 to-pink-400",
                                icon: "👑",
                            },
                            {
                                label: "Gloo Walls & Rare Emotes",
                                value: result.breakdown.collectionsAndEmotes,
                                color: "from-emerald-500 to-teal-400",
                                icon: "🛡️",
                            },
                            {
                                label: "Rank, Likes & Server",
                                value: result.breakdown.rankAndReputation,
                                color: "from-blue-500 to-indigo-400",
                                icon: "🏆",
                            },
                        ].map((item, idx) => {
                            const percent = Math.min(100, Math.round((item.value / totalBreakdown) * 100));
                            return (
                                <div key={idx} className="space-y-1.5">
                                    <div className="flex items-center justify-between text-xs font-bold">
                                        <span className="text-foreground flex items-center gap-1.5">
                                            <span>{item.icon}</span>
                                            <span>{item.label}</span>
                                        </span>
                                        <span className="text-primary font-mono">Rs. {formatPKR(item.value)}</span>
                                    </div>
                                    <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                                        <motion.div
                                            className={`h-full bg-gradient-to-r ${item.color} rounded-full`}
                                            initial={{ width: 0 }}
                                            animate={{ width: `${percent}%` }}
                                            transition={{ duration: 0.6, delay: idx * 0.1 }}
                                        />
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Market Reality Card */}
                <div className="p-6 rounded-3xl bg-card border border-border shadow-lg flex flex-col justify-between space-y-4">
                    <div>
                        <div className="flex items-center gap-2 text-primary font-black text-lg mb-2">
                            <ShieldCheck className="w-5 h-5 text-emerald-400" />
                            <span>Market Reality & Trading Tips</span>
                        </div>
                        <p className="text-xs text-muted-foreground leading-relaxed">
                            In Free Fire gaming markets, accounts typically resell at{" "}
                            <strong className="text-foreground">20% to 35%</strong> of the total diamond cost invested by the owner. The highest liquidity and premium prices are paid for accounts with{" "}
                            <strong className="text-foreground">Level 7 Max Evo Guns</strong> and vintage{" "}
                            <strong className="text-foreground">Season 1-2 OG passes</strong>.
                        </p>
                    </div>

                    <div className="p-4 rounded-2xl bg-muted/40 border border-border space-y-2 text-xs">
                        <div className="font-bold text-foreground flex items-center gap-1.5">
                            <Lock size={14} className="text-primary" /> Never Trade Without a Middleman
                        </div>
                        <p className="text-muted-foreground">
                            90% of online ID scams occur when trading directly without verified escrow. Always use a trusted community admin or verified middleman.
                        </p>
                    </div>
                </div>
            </div>

            {/* Community & Marketplace Call To Actions (CTAs) */}
            <div className="space-y-4">
                <h3 className="text-xl font-black text-foreground tracking-tight text-center md:text-left">
                    What would you like to do next?
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {/* Option A: Sell ID safely */}
                    <a
                        href={getWhatsAppUrl()}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="group p-6 rounded-3xl bg-gradient-to-br from-emerald-950/40 via-card to-card border border-emerald-500/30 hover:border-emerald-500 transition-all duration-300 flex flex-col justify-between hover:-translate-y-1 shadow-lg"
                    >
                        <div>
                            <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 mb-4 group-hover:scale-110 transition-transform">
                                <MessageCircle className="w-6 h-6" />
                            </div>
                            <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                                Seller Escrow
                            </span>
                            <h4 className="text-lg font-black text-foreground mt-2 mb-1">
                                Sell ID with Middleman
                            </h4>
                            <p className="text-xs text-muted-foreground leading-relaxed">
                                Connect with Guru Zone verified community middleman group on WhatsApp to sell safely.
                            </p>
                        </div>
                        <div className="mt-4 pt-4 border-t border-border/40 flex items-center justify-between text-xs font-black text-emerald-400">
                            <span>Join WhatsApp Group</span>
                            <ChevronRight size={16} className="group-hover:translate-x-1 transition-transform" />
                        </div>
                    </a>

                    {/* Option B: Top-Up Diamonds / Upgrade */}
                    <Link
                        href="/topup"
                        className="group p-6 rounded-3xl bg-gradient-to-br from-amber-950/40 via-card to-card border border-amber-500/30 hover:border-amber-500 transition-all duration-300 flex flex-col justify-between hover:-translate-y-1 shadow-lg"
                    >
                        <div>
                            <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-primary mb-4 group-hover:scale-110 transition-transform">
                                <Gem className="w-6 h-6" />
                            </div>
                            <span className="text-[10px] font-bold uppercase tracking-wider text-primary bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/20">
                                Instant Delivery
                            </span>
                            <h4 className="text-lg font-black text-foreground mt-2 mb-1">
                                Top-Up Diamonds Cheap
                            </h4>
                            <p className="text-xs text-muted-foreground leading-relaxed">
                                Buy Weekly/Monthly Memberships and Diamonds via JazzCash & EasyPaisa to boost ID value.
                            </p>
                        </div>
                        <div className="mt-4 pt-4 border-t border-border/40 flex items-center justify-between text-xs font-black text-primary">
                            <span>Visit Diamond Shop</span>
                            <ChevronRight size={16} className="group-hover:translate-x-1 transition-transform" />
                        </div>
                    </Link>

                    {/* Option C: Daily Paid Tournaments */}
                    <Link
                        href="/tournaments"
                        className="group p-6 rounded-3xl bg-gradient-to-br from-blue-950/40 via-card to-card border border-blue-500/30 hover:border-blue-500 transition-all duration-300 flex flex-col justify-between hover:-translate-y-1 shadow-lg"
                    >
                        <div>
                            <div className="w-12 h-12 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 mb-4 group-hover:scale-110 transition-transform">
                                <Swords className="w-6 h-6" />
                            </div>
                            <span className="text-[10px] font-bold uppercase tracking-wider text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded-full border border-blue-500/20">
                                Win Real Cash
                            </span>
                            <h4 className="text-lg font-black text-foreground mt-2 mb-1">
                                Play Tournaments
                            </h4>
                            <p className="text-xs text-muted-foreground leading-relaxed">
                                Put your ID skills to the test in daily 1v1 and Squad custom tournaments with instant cashouts.
                            </p>
                        </div>
                        <div className="mt-4 pt-4 border-t border-border/40 flex items-center justify-between text-xs font-black text-blue-400">
                            <span>View Tournaments</span>
                            <ChevronRight size={16} className="group-hover:translate-x-1 transition-transform" />
                        </div>
                    </Link>
                </div>
            </div>
        </div>
    );
}
