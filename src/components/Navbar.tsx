"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
    Menu,
    X,
    User,
    LogOut,
    LayoutDashboard,
    Trophy,
    BarChart3,
    Wallet,
    ArrowDownToLine,
    History,
    Headphones,
    ChevronRight,
    Shield
} from "lucide-react";
import { useState } from "react";
import { useSession, signOut } from "next-auth/react";
import { motion, AnimatePresence } from "framer-motion";

export default function Navbar() {
    const [isOpen, setIsOpen] = useState(false);
    const { data: session } = useSession();
    const pathname = usePathname();

    // Hide Navbar on dashboard pages as they have their own sidebar, and on the Landing Page ("/")
    if (pathname?.startsWith("/dashboard") || pathname?.startsWith("/admin") || pathname === "/" || pathname === "/login" || pathname === "/signup" || pathname === "/forgot-password" || pathname === "/reset-password") {
        return null;
    }

    return (
        <nav className="fixed top-0 left-0 right-0 z-50 bg-background/60 backdrop-blur-xl border-b border-white/5 shadow-sm transition-all duration-300">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between h-20">
                    {/* Left Side: Hamburger (Mobile) + Logo */}
                    <div className="flex items-center space-x-3">
                        {/* Hamburger Menu for Mobile */}
                        <button
                            onClick={() => setIsOpen(!isOpen)}
                            className="p-2 -ml-2 text-gray-400 hover:text-white transition-colors md:hidden"
                            aria-label="Open menu"
                        >
                            <Menu size={24} />
                        </button>

                        {/* Logo */}
                        <Link href={session ? "/dashboard" : "/"} className="flex items-center space-x-2">
                            <div className="relative h-10 w-10 overflow-hidden rounded-lg">
                                <img src="/logo.jpg" alt="Guru Zone Logo" className="h-full w-full object-cover" />
                            </div>
                            <span className="hidden sm:block text-xl font-bold text-primary tracking-tighter">
                                GURU ZONE
                            </span>
                        </Link>
                    </div>

                    {/* Right Side Buttons (Visible on all screens) */}
                    <div className="flex items-center space-x-3 sm:space-x-6">
                        {session ? (
                            <>
                                {((session.user as any).role === 'admin' || ((session.user as any).permissions && (session.user as any).permissions.length > 0)) && (
                                    <Link href="/admin/dashboard" className="hidden md:flex p-2 text-purple-400 hover:text-purple-300 transition-colors items-center gap-2">
                                        <Shield size={18} />
                                        <span className="font-bold">Admin</span>
                                    </Link>
                                )}
                                <Link href="/dashboard" className="p-2 text-primary hover:text-yellow-400 transition-colors">
                                    <span className="font-bold">Dashboard</span>
                                </Link>
                            </>
                        ) : (
                            <>
                                <Link
                                    href="/login"
                                    className="text-sm font-medium text-foreground/80 hover:text-primary transition-colors"
                                >
                                    Login
                                </Link>
                                <Link
                                    href="/signup"
                                    className="px-4 py-2 text-sm font-bold text-white bg-blue-600 rounded-md hover:bg-blue-700 transition-colors shadow-[0_0_15px_rgba(37,99,235,0.3)]"
                                >
                                    Sign Up
                                </Link>
                            </>
                        )}
                    </div>
                </div>
            </div>

            {/* Drawer */}
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ x: "-100%" }}
                        animate={{ x: 0 }}
                        exit={{ x: "-100%" }}
                        transition={{ type: "spring", damping: 25, stiffness: 250 }}
                        className="fixed top-0 left-0 h-[100dvh] w-[280px] bg-[#0B1120] border-r border-white/5 z-50 shadow-2xl flex flex-col md:hidden"
                    >
                        {/* Close Button Absolute Top Right */}
                        <button
                            onClick={() => setIsOpen(false)}
                            className="absolute top-4 right-4 p-2 text-gray-400 hover:text-white transition-colors z-20"
                            aria-label="Close menu"
                        >
                            <X size={24} />
                        </button>

                        {/* Drawer Content */}
                        <div className="flex-1 overflow-y-auto flex flex-col p-6 pt-16 space-y-4">
                            {session ? (
                                <>
                                    {((session.user as any).role === 'admin' || ((session.user as any).permissions && (session.user as any).permissions.length > 0)) && (
                                        <Link
                                            href="/admin/dashboard"
                                            className="flex items-center space-x-3 p-2 text-purple-400 hover:text-purple-300 transition-colors bg-purple-500/10 rounded-lg border border-purple-500/20"
                                            onClick={() => setIsOpen(false)}
                                        >
                                            <Shield size={20} />
                                            <span className="font-bold">Admin Command</span>
                                        </Link>
                                    )}
                                    <Link
                                        href="/dashboard"
                                        className="flex items-center space-x-3 p-2 text-primary hover:text-yellow-400 transition-colors"
                                        onClick={() => setIsOpen(false)}
                                    >
                                        <LayoutDashboard size={20} />
                                        <span className="font-bold">Dashboard</span>
                                    </Link>
                                    <Link
                                        href="/profile"
                                        className="flex items-center space-x-3 p-2 text-foreground/80 hover:text-primary transition-colors"
                                        onClick={() => setIsOpen(false)}
                                    >
                                        <User size={20} />
                                        <span>Profile</span>
                                    </Link>
                                    <button
                                        onClick={() => {
                                            signOut();
                                            setIsOpen(false);
                                        }}
                                        className="flex items-center space-x-3 p-2 text-foreground/80 hover:text-red-500 transition-colors w-full text-left"
                                    >
                                        <LogOut size={20} />
                                        <span>Logout</span>
                                    </button>
                                </>
                            ) : (
                                <>
                                    <Link
                                        href="/login"
                                        className="flex items-center space-x-3 p-2 text-foreground/80 hover:text-primary transition-colors"
                                        onClick={() => setIsOpen(false)}
                                    >
                                        <User size={20} />
                                        <span>Login</span>
                                    </Link>
                                    <Link
                                        href="/signup"
                                        className="flex items-center space-x-3 p-2 text-white bg-blue-600 rounded-md hover:bg-blue-700 transition-colors shadow-[0_0_15px_rgba(37,99,235,0.3)]"
                                        onClick={() => setIsOpen(false)}
                                    >
                                        <ArrowDownToLine size={20} />
                                        <span>Sign Up</span>
                                    </Link>
                                </>
                            )}
                            <div className="border-t border-white/10 my-4"></div>
                            <Link
                                href="/dashboard/leaderboard"
                                className="flex items-center space-x-3 p-2 text-foreground/80 hover:text-primary transition-colors"
                                onClick={() => setIsOpen(false)}
                            >
                                <Trophy size={20} />
                                <span className="font-bold">Leaderboard</span>
                            </Link>
                            <Link
                                href="/stats"
                                className="flex items-center space-x-3 p-2 text-foreground/80 hover:text-primary transition-colors"
                                onClick={() => setIsOpen(false)}
                            >
                                <BarChart3 size={20} />
                                <span>Stats</span>
                            </Link>
                            <Link
                                href="/wallet"
                                className="flex items-center space-x-3 p-2 text-foreground/80 hover:text-primary transition-colors"
                                onClick={() => setIsOpen(false)}
                            >
                                <Wallet size={20} />
                                <span>Wallet</span>
                            </Link>
                            <Link
                                href="/history"
                                className="flex items-center space-x-3 p-2 text-foreground/80 hover:text-primary transition-colors"
                                onClick={() => setIsOpen(false)}
                            >
                                <History size={20} />
                                <span>History</span>
                            </Link>
                            <Link
                                href="/support"
                                className="flex items-center space-x-3 p-2 text-foreground/80 hover:text-primary transition-colors"
                                onClick={() => setIsOpen(false)}
                            >
                                <Headphones size={20} />
                                <span>Support</span>
                            </Link>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Overlay for when drawer is open */}
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="fixed inset-0 bg-black/50 z-40 md:hidden"
                        onClick={() => setIsOpen(false)}
                    />
                )}
            </AnimatePresence>
        </nav>
    );
}
