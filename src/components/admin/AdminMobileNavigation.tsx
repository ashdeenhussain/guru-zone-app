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
    Bell,
    Settings,
    User,
    LogOut,
    ArrowUpRight,
    LifeBuoy,
    Users,
    Disc,
    Package,
    Shield
} from "lucide-react";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useSession, signOut } from "next-auth/react";
import ThemeToggle from "@/components/ThemeToggle";

export default function AdminMobileNavigation() {
    const pathname = usePathname();
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const { data: session } = useSession();

    const hasPermission = (permission: string) => {
        if (!session?.user) return false;
        const user = session.user as any;
        return user.role === 'admin' || user.permissions?.includes(permission);
    };

    const isActive = (href: string) => pathname === href || pathname?.startsWith(href + '/');

    return (
        <div className="lg:hidden">
            {/* Top Bar for Admin */}
            <div className="fixed top-0 left-0 right-0 z-40 h-16 px-4 bg-background/95 backdrop-blur-md border-b border-border flex items-center justify-between shadow-sm transition-colors duration-300">
                <div className="flex items-center gap-3">
                    <span className="font-bold text-lg"><span className="text-primary">ZP</span> <span className="text-foreground">Admin</span></span>
                </div>

                <div className="flex items-center gap-3">
                    <ThemeToggle />
                </div>
            </div>

            {/* Bottom Navigation for Admin */}
            <div className="fixed bottom-0 left-0 right-0 z-50 bg-background/90 backdrop-blur-lg border-t border-border pb-safe transition-colors duration-300">
                <div className="flex items-center justify-between h-16 px-4 relative">

                    <Link
                        href="/admin/dashboard"
                        className={`flex flex-col items-center gap-1 p-2 transition-colors ${pathname === '/admin/dashboard' ? 'text-primary' : 'text-muted-foreground hover:text-foreground'}`}
                    >
                        <LayoutDashboard size={20} strokeWidth={pathname === '/admin/dashboard' ? 2.5 : 2} />
                        <span className="text-[10px] font-bold">Home</span>
                    </Link>

                    {hasPermission('manage_tournaments') && (
                        <Link
                            href="/admin/tournaments"
                            className={`flex flex-col items-center gap-1 p-2 transition-colors ${isActive('/admin/tournaments') ? 'text-primary' : 'text-muted-foreground hover:text-foreground'}`}
                        >
                            <Trophy size={20} strokeWidth={isActive('/admin/tournaments') ? 2.5 : 2} />
                            <span className="text-[10px] font-bold">Battle</span>
                        </Link>
                    )}

                    {hasPermission('manage_finance') && (
                        <Link
                            href="/admin/finance"
                            className={`flex flex-col items-center gap-1 p-2 transition-colors ${isActive('/admin/finance') ? 'text-primary' : 'text-muted-foreground hover:text-foreground'}`}
                        >
                            <Wallet size={20} strokeWidth={isActive('/admin/finance') ? 2.5 : 2} />
                            <span className="text-[10px] font-bold">Finance</span>
                        </Link>
                    )}

                    {hasPermission('manage_store') && (
                        <Link
                            href="/admin/store"
                            className={`flex flex-col items-center gap-1 p-2 transition-colors ${isActive('/admin/store') ? 'text-primary' : 'text-muted-foreground hover:text-foreground'}`}
                        >
                            <ShoppingBag size={20} strokeWidth={isActive('/admin/store') ? 2.5 : 2} />
                            <span className="text-[10px] font-bold">Shop</span>
                        </Link>
                    )}

                    <button
                        onClick={() => setIsMenuOpen(true)}
                        className={`flex flex-col items-center gap-1 p-2 transition-colors ${isMenuOpen ? 'text-primary' : 'text-muted-foreground hover:text-foreground'}`}
                    >
                        <Menu size={20} strokeWidth={isMenuOpen ? 2.5 : 2} />
                        <span className="text-[10px] font-bold">Menu</span>
                    </button>

                </div>
            </div>

            {/* Full Screen Menu Overlay (Admin Style) */}
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
                        <div className="flex items-center justify-between p-4 border-b border-border bg-background/95 backdrop-blur-xl sticky top-0 z-10 transition-colors duration-300">
                            <h2 className="text-xl font-black tracking-tight text-foreground">Admin Menu</h2>
                            <button
                                onClick={() => setIsMenuOpen(false)}
                                className="p-2 bg-muted rounded-full text-muted-foreground hover:bg-muted/80 hover:text-foreground transition-colors"
                            >
                                <X size={24} />
                            </button>
                        </div>

                        {/* Menu Items */}
                        <div className="flex-1 overflow-y-auto p-4 space-y-3 pb-safe bg-background transition-colors duration-300">

                            {/* Management Section */}
                            <div className="space-y-1">
                                <h3 className="text-xs font-bold text-muted-foreground uppercase px-2 mb-2">Management</h3>

                                {hasPermission('manage_support') && (
                                    <Link
                                        href="/admin/users"
                                        onClick={() => setIsMenuOpen(false)}
                                        className="flex items-center gap-4 p-4 rounded-2xl bg-card border border-border hover:bg-muted/50 active:scale-[0.98] transition-all shadow-sm"
                                    >
                                        <div className="p-3 bg-blue-500/10 text-blue-500 rounded-xl">
                                            <Users size={24} />
                                        </div>
                                        <div className="flex-1">
                                            <h4 className="font-bold text-foreground">Users</h4>
                                            <p className="text-xs text-muted-foreground">Manage player accounts</p>
                                        </div>
                                        <ArrowUpRight size={18} className="text-muted-foreground" />
                                    </Link>
                                )}

                                {hasPermission('manage_store') && (
                                    <>
                                        <Link
                                            href="/admin/store/orders"
                                            onClick={() => setIsMenuOpen(false)}
                                            className="flex items-center gap-4 p-4 rounded-2xl bg-card border border-border hover:bg-muted/50 active:scale-[0.98] transition-all shadow-sm"
                                        >
                                            <div className="p-3 bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 rounded-xl">
                                                <Package size={24} />
                                            </div>
                                            <div className="flex-1">
                                                <h4 className="font-bold text-foreground">Orders</h4>
                                                <p className="text-xs text-muted-foreground">View and process orders</p>
                                            </div>
                                            <ArrowUpRight size={18} className="text-muted-foreground" />
                                        </Link>

                                        <Link
                                            href="/admin/store/spin"
                                            onClick={() => setIsMenuOpen(false)}
                                            className="flex items-center gap-4 p-4 rounded-2xl bg-card border border-border hover:bg-muted/50 active:scale-[0.98] transition-all shadow-sm"
                                        >
                                            <div className="p-3 bg-purple-500/10 text-purple-500 rounded-xl">
                                                <Disc size={24} />
                                            </div>
                                            <div className="flex-1">
                                                <h4 className="font-bold text-foreground">Lucky Spin</h4>
                                                <p className="text-xs text-muted-foreground">Manage spin rewards</p>
                                            </div>
                                            <ArrowUpRight size={18} className="text-muted-foreground" />
                                        </Link>
                                    </>
                                )}
                            </div>

                            {/* System Section */}
                            <div className="space-y-1 mt-4">
                                <h3 className="text-xs font-bold text-muted-foreground uppercase px-2 mb-2">System</h3>

                                {hasPermission('manage_support') && (
                                    <Link
                                        href="/admin/support"
                                        onClick={() => setIsMenuOpen(false)}
                                        className="flex items-center gap-4 p-4 rounded-2xl bg-card border border-border hover:bg-muted/50 active:scale-[0.98] transition-all shadow-sm"
                                    >
                                        <div className="p-3 bg-orange-500/10 text-orange-500 rounded-xl">
                                            <LifeBuoy size={24} />
                                        </div>
                                        <div className="flex-1">
                                            <h4 className="font-bold text-foreground">Support</h4>
                                            <p className="text-xs text-muted-foreground">Handle tickets</p>
                                        </div>
                                        <ArrowUpRight size={18} className="text-muted-foreground" />
                                    </Link>
                                )}

                                {hasPermission('manage_system') && (
                                    <>
                                        <Link
                                            href="/admin/team"
                                            onClick={() => setIsMenuOpen(false)}
                                            className="flex items-center gap-4 p-4 rounded-2xl bg-card border border-border hover:bg-muted/50 active:scale-[0.98] transition-all shadow-sm"
                                        >
                                            <div className="p-3 bg-indigo-500/10 text-indigo-500 rounded-xl">
                                                <Shield size={24} />
                                            </div>
                                            <div className="flex-1">
                                                <h4 className="font-bold text-foreground">Team</h4>
                                                <p className="text-xs text-muted-foreground">Manage staff access</p>
                                            </div>
                                            <ArrowUpRight size={18} className="text-muted-foreground" />
                                        </Link>

                                        <Link
                                            href="/admin/settings"
                                            onClick={() => setIsMenuOpen(false)}
                                            className="flex items-center gap-4 p-4 rounded-2xl bg-card border border-border hover:bg-muted/50 active:scale-[0.98] transition-all shadow-sm"
                                        >
                                            <div className="p-3 bg-muted text-muted-foreground rounded-xl">
                                                <Settings size={24} />
                                            </div>
                                            <div className="flex-1">
                                                <h4 className="font-bold text-foreground">Settings</h4>
                                                <p className="text-xs text-muted-foreground">System configuration</p>
                                            </div>
                                            <ArrowUpRight size={18} className="text-muted-foreground" />
                                        </Link>
                                    </>
                                )}

                                {/* Back to App Button */}
                                <Link
                                    href="/dashboard"
                                    onClick={() => setIsMenuOpen(false)}
                                    className="flex items-center gap-4 p-4 rounded-2xl bg-green-500/10 border border-green-500/20 hover:bg-green-500/20 active:scale-[0.98] transition-all shadow-sm"
                                >
                                    <div className="p-3 bg-green-500/20 text-green-500 rounded-xl">
                                        <LayoutDashboard size={24} />
                                    </div>
                                    <div className="flex-1">
                                        <h4 className="font-bold text-green-600 dark:text-green-500">Back to App</h4>
                                        <p className="text-xs text-green-600/70 dark:text-green-500/70">Return to user dashboard</p>
                                    </div>
                                    <ArrowUpRight size={18} className="text-green-500/50" />
                                </Link>
                            </div>

                            {/* Footer Info */}
                            <div className="mt-8 text-center text-xs text-muted-foreground pb-20">
                                <p>Admin Console v1.0.0</p>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
