"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, HelpCircle, ShieldCheck, Sparkles, AlertTriangle } from "lucide-react";

import { VALUATION_FAQS } from "@/lib/valuation";
export { VALUATION_FAQS };

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
