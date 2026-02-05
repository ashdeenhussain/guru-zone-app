"use client";

import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, Trophy, Zap, Shield, Users, Gamepad2, Timer, Crosshair, Gift, HelpCircle, ChevronRight, Twitter, Instagram, Youtube, Gem, Crown, TrendingUp } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { useState, useEffect } from "react";
import SplashScreen from "@/components/SplashScreen";
import ThemeToggle from "@/components/ThemeToggle";

export default function LandingPage() {
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const timer = setTimeout(() => {
            setIsLoading(false);
        }, 1500);

        return () => clearTimeout(timer);
    }, []);

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

                    {/* Theme Toggle Button (Fixed Bottom Right) */}
                    <div className="fixed bottom-6 right-6 z-[100] shadow-2xl rounded-xl">
                        <ThemeToggle />
                    </div>

                    {/* Background Image & Overlay */}
                    <div className="absolute inset-0 z-0 select-none fixed">
                        <Image
                            src="/hero-bg.png"
                            alt="Gaming Background"
                            fill
                            className="object-cover opacity-10 dark:opacity-40 transition-opacity duration-300"
                            priority
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
                                        src="/logo.png"
                                        alt="Guru Zone Logo"
                                        fill
                                        className="object-cover"
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

                    {/* HERO Section */}
                    <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-32 pb-16 flex flex-col items-center">

                        <motion.div
                            variants={containerVariants}
                            initial="hidden"
                            animate="visible"
                            className="text-center max-w-4xl"
                        >
                            {/* Badge */}
                            <motion.div variants={itemVariants} className="flex justify-center mb-8">
                                <div className="inline-flex items-center gap-2 px-5 py-2 rounded-full border border-primary/30 bg-primary/10 backdrop-blur-md shadow-[0_0_20px_rgba(255,215,0,0.15)]">
                                    <span className="relative flex h-2 w-2">
                                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                                        <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
                                    </span>
                                    <span className="text-xs uppercase tracking-[0.2em] text-primary font-bold">#1 Esports Platform</span>
                                </div>
                            </motion.div>

                            {/* Headline */}
                            <motion.h1
                                variants={itemVariants}
                                className="text-5xl md:text-7xl lg:text-8xl font-black tracking-tight mb-6 drop-shadow-2xl leading-[0.9]"
                            >
                                DOMINATE <br className="hidden md:block" />
                                <span className="text-transparent bg-clip-text bg-gradient-to-b from-primary to-yellow-600 filter drop-shadow-sm">THE BATTLEGROUND</span>
                            </motion.h1>

                            {/* Subheadline */}
                            <motion.p
                                variants={itemVariants}
                                className="text-lg md:text-2xl text-muted-foreground mb-10 leading-relaxed max-w-2xl mx-auto font-light"
                            >
                                Join the elite arena where skill pays off. Compete in daily
                                <span className="text-primary font-bold"> High-Stakes Tournaments</span>,
                                climbing the ranks to become a legend.
                            </motion.p>

                            {/* CTAs */}
                            <motion.div
                                variants={itemVariants}
                                className="flex flex-col sm:flex-row items-center justify-center gap-6 mb-20"
                            >
                                <Link href="/signup" className="w-full sm:w-auto">
                                    <button className="group relative w-full sm:w-auto px-10 py-5 bg-primary text-black font-extrabold text-xl uppercase tracking-widest rounded-xl overflow-hidden hover:scale-105 transition-transform duration-300 shadow-[0_0_40px_-10px_rgba(255,215,0,0.6)]">
                                        <div className="absolute inset-0 bg-white/40 translate-y-full group-hover:translate-y-0 transition-transform duration-300 skew-y-12" />
                                        <div className="relative flex items-center justify-center gap-3">
                                            Get Started
                                            <ArrowRight className="w-6 h-6 group-hover:translate-x-1 transition-transform" />
                                        </div>
                                    </button>
                                </Link>
                                <Link href="/login" className="w-full sm:w-auto">
                                    <button className="group w-full sm:w-auto px-10 py-5 glass text-foreground font-bold text-xl uppercase tracking-widest rounded-xl hover:bg-white/10 transition-all border border-white/10 hover:border-white/20">
                                        Sign In
                                    </button>
                                </Link>
                            </motion.div>

                            {/* Stats Strip */}
                            <motion.div
                                variants={itemVariants}
                                className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-4 w-full max-w-5xl mx-auto p-4 rounded-2xl border border-border bg-card/40 backdrop-blur-md shadow-lg"
                            >
                                <StatItem icon={Users} label="Active Players" value="10K+" />
                                <StatItem icon={Trophy} label="Prize Pool" value="5L+ Coins" />
                                <StatItem icon={Gamepad2} label="Daily Matches" value="50+" />
                                <StatItem icon={Timer} label="Instant Payout" value="24/7" />
                            </motion.div>
                        </motion.div>
                    </div>

                    {/* Features Section */}
                    <div className="relative z-10 max-w-7xl mx-auto px-4 pb-16">
                        <div className="text-center mb-12">
                            <span className="text-primary font-bold tracking-wider uppercase text-sm">Why Choose Guru Zone?</span>
                            <h2 className="text-3xl md:text-5xl font-black text-foreground mt-2">THE ELITE EXPERIENCE</h2>
                        </div>
                        <div className="grid md:grid-cols-3 gap-6">
                            <FeatureCard
                                icon={Trophy}
                                title="Pro Tournaments"
                                desc="Compete in professionally managed rooms with fair play monitoring and live scoring."
                            />
                            <FeatureCard
                                icon={Zap}
                                title="Instant Withdrawals"
                                desc="Win matches and get your earnings transferred directly to your account instantly."
                            />
                            <FeatureCard
                                icon={Shield}
                                title="Anti-Cheat Systems"
                                desc="Our advanced detection ensures a level playing field. Zero tolerance for hackers."
                            />
                        </div>
                    </div>

                    {/* Trending Tournaments / Live Action */}
                    <section className="relative z-10 py-16 overflow-hidden">
                        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                            <div className="text-center mb-12">
                                <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-500/10 text-red-500 text-xs font-bold tracking-wider uppercase mb-4 animate-pulse border border-red-500/20">
                                    <span className="w-2 h-2 rounded-full bg-red-500"></span> Live Action
                                </span>
                                <h2 className="text-3xl md:text-5xl font-black text-foreground px-2">
                                    TRENDING BATTLES
                                </h2>
                                <p className="text-muted-foreground mt-4 max-w-lg mx-auto">
                                    Spots are filling fast. Choose your battleground and prove your worth.
                                </p>
                            </div>

                            <div className="grid md:grid-cols-3 gap-6">
                                {/* Card 1 */}
                                <TournamentCard
                                    map="BERMUDA"
                                    mode="SOLO"
                                    modeColor="bg-primary text-black"
                                    title="Daily Survival #42"
                                    prize="1,000 Coins"
                                    entry="20 Coins"
                                    filled="41/48 Players"
                                    status="Filling Fast"
                                    statusColor="text-green-500"
                                    progress={85}
                                    progressColor="bg-green-500"
                                />

                                {/* Card 2 */}
                                <TournamentCard
                                    map="PURGATORY"
                                    mode="SQUAD"
                                    modeColor="bg-purple-500 text-white"
                                    title="Pro League Qualifier"
                                    prize="5,000 Coins"
                                    entry="100 Coins"
                                    filled="6/12 Squads"
                                    status="Open"
                                    statusColor="text-yellow-500"
                                    progress={45}
                                    progressColor="bg-yellow-500"
                                />

                                {/* Card 3 */}
                                <TournamentCard
                                    map="KALAHARI"
                                    mode="DUO vs DUO"
                                    modeColor="bg-blue-500 text-white"
                                    title="Sniper Only Challenge"
                                    prize="2,000 Coins"
                                    entry="50 Coins"
                                    filled="23/24 Duos"
                                    status="Last Spot!"
                                    statusColor="text-red-500"
                                    progress={95}
                                    progressColor="bg-red-500"
                                />
                            </div>
                        </div>
                    </section>

                    {/* How It Works Section */}
                    <section className="relative z-10 bg-card/30 py-16 border-y border-border">
                        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                            <div className="text-center mb-16">
                                <span className="text-primary font-bold tracking-wider uppercase text-sm">Start Your Journey</span>
                                <h2 className="text-3xl md:text-5xl font-black text-foreground mt-2">HOW IT WORKS</h2>
                            </div>

                            <div className="grid md:grid-cols-3 gap-8 relative">
                                {/* Connecting Line (Desktop) */}
                                <div className="hidden md:block absolute top-12 left-[16%] right-[16%] h-0.5 bg-gradient-to-r from-transparent via-primary/30 to-transparent dashed-line" />

                                <StepCard
                                    number="01"
                                    icon={Users}
                                    title="Create Account"
                                    desc="Sign up in seconds and verified your profile to join the elite community."
                                />
                                <StepCard
                                    number="02"
                                    icon={Crosshair}
                                    title="Join Room"
                                    desc="Browse daily tournaments, pick your squad, and enter the battle room."
                                />
                                <StepCard
                                    number="03"
                                    icon={Gift}
                                    title="Win & Withdraw"
                                    desc="Dominate the game, claim your rewards, and withdraw cash instantly."
                                />
                            </div>
                        </div>
                    </section>

                    {/* Breaking the Flow: Diamond Top-up Section */}
                    <section className="relative z-10 py-16 bg-gradient-to-r from-blue-900/20 to-purple-900/20 border-y border-white/5 overflow-hidden">
                        {/* Decorative background elements */}
                        <div className="absolute top-0 right-0 p-20 bg-blue-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
                        <div className="absolute bottom-0 left-0 p-20 bg-purple-500/10 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2"></div>

                        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                            <div className="grid md:grid-cols-2 gap-12 items-center">
                                {/* Left Content */}
                                <div className="text-center md:text-left">
                                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 text-blue-400 text-xs font-bold tracking-wider uppercase mb-6 border border-blue-500/20">
                                        <Zap className="w-3 h-3" /> Instant Delivery
                                    </div>
                                    <h2 className="text-3xl md:text-5xl font-black text-foreground mb-6">
                                        GEAR UP WITH <br />
                                        <span className="text-blue-500">OFFICIAL TOP-UPS</span>
                                    </h2>
                                    <p className="text-muted-foreground text-lg mb-8 max-w-md mx-auto md:mx-0">
                                        Running low on diamonds? Top-up instantly with your tournament winnings. 100% safe, official ID-based transfer.
                                    </p>

                                    <div className="flex flex-wrap gap-4 justify-center md:justify-start">
                                        <div className="flex items-center gap-2 text-sm text-foreground font-bold bg-card/50 px-4 py-2 rounded-lg border border-border">
                                            <Shield className="w-4 h-4 text-green-500" /> 100% Safe
                                        </div>
                                        <div className="flex items-center gap-2 text-sm text-foreground font-bold bg-card/50 px-4 py-2 rounded-lg border border-border">
                                            <Timer className="w-4 h-4 text-primary" /> 24/7 Available
                                        </div>
                                    </div>
                                </div>

                                {/* Right Cards (Topup Store Preview) */}
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full">
                                    {/* Category 1: Diamond Top-up */}
                                    <div className="bg-card border border-border rounded-xl p-6 flex flex-col items-center hover:border-blue-500/50 transition-all hover:-translate-y-1 group relative overflow-hidden">
                                        <div className="absolute top-0 right-0 p-16 bg-blue-500/10 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2 group-hover:bg-blue-500/20 transition-all"></div>
                                        <div className="w-16 h-16 mb-4 rounded-2xl bg-blue-500/10 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                                            <Gem className="w-8 h-8 text-blue-500" />
                                        </div>
                                        <h3 className="text-xl font-black text-foreground mb-2">DIAMOND TOP-UP</h3>
                                        <p className="text-sm text-muted-foreground text-center mb-6">Instant delivery to your UID. Regular & Bonus packs available.</p>
                                        <button className="w-full py-3 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl transition-colors shadow-lg shadow-blue-900/20">
                                            Top-up Now
                                        </button>
                                    </div>

                                    {/* Category 2: Memberships */}
                                    <div className="bg-card border border-border rounded-xl p-6 flex flex-col items-center hover:border-yellow-500/50 transition-all hover:-translate-y-1 group relative overflow-hidden">
                                        <div className="absolute top-0 right-0 p-16 bg-yellow-500/10 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2 group-hover:bg-yellow-500/20 transition-all"></div>
                                        <div className="absolute top-3 right-3 bg-yellow-500 text-black text-[10px] font-black px-2 py-0.5 rounded uppercase">Best Value</div>
                                        <div className="w-16 h-16 mb-4 rounded-2xl bg-yellow-500/10 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                                            <Crown className="w-8 h-8 text-yellow-500" />
                                        </div>
                                        <h3 className="text-xl font-black text-foreground mb-2">MEMBERSHIPS</h3>
                                        <p className="text-sm text-muted-foreground text-center mb-6">Weekly & Monthly subscriptions. Save up to 60%.</p>
                                        <button className="w-full py-3 bg-yellow-500 hover:bg-yellow-400 text-black font-bold rounded-xl transition-colors shadow-lg shadow-yellow-900/20">
                                            View Plans
                                        </button>
                                    </div>

                                    {/* Category 3: Level Up Pass */}
                                    <div className="bg-card border border-border rounded-xl p-6 flex flex-col items-center hover:border-purple-500/50 transition-all hover:-translate-y-1 group relative overflow-hidden">
                                        <div className="absolute top-0 right-0 p-16 bg-purple-500/10 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2 group-hover:bg-purple-500/20 transition-all"></div>
                                        <div className="w-16 h-16 mb-4 rounded-2xl bg-purple-500/10 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                                            <TrendingUp className="w-8 h-8 text-purple-500" />
                                        </div>
                                        <h3 className="text-xl font-black text-foreground mb-2">LEVEL UP PASS</h3>
                                        <p className="text-sm text-muted-foreground text-center mb-6">Get 5x value. Claim diamonds as you level up your account.</p>
                                        <button className="w-full py-3 bg-purple-600 hover:bg-purple-500 text-white font-bold rounded-xl transition-colors shadow-lg shadow-purple-900/20">
                                            Get Pass
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </section>

                    {/* FAQ Section */}
                    <section className="relative z-10 py-16 bg-background/50 max-w-4xl mx-auto px-4">
                        <div className="text-center mb-12">
                            <h2 className="text-3xl md:text-4xl font-black text-foreground">FREQUENTLY ASKED QUESTIONS</h2>
                        </div>
                        <div className="space-y-4">
                            <FaqItem q="Is it safe to deposit money?" a="Absolutely. We use secure, encrypted payment gateways. Your funds are held safely until you withdraw." />
                            <FaqItem q="How do I get the Room ID & Password?" a="Once you join a tournament, the Room ID and Password will be displayed in your 'My Matches' section 15 minutes before start." />
                            <FaqItem q="What is the minimum withdrawal?" a="You can withdraw as low as PKR 50 directly to your account. Withdrawals are processed 24/7." />
                        </div>
                    </section>

                    {/* Footer */}
                    <footer className="relative z-10 border-t border-border bg-card text-card-foreground pt-16 pb-8">
                        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 md:grid-cols-4 gap-12 mb-12 text-center md:text-left">
                            <div className="col-span-1 md:col-span-2">
                                <h3 className="text-2xl font-black text-primary mb-4">GURU ZONE</h3>
                                <p className="text-muted-foreground max-w-sm mx-auto md:mx-0 mb-6">
                                    The ultimate platform for esports enthusiasts. We turn your gaming passion into a professional career.
                                </p>
                                <div className="flex gap-4 justify-center md:justify-start">
                                    <SocialIcon icon={Twitter} />
                                    <SocialIcon icon={Instagram} />
                                    <SocialIcon icon={Youtube} />
                                </div>
                            </div>
                            <div>
                                <h4 className="font-bold text-foreground mb-4">Quick Links</h4>
                                <ul className="space-y-2 text-muted-foreground text-sm">
                                    <li className="hover:text-primary cursor-pointer transition-colors">Tournaments</li>
                                    <li className="hover:text-primary cursor-pointer transition-colors">Leaderboard</li>
                                    <li className="hover:text-primary cursor-pointer transition-colors">About Us</li>
                                    <li className="hover:text-primary cursor-pointer transition-colors">Contact Support</li>
                                </ul>
                            </div>
                            <div>
                                <h4 className="font-bold text-foreground mb-4">Legal</h4>
                                <ul className="space-y-2 text-muted-foreground text-sm">
                                    <li className="hover:text-primary cursor-pointer transition-colors">Privacy Policy</li>
                                    <li className="hover:text-primary cursor-pointer transition-colors">Terms of Service</li>
                                    <li className="hover:text-primary cursor-pointer transition-colors">Refund Policy</li>
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

