"use client";

import { motion } from "framer-motion";
import { Info, Trophy, Target, Heart, ChevronLeft } from "lucide-react";
import Link from "next/link";
import Image from "next/image";

interface AboutContentProps {
    content: any;
}

export default function AboutContent({ content }: AboutContentProps) {
    if (!content) return null;

    return (
        <main className="min-h-screen bg-background text-foreground selection:bg-primary/30">
            {/* Header / Navbar Placeholder */}
            <div className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-md border-b border-border h-20">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-full flex items-center justify-between">
                    <Link href="/" className="flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors font-bold uppercase tracking-widest text-sm">
                        <ChevronLeft className="w-4 h-4" />
                        Back to Home
                    </Link>
                    <div className="flex items-center gap-3">
                        <Image src="/logo.jpg" alt="Logo" width={40} height={40} className="rounded-xl" loading="lazy" />
                        <span className="font-black text-xl">GURU <span className="text-primary">ZONE</span></span>
                    </div>
                    <div className="w-24"></div> {/* Spacer */}
                </div>
            </div>

            {/* Hero Section */}
            <div className="relative pt-32 pb-20 overflow-hidden">
                <div className="absolute inset-0 z-0">
                    <div className="absolute inset-0 bg-gradient-to-b from-primary/5 via-transparent to-transparent" />
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-primary/5 rounded-full blur-[120px] opacity-50" />
                </div>

                <div className="relative z-10 max-w-4xl mx-auto px-4 text-center">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-bold tracking-widest uppercase mb-6"
                    >
                        <Info className="w-3 h-3" /> Our Story
                    </motion.div>
                    <motion.h1 
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        className="text-4xl md:text-6xl font-black mb-6"
                    >
                        {content.about?.title || "About Guru Zone"}
                    </motion.h1>
                    <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.2 }}
                        className="text-lg md:text-xl text-muted-foreground leading-relaxed whitespace-pre-wrap"
                    >
                        {content.about?.content || "The ultimate platform for esports enthusiasts. We turn your gaming passion into a professional career."}
                    </motion.div>
                </div>
            </div>

            {/* Mission/Vision Section */}
            <div className="max-w-7xl mx-auto px-4 py-20">
                <div className="grid md:grid-cols-3 gap-8">
                    <Card 
                        icon={Trophy} 
                        title="Our Mission" 
                        desc="To provide a transparent, fair, and high-stakes arena for gamers to showcase their skills and earn rewards." 
                    />
                    <Card 
                        icon={Target} 
                        title="Our Vision" 
                        desc="To become the global leader in amateur and semi-pro esports tournament management." 
                    />
                    <Card 
                        icon={Heart} 
                        title="Our Values" 
                        desc="Integrity, fair play, and community first. We believe every gamer deserves a shot at the spotlight." 
                    />
                </div>
            </div>

            {/* Footer Placeholder */}
            <footer className="border-t border-border py-12 text-center text-muted-foreground text-sm">
                <p>© {new Date().getFullYear()} Guru Zone Esports. All rights reserved.</p>
            </footer>
        </main>
    );
}

function Card({ icon: Icon, title, desc }: any) {
    return (
        <div className="p-8 rounded-3xl bg-card border border-border shadow-sm hover:border-primary/50 transition-all hover:-translate-y-1 group">
            <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mb-6 group-hover:bg-primary group-hover:text-black transition-all">
                <Icon className="w-7 h-7" />
            </div>
            <h3 className="text-xl font-bold mb-3">{title}</h3>
            <p className="text-muted-foreground leading-relaxed">{desc}</p>
        </div>
    );
}
