"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, HelpCircle, ShieldCheck, Sparkles, AlertTriangle } from "lucide-react";

export const VALUATION_FAQS = [
    {
        q: "How is the Free Fire ID valuation calculated?",
        a: "Our algorithm calculates estimated market prices based on thousands of real Free Fire ID sales in Pakistan and South Asia. We weight critical assets such as player level, account seniority (Season 1-5 OG status), number of Max-Level (Lv. 7) Evo Guns, rare Incubator & Collab outfits, Gloo Wall skin count, and profile rank."
    },
    {
        q: "Why are Season 1 & 2 (Sakura / Hip Hop) accounts worth so much?",
        a: "Season 1 (Sakura) and Season 2 (Hip Hop) Elite Passes were released in 2018 when the player base was very small. Because these original items cannot be purchased again directly from the in-game store, they have become supreme collector status symbols and command the highest market resale multiplier in Pakistan (often Rs. 20,000+ to Rs. 50,000+ depending on other items)."
    },
    {
        q: "Does spending money on diamonds equal the account resale price?",
        a: "No. In digital gaming markets, accounts typically resell at 20% to 35% of the total in-game diamonds purchased. However, Max-Level Evo Guns (like MP40 Cobra and M1887) and limited collaboration bundles retain the highest percentage of resale value."
    },
    {
        q: "How can I increase the value of my Free Fire ID?",
        a: "To maximize your account valuation: (1) Upgrade your Evo Guns to Level 7 to unlock kill emotes and announcement effects, (2) Acquire limited-time Incubator or Anime Collab sets, (3) Maintain high profile rank (Master / Grandmaster) and active Monthly Memberships, and (4) Collect unique Gloo Wall skins."
    },
    {
        q: "How can I safely buy or sell a Free Fire account without getting scammed?",
        a: "Never make direct payments or send account credentials first. Always use a verified community middleman or trusted escrow service who verifies the Gmail / Facebook / VK bind change before releasing funds. Guru Zone provides community verification groups to help players avoid scams."
    }
];

export default function ValuationFAQ() {
    const [openIndex, setOpenIndex] = useState<number | null>(0);

    const toggle = (idx: number) => {
        setOpenIndex(openIndex === idx ? null : idx);
    };

    return (
        <div className="w-full max-w-4xl mx-auto mt-12 p-6 md:p-8 rounded-3xl bg-card border border-border shadow-lg">
            <div className="flex items-center gap-3 mb-6">
                <div className="p-3 rounded-2xl bg-primary/10 text-primary border border-primary/20">
                    <HelpCircle className="w-6 h-6" />
                </div>
                <div>
                    <h3 className="text-xl md:text-2xl font-black text-foreground">
                        Frequently Asked Questions
                    </h3>
                    <p className="text-xs md:text-sm text-muted-foreground">
                        Everything you need to know about Free Fire ID pricing, market rates, and safe trading in Pakistan.
                    </p>
                </div>
            </div>

            <div className="space-y-3">
                {VALUATION_FAQS.map((faq, idx) => {
                    const isOpen = openIndex === idx;
                    return (
                        <div
                            key={idx}
                            className="border border-border/80 rounded-2xl bg-card/60 overflow-hidden transition-colors hover:border-primary/40"
                        >
                            <button
                                type="button"
                                onClick={() => toggle(idx)}
                                className="w-full p-4 md:p-5 flex items-center justify-between text-left font-bold text-sm md:text-base text-foreground hover:bg-muted/30 transition-colors"
                            >
                                <span>{faq.q}</span>
                                <ChevronDown
                                    size={18}
                                    className={`text-muted-foreground transition-transform duration-300 ml-3 flex-shrink-0 ${
                                        isOpen ? "rotate-180 text-primary" : ""
                                    }`}
                                />
                            </button>

                            <AnimatePresence initial={false}>
                                {isOpen && (
                                    <motion.div
                                        initial={{ height: 0, opacity: 0 }}
                                        animate={{ height: "auto", opacity: 1 }}
                                        exit={{ height: 0, opacity: 0 }}
                                        transition={{ duration: 0.25, ease: "easeInOut" }}
                                    >
                                        <div className="p-4 md:p-5 pt-0 text-xs md:text-sm text-muted-foreground leading-relaxed border-t border-border/30">
                                            {faq.a}
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
