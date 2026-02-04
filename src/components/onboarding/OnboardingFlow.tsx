"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import { useRouter } from "next/navigation";
import {
    User,
    Crosshair,
    Shield,
    FileText,
    Check,
    ArrowRight,
    Trophy,
    Wallet,
    ShoppingBag,
    LayoutDashboard,
    SkipForward
} from "lucide-react";
import { AVATARS } from "@/lib/avatars";

interface OnboardingFlowProps {
    user: any; // Using any for flexibility with database user object
}

export default function OnboardingFlow({ user }: OnboardingFlowProps) {
    const [step, setStep] = useState(0); // 0 = Profile, 1-4 = Tour
    const [isOpen, setIsOpen] = useState(true);
    const [loading, setLoading] = useState(false);

    const [formData, setFormData] = useState({
        inGameName: user.inGameName || "",
        freeFireUid: user.freeFireUid || "",
        avatarId: user.avatarId || 1,
        bio: user.bio || "",
    });

    const router = useRouter();

    const selectedAvatar = AVATARS.find((a) => a.id === formData.avatarId) || AVATARS[0];

    const handleSubmitProfile = async (skipped = false) => {
        setLoading(true);
        try {
            const res = await fetch("/api/user/onboarding", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    ...formData,
                    skipped
                }),
            });

            if (res.ok) {
                if (skipped) {
                    // If skipped profile, go straight to tour
                    setStep(1);
                } else {
                    setStep(1);
                }
            }
        } catch (error) {
            console.error("Onboarding error", error);
        } finally {
            setLoading(false);
        }
    };

    const handleSkipProfile = () => {
        handleSubmitProfile(true);
    };

    const completeOnboarding = () => {
        setIsOpen(false);
        router.refresh(); // Refresh to update user state in UI
    };

    if (!isOpen) return null;

    const tourSteps = [
        {
            title: "Welcome to Guru Zone!",
            description: "Your ultimate destination for esports tournaments. Let's show you around.",
            icon: LayoutDashboard,
            color: "text-primary",
            bgColor: "bg-primary/20",
            image: null
        },
        {
            title: "Join Tournaments",
            description: "Find 'My Tournaments' or 'Tournaments' in the sidebar to join matches and win prizes.",
            icon: Trophy,
            color: "text-yellow-400",
            bgColor: "bg-yellow-400/20",
            image: null
        },
        {
            title: "Manage Your Wallet",
            description: "Deposit funds and withdraw your winnings securely from the 'Wallet' section.",
            icon: Wallet,
            color: "text-green-400",
            bgColor: "bg-green-400/20",
            image: null
        },
        {
            title: "Diamond Shop",
            description: "Spend your winnings or top up in our Shop for exclusive game items.",
            icon: ShoppingBag,
            color: "text-purple-400",
            bgColor: "bg-purple-400/20",
            image: null
        }
    ];

    // Total steps = Profile (0) + Tour Steps (1 to length)
    // Current Tour Step Index = step - 1

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            {/* Backdrop */}
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            />

            <AnimatePresence mode="wait">
                {step === 0 ? (
                    /* Step 0: Profile Setup */
                    <motion.div
                        key="profile-setup"
                        initial={{ scale: 0.9, opacity: 0, y: 20 }}
                        animate={{ scale: 1, opacity: 1, y: 0 }}
                        exit={{ scale: 0.9, opacity: 0, y: -20 }}
                        className="relative w-full max-w-2xl bg-[#0a0a0a] border border-white/10 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
                    >
                        {/* Header */}
                        <div className="p-6 border-b border-white/5 bg-gradient-to-r from-primary/10 to-transparent">
                            <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                                <span className="bg-primary/20 p-2 rounded-lg text-primary">
                                    <User size={24} />
                                </span>
                                Set Up Your Profile
                            </h2>
                            <p className="text-white/50 mt-1 ml-12">
                                Customize how you appear to others in tournaments.
                            </p>
                        </div>

                        {/* Scrollable Content */}
                        <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">

                            {/* Avatar Selection */}
                            <div className="space-y-3">
                                <label className="text-sm font-medium text-white/70">Choose Avatar</label>
                                <div className="flex items-center gap-4">
                                    <div className="relative w-20 h-20 rounded-full overflow-hidden border-2 border-primary bg-zinc-900">
                                        <Image src={selectedAvatar.src} alt="Selected" fill className="object-cover" />
                                    </div>
                                    <div className="flex-1 overflow-x-auto pb-2 flex gap-3">
                                        {AVATARS.map((av) => (
                                            <button
                                                key={av.id}
                                                onClick={() => setFormData({ ...formData, avatarId: av.id })}
                                                className={`relative w-16 h-16 rounded-full overflow-hidden border-2 transition-all flex-shrink-0 ${formData.avatarId === av.id ? "border-primary scale-110" : "border-white/10 hover:border-white/30"
                                                    }`}
                                            >
                                                <Image src={av.src} alt={av.name} fill className="object-cover" />
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            {/* Form Fields */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-white/70">In-Game Name (IGN)</label>
                                    <div className="relative">
                                        <div className="absolute left-3 top-3 text-white/30"><Crosshair size={18} /></div>
                                        <input
                                            type="text"
                                            value={formData.inGameName}
                                            onChange={(e) => setFormData({ ...formData, inGameName: e.target.value })}
                                            className="w-full bg-white/5 border border-white/10 rounded-xl py-2.5 pl-10 pr-4 text-white focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary transition-all"
                                            placeholder="e.g. ProGamer123"
                                        />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-white/70">Game UID</label>
                                    <div className="relative">
                                        <div className="absolute left-3 top-3 text-white/30"><Shield size={18} /></div>
                                        <input
                                            type="text"
                                            value={formData.freeFireUid}
                                            onChange={(e) => setFormData({ ...formData, freeFireUid: e.target.value })}
                                            className="w-full bg-white/5 border border-white/10 rounded-xl py-2.5 pl-10 pr-4 text-white focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary transition-all"
                                            placeholder="e.g. 1234567890"
                                        />
                                    </div>
                                </div>
                                <div className="col-span-1 md:col-span-2 space-y-2">
                                    <label className="text-sm font-medium text-white/70">Bio</label>
                                    <div className="relative">
                                        <div className="absolute left-3 top-3 text-white/30"><FileText size={18} /></div>
                                        <textarea
                                            value={formData.bio}
                                            onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                                            className="w-full bg-white/5 border border-white/10 rounded-xl py-2.5 pl-10 pr-4 text-white focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary transition-all resize-none h-24"
                                            placeholder="Tell us a bit about yourself..."
                                            maxLength={100}
                                        />
                                    </div>
                                    <div className="text-right text-xs text-white/30">{formData.bio.length}/100</div>
                                </div>
                            </div>
                        </div>

                        {/* Footer */}
                        <div className="p-6 border-t border-white/5 bg-zinc-950 flex justify-between items-center">
                            <button
                                onClick={handleSkipProfile}
                                className="text-white/50 hover:text-white text-sm font-medium px-4 py-2 hover:bg-white/5 rounded-lg transition-colors flex items-center gap-2"
                            >
                                Skip Setup <SkipForward size={14} />
                            </button>
                            <button
                                onClick={() => handleSubmitProfile(false)}
                                disabled={loading}
                                className="bg-primary hover:bg-primary/90 text-primary-foreground px-6 py-2.5 rounded-xl font-bold shadow-lg shadow-primary/25 transition-all active:scale-95 flex items-center gap-2"
                            >
                                {loading ? "Saving..." : <>Save & Continue <ArrowRight size={18} /></>}
                            </button>
                        </div>
                    </motion.div>
                ) : (
                    /* Step 1+: Tour */
                    <motion.div
                        key="tour-step"
                        initial={{ opacity: 0, x: 50 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -50 }}
                        className="w-full max-w-md bg-[#0a0a0a] border border-white/10 rounded-3xl shadow-2xl overflow-hidden flex flex-col text-center p-8 relative"
                    >
                        {/* Progress Dots */}
                        <div className="absolute top-6 left-0 right-0 flex justify-center gap-2">
                            {tourSteps.map((_, i) => (
                                <div
                                    key={i}
                                    className={`w-2 h-2 rounded-full transition-all ${i === step - 1 ? "bg-primary w-6" : "bg-white/10"
                                        }`}
                                />
                            ))}
                        </div>

                        <div className="mt-8 flex justify-center mb-6">
                            <div className={`p-6 rounded-3xl ${tourSteps[step - 1].bgColor} shadow-[0_0_40px_rgba(0,0,0,0.5)]`}>
                                {(() => {
                                    const Icon = tourSteps[step - 1].icon;
                                    return <Icon size={48} className={tourSteps[step - 1].color} />;
                                })()}
                            </div>
                        </div>

                        <h3 className="text-2xl font-bold text-white mb-2">
                            {tourSteps[step - 1].title}
                        </h3>
                        <p className="text-white/60 mb-8 leading-relaxed">
                            {tourSteps[step - 1].description}
                        </p>

                        <button
                            onClick={() => {
                                if (step - 1 < tourSteps.length - 1) {
                                    setStep(s => s + 1);
                                } else {
                                    completeOnboarding();
                                }
                            }}
                            className="bg-white text-black hover:bg-white/90 w-full py-3.5 rounded-xl font-bold shadow-lg transition-all active:scale-95 flex items-center justify-center gap-2"
                        >
                            {step - 1 < tourSteps.length - 1 ? (
                                <>Next Step <ArrowRight size={18} /></>
                            ) : (
                                <>Get Started <Check size={18} /></>
                            )}
                        </button>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
