'use client';

import { useState } from "react";
import AdminSidebar from '@/components/admin/Sidebar';
import AdminMobileNavigation from '@/components/admin/AdminMobileNavigation';

export default function AdminLayoutShell({
    children,
}: {
    children: React.ReactNode;
}) {
    // We can rely on hidden/block classes for responsiveness instead of state for the sidebar on mobile 
    // since we now have a dedicated bottom nav.
    // The Sidebar will only be for Desktop (lg:block).

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