function StepCard({ number, icon: Icon, title, desc }: { number: string, icon: any, title: string, desc: string }) {
    return (
        <div className="relative flex flex-col items-center text-center group">
            <div className="w-16 h-16 rounded-full glass border border-white/10 flex items-center justify-center mb-6 z-10 group-hover:border-primary group-hover:shadow-[0_0_25px_rgba(255,215,0,0.4)] transition-all duration-300 bg-black/50">
                <Icon className="w-8 h-8 text-muted-foreground group-hover:text-primary transition-colors" />
            </div>
            <h3 className="text-xl font-bold text-foreground mb-3">{title}</h3>
            <p className="text-muted-foreground text-sm leading-relaxed max-w-xs">{desc}</p>
            <span className="absolute -top-6 right-1/4 text-8xl font-black text-foreground/5 select-none -z-10">{number}</span>
        </div>
    );
}

function FaqItem({ q, a }: { q: string, a: string }) {
    const [isOpen, setIsOpen] = useState(false);
    return (
        <div className="border border-border rounded-xl bg-card overflow-hidden">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="w-full flex items-center justify-between p-4 text-left font-bold text-foreground hover:bg-muted/50 transition-colors"
            >
                {q}
                <ChevronRight className={`w-5 h-5 text-muted-foreground transition-transform ${isOpen ? 'rotate-90' : ''}`} />
            </button>
            <div className={`overflow-hidden transition-all duration-300 ${isOpen ? 'max-h-40 p-4 pt-0' : 'max-h-0'}`}>
                <p className="text-muted-foreground text-sm leading-relaxed">{a}</p>
            </div>
        </div>
    );
}

