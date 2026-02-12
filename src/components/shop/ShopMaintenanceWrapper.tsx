import { Lock } from "lucide-react";
import React from 'react';

interface ShopMaintenanceWrapperProps {
    children: React.ReactNode;
    isActive: boolean;
}

export default function ShopMaintenanceWrapper({ children, isActive }: ShopMaintenanceWrapperProps) {
    if (!isActive) {
        return <>{children}</>;
    }

    return (
        <div className="relative w-full h-full min-h-[400px]">
            {/* Blurred Content */}
            <div className="filter blur-md pointer-events-none select-none opacity-50 transition-all duration-500">
                {children}
            </div>

            {/* Overlay */}
            <div className="absolute inset-0 z-50 flex flex-col items-center justify-center p-6 text-center">
                <div className="bg-background/80 backdrop-blur-xl border border-border p-8 rounded-3xl shadow-2xl max-w-md w-full animate-in fade-in zoom-in duration-500">
                    <div className="w-16 h-16 bg-primary/10 text-primary rounded-2xl flex items-center justify-center mx-auto mb-6">
                        {/* eslint-disable-next-line jsx-a11y/alt-text */}
                        <Lock size={32} />
                    </div>
                    <h2 className="text-2xl font-black mb-2 text-foreground">Coming Soon</h2>
                    <p className="text-muted-foreground font-medium">
                        Our shop is currently under maintenance. We're working hard to bring you new and exciting items!
                    </p>
                    <div className="mt-6">
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-primary/10 text-primary">
                            Stay Tuned
                        </span>
                    </div>
                </div>
            </div>
        </div>
    );
}
