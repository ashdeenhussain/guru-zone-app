"use client";

import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, Trophy, Zap, Shield, Users, Gamepad2, Timer, Crosshair, Gift, HelpCircle, ChevronRight, Twitter, Instagram, Youtube, Gem, Crown, TrendingUp, Swords, Wallet, Sparkles, CheckCircle2, Lock, ArrowUpRight, User, PlusCircle, Gamepad, Headphones } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { useState, useEffect } from "react";
import SplashScreen from "@/components/SplashScreen";
import ThemeToggle from "@/components/ThemeToggle";
import HeroSlider from "@/components/HeroSlider";

export default function LandingPage({ initialData, city }: { initialData?: any, city?: string }) {
    const [isLoading, setIsLoading] = useState(true);
    const [pageData, setPageData] = useState<any>(initialData || null);
    const cityName = city ? city.charAt(0).toUpperCase() + city.slice(1) : "";

    useEffect(() => {
        const timer = setTimeout(() => {
            setIsLoading(false);
        }, 1500);

        if (!initialData) {
            // Fetch dynamic content
            fetch("/api/landing-page")
                .then(res => res.json())
                .then(data => setPageData(data))
                .catch(err => console.error("Error loading landing page data:", err));
        }

        return () => clearTimeout(timer);
    }, [initialData]);

    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: {
                staggerChildren: 0.15
            }
        }
    };

    const itemVariants = {
        hidden: { opacity: 0, y: 30 },
        visible: {
            opacity: 1,
            y: 0,
            transition: { duration: 0.6 }
        }
    };

    return (
        <AnimatePresence mode="wait">
            {isLoading ? (
                <SplashScreen key="splash" />
            ) : (
                <main className="min-h-screen relative overflow-hidden bg-background text-foreground selection:bg-primary/30 font-sans transition-colors duration-300">
                    {city ? (
                        <h1 className="sr-only">Premium Free Fire Top Up & Custom Tournaments in {cityName}</h1>
                    ) : (
                        <h1 className="sr-only">Guru Zone: Pakistan's Premium Free Fire Tournaments & Top Up Platform</h1>
                    )}

                    {/* Theme Toggle Button (Fixed Bottom Right) */}
                    <div className="fixed bottom-6 right-6 z-[100] shadow-2xl rounded-xl">
                        <ThemeToggle />
                    </div>

                    {/* Background Image & Overlay */}
                    <div className="absolute inset-0 z-0 select-none fixed">
                        <Image
                            src="/hero-bg.png"
                            alt="Free Fire Tournaments and Custom Matches Background"
                            fill
                            className="object-cover opacity-10 dark:opacity-40 transition-opacity duration-300"
                            priority
                            quality={85}
                        />
                        <div className="absolute inset-0 bg-gradient-to-b from-background/90 via-background/50 to-background pointer-events-none" />
                        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-primary/5 via-transparent to-transparent opacity-40" />
                    </div>

                    {/* Floating Brand Header */}
                    <div className="fixed top-0 left-0 right-0 z-50 border-b border-border bg-background/80 backdrop-blur-md shadow-sm">
                        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="relative w-10 h-10 md:w-11 md:h-11 rounded-xl overflow-hidden shadow-lg border border-white/10">
                                    <Image
                                        src="/logo.jpg"
                                        alt="Guru Zone Free Fire Earning App Logo"
                                        fill
                                        className="object-cover"
                                        loading="lazy"
                                        quality={70}
                                        sizes="(max-width: 768px) 100vw, 50vw"
                                    />
                                </div>
                                <span className="font-black text-lg md:text-xl tracking-tighter text-foreground drop-shadow-md">
                                    GURU <span className="text-primary">ZONE</span>
                                </span>
                            </div>
                            <Link href="/login">
                                <button className="px-6 py-2 bg-primary text-black font-bold rounded-lg text-sm hover:scale-105 transition-transform shadow-[0_0_15px_rgba(250,204,21,0.3)]">
                                    Login
                                </button>
                            </Link>
                        </div>
                    </div>

                    {/* HERO Slider Section */}
                    <div className="relative z-10 w-full pt-20">
                        <HeroSlider heroData={pageData?.hero} />
                    </div>

                    {/* Stats Strip overlap */}
                    <div className="relative z-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-8 md:-mt-12 mb-16">
                        <motion.div
                            variants={containerVariants}
                            initial="hidden"
                            animate="visible"
                            className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-4 w-full max-w-5xl mx-auto p-6 rounded-2xl border border-border bg-card/75 backdrop-blur-lg shadow-xl"
                        >
                            <StatItem icon={Users} label="Active Players" value="10K+" />
                            <StatItem icon={Trophy} label="Prize Pool" value="5L+ Coins" />
                            <StatItem icon={Gamepad2} label="Daily Matches" value="50+" />
                            <StatItem icon={Timer} label="Instant Payout" value="24/7" />
                        </motion.div>
                    </div>

                    {/* Features Showcase Section (Zig-Zag Layout) */}
                    <div className="relative z-10 max-w-7xl mx-auto px-4 pb-24 pt-8">
                        {/* Section Header */}
                        <div className="text-center mb-20">
                            <span className="inline-flex items-center gap-1.5 text-primary font-black tracking-widest uppercase text-xs px-3 py-1 rounded-full bg-primary/10 border border-primary/20 mb-4">
                                <Sparkles className="w-3.5 h-3.5" /> GURU ZONE ECOSYSTEM
                            </span>
                            <h2 className="text-3xl md:text-6xl font-black text-foreground mt-2 tracking-tighter uppercase">
                                {city ? (
                                    <>Premium Free Fire Top Up in <span className="text-primary text-stroke-primary dark:text-primary">{cityName}</span></>
                                ) : (
                                    <>PAKISTAN&apos;S BEST <span className="text-primary text-stroke-primary dark:text-primary">FREE FIRE ESPORTS</span> APP</>
                                )}
                            </h2>
                            <p className="text-muted-foreground mt-4 max-w-xl mx-auto text-sm md:text-base leading-relaxed">
                                {city 
                                    ? `Looking for the fastest and most secure Free Fire Top Up in ${cityName}? Guru Zone is the #1 trusted platform for gamers across ${cityName} to buy diamonds, weekly memberships, and level up passes via JazzCash and EasyPaisa.`
                                    : `Experience professional tournament rooms, custom 1v1 challenges, instant diamond top-ups, and blazing-fast payouts directly to your local wallets.`}
                            </p>
                        </div>

                        {/* Zig-Zag Showcase Rows */}
                        <div className="space-y-24 md:space-y-32">
                            {/* Block 1: Daily Tournaments */}
                            <div className="grid md:grid-cols-2 gap-8 md:gap-16 items-center">
                                {/* Text Column (Left) */}
                                <motion.div 
                                    initial={{ opacity: 0, x: -40 }}
                                    whileInView={{ opacity: 1, x: 0 }}
                                    viewport={{ once: true, margin: "-100px" }}
                                    transition={{ duration: 0.7, ease: "easeOut" }}
                                    className="space-y-6 text-left"
                                >
                                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 text-amber-400 text-xs font-bold border border-amber-500/20">
                                        <Trophy className="w-3.5 h-3.5" /> DAILY TOURNAMENTS
                                    </div>
                                    <h2 className="text-2xl md:text-4xl font-black text-foreground leading-tight">
                                        Compete in Daily Free Fire Tournaments
                                    </h2>
                                    <p className="text-muted-foreground text-sm md:text-base leading-relaxed">
                                        Join the most competitive Free Fire community in Pakistan. Participate in daily custom rooms, showcase your skills, and win real rewards. Over 50+ major tournaments successfully hosted.
                                    </p>
                                    <Link href="/tournaments">
                                        <button className="px-6 py-3 bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-black font-black rounded-xl shadow-lg shadow-amber-500/20 hover:shadow-amber-500/40 hover:scale-105 transition-all flex items-center gap-2 group">
                                            Join Free Fire Tournaments <ArrowUpRight className="w-4 h-4 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                                        </button>
                                    </Link>
                                </motion.div>

                                {/* Graphic Column (Right) */}
                                <motion.div 
                                    initial={{ opacity: 0, x: 40 }}
                                    whileInView={{ opacity: 1, x: 0 }}
                                    viewport={{ once: true, margin: "-100px" }}
                                    transition={{ duration: 0.7, ease: "easeOut" }}
                                    className="relative w-full h-full flex items-center justify-center min-h-[300px]"
                                >
                                    {/* Glowing Background Glow */}
                                    <div className="absolute w-64 h-64 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
                                    
                                    <div className="relative w-full max-w-sm glass rounded-3xl border border-white/10 p-5 overflow-hidden shadow-2xl">
                                        {/* Blinking Live Badge */}
                                        <div className="absolute top-4 right-4 flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-red-500/10 border border-red-500/20 text-red-500 text-[10px] font-bold tracking-wider uppercase animate-pulse">
                                            <span className="w-1.5 h-1.5 rounded-full bg-red-500" /> Live Lobby
                                        </div>
                                        
                                        <div className="flex items-center gap-3 mb-4">
                                            <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center border border-amber-500/20">
                                                <Trophy className="w-5 h-5 text-amber-400" />
                                            </div>
                                            <div>
                                                <h4 className="font-black text-sm text-foreground">PAK CHAMPIONSHIP</h4>
                                                <p className="text-[10px] text-muted-foreground uppercase tracking-widest">Room ID: 9482103</p>
                                            </div>
                                        </div>
                                        
                                        {/* Details Grid */}
                                        <div className="grid grid-cols-3 gap-2 p-3 bg-white/5 dark:bg-black/40 rounded-xl border border-white/5 mb-4 text-center">
                                            <div>
                                                <p className="text-[9px] text-muted-foreground uppercase">Prize Pool</p>
                                                <p className="text-xs font-black text-amber-400">10,000 🪙</p>
                                            </div>
                                            <div className="border-x border-white/5">
                                                <p className="text-[9px] text-muted-foreground uppercase">Map</p>
                                                <p className="text-xs font-bold text-foreground">Bermuda</p>
                                            </div>
                                            <div>
                                                <p className="text-[9px] text-muted-foreground uppercase">Entry Fee</p>
                                                <p className="text-xs font-bold text-foreground">50 🪙</p>
                                            </div>
                                        </div>
                                        
                                        {/* Registered Squads */}
                                        <div className="space-y-2 mb-4">
                                            <div className="flex items-center justify-between text-[11px] text-muted-foreground font-semibold">
                                                <span>Registered Players</span>
                                                <span className="text-amber-400">42 / 48 Slots Filled</span>
                                            </div>
                                            <div className="w-full bg-white/10 dark:bg-black/60 rounded-full h-1.5 overflow-hidden">
                                                <div className="bg-amber-400 h-full rounded-full w-[87%] animate-pulse" />
                                            </div>
                                        </div>
                                        
                                        {/* Squad Details List */}
                                        <div className="space-y-1.5 text-xs">
                                            <div className="flex justify-between items-center py-1 border-b border-white/5">
                                                <span className="text-foreground font-medium flex items-center gap-1.5">
                                                    <span className="w-1.5 h-1.5 rounded-full bg-green-500" /> Squad 1: Team Pakistan
                                                </span>
                                                <span className="text-muted-foreground text-[10px]">Ping: 24ms</span>
                                            </div>
                                            <div className="flex justify-between items-center py-1 border-b border-white/5">
                                                <span className="text-foreground font-medium flex items-center gap-1.5">
                                                    <span className="w-1.5 h-1.5 rounded-full bg-green-500" /> Squad 2: Legend Kings
                                                </span>
                                                <span className="text-muted-foreground text-[10px]">Ping: 32ms</span>
                                            </div>
                                            <div className="flex justify-between items-center py-1">
                                                <span className="text-muted-foreground font-medium italic flex items-center gap-1.5">
                                                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-ping" /> Slot #43 open...
                                                </span>
                                                <span className="text-amber-400 text-[10px] font-bold">Join now</span>
                                            </div>
                                        </div>
                                    </div>
                                </motion.div>
                            </div>

                            {/* Block 2: Battle Zone */}
                            <div className="grid md:grid-cols-2 gap-8 md:gap-16 items-center">
                                {/* Graphic Column (Left on Desktop, second on Mobile) */}
                                <motion.div 
                                    initial={{ opacity: 0, x: -40 }}
                                    whileInView={{ opacity: 1, x: 0 }}
                                    viewport={{ once: true, margin: "-100px" }}
                                    transition={{ duration: 0.7, ease: "easeOut" }}
                                    className="relative w-full h-full flex items-center justify-center min-h-[300px] order-2 md:order-1"
                                >
                                    {/* Glowing Background Glow */}
                                    <div className="absolute w-64 h-64 bg-red-500/10 rounded-full blur-3xl pointer-events-none" />
                                    
                                    <div className="relative w-full max-w-sm glass rounded-3xl border border-white/10 p-5 overflow-hidden shadow-2xl">
                                        <div className="flex items-center justify-between mb-4">
                                            <span className="text-[10px] bg-red-500/20 text-red-400 border border-red-500/30 px-2.5 py-0.5 rounded font-bold uppercase tracking-wider">
                                                Battle Lobby
                                            </span>
                                            <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                                                <Lock className="w-3 h-3 text-red-500" /> Escrow Secure
                                            </span>
                                        </div>
                                        
                                        {/* VS Matchup Graphic */}
                                        <div className="flex items-center justify-between gap-4 mb-5">
                                            {/* Player 1 */}
                                            <div className="flex flex-col items-center flex-1 text-center bg-white/5 dark:bg-black/30 p-3 rounded-xl border border-white/5">
                                                <div className="relative w-12 h-12 rounded-full overflow-hidden border-2 border-amber-400 mb-2">
                                                    <div className="w-full h-full bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center font-black text-black text-sm">
                                                        PK
                                                    </div>
                                                </div>
                                                <h5 className="font-bold text-xs text-foreground truncate max-w-[80px]">PK_Legend</h5>
                                                <span className="text-[9px] text-muted-foreground">Level 72</span>
                                                <span className="text-[9px] text-green-500 font-bold mt-1">Win: 78%</span>
                                            </div>
                                            
                                            {/* VS Circle */}
                                            <div className="flex flex-col items-center">
                                                <div className="w-8 h-8 rounded-full bg-red-500/20 border border-red-500/30 flex items-center justify-center text-red-400 font-black text-xs animate-pulse">
                                                    VS
                                                </div>
                                                <h3 className="text-[8px] text-muted-foreground mt-2 uppercase tracking-widest">1v1 Solo</h3>
                                            </div>
                                            
                                            {/* Player 2 (Waiting) */}
                                            <div className="flex flex-col items-center flex-1 text-center bg-white/5 dark:bg-black/30 p-3 rounded-xl border border-white/5">
                                                <div className="relative w-12 h-12 rounded-full overflow-hidden border-2 border-dashed border-muted-foreground/30 mb-2 flex items-center justify-center bg-muted/20 animate-pulse">
                                                    <Users className="w-6 h-6 text-muted-foreground/50" />
                                                </div>
                                                <h5 className="font-bold text-xs text-muted-foreground truncate max-w-[80px]">Waiting...</h5>
                                                <span className="text-[9px] text-muted-foreground">Open Slot</span>
                                                <span className="text-[9px] text-amber-400 font-bold mt-1 animate-pulse">Accept Match</span>
                                            </div>
                                        </div>
                                        
                                        {/* Match Settings */}
                                        <div className="space-y-2 text-xs">
                                            <h6 className="font-bold text-[10px] text-muted-foreground uppercase tracking-widest">Match Settings</h6>
                                            <div className="grid grid-cols-2 gap-2">
                                                <div className="flex justify-between items-center p-2 bg-white/5 dark:bg-black/25 rounded border border-white/5">
                                                    <span className="text-muted-foreground text-[10px]">Ammo:</span>
                                                    <span className="text-foreground font-bold text-[10px]">Unlimited</span>
                                                </div>
                                                <div className="flex justify-between items-center p-2 bg-white/5 dark:bg-black/25 rounded border border-white/5">
                                                    <span className="text-muted-foreground text-[10px]">Skills:</span>
                                                    <span className="text-foreground font-bold text-[10px]">Disabled</span>
                                                </div>
                                                <div className="flex justify-between items-center p-2 bg-white/5 dark:bg-black/25 rounded border border-white/5">
                                                    <span className="text-muted-foreground text-[10px]">Property:</span>
                                                    <span className="text-foreground font-bold text-[10px]">Off</span>
                                                </div>
                                                <div className="flex justify-between items-center p-2 bg-white/5 dark:bg-black/25 rounded border border-white/5">
                                                    <span className="text-muted-foreground text-[10px]">Prize:</span>
                                                    <span className="text-amber-400 font-bold text-[10px]">200 🪙</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </motion.div>

                                {/* Text Column (Right on Desktop, first on Mobile) */}
                                <motion.div 
                                    initial={{ opacity: 0, x: 40 }}
                                    whileInView={{ opacity: 1, x: 0 }}
                                    viewport={{ once: true, margin: "-100px" }}
                                    transition={{ duration: 0.7, ease: "easeOut" }}
                                    className="space-y-6 text-left order-1 md:order-2"
                                >
                                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-500/10 text-red-400 text-xs font-bold border border-red-500/20">
                                        <Swords className="w-3.5 h-3.5" /> BATTLE ZONE
                                    </div>
                                    <h2 className="text-2xl md:text-4xl font-black text-foreground leading-tight">
                                        Create Custom Matches in Battle Zone
                                    </h2>
                                    <h3 className="text-lg md:text-xl font-bold text-muted-foreground mt-[-1rem]">
                                        1v1, 2v2 & 4v4 Challenges
                                    </h3>
                                    <p className="text-muted-foreground text-sm md:text-base leading-relaxed">
                                        Challenge the best! Create your own custom matches or challenge PC Legends. Set your own entry fee, play by your rules, and claim your victory coins instantly with our secure escrow system.
                                    </p>
                                    <Link href="/battle-zone">
                                        <button className="px-6 py-3 bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-500 hover:to-orange-500 text-white font-black rounded-xl shadow-lg shadow-red-600/20 hover:shadow-red-600/40 hover:scale-105 transition-all flex items-center gap-2 group">
                                            Join 1v1 Battle Zone <ArrowUpRight className="w-4 h-4 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                                        </button>
                                    </Link>
                                </motion.div>
                            </div>

                            {/* Block 3: Official Top Up */}
                            <div className="grid md:grid-cols-2 gap-8 md:gap-16 items-center">
                                {/* Text Column (Left) */}
                                <motion.div 
                                    initial={{ opacity: 0, x: -40 }}
                                    whileInView={{ opacity: 1, x: 0 }}
                                    viewport={{ once: true, margin: "-100px" }}
                                    transition={{ duration: 0.7, ease: "easeOut" }}
                                    className="space-y-6 text-left"
                                >
                                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 text-cyan-400 text-xs font-bold border border-cyan-500/20">
                                        <Gem className="w-3.5 h-3.5" /> OFFICIAL TOP UP
                                    </div>
                                    <h2 className="text-2xl md:text-4xl font-black text-foreground leading-tight">
                                        Fast & Secure Free Fire Top Up
                                    </h2>
                                    <p className="text-muted-foreground text-sm md:text-base leading-relaxed">
                                        Get instant Free Fire Diamonds, Weekly/Monthly Memberships, and Level Up Passes{city ? ` in ${cityName}` : ""}. We provide 100% official and safe top-up services directly to your UID.
                                    </p>
                                    <Link href="/topup">
                                        <button className="px-6 py-3 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-black rounded-xl shadow-lg shadow-cyan-600/20 hover:shadow-cyan-600/40 hover:scale-105 transition-all flex items-center gap-2 group">
                                            Get Free Fire Diamonds <ArrowUpRight className="w-4 h-4 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                                        </button>
                                    </Link>
                                </motion.div>

                                {/* Graphic Column (Right) */}
                                <motion.div 
                                    initial={{ opacity: 0, x: 40 }}
                                    whileInView={{ opacity: 1, x: 0 }}
                                    viewport={{ once: true, margin: "-100px" }}
                                    transition={{ duration: 0.7, ease: "easeOut" }}
                                    className="relative w-full h-full flex items-center justify-center min-h-[300px]"
                                >
                                    {/* Glowing Background Glow */}
                                    <div className="absolute w-64 h-64 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
                                    
                                    <div className="relative w-full max-w-sm glass rounded-3xl border border-white/10 p-5 overflow-hidden shadow-2xl">
                                        {/* Mock ID Input */}
                                        <div className="mb-4">
                                            <label className="block text-[10px] text-muted-foreground uppercase tracking-widest mb-1.5 font-bold">UID Top-Up Gateway</label>
                                            <div className="flex items-center gap-2 p-2.5 bg-white/5 dark:bg-black/40 rounded-xl border border-white/10">
                                                <span className="text-xs text-muted-foreground font-bold">UID:</span>
                                                <span className="text-xs text-foreground font-black tracking-wide flex-1">5493821038</span>
                                                <span className="flex items-center gap-1 text-[9px] bg-green-500/20 text-green-400 border border-green-500/30 px-2 py-0.5 rounded font-bold">
                                                    Verified
                                                </span>
                                            </div>
                                        </div>
                                        
                                        <h6 className="font-bold text-[10px] text-muted-foreground uppercase tracking-widest mb-2.5">Diamond Offers</h6>
                                        {/* Diamond Cards Grid */}
                                        <div className="grid grid-cols-2 gap-3 mb-4">
                                            {/* Pack 1 */}
                                            <div className="relative bg-white/5 dark:bg-black/30 p-3 rounded-xl border border-white/5 flex flex-col items-center text-center group hover:border-cyan-500/40 transition-colors">
                                                <div className="absolute top-2 right-2 px-1.5 py-0.5 rounded bg-cyan-500 text-black text-[8px] font-black uppercase">
                                                    +10%
                                                </div>
                                                <div className="w-10 h-10 rounded-full bg-cyan-500/10 flex items-center justify-center mb-2">
                                                    <Gem className="w-5 h-5 text-cyan-400" />
                                                </div>
                                                <span className="font-black text-sm text-foreground">110 Diamonds</span>
                                                <span className="text-[10px] text-muted-foreground mt-1">PKR 190</span>
                                            </div>
                                            
                                            {/* Pack 2 */}
                                            <div className="relative bg-white/5 dark:bg-black/30 p-3 rounded-xl border border-amber-500/30 flex flex-col items-center text-center group hover:border-amber-500/60 transition-colors">
                                                <div className="absolute top-2 right-2 px-1.5 py-0.5 rounded bg-amber-500 text-black text-[8px] font-black uppercase">
                                                    Best Value
                                                </div>
                                                <div className="w-10 h-10 rounded-full bg-amber-500/10 flex items-center justify-center mb-2">
                                                    <Crown className="w-5 h-5 text-amber-400" />
                                                </div>
                                                <span className="font-black text-sm text-foreground">Weekly Pass</span>
                                                <span className="text-[10px] text-muted-foreground mt-1">PKR 450</span>
                                            </div>
                                        </div>
                                        
                                        {/* Security Notice */}
                                        <div className="flex items-center gap-2 p-2.5 bg-cyan-500/5 rounded-xl border border-cyan-500/10 text-[10px] text-cyan-400">
                                            <Shield className="w-4 h-4 flex-shrink-0" />
                                            <span>100% Garena Official API. Instant delivery to your account inbox.</span>
                                        </div>
                                    </div>
                                </motion.div>
                            </div>

                            {/* Block 4: Secure Wallet */}
                            <div className="grid md:grid-cols-2 gap-8 md:gap-16 items-center">
                                {/* Graphic Column (Left on Desktop, second on Mobile) */}
                                <motion.div 
                                    initial={{ opacity: 0, x: -40 }}
                                    whileInView={{ opacity: 1, x: 0 }}
                                    viewport={{ once: true, margin: "-100px" }}
                                    transition={{ duration: 0.7, ease: "easeOut" }}
                                    className="relative w-full h-full flex items-center justify-center min-h-[300px] order-2 md:order-1"
                                >
                                    {/* Glowing Background Glow */}
                                    <div className="absolute w-64 h-64 bg-green-500/10 rounded-full blur-3xl pointer-events-none" />
                                    
                                    <div className="relative w-full max-w-sm glass rounded-3xl border border-white/10 p-5 overflow-hidden shadow-2xl">
                                        {/* Balance Info */}
                                        <div className="flex items-center justify-between mb-4 border-b border-white/5 pb-3">
                                            <div>
                                                <p className="text-[9px] text-muted-foreground uppercase tracking-widest">Available Balance</p>
                                                <p className="text-xl font-black text-foreground mt-0.5">PKR 4,850.00</p>
                                            </div>
                                            <div className="px-2 py-1 rounded bg-green-500/10 border border-green-500/20 text-green-500 text-[10px] font-bold">
                                                Verified Account
                                            </div>
                                        </div>
                                        
                                        {/* Transactions */}
                                        <h6 className="font-bold text-[10px] text-muted-foreground uppercase tracking-widest mb-2.5">Recent Payouts</h6>
                                        <div className="space-y-2 mb-4">
                                            {/* EP Payout */}
                                            <div className="flex items-center justify-between p-2.5 bg-white/5 dark:bg-black/30 rounded-xl border border-white/5 text-xs">
                                                <div className="flex items-center gap-2">
                                                    <div className="w-8 h-8 rounded-lg bg-green-600/20 border border-green-600/30 flex items-center justify-center font-bold text-green-500 text-[9px]">
                                                        EP
                                                    </div>
                                                    <div>
                                                        <p className="font-bold text-foreground">Withdrawal to EasyPaisa</p>
                                                        <p className="text-[9px] text-muted-foreground">Today, 04:12 PM</p>
                                                    </div>
                                                </div>
                                                <div className="text-right">
                                                    <p className="font-black text-red-400">-PKR 2,500</p>
                                                    <p className="text-[9px] text-green-500 font-bold">🟢 Success</p>
                                                </div>
                                            </div>
                                            
                                            {/* JC Deposit */}
                                            <div className="flex items-center justify-between p-2.5 bg-white/5 dark:bg-black/30 rounded-xl border border-white/5 text-xs">
                                                <div className="flex items-center gap-2">
                                                    <div className="w-8 h-8 rounded-lg bg-red-600/20 border border-red-600/30 flex items-center justify-center font-bold text-red-500 text-[9px]">
                                                        JC
                                                    </div>
                                                    <div>
                                                        <p className="font-bold text-foreground">Deposit via JazzCash</p>
                                                        <p className="text-[9px] text-muted-foreground">Yesterday, 08:30 PM</p>
                                                    </div>
                                                </div>
                                                <div className="text-right">
                                                    <p className="font-black text-green-400">+PKR 1,500</p>
                                                    <p className="text-[9px] text-green-500 font-bold">🟢 Success</p>
                                                </div>
                                            </div>
                                        </div>
                                        
                                        {/* Escrow Lock Indicator */}
                                        <div className="flex items-center justify-between text-[10px] text-muted-foreground">
                                            <span className="flex items-center gap-1"><Lock className="w-3 h-3 text-amber-400" /> Funds Protected</span>
                                            <span>24/7 Support Available</span>
                                        </div>
                                    </div>
                                </motion.div>

                                {/* Text Column (Right on Desktop, first on Mobile) */}
                                <motion.div 
                                    initial={{ opacity: 0, x: 40 }}
                                    whileInView={{ opacity: 1, x: 0 }}
                                    viewport={{ once: true, margin: "-100px" }}
                                    transition={{ duration: 0.7, ease: "easeOut" }}
                                    className="space-y-6 text-left order-1 md:order-2"
                                >
                                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 text-xs font-bold border border-emerald-500/20">
                                        <Wallet className="w-3.5 h-3.5" /> SECURE WALLET
                                    </div>
                                    <h3 className="text-2xl md:text-4xl font-black text-foreground leading-tight">
                                        Instant Deposits & Withdrawals
                                    </h3>
                                    <p className="text-muted-foreground text-sm md:text-base leading-relaxed">
                                        Manage your winnings with ease. Guru Zone supports fast, secure, and automated deposits and withdrawals via JazzCash and EasyPaisa. Your funds are always safe with us.
                                    </p>
                                    <Link href="/login">
                                        <button className="px-6 py-3 bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-500 hover:to-green-500 text-white font-black rounded-xl shadow-lg shadow-emerald-600/20 hover:shadow-emerald-600/40 hover:scale-105 transition-all flex items-center gap-2 group">
                                            Manage Wallet <ArrowUpRight className="w-4 h-4 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                                        </button>
                                    </Link>
                                </motion.div>
                            </div>
                        </div>
                    </div>


                    {/* How Guru Zone Works Section */}
                    <section className="relative z-10 py-20 border-y border-border bg-gradient-to-b from-transparent via-card/20 to-transparent">
                        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                            <div className="text-center mb-16">
                                <span className="inline-flex items-center gap-1.5 text-primary font-black tracking-widest uppercase text-xs px-3 py-1 rounded-full bg-primary/10 border border-primary/20 mb-4">
                                    START EARNING
                                </span>
                                <h2 className="text-3xl md:text-5xl font-black text-foreground mt-2 tracking-tighter uppercase">
                                    HOW TO <span className="text-primary text-stroke-primary dark:text-primary">START WINNING</span>
                                </h2>
                                <p className="text-muted-foreground mt-4 max-w-lg mx-auto text-sm">
                                    Follow three simple steps to start competing in your favorite game modes and withdraw rewards.
                                </p>
                            </div>

                            <div className="grid md:grid-cols-3 gap-8 relative z-10">
                                {/* Connecting Dashed Line for Desktop */}
                                <div className="hidden md:block absolute top-[25%] left-[12%] right-[12%] h-0.5 border-t-2 border-dashed border-border -z-10" />

                                {/* Step 1 */}
                                <motion.div
                                    initial={{ opacity: 0, y: 30 }}
                                    whileInView={{ opacity: 1, y: 0 }}
                                    viewport={{ once: true }}
                                    transition={{ duration: 0.5, delay: 0.1 }}
                                    className="group relative bg-card/45 backdrop-blur-md border border-border rounded-2xl p-8 transition-all duration-300 hover:-translate-y-1.5 hover:border-primary/50 hover:shadow-[0_0_25px_rgba(255,215,0,0.25)] flex flex-col items-center text-center"
                                >
                                    <div className="absolute top-4 right-6 text-5xl font-black text-foreground/5 select-none font-mono">01</div>
                                    <div className="w-14 h-14 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center mb-6 group-hover:bg-primary group-hover:text-black transition-all duration-300">
                                        <User className="w-7 h-7 text-primary group-hover:text-black transition-colors" />
                                    </div>
                                    <h3 className="text-xl font-bold text-foreground mb-3">Create Account</h3>
                                    <p className="text-muted-foreground text-sm leading-relaxed">
                                        Sign up and set up your Free Fire Game ID in seconds.
                                    </p>
                                </motion.div>

                                {/* Step 2 */}
                                <motion.div
                                    initial={{ opacity: 0, y: 30 }}
                                    whileInView={{ opacity: 1, y: 0 }}
                                    viewport={{ once: true }}
                                    transition={{ duration: 0.5, delay: 0.2 }}
                                    className="group relative bg-card/45 backdrop-blur-md border border-border rounded-2xl p-8 transition-all duration-300 hover:-translate-y-1.5 hover:border-cyan-500/50 hover:shadow-[0_0_25px_rgba(6,182,212,0.25)] flex flex-col items-center text-center"
                                >
                                    <div className="absolute top-4 right-6 text-5xl font-black text-foreground/5 select-none font-mono">02</div>
                                    <div className="w-14 h-14 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center mb-6 group-hover:bg-cyan-500 group-hover:text-black transition-all duration-300">
                                        <PlusCircle className="w-7 h-7 text-cyan-400 group-hover:text-black transition-colors" />
                                    </div>
                                    <h3 className="text-xl font-bold text-foreground mb-3">Add Funds</h3>
                                    <p className="text-muted-foreground text-sm leading-relaxed">
                                        Top up your wallet securely using local payment methods.
                                    </p>
                                </motion.div>

                                {/* Step 3 */}
                                <motion.div
                                    initial={{ opacity: 0, y: 30 }}
                                    whileInView={{ opacity: 1, y: 0 }}
                                    viewport={{ once: true }}
                                    transition={{ duration: 0.5, delay: 0.3 }}
                                    className="group relative bg-card/45 backdrop-blur-md border border-border rounded-2xl p-8 transition-all duration-300 hover:-translate-y-1.5 hover:border-emerald-500/50 hover:shadow-[0_0_25px_rgba(16,185,129,0.25)] flex flex-col items-center text-center"
                                >
                                    <div className="absolute top-4 right-6 text-5xl font-black text-foreground/5 select-none font-mono">03</div>
                                    <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mb-6 group-hover:bg-emerald-500 group-hover:text-black transition-all duration-300">
                                        <Gamepad className="w-7 h-7 text-emerald-400 group-hover:text-black transition-colors" />
                                    </div>
                                    <h3 className="text-xl font-bold text-foreground mb-3">Play & Earn</h3>
                                    <p className="text-muted-foreground text-sm leading-relaxed">
                                        Join tournaments or Battle Zone matches and withdraw your winnings instantly.
                                    </p>
                                </motion.div>
                            </div>
                        </div>
                    </section>

                    {/* Why Choose Guru Zone Section */}
                    <section className="relative z-10 py-20 bg-background/40">
                        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                            <div className="text-center mb-16">
                                <span className="inline-flex items-center gap-1.5 text-primary font-black tracking-widest uppercase text-xs px-3 py-1 rounded-full bg-primary/10 border border-primary/20 mb-4">
                                    TRUSTED GAMING PLATFORM
                                </span>
                                <h2 className="text-3xl md:text-5xl font-black text-foreground mt-2 tracking-tighter uppercase">
                                    {city ? `Why Gamers in ${cityName} Trust Guru Zone` : "Why Gamers Trust Guru Zone Since 2023"}
                                </h2>
                                <p className="text-muted-foreground mt-4 max-w-lg mx-auto text-sm">
                                    {city 
                                        ? `Join thousands of players in ${cityName} who trust us for a premium esports experience built around security, speed, and local support.` 
                                        : "We offer a premium esports experience built around security, speed, and player support."}
                                </p>
                            </div>

                            <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
                                {/* Point 1: 100% Safe & Secure */}
                                <motion.div
                                    initial={{ opacity: 0, scale: 0.95 }}
                                    whileInView={{ opacity: 1, scale: 1 }}
                                    viewport={{ once: true }}
                                    transition={{ duration: 0.4, delay: 0.1 }}
                                    className="group bg-card/50 backdrop-blur-sm border border-border p-6 rounded-2xl text-center flex flex-col items-center hover:border-amber-400/40 hover:shadow-[0_0_20px_rgba(251,191,36,0.15)] hover:-translate-y-1 transition-all duration-300"
                                >
                                    <div className="w-12 h-12 rounded-xl bg-amber-400/10 border border-amber-400/20 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                                        <Shield className="w-6 h-6 text-amber-400" />
                                    </div>
                                    <h3 className="text-sm md:text-base font-black text-foreground mb-1 group-hover:text-amber-400 transition-colors">100% Safe & Secure</h3>
                                    <p className="text-[10px] md:text-[11px] text-muted-foreground leading-normal">{city ? `Trusted by the ${cityName} eSports Community.` : "Certified escrow & account protection"}</p>
                                </motion.div>

                                {/* Point 2: Instant Payouts */}
                                <motion.div
                                    initial={{ opacity: 0, scale: 0.95 }}
                                    whileInView={{ opacity: 1, scale: 1 }}
                                    viewport={{ once: true }}
                                    transition={{ duration: 0.4, delay: 0.2 }}
                                    className="group bg-card/50 backdrop-blur-sm border border-border p-6 rounded-2xl text-center flex flex-col items-center hover:border-red-500/40 hover:shadow-[0_0_20px_rgba(239,68,68,0.15)] hover:-translate-y-1 transition-all duration-300"
                                >
                                    <div className="w-12 h-12 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                                        <Zap className="w-6 h-6 text-red-500" />
                                    </div>
                                    <h3 className="text-sm md:text-base font-black text-foreground mb-1 group-hover:text-red-500 transition-colors">Instant Payouts</h3>
                                    <p className="text-[10px] md:text-[11px] text-muted-foreground leading-normal">EasyPaisa & JazzCash within 15 minutes</p>
                                </motion.div>

                                {/* Point 3: Anti-Cheat System */}
                                <motion.div
                                    initial={{ opacity: 0, scale: 0.95 }}
                                    whileInView={{ opacity: 1, scale: 1 }}
                                    viewport={{ once: true }}
                                    transition={{ duration: 0.4, delay: 0.3 }}
                                    className="group bg-card/50 backdrop-blur-sm border border-border p-6 rounded-2xl text-center flex flex-col items-center hover:border-cyan-400/40 hover:shadow-[0_0_20px_rgba(34,211,238,0.15)] hover:-translate-y-1 transition-all duration-300"
                                >
                                    <div className="w-12 h-12 rounded-xl bg-cyan-400/10 border border-cyan-400/20 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                                        <Lock className="w-6 h-6 text-cyan-400" />
                                    </div>
                                    <h3 className="text-sm md:text-base font-black text-foreground mb-1 group-hover:text-cyan-400 transition-colors">Anti-Cheat System</h3>
                                    <p className="text-[10px] md:text-[11px] text-muted-foreground leading-normal">Rigorous monitoring & zero hack tolerance</p>
                                </motion.div>

                                {/* Point 4: 24/7 Support */}
                                <motion.div
                                    initial={{ opacity: 0, scale: 0.95 }}
                                    whileInView={{ opacity: 1, scale: 1 }}
                                    viewport={{ once: true }}
                                    transition={{ duration: 0.4, delay: 0.4 }}
                                    className="group bg-card/50 backdrop-blur-sm border border-border p-6 rounded-2xl text-center flex flex-col items-center hover:border-emerald-400/40 hover:shadow-[0_0_20px_rgba(52,211,153,0.15)] hover:-translate-y-1 transition-all duration-300"
                                >
                                    <div className="w-12 h-12 rounded-xl bg-emerald-400/10 border border-emerald-400/20 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                                        <Headphones className="w-6 h-6 text-emerald-400" />
                                    </div>
                                    <h3 className="text-sm md:text-base font-black text-foreground mb-1 group-hover:text-emerald-400 transition-colors">24/7 Support</h3>
                                    <p className="text-[10px] md:text-[11px] text-muted-foreground leading-normal">{city ? `Instant WhatsApp delivery for all ${cityName} players.` : "Direct WhatsApp & ticket support anytime"}</p>
                                </motion.div>
                            </div>
                        </div>
                    </section>


                    {/* FAQ Section */}
                    <section 
                        itemScope 
                        itemType="https://schema.org/FAQPage"
                        id="faqs"
                        className="relative z-10 py-24 bg-background/50 max-w-4xl mx-auto px-4"
                    >
                        <div className="text-center mb-16">
                            <span className="inline-flex items-center gap-1.5 text-primary font-black tracking-widest uppercase text-xs px-3 py-1 rounded-full bg-primary/10 border border-primary/20 mb-4">
                                QUESTIONS & ANSWERS
                            </span>
                            <h2 className="text-3xl md:text-5xl font-black text-foreground tracking-tighter uppercase px-2">
                                FREQUENTLY ASKED <span className="text-primary text-stroke-primary dark:text-primary">QUESTIONS</span>
                            </h2>
                            <p className="text-muted-foreground mt-4 max-w-md mx-auto text-sm">
                                Find answers to common queries about deposits, tournament rules, and diamond deliveries.
                            </p>
                        </div>
                        <div className="space-y-4">
                            {pageData?.faqs?.length > 0 ? (
                                pageData.faqs.filter((f: any) => f.isActive).map((faq: any, i: number) => (
                                    <FaqItem key={i} q={faq.question} a={faq.answer} />
                                ))
                            ) : (
                                <>
                                    <FaqItem 
                                        q={city ? `How to buy Free Fire Diamonds in ${cityName}?` : "How do I buy Free Fire Diamonds in Pakistan?"} 
                                        a={city ? (
                                            <>
                                                Guru Zone offers instant Free Fire top-ups in {cityName} without any hassle. Simply enter your UID, select your package, and pay securely via local methods like JazzCash or EasyPaisa.
                                            </>
                                        ) : (
                                            <>
                                                You can easily buy Free Fire Diamonds through Guru Zone's official <Link href="/topup" className="text-primary hover:underline font-bold">Top Up section</Link> using your game UID. We support secure payments via JazzCash and EasyPaisa.
                                            </>
                                        )} 
                                    />
                                    <FaqItem 
                                        q={city ? `Are there any custom Free Fire tournaments in ${cityName}?` : "Is Battle Zone safe to play?"} 
                                        a={city ? (
                                            <>
                                                Yes! Gamers from {cityName} can join our daily custom rooms and Battle Zone matches to compete and earn real rewards.
                                            </>
                                        ) : (
                                            <>
                                                Yes! Our <Link href="/battle-zone" className="text-primary hover:underline font-bold">Battle Zone</Link> features an automated 15-minute room ID system and a strict dispute resolution process requiring screen recordings to ensure 100% fair play.
                                            </>
                                        )} 
                                    />
                                    <FaqItem 
                                        q="How long do withdrawals take?" 
                                        a="Withdrawals requested to JazzCash or EasyPaisa are processed extremely fast, often within a few minutes to a few hours depending on the queue." 
                                    />
                                    <FaqItem 
                                        q="Can I challenge PC players on mobile?" 
                                        a="Absolutely. Guru Zone allows you to specifically host or join matches against PC Legends or keep it strictly mobile-only in our Battle Zone." 
                                    />
                                </>
                            )}
                        </div>
                    </section>

                    <footer className="relative z-10 border-t border-border bg-card text-card-foreground pt-16 pb-8">
                        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 md:grid-cols-5 gap-12 mb-12 text-center md:text-left">
                            <div className="col-span-1 md:col-span-2">
                                <h3 className="text-2xl font-black text-primary mb-4 uppercase tracking-tighter">GURU ZONE</h3>
                                <p className="text-muted-foreground max-w-sm mx-auto md:mx-0 mb-6">
                                    {pageData?.about?.content || "The ultimate platform for esports enthusiasts. We turn your gaming passion into a professional career."}
                                </p>
                                <div className="flex gap-4 justify-center md:justify-start">
                                    <SocialIcon icon={Twitter} href={pageData?.socialLinks?.twitter} />
                                    <SocialIcon icon={Instagram} href={pageData?.socialLinks?.instagram} />
                                    <SocialIcon icon={Youtube} href={pageData?.socialLinks?.youtube} />
                                </div>
                            </div>
                            <div>
                                <h4 className="font-bold text-foreground mb-4">Play</h4>
                                <ul className="space-y-2 text-muted-foreground text-sm">
                                    <li><Link href="/tournaments" className="hover:text-primary transition-colors">Tournaments</Link></li>
                                    <li><Link href="/battle-zone" className="hover:text-primary transition-colors">Battle Zone</Link></li>
                                </ul>
                            </div>
                            <div>
                                <h4 className="font-bold text-foreground mb-4">Store</h4>
                                <ul className="space-y-2 text-muted-foreground text-sm">
                                    <li><Link href="/topup" className="hover:text-primary transition-colors">Free Fire Top Up</Link></li>
                                    <li><Link href="/topup" className="hover:text-primary transition-colors">Memberships & Passes</Link></li>
                                </ul>
                            </div>
                            <div>
                                <h4 className="font-bold text-foreground mb-4">Support</h4>
                                <ul className="space-y-2 text-muted-foreground text-sm">
                                    <li><Link href="/#faqs" className="hover:text-primary transition-colors">FAQs</Link></li>
                                    <li><Link href="/contact" className="hover:text-primary transition-colors">Contact Us</Link></li>
                                </ul>
                            </div>
                        </div>
                        <div className="text-center text-muted-foreground text-sm pt-8 border-t border-border">
                            © {new Date().getFullYear()} Guru Zone Esports. All rights reserved.
                        </div>
                    </footer>

                </main>
            )
            }
        </AnimatePresence >
    );
}

