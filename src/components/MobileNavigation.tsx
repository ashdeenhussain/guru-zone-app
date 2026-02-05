"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
    LayoutDashboard,
    Trophy,
    ShoppingBag,
    Wallet,
    Menu,
    X,
    Bell
} from "lucide-react";
import { useState } from "react";
import ThemeToggle from "@/components/ThemeToggle";
import { motion, AnimatePresence } from "framer-motion";
import { useSession, signOut } from "next-auth/react";
import {
    User,
    LogOut,
    ArrowUpRight,
    History,
    MessageCircle,
    Settings,
} from "lucide-react";
import NotificationDropdown from "@/components/dashboard/NotificationDropdown";

export default function MobileNavigation() {
    const pathname = usePathname();
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const { data: session } = useSession();

    const navItems = [
        { icon: LayoutDashboard, label: "Home", href: "/dashboard" },
        { icon: Trophy, label: "Tournaments", href: "/dashboard/tournaments" },
        // Middle Space for Menu
        { icon: ShoppingBag, label: "Shop", href: "/dashboard/shop" },
        { icon: Wallet, label: "Wallet", href: "/dashboard/wallet" },
    ];

    const isActive = (href: string) => pathname === href;

    return (
        <div className="lg:hidden">
            {/* Top Bar */}
            <div className="fixed top-0 left-0 right-0 z-40 h-16 px-4 bg-background/80 backdrop-blur-xl border-b border-border flex items-center justify-between shadow-sm">
                <div className="flex items-center gap-3">
                    <div className="relative h-9 w-9 overflow-hidden rounded-xl border border-border shadow-sm">
                        <img src="/logo.jpg" alt="Guru Zone" className="h-full w-full object-cover" />
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <ThemeToggle />
                    <NotificationDropdown />
                </div>
            </div>

            {/* Bottom Navigation */}
            <div className="fixed bottom-0 left-0 right-0 z-50 bg-background/90 backdrop-blur-lg border-t border-border pb-safe">
                <div className="flex items-center justify-between h-16 px-4 relative">

                    <Link
                        href="/dashboard"
                        className={`flex flex-col items-center gap-1 p-2 transition-colors ${isActive('/dashboard') ? 'text-primary' : 'text-muted-foreground'}`}
                    >
                        <LayoutDashboard size={20} strokeWidth={isActive('/dashboard') ? 2.5 : 2} />
                        <span className="text-[10px] font-bold">Home</span>
                    </Link>

                    <Link
                        href="/dashboard/tournaments"
                        className={`flex flex-col items-center gap-1 p-2 transition-colors ${isActive('/dashboard/tournaments') ? 'text-primary' : 'text-muted-foreground'}`}
                    >
                        <Trophy size={20} strokeWidth={isActive('/dashboard/tournaments') ? 2.5 : 2} />
                        <span className="text-[10px] font-bold">Battle</span>
                    </Link>

                    <Link
                        href="/dashboard/shop"
                        className={`flex flex-col items-center gap-1 p-2 transition-colors ${isActive('/dashboard/shop') ? 'text-primary' : 'text-muted-foreground'}`}
                    >
                        <ShoppingBag size={20} strokeWidth={isActive('/dashboard/shop') ? 2.5 : 2} />
                        <span className="text-[10px] font-bold">Shop</span>
                    </Link>

                    <Link
                        href="/dashboard/wallet"
                        className={`flex flex-col items-center gap-1 p-2 transition-colors ${isActive('/dashboard/wallet') ? 'text-primary' : 'text-muted-foreground'}`}
                    >
                        <Wallet size={20} strokeWidth={isActive('/dashboard/wallet') ? 2.5 : 2} />
                        <span className="text-[10px] font-bold">Wallet</span>
                    </Link>

                    <button
                        onClick={() => setIsMenuOpen(true)}
                        className={`flex flex-col items-center gap-1 p-2 transition-colors ${isMenuOpen ? 'text-primary' : 'text-muted-foreground'}`}
                    >
                        <Menu size={20} strokeWidth={isMenuOpen ? 2.5 : 2} />
                        <span className="text-[10px] font-bold">Menu</span>
                    </button>

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
                                    href="/dashboard/transactions"
                                    onClick={() => setIsMenuOpen(false)}
                                    className="flex items-center gap-4 p-4 rounded-2xl bg-card border border-border/50 hover:bg-muted/50 active:scale-[0.98] transition-all"
                                >
                                    <div className="p-3 bg-purple-500/10 text-purple-500 rounded-xl">
                                        <History size={24} />
                                    </div>
                                    <div className="flex-1">
                                        <h4 className="font-bold text-foreground">History</h4>
                                        <p className="text-xs text-muted-foreground">View past transactions</p>
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

                                <button
                                    onClick={() => { signOut(); setIsMenuOpen(false); }}
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
        </div>
    );
}
