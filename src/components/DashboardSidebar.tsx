"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
    LayoutDashboard,
    Trophy,
    Wallet,
    User,
    LogOut,
    Menu,
    X,
    Settings,
    Crown,
    History,
    ArrowUpRight,
    MessageCircle,
    Shield,
    Sun,
    Moon,
    Sunset,
    ShoppingBag,
    Bell
} from "lucide-react";
import { useTheme } from "@/context/ThemeContext";
import { useState } from "react";
import { useSession, signOut } from "next-auth/react";

export default function DashboardSidebar() {
    const [isOpen, setIsOpen] = useState(false);
    const pathname = usePathname();
    const { data: session } = useSession();
    const { theme, setTheme } = useTheme();

    const toggleSidebar = () => setIsOpen(!isOpen);

    const sidebarItems = [
        { icon: LayoutDashboard, label: "Dashboard", href: "/dashboard" },
        { icon: Trophy, label: "My Tournaments", href: "/dashboard/tournaments" },
        { icon: ShoppingBag, label: "Diamond Shop", href: "/dashboard/shop" },
        { icon: Crown, label: "Leaderboard", href: "/dashboard/leaderboard" },
        { icon: Wallet, label: "Wallet", href: "/dashboard/wallet" },
        { icon: ArrowUpRight, label: "Withdraw", href: "/dashboard/wallet/withdraw" },
        { icon: History, label: "Transactions", href: "/dashboard/transactions" },
        { icon: MessageCircle, label: "Support", href: "/dashboard/support" },
        { icon: User, label: "Profile", href: "/dashboard/profile" },
        { icon: Settings, label: "Settings", href: "/dashboard/settings" },
    ];

    // Check for admin role
    const isAdmin = (session?.user as any)?.role === 'admin';

    // Add Admin Dashboard link if user is admin
    if (isAdmin) {
        sidebarItems.unshift({
            icon: Shield,
            label: "Admin Command",
            href: "/admin/dashboard"
        });
    }

    return (
        <>
            {/* Mobile Header Removed - Using MobileNavigation Component */}

            {/* Sidebar Container */}
            <aside className={`
                hidden lg:block fixed top-0 left-0 h-[100dvh] z-50 bg-[#050505]/95 backdrop-blur-2xl border-r border-white/5
                transition-transform duration-300 ease-in-out w-[280px]
                ${isOpen ? "translate-x-0" : "-translate-x-full"}
                lg:translate-x-0 lg:static lg:w-72
            `}>
                <div className="flex flex-col h-full p-4">
                    <div className="mb-8 pt-2 px-2 flex items-center justify-between">
                        <Link href="/dashboard" className="block">
                            <span className="text-2xl font-bold bg-gradient-to-r from-primary to-yellow-200 bg-clip-text text-transparent tracking-tighter">
                                GURU ZONE
                            </span>
                        </Link>
                        {/* Close Button (Mobile Only) */}
                        <button
                            onClick={() => setIsOpen(false)}
                            className="lg:hidden p-1 text-muted-foreground hover:text-foreground transition-colors"
                        >
                            <X size={24} />
                        </button>
                    </div>

                    {/* Navigation Items */}
                    <nav className="flex-1 space-y-2 overflow-y-auto">
                        {sidebarItems.map((item) => {
                            const isActive = pathname === item.href;
                            // Check if it's the Admin Component to give it a special style
                            const isAdminItem = item.label === "Admin Command";

                            return (
                                <Link
                                    key={item.href}
                                    href={item.href}
                                    onClick={() => setIsOpen(false)}
                                    className={`
                                        flex items-center space-x-3 px-4 py-3.5 rounded-xl transition-all duration-300 group relative overflow-hidden
                                        ${isActive
                                            ? "bg-primary text-black font-bold shadow-[0_0_20px_rgba(255,215,0,0.4)] scale-[1.02]"
                                            : isAdminItem
                                                ? "text-purple-400 hover:text-purple-300 hover:bg-purple-500/10 border border-purple-500/20"
                                                : "text-muted-foreground hover:text-white hover:bg-white/5"
                                        }
                                    `}
                                >
                                    {isActive && <div className="absolute inset-0 bg-white/20 animate-pulse-slow" />}
                                    <item.icon size={20} className={`relative z-10 transition-transform duration-300 group-hover:scale-110 ${isActive ? 'text-black' : ''}`} />
                                    <span className="relative z-10">{item.label}</span>
                                </Link>
                            );
                        })}
                    </nav>

                    {/* User Profile / Logout */}
                    <div className="mt-auto pt-4 border-t border-border">
                        {/* Theme Switcher */}
                        <div className="px-4 py-2">
                            <div className="bg-muted/20 backdrop-blur-sm border border-border rounded-xl p-1 flex items-center justify-between">
                                <button
                                    onClick={() => setTheme('light')}
                                    className={`flex-1 flex items-center justify-center py-1.5 rounded-lg transition-all duration-200 ${theme === 'light'
                                        ? 'bg-primary text-primary-foreground shadow-sm'
                                        : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                                        }`}
                                    title="Light Mode"
                                >
                                    <Sun size={18} />
                                </button>
                                <button
                                    onClick={() => setTheme('dark')}
                                    className={`flex-1 flex items-center justify-center py-1.5 rounded-lg transition-all duration-200 ${theme === 'dark'
                                        ? 'bg-primary text-primary-foreground shadow-sm'
                                        : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                                        }`}
                                    title="Dark Mode"
                                >
                                    <Moon size={18} />
                                </button>
                                <button
                                    onClick={() => setTheme('mix')}
                                    className={`flex-1 flex items-center justify-center py-1.5 rounded-lg transition-all duration-200 ${theme === 'mix'
                                        ? 'bg-primary text-primary-foreground shadow-sm'
                                        : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                                        }`}
                                    title="Mix Mode"
                                >
                                    <Sunset size={18} />
                                </button>
                            </div>
                        </div>

                        <div className="mt-2 pt-2 border-t border-border">
                            <button
                                onClick={() => signOut({ callbackUrl: '/' })}
                                className="flex items-center space-x-3 px-4 py-3 w-full text-left text-red-500 hover:text-red-600 hover:bg-red-500/10 rounded-xl transition-colors"
                            >
                                <LogOut size={20} />
                                <span>Sign Out</span>
                            </button>
                        </div>
                    </div>
                </div>
            </aside>

            {/* Overlay for mobile */}
            {isOpen && (
                <div
                    className="fixed inset-0 bg-black/50 z-30 lg:hidden backdrop-blur-sm"
                    onClick={() => setIsOpen(false)}
                />
            )}
        </>
    );
}

