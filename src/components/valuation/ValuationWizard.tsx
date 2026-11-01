"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    ValuationAnswers,
    POPULAR_EVO_GUNS,
    RARE_BUNDLE_OPTIONS,
    RARE_EMOTE_OPTIONS,
    EvoGunSelection
} from "@/lib/valuation";
import {
    Sparkles,
    ChevronRight,
    ChevronLeft,
    Flame,
    Crown,
    Shield,
    Crosshair,
    Gem,
    Shirt,
    Smile,
    Award,
    Check,
    HelpCircle,
    Plus,
    Minus,
    Zap
} from "lucide-react";

interface ValuationWizardProps {
    onComplete: (answers: ValuationAnswers) => void;
    initialAnswers?: ValuationAnswers;
}

const DEFAULT_ANSWERS: ValuationAnswers = {
    levelRange: "51-65",
    startSeason: "s6-10",
    membership: "none",
    hasEvoGuns: false,
    evoGuns: [],
    rareBundles: [],
    glooWallCount: "6-15",
    hasRareEmotes: false,
    rareEmotesList: [],
    highestRank: "heroic",
    server: "pk",
    likeCount: "5k_15k",
};

const TOTAL_STEPS = 8;

export default function ValuationWizard({ onComplete, initialAnswers }: ValuationWizardProps) {
    const [step, setStep] = useState(1);
    const [answers, setAnswers] = useState<ValuationAnswers>(initialAnswers || DEFAULT_ANSWERS);

    const updateField = <K extends keyof ValuationAnswers>(field: K, value: ValuationAnswers[K]) => {
        setAnswers((prev) => ({ ...prev, [field]: value }));
    };

    const toggleBundle = (bundleId: string) => {
        setAnswers((prev) => {
            const exists = prev.rareBundles.includes(bundleId);
            if (exists) {
                return { ...prev, rareBundles: prev.rareBundles.filter((id) => id !== bundleId) };
            } else {
                return { ...prev, rareBundles: [...prev.rareBundles, bundleId] };
            }
        });
    };

    const toggleEmote = (emoteId: string) => {
        setAnswers((prev) => {
            const exists = prev.rareEmotesList.includes(emoteId);
            const updated = exists
                ? prev.rareEmotesList.filter((id) => id !== emoteId)
                : [...prev.rareEmotesList, emoteId];
            return {
                ...prev,
                rareEmotesList: updated,
                hasRareEmotes: updated.length > 0,
            };
        });
    };

    const toggleEvoGun = (gunId: string, name: string) => {
        setAnswers((prev) => {
            const exists = prev.evoGuns.find((g) => g.id === gunId);
            if (exists) {
                const filtered = prev.evoGuns.filter((g) => g.id !== gunId);
                return {
                    ...prev,
                    evoGuns: filtered,
                    hasEvoGuns: filtered.length > 0,
                };
            } else {
                const updated = [...prev.evoGuns, { id: gunId, name, level: 7 }]; // Default to Max Level 7
                return {
                    ...prev,
                    evoGuns: updated,
                    hasEvoGuns: true,
                };
            }
        });
    };

    const setEvoGunLevel = (gunId: string, level: number) => {
        setAnswers((prev) => ({
            ...prev,
            evoGuns: prev.evoGuns.map((g) => (g.id === gunId ? { ...g, level: Math.max(1, Math.min(7, level)) } : g)),
        }));
    };

    const nextStep = () => {
        if (step < TOTAL_STEPS) {
            setStep((s) => s + 1);
            window.scrollTo({ top: 0, behavior: "smooth" });
        } else {
            onComplete(answers);
        }
    };

    const prevStep = () => {
        if (step > 1) {
            setStep((s) => s - 1);
            window.scrollTo({ top: 0, behavior: "smooth" });
        }
    };

    const progressPercent = Math.round((step / TOTAL_STEPS) * 100);

    return (
        <div className="w-full max-w-3xl mx-auto">
            {/* Progress Header */}
            <div className="mb-6 p-4 rounded-2xl bg-card border border-border/80 shadow-md">
                <div className="flex items-center justify-between text-xs md:text-sm font-semibold mb-2">
                    <span className="flex items-center gap-2 text-primary">
                        <Sparkles className="w-4 h-4 animate-pulse text-yellow-400" />
                        <span>Step {step} of {TOTAL_STEPS}</span>
                    </span>
                    <span className="text-muted-foreground font-mono">{progressPercent}% Completed</span>
                </div>
                {/* Visual Bar */}
                <div className="w-full h-2.5 bg-muted rounded-full overflow-hidden">
                    <motion.div
                        className="h-full bg-gradient-to-r from-yellow-500 via-amber-400 to-primary rounded-full shadow-[0_0_12px_rgba(234,179,8,0.5)]"
                        initial={{ width: `${((step - 1) / TOTAL_STEPS) * 100}%` }}
                        animate={{ width: `${progressPercent}%` }}
                        transition={{ duration: 0.4, ease: "easeOut" }}
                    />
                </div>
            </div>

            {/* Wizard Step Body */}
            <AnimatePresence mode="wait">
                <motion.div
                    key={step}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.25 }}
                    className="p-5 md:p-8 rounded-3xl bg-card border border-border/90 shadow-xl relative overflow-hidden"
                >
                    {/* Background glow watermark */}
                    <div className="absolute -top-24 -right-24 w-60 h-60 bg-primary/5 rounded-full blur-3xl pointer-events-none" />

                    {/* Step 1: Account Level */}
                    {step === 1 && (
                        <div className="space-y-6">
                            <div className="flex items-center gap-3">
                                <div className="p-3 rounded-2xl bg-amber-500/10 text-primary border border-amber-500/20">
                                    <Crown className="w-6 h-6" />
                                </div>
                                <div>
                                    <h2 className="text-xl md:text-2xl font-black text-foreground">
                                        What is your Free Fire Player Level?
                                    </h2>
                                    <p className="text-xs md:text-sm text-muted-foreground">
                                        Account level reflects seniority and unlocks high-tier profile status.
                                    </p>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-2">
                                {[
                                    { id: "30-50", title: "Level 30 - 50", subtitle: "Bronze / Starter Account", tag: "Basic" },
                                    { id: "51-65", title: "Level 51 - 65", subtitle: "Active Veteran Profile", tag: "Popular" },
                                    { id: "66-75", title: "Level 66 - 75", subtitle: "Elite High-End Gamer", tag: "High Demand" },
                                    { id: "75+", title: "Level 75+ (Master)", subtitle: "God-Tier Profile Status", tag: "Supreme" },
                                ].map((opt) => {
                                    const selected = answers.levelRange === opt.id;
                                    return (
                                        <button
                                            key={opt.id}
                                            type="button"
                                            onClick={() => updateField("levelRange", opt.id as any)}
                                            className={`p-4 rounded-2xl border text-left transition-all relative overflow-hidden flex flex-col justify-between ${
                                                selected
                                                    ? "border-primary bg-primary/10 shadow-[0_0_20px_rgba(255,215,0,0.15)] ring-2 ring-primary/40"
                                                    : "border-border bg-card/60 hover:border-border hover:bg-muted/40"
                                            }`}
                                        >
                                            <div className="flex items-start justify-between w-full mb-2">
                                                <span className="font-bold text-base md:text-lg text-foreground">{opt.title}</span>
                                                <span
                                                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                                                        selected
                                                            ? "bg-primary text-black border-primary"
                                                            : "bg-muted text-muted-foreground border-border"
                                                    }`}
                                                >
                                                    {opt.tag}
                                                </span>
                                            </div>
                                            <p className="text-xs text-muted-foreground">{opt.subtitle}</p>
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    {/* Step 2: Account Age / Start Season */}
                    {step === 2 && (
                        <div className="space-y-6">
                            <div className="flex items-center gap-3">
                                <div className="p-3 rounded-2xl bg-orange-500/10 text-orange-400 border border-orange-500/20">
                                    <Flame className="w-6 h-6" />
                                </div>
                                <div>
                                    <h2 className="text-xl md:text-2xl font-black text-foreground">
                                        Which Season did the account start?
                                    </h2>
                                    <p className="text-xs md:text-sm text-muted-foreground">
                                        Early season accounts carry high collector prestige and vintage value.
                                    </p>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-2">
                                {[
                                    {
                                        id: "s1-5",
                                        title: "Season 1 - 5 (OG Vintage)",
                                        subtitle: "Sakura & Hip-Hop Era (Extremely Rare)",
                                        badge: "👑 Max Multiplier",
                                        borderGlow: "border-amber-500/40",
                                    },
                                    {
                                        id: "s6-10",
                                        title: "Season 6 - 10 (Golden Era)",
                                        subtitle: "Rampage, Steampunk & Early Passes",
                                        badge: "🔥 High Value",
                                        borderGlow: "border-orange-500/30",
                                    },
                                    {
                                        id: "s11-20",
                                        title: "Season 11 - 20 (Mid Era)",
                                        subtitle: "Active competitive season era",
                                        badge: "⚡ Solid",
                                        borderGlow: "border-blue-500/30",
                                    },
                                    {
                                        id: "recent",
                                        title: "Season 21+ or Recent",
                                        subtitle: "Modern account with recent events",
                                        badge: "Standard",
                                        borderGlow: "border-border",
                                    },
                                ].map((opt) => {
                                    const selected = answers.startSeason === opt.id;
                                    return (
                                        <button
                                            key={opt.id}
                                            type="button"
                                            onClick={() => updateField("startSeason", opt.id as any)}
                                            className={`p-4 rounded-2xl border text-left transition-all relative overflow-hidden flex flex-col justify-between ${
                                                selected
                                                    ? "border-primary bg-primary/10 shadow-[0_0_20px_rgba(255,215,0,0.15)] ring-2 ring-primary/40"
                                                    : `border-border bg-card/60 hover:border-border hover:bg-muted/40`
                                            }`}
                                        >
                                            <div className="flex items-start justify-between w-full mb-2">
                                                <span className="font-bold text-sm md:text-base text-foreground">{opt.title}</span>
                                                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-muted text-muted-foreground border border-border">
                                                    {opt.badge}
                                                </span>
                                            </div>
                                            <p className="text-xs text-muted-foreground">{opt.subtitle}</p>
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    {/* Step 3: Membership / VIP */}
                    {step === 3 && (
                        <div className="space-y-6">
                            <div className="flex items-center gap-3">
                                <div className="p-3 rounded-2xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                                    <Gem className="w-6 h-6" />
                                </div>
                                <div>
                                    <h2 className="text-xl md:text-2xl font-black text-foreground">
                                        Membership & Prime Subscription Status
                                    </h2>
                                    <p className="text-xs md:text-sm text-muted-foreground">
                                        Select the active or historical membership level of the ID.
                                    </p>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-2">
                                {[
                                    {
                                        id: "none",
                                        title: "No Active Membership",
                                        subtitle: "Standard Free-to-play / occasional top-up",
                                    },
                                    {
                                        id: "weekly",
                                        title: "Weekly Membership",
                                        subtitle: "Active weekly diamond subscription",
                                    },
                                    {
                                        id: "monthly",
                                        title: "Monthly Membership",
                                        subtitle: "Regular monthly pass subscriber",
                                    },
                                    {
                                        id: "vip_prime",
                                        title: "VIP / High Prime / Level Up Pass",
                                        subtitle: "Maxed subscription tiers & prime perks",
                                    },
                                ].map((opt) => {
                                    const selected = answers.membership === opt.id;
                                    return (
                                        <button
                                            key={opt.id}
                                            type="button"
                                            onClick={() => updateField("membership", opt.id as any)}
                                            className={`p-4 rounded-2xl border text-left transition-all relative ${
                                                selected
                                                    ? "border-primary bg-primary/10 shadow-[0_0_20px_rgba(255,215,0,0.15)] ring-2 ring-primary/40"
                                                    : "border-border bg-card/60 hover:bg-muted/40"
                                            }`}
                                        >
                                            <span className="font-bold text-sm md:text-base text-foreground block mb-1">
                                                {opt.title}
                                            </span>
                                            <p className="text-xs text-muted-foreground">{opt.subtitle}</p>
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    {/* Step 4: Evo Guns (Conditional Wizard with Sub-questions) */}
                    {step === 4 && (
                        <div className="space-y-6">
                            <div className="flex items-center gap-3">
                                <div className="p-3 rounded-2xl bg-red-500/10 text-red-400 border border-red-500/20">
                                    <Crosshair className="w-6 h-6" />
                                </div>
                                <div>
                                    <h2 className="text-xl md:text-2xl font-black text-foreground">
                                        Does the ID have Evo Guns?
                                    </h2>
                                    <p className="text-xs md:text-sm text-muted-foreground">
                                        Evo Guns with upgraded kill emotes are the #1 market price booster in Free Fire!
                                    </p>
                                </div>
                            </div>

                            {/* Yes / No Toggle */}
                            <div className="grid grid-cols-2 gap-4">
                                <button
                                    type="button"
                                    onClick={() => {
                                        updateField("hasEvoGuns", true);
                                        if (answers.evoGuns.length === 0) {
                                            // Select MP40 by default
                                            updateField("evoGuns", [{ id: "mp40_cobra", name: "MP40 - Predatory Cobra", level: 7 }]);
                                        }
                                    }}
                                    className={`p-4 rounded-2xl border text-center font-black transition-all ${
                                        answers.hasEvoGuns
                                            ? "border-primary bg-primary/10 text-primary shadow-[0_0_20px_rgba(255,215,0,0.2)] ring-2 ring-primary/40"
                                            : "border-border bg-card/60 text-muted-foreground hover:bg-muted/40"
                                    }`}
                                >
                                    🔥 YES (I have Evo Guns)
                                </button>
                                <button
                                    type="button"
                                    onClick={() => {
                                        updateField("hasEvoGuns", false);
                                        updateField("evoGuns", []);
                                    }}
                                    className={`p-4 rounded-2xl border text-center font-bold transition-all ${
                                        !answers.hasEvoGuns
                                            ? "border-primary bg-primary/10 text-primary ring-2 ring-primary/40"
                                            : "border-border bg-card/60 text-muted-foreground hover:bg-muted/40"
                                    }`}
                                >
                                    No Evo Guns
                                </button>
                            </div>

                            {/* Conditional Evo Gun Detail Selector */}
                            {answers.hasEvoGuns && (
                                <motion.div
                                    initial={{ opacity: 0, height: 0 }}
                                    animate={{ opacity: 1, height: "auto" }}
                                    exit={{ opacity: 0, height: 0 }}
                                    className="space-y-4 pt-4 border-t border-border/80"
                                >
                                    <div className="flex items-center justify-between">
                                        <h3 className="text-sm font-bold text-foreground">
                                            Select Owned Evo Guns & their Level:
                                        </h3>
                                        <span className="text-xs text-primary font-bold">
                                            {answers.evoGuns.length} Selected
                                        </span>
                                    </div>

                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-72 overflow-y-auto pr-1">
                                        {POPULAR_EVO_GUNS.map((gun) => {
                                            const selectedGun = answers.evoGuns.find((g) => g.id === gun.id);
                                            const isSelected = !!selectedGun;

                                            return (
                                                <div
                                                    key={gun.id}
                                                    className={`p-3 rounded-2xl border transition-all ${
                                                        isSelected
                                                            ? "border-amber-500/60 bg-amber-500/10 shadow-sm"
                                                            : "border-border bg-card/40 hover:border-border/80"
                                                    }`}
                                                >
                                                    <div className="flex items-center justify-between mb-2">
                                                        <button
                                                            type="button"
                                                            onClick={() => toggleEvoGun(gun.id, gun.name)}
                                                            className="flex items-center gap-2 text-left flex-1"
                                                        >
                                                            <div
                                                                className={`w-5 h-5 rounded-md flex items-center justify-center border text-xs ${
                                                                    isSelected
                                                                        ? "bg-primary text-black border-primary"
                                                                        : "border-border text-transparent"
                                                                }`}
                                                            >
                                                                <Check size={14} />
                                                            </div>
                                                            <span className="font-bold text-xs md:text-sm text-foreground">
                                                                {gun.name}
                                                            </span>
                                                        </button>
                                                        <span className="text-[10px] text-muted-foreground px-1.5 py-0.5 rounded bg-muted">
                                                            {gun.tag}
                                                        </span>
                                                    </div>

                                                    {/* Level Controller if selected */}
                                                    {isSelected && (
                                                        <div className="mt-2 pt-2 border-t border-border/40 flex items-center justify-between bg-card/60 p-2 rounded-xl">
                                                            <span className="text-xs font-semibold text-muted-foreground">
                                                                Level:
                                                            </span>
                                                            <div className="flex items-center gap-2">
                                                                <button
                                                                    type="button"
                                                                    onClick={() =>
                                                                        setEvoGunLevel(gun.id, (selectedGun?.level || 7) - 1)
                                                                    }
                                                                    className="w-6 h-6 rounded-lg bg-muted flex items-center justify-center hover:bg-primary hover:text-black transition-colors"
                                                                >
                                                                    <Minus size={12} />
                                                                </button>
                                                                <span
                                                                    className={`text-xs font-black px-2 py-0.5 rounded ${
                                                                        selectedGun?.level === 7
                                                                            ? "bg-gradient-to-r from-amber-500 to-yellow-400 text-black shadow-sm"
                                                                            : "bg-muted text-foreground"
                                                                    }`}
                                                                >
                                                                    {selectedGun?.level === 7
                                                                        ? "MAX (Lv.7 👑)"
                                                                        : `Lv. ${selectedGun?.level}`}
                                                                </span>
                                                                <button
                                                                    type="button"
                                                                    onClick={() =>
                                                                        setEvoGunLevel(gun.id, (selectedGun?.level || 1) + 1)
                                                                    }
                                                                    className="w-6 h-6 rounded-lg bg-muted flex items-center justify-center hover:bg-primary hover:text-black transition-colors"
                                                                >
                                                                    <Plus size={12} />
                                                                </button>
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            );
                                        })}
                                    </div>
                                </motion.div>
                            )}
                        </div>
                    )}

                    {/* Step 5: Rare Bundles & Outfits */}
                    {step === 5 && (
                        <div className="space-y-6">
                            <div className="flex items-center gap-3">
                                <div className="p-3 rounded-2xl bg-purple-500/10 text-purple-400 border border-purple-500/20">
                                    <Shirt className="w-6 h-6" />
                                </div>
                                <div>
                                    <h2 className="text-xl md:text-2xl font-black text-foreground">
                                        Are there Rare or OG Outfits / Bundles?
                                    </h2>
                                    <p className="text-xs md:text-sm text-muted-foreground">
                                        Select all bundles that apply to this account (Multi-select).
                                    </p>
                                </div>
                            </div>

                            <div className="space-y-3 pt-2">
                                {RARE_BUNDLE_OPTIONS.map((bundle) => {
                                    const selected = answers.rareBundles.includes(bundle.id);
                                    return (
                                        <button
                                            key={bundle.id}
                                            type="button"
                                            onClick={() => toggleBundle(bundle.id)}
                                            className={`w-full p-4 rounded-2xl border text-left transition-all flex items-start gap-3.5 ${
                                                selected
                                                    ? "border-primary bg-primary/10 shadow-[0_0_15px_rgba(255,215,0,0.1)] ring-2 ring-primary/40"
                                                    : "border-border bg-card/60 hover:bg-muted/40"
                                            }`}
                                        >
                                            <div
                                                className={`mt-0.5 w-5 h-5 rounded-md flex items-center justify-center border flex-shrink-0 ${
                                                    selected
                                                        ? "bg-primary text-black border-primary"
                                                        : "border-border text-transparent"
                                                }`}
                                            >
                                                <Check size={14} />
                                            </div>
                                            <div className="flex-1">
                                                <div className="flex items-center justify-between mb-1">
                                                    <span className="font-bold text-sm md:text-base text-foreground">
                                                        {bundle.title}
                                                    </span>
                                                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${bundle.badgeColor}`}>
                                                        {bundle.multiplier}
                                                    </span>
                                                </div>
                                                <p className="text-xs text-muted-foreground">{bundle.description}</p>
                                            </div>
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    {/* Step 6: Gloo Wall Skins */}
                    {step === 6 && (
                        <div className="space-y-6">
                            <div className="flex items-center gap-3">
                                <div className="p-3 rounded-2xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                                    <Shield className="w-6 h-6" />
                                </div>
                                <div>
                                    <h2 className="text-xl md:text-2xl font-black text-foreground">
                                        How many Gloo Wall Skins are unlocked?
                                    </h2>
                                    <p className="text-xs md:text-sm text-muted-foreground">
                                        Gloo walls are a vital symbol of diamond spending and account wealth.
                                    </p>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-2">
                                {[
                                    { id: "0-5", title: "0 - 5 Gloo Walls", desc: "Basic defense collection" },
                                    { id: "6-15", title: "6 - 15 Gloo Walls", desc: "Solid competitive collector" },
                                    { id: "16-30", title: "16 - 30 Gloo Walls", desc: "High-tier collection (Rare event skins)" },
                                    { id: "30+", title: "30+ Gloo Walls (Master)", desc: "Supreme arsenal with OG & Collab walls" },
                                ].map((opt) => {
                                    const selected = answers.glooWallCount === opt.id;
                                    return (
                                        <button
                                            key={opt.id}
                                            type="button"
                                            onClick={() => updateField("glooWallCount", opt.id as any)}
                                            className={`p-4 rounded-2xl border text-left transition-all ${
                                                selected
                                                    ? "border-primary bg-primary/10 shadow-[0_0_20px_rgba(255,215,0,0.15)] ring-2 ring-primary/40"
                                                    : "border-border bg-card/60 hover:bg-muted/40"
                                            }`}
                                        >
                                            <span className="font-bold text-sm md:text-base text-foreground block mb-1">
                                                {opt.title}
                                            </span>
                                            <p className="text-xs text-muted-foreground">{opt.desc}</p>
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    {/* Step 7: Rare Emotes & Special Animations */}
                    {step === 7 && (
                        <div className="space-y-6">
                            <div className="flex items-center gap-3">
                                <div className="p-3 rounded-2xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                                    <Smile className="w-6 h-6" />
                                </div>
                                <div>
                                    <h2 className="text-xl md:text-2xl font-black text-foreground">
                                        Rare Emotes & Lobby Animations
                                    </h2>
                                    <p className="text-xs md:text-sm text-muted-foreground">
                                        Select the flex emotes and special entry animations on the ID (Multi-select).
                                    </p>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                                {RARE_EMOTE_OPTIONS.map((emote) => {
                                    const selected = answers.rareEmotesList.includes(emote.id);
                                    return (
                                        <button
                                            key={emote.id}
                                            type="button"
                                            onClick={() => toggleEmote(emote.id)}
                                            className={`p-3.5 rounded-2xl border text-left transition-all flex items-center justify-between ${
                                                selected
                                                    ? "border-primary bg-primary/10 shadow-[0_0_15px_rgba(255,215,0,0.1)] ring-2 ring-primary/40"
                                                    : "border-border bg-card/60 hover:bg-muted/40"
                                            }`}
                                        >
                                            <div className="flex items-center gap-2.5">
                                                <div
                                                    className={`w-4 h-4 rounded-md flex items-center justify-center border text-xs ${
                                                        selected
                                                            ? "bg-primary text-black border-primary"
                                                            : "border-border text-transparent"
                                                    }`}
                                                >
                                                    <Check size={12} />
                                                </div>
                                                <span className="font-bold text-xs md:text-sm text-foreground">
                                                    {emote.label}
                                                </span>
                                            </div>
                                            <span className="text-[10px] font-semibold text-muted-foreground bg-muted px-2 py-0.5 rounded-md">
                                                {emote.tag}
                                            </span>
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    {/* Step 8: Rank & Profile Reputation */}
                    {step === 8 && (
                        <div className="space-y-6">
                            <div className="flex items-center gap-3">
                                <div className="p-3 rounded-2xl bg-yellow-500/10 text-yellow-400 border border-yellow-500/20">
                                    <Award className="w-6 h-6" />
                                </div>
                                <div>
                                    <h2 className="text-xl md:text-2xl font-black text-foreground">
                                        Rank, Server & Profile Likes
                                    </h2>
                                    <p className="text-xs md:text-sm text-muted-foreground">
                                        Final step! Specify rank achievements and server liquidity.
                                    </p>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <div>
                                    <label className="text-xs font-bold uppercase text-muted-foreground block mb-2">
                                        Highest / Current Rank:
                                    </label>
                                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                                        {[
                                            { id: "grandmaster", label: "Grandmaster 👑" },
                                            { id: "master", label: "Master 🎖️" },
                                            { id: "heroic", label: "Heroic ⭐" },
                                            { id: "diamond", label: "Diamond / Plat" },
                                        ].map((r) => (
                                            <button
                                                key={r.id}
                                                type="button"
                                                onClick={() => updateField("highestRank", r.id as any)}
                                                className={`p-2.5 rounded-xl border text-center font-bold text-xs transition-all ${
                                                    answers.highestRank === r.id
                                                        ? "border-primary bg-primary/10 text-primary ring-2 ring-primary/30"
                                                        : "border-border bg-card/60 text-muted-foreground hover:bg-muted/40"
                                                }`}
                                            >
                                                {r.label}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div>
                                    <label className="text-xs font-bold uppercase text-muted-foreground block mb-2">
                                        Server / Region:
                                    </label>
                                    <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
                                        {[
                                            { id: "pk", label: "Pakistan (PK 🇵🇰)" },
                                            { id: "bd", label: "Bangladesh 🇧🇩" },
                                            { id: "ind", label: "India 🇮🇳" },
                                            { id: "mena", label: "MENA / ME" },
                                            { id: "other", label: "Other" },
                                        ].map((srv) => (
                                            <button
                                                key={srv.id}
                                                type="button"
                                                onClick={() => updateField("server", srv.id as any)}
                                                className={`p-2 rounded-xl border text-center font-semibold text-xs transition-all ${
                                                    answers.server === srv.id
                                                        ? "border-primary bg-primary/10 text-primary ring-2 ring-primary/30"
                                                        : "border-border bg-card/60 text-muted-foreground hover:bg-muted/40"
                                                }`}
                                            >
                                                {srv.label}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div>
                                    <label className="text-xs font-bold uppercase text-muted-foreground block mb-2">
                                        Profile Like Count:
                                    </label>
                                    <div className="grid grid-cols-3 gap-2">
                                        {[
                                            { id: "under_5k", label: "< 5,000 Likes" },
                                            { id: "5k_15k", label: "5,000 - 15,000" },
                                            { id: "15k_plus", label: "15,000+ Likes ❤️" },
                                        ].map((lk) => (
                                            <button
                                                key={lk.id}
                                                type="button"
                                                onClick={() => updateField("likeCount", lk.id as any)}
                                                className={`p-2.5 rounded-xl border text-center font-bold text-xs transition-all ${
                                                    answers.likeCount === lk.id
                                                        ? "border-primary bg-primary/10 text-primary ring-2 ring-primary/30"
                                                        : "border-border bg-card/60 text-muted-foreground hover:bg-muted/40"
                                                }`}
                                            >
                                                {lk.label}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Navigation Buttons */}
                    <div className="mt-8 pt-6 border-t border-border flex items-center justify-between gap-4">
                        {step > 1 ? (
                            <button
                                type="button"
                                onClick={prevStep}
                                className="px-4 py-2.5 rounded-xl border border-border text-foreground font-bold text-sm hover:bg-muted transition-colors flex items-center gap-1.5"
                            >
                                <ChevronLeft size={16} /> Back
                            </button>
                        ) : (
                            <div />
                        )}

                        <button
                            type="button"
                            onClick={nextStep}
                            className={`px-6 py-3 rounded-xl font-black text-sm transition-all flex items-center gap-2 ${
                                step === TOTAL_STEPS
                                    ? "bg-gradient-to-r from-amber-500 to-yellow-400 text-black shadow-[0_0_25px_rgba(250,204,21,0.4)] hover:scale-105"
                                    : "bg-primary text-black hover:bg-yellow-400 shadow-md"
                            }`}
                        >
                            {step === TOTAL_STEPS ? (
                                <>
                                    <Zap className="w-4 h-4 fill-current" />
                                    <span>Calculate Instant Valuation</span>
                                </>
                            ) : (
                                <>
                                    <span>Next Step</span>
                                    <ChevronRight size={16} />
                                </>
                            )}
                        </button>
                    </div>
                </motion.div>
            </AnimatePresence>
        </div>
    );
}