// Sub-components
function StatItem({ icon: Icon, label, value }: { icon: any, label: string, value: string }) {
    return (
        <div className="flex flex-col items-center justify-center text-center space-y-1">
            <Icon className="w-5 h-5 text-primary mb-1 opacity-80" />
            <span className="text-xl md:text-2xl font-black text-foreground">{value}</span>
            <span className="text-xs md:text-sm text-muted-foreground uppercase tracking-wider">{label}</span>
        </div>
    );
}

function FeatureCard({ icon: Icon, title, desc }: { icon: any, title: string, desc: string }) {
    return (
        <div className="group p-8 rounded-3xl glass hover:border-primary/50 transition-all duration-300 hover:-translate-y-2 relative overflow-hidden shadow-lg flex flex-col items-center text-center">
            <div className="absolute inset-0 bg-gradient-to-b from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            <div className="relative flex flex-col items-center">
                <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mb-6 group-hover:bg-primary group-hover:text-black transition-colors duration-300 shadow-[0_0_15px_rgba(255,215,0,0.2)]">
                    <Icon className="w-7 h-7 text-primary group-hover:text-black transition-colors" />
                </div>
                <h3 className="text-xl font-bold text-foreground mb-3">{title}</h3>
                <p className="text-muted-foreground leading-relaxed text-sm">{desc}</p>
            </div>
        </div>
    );
}



