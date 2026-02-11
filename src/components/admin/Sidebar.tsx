
'use client';

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import {
    LayoutDashboard,
    Trophy,
    Users,
    Wallet,
    Settings,
    ShoppingCart,
    Package,
    ChevronDown,
    ChevronRight,
    Store,
    Disc,
    X,
    LifeBuoy,
    Shield,
    ArrowUpRight
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSession } from "next-auth/react";

interface AdminSidebarProps {
    onClose?: () => void;
}

export default function Sidebar({ onClose }: AdminSidebarProps) {
    const { data: session } = useSession();

    const hasPermission = (permission: string) => {
        if (!session?.user) return false;
        const user = session.user as any;
        return user.role === 'admin' || user.permissions?.includes(permission);
    };

    const pathname = usePathname();
    const [isStoreOpen, setIsStoreOpen] = useState(true);

    const isActive = (path: string) => pathname === path;
    const isStoreActive = pathname.startsWith('/admin/store');

    const navItems = [
        { name: 'Command Center', href: '/admin/dashboard', icon: LayoutDashboard, permission: null },
        { name: 'Team', href: '/admin/team', icon: Shield, permission: 'manage_system' },
        { name: 'Tournaments', href: '/admin/tournaments', icon: Trophy, permission: 'manage_tournaments' },
        { name: 'Users', href: '/admin/users', icon: Users, permission: 'manage_support' },
        { name: 'Finance', href: '/admin/finance', icon: Wallet, permission: 'manage_finance' },
        { name: 'Transactions', href: '/admin/transactions', icon: ArrowUpRight, permission: 'manage_finance' },
        { name: 'Audit Logs', href: '/admin/audit-logs', icon: Shield, permission: 'manage_system' },
    ];

    return (
        <aside className="w-64 bg-card border-r border-border flex flex-col h-full relative">
            <div className="p-6 border-b border-border flex items-center justify-between">
                <h2 className="text-2xl font-bold tracking-tight text-foreground">
                    <span className="text-primary">Guru Zone</span> Admin
                </h2>
                {/* Mobile Close Button */}
                <button onClick={onClose} className="lg:hidden p-1 hover:bg-muted rounded text-muted-foreground hover:text-foreground">
                    <X className="w-5 h-5" />
                </button>
            </div>

            <nav className="flex-1 overflow-y-auto py-6 px-3 space-y-1 scrollbar-thin scrollbar-thumb-border">
                {navItems
                    .filter(item => !item.permission || hasPermission(item.permission))
                    .map((item) => (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors group ${isActive(item.href)
                                ? 'bg-primary/10 text-primary'
                                : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                                }`}
                        >
                            <item.icon className={`w-5 h-5 transition-colors ${isActive(item.href) ? 'text-primary' : 'text-muted-foreground group-hover:text-primary'
                                }`} />
                            <span className="font-medium">{item.name}</span>
                        </Link>
                    ))}

                {/* Store Section with Dropdown */}
                {hasPermission('manage_store') && (
                    <div className="space-y-1">
                        <button
                            onClick={() => setIsStoreOpen(!isStoreOpen)}
                            className={`w-full flex items-center justify-between gap-3 px-3 py-2.5 rounded-lg transition-colors group ${isStoreActive ? 'text-foreground' : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                                }`}
                        >
                            <div className="flex items-center gap-3">
                                <Store className={`w-5 h-5 transition-colors ${isStoreActive ? 'text-primary' : 'text-muted-foreground group-hover:text-primary'
                                    }`} />
                                <span className="font-medium">Store</span>
                            </div>
                            {isStoreOpen ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                        </button>

                        <AnimatePresence>
                            {isStoreOpen && (
                                <motion.div
                                    initial={{ height: 0, opacity: 0 }}
                                    animate={{ height: 'auto', opacity: 1 }}
                                    exit={{ height: 0, opacity: 0 }}
                                    className="overflow-hidden ml-4 pl-4 border-l border-border space-y-1"
                                >
                                    <Link
                                        href="/admin/store/products"
                                        className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors group ${isActive('/admin/store/products')
                                            ? 'bg-primary/10 text-primary'
                                            : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                                            }`}
                                    >
                                        <Package className="w-4 h-4" />
                                        <span>Inventory</span>
                                    </Link>
                                    <Link
                                        href="/admin/store/orders"
                                        className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors group ${isActive('/admin/store/orders')
                                            ? 'bg-primary/10 text-primary'
                                            : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                                            }`}
                                    >
                                        <ShoppingCart className="w-4 h-4" />
                                        <span>Orders</span>
                                    </Link>
                                    <Link
                                        href="/admin/store/spin"
                                        className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors group ${isActive('/admin/store/spin')
                                            ? 'bg-primary/10 text-primary'
                                            : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                                            }`}
                                    >
                                        <Disc className="w-4 h-4" />
                                        <span>Lucky Spin</span>
                                    </Link>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                )}

                <div className="my-4 border-t border-border mx-2"></div>

                <Link
                    href="/dashboard"
                    className="flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors group text-green-500 hover:text-foreground hover:bg-green-500/10"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5"><rect width="7" height="9" x="3" y="3" rx="1" /><rect width="7" height="5" x="14" y="3" rx="1" /><rect width="7" height="9" x="14" y="12" rx="1" /><rect width="7" height="5" x="3" y="16" rx="1" /></svg>
                    <span className="font-bold">Back to App</span>
                </Link>

                {hasPermission('manage_support') && (
                    <Link
                        href="/admin/support"
                        className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors group ${isActive('/admin/support')
                            ? 'bg-primary/10 text-primary'
                            : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                            }`}
                    >
                        <LifeBuoy className={`w-5 h-5 transition-colors ${isActive('/admin/support') ? 'text-primary' : 'text-muted-foreground group-hover:text-primary'
                            }`} />
                        <span className="font-medium">Support</span>
                    </Link>
                )}

                {hasPermission('manage_system') && (
                    <Link
                        href="/admin/settings"
                        className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors group ${isActive('/admin/settings')
                            ? 'bg-primary/10 text-primary'
                            : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                            }`}
                    >
                        <Settings className={`w-5 h-5 transition-colors ${isActive('/admin/settings') ? 'text-primary' : 'text-muted-foreground group-hover:text-primary'
                            }`} />
                        <span className="font-medium">Settings</span>
                    </Link>
                )}
            </nav>

            <div className="p-4 border-t border-border bg-muted/20">
                <div className="flex items-center gap-3 px-3 py-2">
                    <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold text-xs ring-2 ring-primary/10">
                        SA
                    </div>
                    <div>
                        <p className="text-sm font-medium text-foreground">Super Admin</p>
                        <p className="text-xs text-muted-foreground">System Root</p>
                    </div>
                </div>
            </div>
        </aside>
    );
}

