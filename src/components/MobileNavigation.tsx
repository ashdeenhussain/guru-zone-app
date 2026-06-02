"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import Image from "next/image";
import {
    LayoutDashboard,
    Trophy,
    ShoppingBag,
    Wallet,
    Menu,
    X,
    Bell,
    Swords,
    ScrollText,
    Gift
} from "lucide-react";
import { useState, useEffect } from "react";
import ThemeToggle from "@/components/ThemeToggle";
import { motion, AnimatePresence } from "framer-motion";
import { useSession, signOut } from "next-auth/react";
import {
    User,
    LogOut,
    ArrowUpRight,
    MessageCircle,
    Settings,
} from "lucide-react";
import NotificationDropdown from "@/components/dashboard/NotificationDropdown";
import DailyRewardModal from "@/components/dashboard/DailyRewardModal";
import { useGuest } from "@/context/GuestContext";

export default function MobileNavigation() {
    const pathname = usePathname();
    const { isGuest, logoutGuest } = useGuest();
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [isDailyRewardOpen, setIsDailyRewardOpen] = useState(false);
    const { data: session } = useSession();
    const [unreadCounts, setUnreadCounts] = useState({ admin: 0, chat: 0, total: 0 });

    const fetchUnreadCounts = async () => {
        if (typeof document !== 'undefined' && document.visibilityState !== 'visible') {
            return;
        }
        try {
            const res = await fetch('/api/notifications/unread-count');
            if (res.ok) {
                const data = await res.json();
                if (data.success) {
                    setUnreadCounts(data.counts);
                }
            }
        } catch (error) {
            console.error('Failed to fetch unread counts', error);
        }
    };

    useEffect(() => {
        if (session?.user && !isGuest) {
            fetchUnreadCounts();
            const interval = setInterval(fetchUnreadCounts, 60000);
            return () => clearInterval(interval);
        }
    }, [session?.user, isGuest]);

    const navItems = [
        { icon: LayoutDashboard, label: "Home", href: "/dashboard" },
        { icon: Trophy, label: "Tournaments", href: "/dashboard/tournaments" },
        // Middle Space for Menu
        { icon: Swords, label: "Battle Zone", href: "/battle-zone", badge: unreadCounts.chat },
        { icon: ShoppingBag, label: "Shop", href: "/dashboard/shop" },
        { icon: Wallet, label: "Wallet", href: "/dashboard/wallet" },
    ];

    const isActive = (href: string) => pathname === href;

    return (
        <div className="lg:hidden">
            {/* Top Bar */}
            <div className="fixed top-0 left-0 right-0 z-[60] h-16 px-4 bg-background/80 backdrop-blur-xl border-b border-border flex items-center justify-between shadow-sm">
                {/* Left Side: Brand Logo */}
                <Link href={session || isGuest ? "/dashboard" : "/"} className="flex items-center gap-2">
                    <div className="relative h-8 w-8 overflow-hidden rounded-lg">
                        <Image src="/logo.jpg" alt="Guru Zone Logo" width={32} height={32} className="object-cover" loading="lazy" />
                    </div>
                    <span className="text-lg font-bold bg-gradient-to-r from-primary to-yellow-200 bg-clip-text text-transparent tracking-tighter">
                        GURU ZONE
                    </span>
                </Link>

                {/* Right Side: Action Icons Group */}
                <div className="flex items-center gap-3">
                    {/* 1. Daily Reward (Gift) */}
                    <Link
                        href="/dashboard/daily-reward"
                        className="relative p-2 rounded-xl bg-gradient-to-br from-purple-600/20 to-fuchsia-600/20 border border-purple-500/30 text-purple-400 hover:text-purple-300 hover:bg-purple-500/20 transition-all group"
                        aria-label="Daily Reward"
                    >
                        <Gift size={20} className="group-hover:scale-110 transition-transform" />
                        <span className="absolute -top-1 -right-1 w-3 h-3 bg-fuchsia-500 rounded-full animate-ping" />
                        <span className="absolute -top-1 -right-1 w-3 h-3 bg-fuchsia-500 rounded-full" />
                    </Link>

                    {/* 2. Notification (Bell) */}
                    <NotificationDropdown />

                    {/* 3. Menu (Hamburger) */}
                    <button
                        onClick={() => setIsMenuOpen(true)}
                        className="p-2 -mr-2 text-muted-foreground hover:text-primary transition-colors"
                        aria-label="Open menu"
                    >
                        <Menu size={24} />
                    </button>
                </div>
            </div>

            {/* Bottom Navigation */}
            <div className="fixed bottom-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-lg border-t border-border pb-safe shadow-[0_-4px_20px_rgba(0,0,0,0.1)]">
                <div className="grid grid-cols-5 h-16 relative">

                    <Link
                        href="/dashboard"
                        className={`flex flex-col items-center justify-center gap-1 transition-all ${isActive('/dashboard') ? 'text-primary' : 'text-muted-foreground hover:text-foreground'}`}
                    >
                        <LayoutDashboard size={20} strokeWidth={isActive('/dashboard') ? 2.5 : 2} />
                        <span className="text-[10px] font-bold">Home</span>
                    </Link>

                    <Link
                        href="/dashboard/tournaments"
                        className={`flex flex-col items-center justify-center gap-1 transition-all ${isActive('/dashboard/tournaments') ? 'text-primary' : 'text-muted-foreground hover:text-foreground'}`}
                    >
                        <Trophy size={20} strokeWidth={isActive('/dashboard/tournaments') ? 2.5 : 2} />
                        <span className="text-[10px] font-bold">Tournament</span>
                    </Link>

                    {/* Battle Zone - Center Feature Highlight */}
                    <Link
                        href="/battle-zone"
                        className={`flex flex-col items-center justify-center gap-1 relative transition-all duration-300 ${isActive('/battle-zone') ? 'text-primary scale-110' : 'text-muted-foreground hover:text-foreground'}`}
                    >
                        <div className="relative p-2 flex items-center justify-center">
                            {/* Animated Background Glow */}
                            <div className="absolute inset-0 bg-primary/20 blur-xl rounded-full animate-pulse" />
                            <div className="absolute inset-0 bg-gradient-to-tr from-primary/10 to-transparent rounded-full animate-spin-slow" />
                            
                            <Swords 
                                size={24} 
                                strokeWidth={isActive('/battle-zone') ? 2.5 : 2}
                                className={`${isActive('/battle-zone') ? 'text-primary' : 'text-muted-foreground'} relative z-10 drop-shadow-[0_0_10px_rgba(255,215,0,0.5)]`}
                            />
                            
                            {/* "MESSENGER" Style Badge */}
                            {unreadCounts.chat > 0 && (
                                <span className="absolute -top-1 -right-1 flex h-4 w-4 z-20">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-500 opacity-75"></span>
                                    <span className="relative inline-flex rounded-full h-4 w-4 bg-red-600 border-2 border-background flex items-center justify-center shadow-[0_0_10px_rgba(220,38,38,0.5)]">
                                        <span className="text-[7px] text-white font-black leading-none">
                                            {unreadCounts.chat > 9 ? '9+' : unreadCounts.chat}
                                        </span>
                                    </span>
                                </span>
                            )}
                        </div>
                        <span className="text-[10px] font-bold">Battle Zone</span>
                    </Link>

                    <Link
                        href="/dashboard/shop"
                        className={`flex flex-col items-center justify-center gap-1 transition-all ${isActive('/dashboard/shop') ? 'text-primary' : 'text-muted-foreground hover:text-foreground'}`}
                    >
                        <ShoppingBag size={20} strokeWidth={isActive('/dashboard/shop') ? 2.5 : 2} />
                        <span className="text-[10px] font-bold">Shop</span>
                    </Link>

                    <Link
                        href="/dashboard/wallet"
                        className={`flex flex-col items-center justify-center gap-1 transition-all ${isActive('/dashboard/wallet') ? 'text-primary' : 'text-muted-foreground hover:text-foreground'}`}
                    >
                        <Wallet size={20} strokeWidth={isActive('/dashboard/wallet') ? 2.5 : 2} />
                        <span className="text-[10px] font-bold">Wallet</span>
                    </Link>

                </div>
            </div>

            {/* Full Screen Menu Overlay (Settings Style) */}
            <AnimatePresence>
                {isMenuOpen && (
                    <motion.div
                        initial={{ opacity: 0, x: "100%" }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: "100%" }}
                        transition={{ type: "spring", damping: 25, stiffness: 200 }}
                        className="fixed inset-0 z-[60] bg-background flex flex-col"
                    >
                        {/* Header */}
                        <div className="flex items-center justify-between p-4 border-b border-border bg-background/95 backdrop-blur-xl sticky top-0 z-10">
                            <h2 className="text-xl font-black tracking-tight">Menu</h2>
                            <button
                                onClick={() => setIsMenuOpen(false)}
                                className="p-2 bg-muted/50 rounded-full text-muted-foreground hover:bg-muted transition-colors"
                            >
                                <X size={24} />
                            </button>
                        </div>

                        {/* Menu Items */}
                        <div className="flex-1 overflow-y-auto p-4 space-y-3 pb-safe">

                            {/* Account Section */}
                            <div className="space-y-1">
                                <h3 className="text-xs font-bold text-muted-foreground uppercase px-2 mb-2">Account & Game</h3>

                                <Link
                                    href="/dashboard/profile"
                                    onClick={() => setIsMenuOpen(false)}
                                    className="flex items-center gap-4 p-4 rounded-2xl bg-card border border-border/50 hover:bg-muted/50 active:scale-[0.98] transition-all"
                                >
                                    <div className="p-3 bg-blue-500/10 text-blue-500 rounded-xl">
                                        <User size={24} />
                                    </div>
                                    <div className="flex-1">
                                        <h4 className="font-bold text-foreground">Profile</h4>
                                        <p className="text-xs text-muted-foreground">Manage avatar, bio & credentials</p>
                                    </div>
                                    <ArrowUpRight size={18} className="text-muted-foreground/50" />
                                </Link>

                                {session?.user && ((session.user as any).role === 'admin' || ((session.user as any).permissions && (session.user as any).permissions.length > 0)) && (
                                    <Link
                                        href="/admin/dashboard"
                                        onClick={() => setIsMenuOpen(false)}
                                        className="flex items-center gap-4 p-4 rounded-2xl bg-gradient-to-r from-red-600/10 to-transparent border border-red-500/20 hover:bg-red-500/5 active:scale-[0.98] transition-all"
                                    >
                                        <div className="p-3 bg-red-500/20 text-red-500 rounded-xl">
                                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-shield-alert"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /><path d="M12 8v4" /><path d="M12 16h.01" /></svg>
                                        </div>
                                        <div className="flex-1">
                                            <h4 className="font-bold text-red-500">Admin Control</h4>
                                            <p className="text-xs text-red-500/70">Access Command Center</p>
                                        </div>
                                        <ArrowUpRight size={18} className="text-red-500/50" />
                                    </Link>
                                )}

                                <Link
                                    href="/dashboard/leaderboard"
                                    onClick={() => setIsMenuOpen(false)}
                                    className="flex items-center gap-4 p-4 rounded-2xl bg-card border border-border/50 hover:bg-muted/50 active:scale-[0.98] transition-all"
                                >
                                    <div className="p-3 bg-yellow-500/10 text-yellow-500 rounded-xl">
                                        <Trophy size={24} />
                                    </div>
                                    <div className="flex-1">
                                        <h4 className="font-bold text-foreground">Leaderboard</h4>
                                        <p className="text-xs text-muted-foreground">See top ranking players</p>
                                    </div>
                                    <ArrowUpRight size={18} className="text-muted-foreground/50" />
                                </Link>

                                <Link
                                    href="/battle-zone"
                                    onClick={() => setIsMenuOpen(false)}
                                    className="flex items-center gap-4 p-4 rounded-2xl bg-card border border-border/50 hover:bg-muted/50 active:scale-[0.98] transition-all"
                                >
                                    <div className="p-3 bg-rose-500/10 text-rose-500 rounded-xl">
                                        <Swords size={24} />
                                    </div>
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2">
                                            <h4 className="font-bold text-foreground">Battle Zone</h4>
                                            <span className="bg-primary/20 text-primary text-[8px] font-black px-1.5 py-0.5 rounded uppercase">BETA</span>
                                        </div>
                                        <p className="text-xs text-muted-foreground">Join community challenges</p>
                                    </div>
                                    <ArrowUpRight size={18} className="text-muted-foreground/50" />
                                </Link>

                                <Link
                                    href="/dashboard/wallet"
                                    onClick={() => setIsMenuOpen(false)}
                                    className="flex items-center gap-4 p-4 rounded-2xl bg-card border border-border/50 hover:bg-muted/50 active:scale-[0.98] transition-all"
                                >
                                    <div className="p-3 bg-green-500/10 text-green-500 rounded-xl">
                                        <Wallet size={24} />
                                    </div>
                                    <div className="flex-1">
                                        <h4 className="font-bold text-foreground">Wallet & Withdraw</h4>
                                        <p className="text-xs text-muted-foreground">Manage coins and cashouts</p>
                                    </div>
                                    <ArrowUpRight size={18} className="text-muted-foreground/50" />
                                </Link>

                                <Link
                                    href="/dashboard/history"
                                    onClick={() => setIsMenuOpen(false)}
                                    className="flex items-center gap-4 p-4 rounded-2xl bg-card border border-border/50 hover:bg-muted/50 active:scale-[0.98] transition-all"
                                >
                                    <div className="p-3 bg-purple-500/10 text-purple-500 rounded-xl">
                                        <ScrollText size={24} />
                                    </div>
                                    <div className="flex-1">
                                        <h4 className="font-bold text-foreground">History</h4>
                                        <p className="text-xs text-muted-foreground">View tournament history</p>
                                    </div>
                                    <ArrowUpRight size={18} className="text-muted-foreground/50" />
                                </Link>
                            </div>

                            {/* System Section */}
                            <div className="space-y-1 mt-4">
                                <h3 className="text-xs font-bold text-muted-foreground uppercase px-2 mb-2">System</h3>

                                <Link
                                    href="/dashboard/support"
                                    onClick={() => setIsMenuOpen(false)}
                                    className="flex items-center gap-4 p-4 rounded-2xl bg-card border border-border/50 hover:bg-muted/50 active:scale-[0.98] transition-all"
                                >
                                    <div className="p-3 bg-orange-500/10 text-orange-500 rounded-xl">
                                        <MessageCircle size={24} />
                                    </div>
                                    <div className="flex-1">
                                        <h4 className="font-bold text-foreground">Support</h4>
                                        <p className="text-xs text-muted-foreground">Get help & report issues</p>
                                    </div>
                                    <ArrowUpRight size={18} className="text-muted-foreground/50" />
                                </Link>

                                <Link
                                    href="/dashboard/settings"
                                    onClick={() => setIsMenuOpen(false)}
                                    className="flex items-center gap-4 p-4 rounded-2xl bg-card border border-border/50 hover:bg-muted/50 active:scale-[0.98] transition-all"
                                >
                                    <div className="p-3 bg-gray-500/10 text-gray-500 rounded-xl">
                                        <Settings size={24} />
                                    </div>
                                    <div className="flex-1">
                                        <h4 className="font-bold text-foreground">Settings</h4>
                                        <p className="text-xs text-muted-foreground">Security, Notifications & More</p>
                                    </div>
                                    <ArrowUpRight size={18} className="text-muted-foreground/50" />
                                </Link>

                                {/* Theme Toggle inside menu */}
                                <div className="flex items-center gap-4 p-4 rounded-2xl bg-card border border-border/50">
                                    <div className="p-3 bg-indigo-500/10 text-indigo-400 rounded-xl">
                                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41"/></svg>
                                    </div>
                                    <div className="flex-1">
                                        <h4 className="font-bold text-foreground">Appearance</h4>
                                        <p className="text-xs text-muted-foreground">Switch light / dark theme</p>
                                    </div>
                                    <ThemeToggle />
                                </div>

                                <button
                                    onClick={() => {
                                        if (isGuest) {
                                            logoutGuest();
                                        } else {
                                            signOut();
                                        }
                                        setIsMenuOpen(false);
                                    }}
                                    className="flex w-full items-center gap-4 p-4 rounded-2xl bg-red-500/5 border border-red-500/10 hover:bg-red-500/10 active:scale-[0.98] transition-all"
                                >
                                    <div className="p-3 bg-red-500/10 text-red-500 rounded-xl">
                                        <LogOut size={24} />
                                    </div>
                                    <div className="flex-1 text-left">
                                        <h4 className="font-bold text-red-500">Sign Out</h4>
                                        <p className="text-xs text-red-500/60">Log out of your account</p>
                                    </div>
                                </button>
                            </div>

                            {/* Footer Info */}
                            <div className="mt-8 text-center text-xs text-muted-foreground pb-20">
                                <p>Guru Zone v1.0.0</p>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Daily Reward Modal */}
            <AnimatePresence>
                {isDailyRewardOpen && (
                    <DailyRewardModal
                        onClose={() => setIsDailyRewardOpen(false)}
                    />
                )}
            </AnimatePresence>
        </div>
    );
}
