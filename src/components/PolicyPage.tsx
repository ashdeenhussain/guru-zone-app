"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { ChevronLeft, ShieldCheck, ScrollText, RefreshCcw } from "lucide-react";
import { motion } from "framer-motion";

export default function PolicyPage({ type }: { type: 'privacy' | 'terms' | 'refund' }) {
    const [content, setContent] = useState<any>(null);

    useEffect(() => {
        fetch("/api/landing-page")
            .then(res => res.json())
            .then(data => setContent(data));
    }, []);

    if (!content) return null;

    const config = {
        privacy: {
            title: content.privacyPolicy.title || "Privacy Policy",
            data: content.privacyPolicy.content,
            icon: ShieldCheck,
            color: "text-blue-500",
            bg: "bg-blue-500/10"
        },
        terms: {
            title: content.termsOfService.title || "Terms of Service",
            data: content.termsOfService.content,
            icon: ScrollText,
            color: "text-purple-500",
            bg: "bg-purple-500/10"
        },
        refund: {
            title: content.refundPolicy.title || "Refund Policy",
            data: content.refundPolicy.content,
            icon: RefreshCcw,
            color: "text-orange-500",
            bg: "bg-orange-500/10"
        }
    }[type];

    const Icon = config.icon;

    return (
        <main className="min-h-screen bg-background text-foreground">
            <div className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-md border-b border-border h-20">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-full flex items-center justify-between">
                    <Link href="/" className="flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors font-bold uppercase tracking-widest text-sm">
                        <ChevronLeft className="w-4 h-4" />
                        Back to Home
                    </Link>
                    <div className="flex items-center gap-3">
                        <img src="/logo.jpg" alt="Logo" className="w-10 h-10 rounded-xl" />
                        <span className="font-black text-xl tracking-tighter">GURU <span className="text-primary">ZONE</span></span>
                    </div>
                    <div className="w-24"></div>
                </div>
            </div>

            <div className="max-w-4xl mx-auto px-4 pt-32 pb-20">
                <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mb-12"
                >
                    <div className={`w-16 h-16 ${config.bg} ${config.color} rounded-2xl flex items-center justify-center mb-6`}>
                        <Icon className="w-8 h-8" />
                    </div>
                    <h1 className="text-4xl md:text-5xl font-black mb-4 uppercase tracking-tight">{config.title}</h1>
                    <p className="text-muted-foreground">Last Updated: {new Date(content.updatedAt).toLocaleDateString()}</p>
                </motion.div>

                <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.2 }}
                    className="prose prose-invert max-w-none bg-card border border-border p-8 md:p-12 rounded-3xl shadow-sm whitespace-pre-wrap leading-relaxed text-muted-foreground"
                >
                    {config.data || "This policy is currently being updated. Please check back later."}
                </motion.div>
            </div>

             <footer className="border-t border-border py-12 text-center text-muted-foreground text-sm">
                <p>© {new Date().getFullYear()} Guru Zone Esports. All rights reserved.</p>
            </footer>
        </main>
    );
}