function FaqItem({ q, a }: { q: string, a: React.ReactNode }) {
    const [isOpen, setIsOpen] = useState(false);
    return (
        <div 
            itemScope 
            itemProp="mainEntity" 
            itemType="https://schema.org/Question"
            className="border border-border rounded-2xl bg-card/40 backdrop-blur-sm overflow-hidden hover:border-primary/40 transition-colors duration-300"
        >
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="w-full flex items-center justify-between p-5 text-left font-black text-foreground hover:bg-muted/30 transition-colors group"
                aria-expanded={isOpen}
            >
                <span itemProp="name" className="text-sm md:text-base tracking-tight">{q}</span>
                <span className="ml-4 flex-shrink-0 w-8 h-8 rounded-full bg-muted flex items-center justify-center border border-border group-hover:border-primary/30 transition-colors">
                    <ChevronRight className={`w-4 h-4 text-muted-foreground transition-transform duration-300 ${isOpen ? 'rotate-90 text-primary' : ''}`} />
                </span>
            </button>
            <motion.div
                initial={false}
                animate={{ height: isOpen ? "auto" : 0 }}
                transition={{ duration: 0.3, ease: "easeInOut" }}
                className="overflow-hidden"
            >
                <div 
                    itemProp="acceptedAnswer" 
                    itemScope 
                    itemType="https://schema.org/Answer"
                    className="p-5 pt-0 border-t border-border/20 text-xs md:text-sm text-muted-foreground leading-relaxed"
                >
                    <p itemProp="text">{a}</p>
                </div>
            </motion.div>
        </div>
    );
}

function SocialIcon({ icon: Icon, href }: { icon: any, href?: string }) {
    return (
        <a 
            href={href || "#"} 
            target="_blank" 
            rel="noopener noreferrer" 
            className="w-10 h-10 rounded-full bg-muted flex items-center justify-center text-muted-foreground hover:bg-primary hover:text-black transition-all duration-300"
        >
            <Icon className="w-5 h-5" />
        </a>
    );
}


