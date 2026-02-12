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
    Bell,
    ScrollText
} from "lucide-react";
import { useTheme } from "@/context/ThemeContext";
import { useState } from "react";
import { useSession, signOut } from "next-auth/react";

export default function DashboardSidebar() {
    const [isOpen, setIsOpen] = useState(false); // Mobile toggle
    const [isHovered, setIsHovered] = useState(false); // Desktop hover state
    const pathname = usePathname();
    const { data: session } = useSession();

    // We don't need useTheme here anymore as it's in the header

    const sidebarItems = [
        { icon: LayoutDashboard, label: "Dashboard", href: "/dashboard" },
        { icon: Trophy, label: "My Tournaments", href: "/dashboard/tournaments" },
        { icon: ShoppingBag, label: "Diamond Shop", href: "/dashboard/shop" },
        { icon: Crown, label: "Leaderboard", href: "/dashboard/leaderboard" },
        { icon: Wallet, label: "Wallet", href: "/dashboard/wallet" },
        { icon: ArrowUpRight, label: "Withdraw", href: "/dashboard/wallet/withdraw" },
        { icon: ScrollText, label: "History", href: "/dashboard/history" },
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
            <aside
                className={`
                    fixed top-0 left-0 z-[60] bg-card/95 backdrop-blur-2xl border-r border-border
                    transition-all duration-300 ease-in-out
                    
                    /* Mobile Styles */
                    h-[100dvh]
                    ${isOpen ? "translate-x-0" : "-translate-x-full"}
                    w-[280px]
                    
                    /* Desktop Styles */
                    lg:translate-x-0 lg:w-20 lg:hover:w-72
                    lg:top-20 lg:h-[calc(100vh-5rem)] lg:z-40
                `}
                onMouseEnter={() => setIsHovered(true)}
                onMouseLeave={() => setIsHovered(false)}
            >
                <div className="flex flex-col h-full p-4 overflow-hidden">
                    {/* Logo Section - Mobile Only (Header has logo on Desktop) */}
                    <div className="mb-8 pt-2 px-2 flex items-center h-10 lg:hidden">
                        <Link href="/dashboard" className="flex items-center gap-3 overflow-hidden whitespace-nowrap">
                            {/* Logo Icon */}
                            <div className="min-w-[24px]">
                                <img src="/logo.jpg" alt="Logo" className="w-8 h-8 rounded-full" />
                            </div>

                            {/* Text */}
                            <span className="text-xl font-bold bg-gradient-to-r from-primary to-yellow-200 bg-clip-text text-transparent tracking-tighter">
                                GURU ZONE
                            </span>
                        </Link>

                        {/* Close Button (Mobile Only) */}
                        <button
                            onClick={() => setIsOpen(false)}
                            className="lg:hidden ml-auto p-1 text-muted-foreground hover:text-foreground transition-colors"
                        >
                            <X size={24} />
                        </button>
                    </div>

                    {/* Desktop Spacer - To align items nicely if logo is hidden */}
                    <div className="hidden lg:block h-4"></div>

                    {/* Navigation Items */}
                    <nav className="flex-1 space-y-2 overflow-y-auto overflow-x-hidden no-scrollbar pb-4">
                        {sidebarItems.map((item) => {
                            const isActive = pathname === item.href;
                            const isAdminItem = item.label === "Admin Command";

                            return (
                                <Link
                                    key={item.href}
                                    href={item.href}
                                    onClick={() => setIsOpen(false)}
                                    className={`
                                        flex items-center px-3 py-3 rounded-xl transition-all duration-300 group relative overflow-hidden whitespace-nowrap
                                        ${isActive
                                            ? "bg-gradient-to-r from-primary/20 to-primary/5 text-primary font-bold shadow-[0_0_20px_rgba(255,215,0,0.1)] border border-primary/20"
                                            : isAdminItem
                                                ? "text-purple-400 hover:text-purple-300 hover:bg-purple-500/10 border border-purple-500/20"
                                                : "text-muted-foreground hover:text-foreground hover:bg-muted hover:translate-x-1"
                                        }
                                    `}
                                    title={!isHovered ? item.label : ''}
                                >
                                    {isActive && (
                                        <>
                                            <div className="absolute inset-0 bg-gradient-to-r from-primary/10 to-transparent opacity-50" />
                                            <div className="absolute -left-1 top-0 bottom-0 w-1 bg-primary shadow-[0_0_10px_var(--primary)] rounded-r-full" />
                                        </>
                                    )}

                                    <div className="min-w-[24px] flex justify-center relative z-10">
                                        <item.icon
                                            size={20}
                                            className={`
                                                transition-transform duration-300 group-hover:scale-110 
                                                ${isActive ? 'text-primary drop-shadow-[0_0_5px_rgba(255,215,0,0.5)]' : 'group-hover:text-foreground'}
                                            `}
                                        />
                                    </div>

                                    <span className={`relative z-10 ml-3 transition-all duration-300 ${isHovered ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-2 lg:opacity-0'}`}>
                                        {item.label}
                                    </span>

                                    {!isActive && !isAdminItem && (
                                        <div className="absolute inset-0 border border-transparent group-hover:border-border/50 rounded-xl transition-colors duration-300" />
                                    )}
                                </Link>
                            );
                        })}
                    </nav>

                    {/* User Profile / Logout */}
                    <div className="mt-auto pt-4 border-t border-border overflow-hidden">
                        <div className="pt-2">
                            <button
                                onClick={() => signOut({ callbackUrl: '/' })}
                                className="flex items-center px-3 py-3 w-full text-left text-red-500 hover:text-red-600 hover:bg-red-500/10 rounded-xl transition-colors whitespace-nowrap"
                                title={!isHovered ? "Sign Out" : ''}
                            >
                                <div className="min-w-[24px] flex justify-center">
                                    <LogOut size={20} />
                                </div>
                                <span className={`ml-3 transition-opacity duration-200 ${isHovered ? 'opacity-100' : 'opacity-0 lg:opacity-0'}`}>
                                    Sign Out
                                </span>
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