function SocialIcon({ icon: Icon }: { icon: any }) {
    return (
        <a href="#" className="w-10 h-10 rounded-full bg-muted flex items-center justify-center text-muted-foreground hover:bg-primary hover:text-black transition-all duration-300">
            <Icon className="w-5 h-5" />
        </a>
    );
}

function TournamentCard({ map, mode, modeColor, title, prize, entry, filled, status, statusColor, progress, progressColor }: any) {
    return (
        <div className="group relative bg-card border border-border rounded-2xl overflow-hidden hover:border-primary/50 transition-all duration-300 hover:shadow-lg shadow-sm">
            <div className="h-32 bg-muted relative">
                {/* Placeholder for map - in real app would be image */}
                <div className="absolute inset-0 bg-gradient-to-br from-background/50 to-background/90" />
                <div className="absolute top-4 left-4 bg-background/80 backdrop-blur-md px-3 py-1 rounded-md text-xs font-bold text-foreground border border-white/10">
                    {map}
                </div>
                <div className={`absolute top-4 right-4 ${modeColor} px-3 py-1 rounded-md text-xs font-bold`}>
                    {mode}
                </div>
                <div className="absolute bottom-0 inset-x-0 p-4 bg-gradient-to-t from-background to-transparent">
                    <div className="flex items-center justify-between">
                        <span className="text-foreground font-bold text-lg">{title}</span>
                    </div>
                </div>
            </div>
            <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                    <div className="flex flex-col">
                        <span className="text-muted-foreground text-xs uppercase tracking-wider">Prize Pool</span>
                        <span className="text-2xl font-black text-primary">{prize}</span>
                    </div>
                    <div className="flex flex-col items-end">
                        <span className="text-muted-foreground text-xs uppercase tracking-wider">Entry</span>
                        <span className="text-xl font-bold text-foreground">{entry}</span>
                    </div>
                </div>
                <div className="space-y-3 mb-6">
                    <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
                        <div className={`${progressColor} h-full rounded-full relative`} style={{ width: `${progress}%` }}>
                            {progress > 80 && <div className="absolute right-0 top-0 bottom-0 w-2 bg-white/50 animate-pulse"></div>}
                        </div>
                    </div>
                    <div className="flex justify-between text-xs text-muted-foreground">
                        <span>{filled}</span>
                        <span className={`${statusColor} font-bold`}>{status}</span>
                    </div>
                </div>
                <button className="w-full py-3 bg-muted hover:bg-primary hover:text-black border border-border hover:border-primary text-foreground font-bold rounded-xl transition-all duration-200">
                    Join Now
                </button>
            </div>
        </div>
    );
}
