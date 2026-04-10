'use client';

import { useSession } from "next-auth/react";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import AdminSidebar from '@/components/admin/Sidebar';
import AdminMobileNavigation from '@/components/admin/AdminMobileNavigation';
import { ShieldAlert, Loader2, Home } from 'lucide-react';
import Link from 'next/link';
import { AdminPermission } from "@/lib/auth";

const PERMISSION_MAP: Record<string, AdminPermission | null> = {
    '/admin/dashboard': null,
    '/admin/media': 'manage_store',
    '/admin/team': 'manage_system',
    '/admin/audit-logs': 'manage_system',
    '/admin/settings': 'manage_system',
    '/admin/tournaments': 'manage_tournaments',
    '/admin/battle-zone': 'manage_tournaments',
    '/admin/finance': 'manage_finance',
    '/admin/transactions': 'manage_finance',
    '/admin/users': 'manage_support',
    '/admin/support': 'manage_support',
    '/admin/store': 'manage_store',
    '/admin': null,
};

export default function AdminLayoutShell({
    children,
}: {
    children: React.ReactNode;
}) {
    const { data: session, status } = useSession();
    const pathname = usePathname();
    const [isAuthorized, setIsAuthorized] = useState<boolean | null>(null);

    useEffect(() => {
        if (status === "loading") return;

        const checkPermission = () => {
            if (!session?.user || session.user.role !== 'admin') {
                setIsAuthorized(false);
                return;
            }

            const permissions = session.user.permissions || [];
            
            // Super Admin bypass
            if (permissions.includes('manage_system')) {
                setIsAuthorized(true);
                return;
            }

            // Find matching permission requirement
            // Sort keys by length descending to ensure specific sub-paths match before general parent paths
            const sortedPaths = Object.keys(PERMISSION_MAP).sort((a, b) => b.length - a.length);
            const matchedPath = sortedPaths.find(path => pathname?.startsWith(path));
            
            if (!matchedPath) {
                // If path not in map, assume it's public admin area (like dashboard)
                setIsAuthorized(true);
                return;
            }

            const requiredPermission = PERMISSION_MAP[matchedPath];
            if (!requiredPermission) {
                setIsAuthorized(true);
                return;
            }

            setIsAuthorized(permissions.includes(requiredPermission));
        };

        checkPermission();
    }, [pathname, session, status]);

    if (status === "loading" || isAuthorized === null) {
        return (
            <div className="flex h-screen w-full items-center justify-center bg-background">
                <Loader2 className="w-10 h-10 animate-spin text-primary" />
            </div>
        );
    }

    if (isAuthorized === false) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen bg-background p-6 text-center">
                <div className="w-20 h-20 bg-red-500/10 rounded-full flex items-center justify-center mb-6 ring-8 ring-red-500/5 anim-pulse">
                    <ShieldAlert className="w-10 h-10 text-red-500" />
                </div>
                <h1 className="text-3xl font-bold text-foreground mb-3 font-outfit uppercase tracking-tighter">Access Denied</h1>
                <p className="text-muted-foreground max-w-md mb-8 leading-relaxed">
                    You don't have the necessary administrative privileges to view this section. 
                    Please contact the system administrator if you believe this is an error.
                </p>
                <div className="flex gap-4">
                    <Link 
                        href="/admin/dashboard" 
                        className="flex items-center gap-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl shadow-lg shadow-indigo-500/20 transition-all active:scale-95 font-bold"
                    >
                        <Home className="w-5 h-5" />
                        Admin Home
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="flex min-h-screen bg-background text-foreground font-sans">

            {/* Mobile Navigation (Bottom Bar + Top Bar within comp) */}
            <AdminMobileNavigation />

            {/* Desktop Sidebar (Hidden on Mobile) */}
            <div className="hidden lg:block fixed h-full w-64 z-50">
                <AdminSidebar />
            </div>

            {/* Content Area */}
            <main className="flex-1 w-full lg:ml-64 pt-20 px-4 pb-24 lg:p-8 lg:pb-8 overflow-x-hidden">
                {children}
            </main>
        </div>
    );
}
