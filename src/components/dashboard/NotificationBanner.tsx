"use client";

import { useState, useEffect } from "react";
import { ArrowUpRight, Bell, BellRing, CheckCircle } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";

export default function NotificationBanner() {
    const [permission, setPermission] = useState<NotificationPermission>("default");
    const [isSupported, setIsSupported] = useState(true);

    useEffect(() => {
        if (!("Notification" in window)) {
            setIsSupported(false);
        } else {
            setPermission(Notification.permission);
        }
    }, []);

    const requestPermission = async () => {
        if (!isSupported) {
            toast.error("Notifications are not supported in this browser.");
            return;
        }

        try {
            const result = await Notification.requestPermission();
            setPermission(result);

            if (result === "granted") {
                toast.success("Notifications enabled successfully!");
                // Here you would typically subscribe the user to push notifications
                // await subscribeToPush(); 
            } else if (result === "denied") {
                toast.error("Notifications were denied. Please enable them in browser settings.");
            }
        } catch (error) {
            console.error("Error requesting notification permission:", error);
            toast.error("Something went wrong.");
        }
    };

    // If notifications are already granted or not supported, we might show a different banner or nothing.
    // For now, let's keep it visible but change state, or hide if granted to avoid clutter?
    // The user might want to see it to manage them. Let's show "Enabled" state.

    if (!isSupported) return null;

    // If granted, maybe show a "View Settings" banner or hide it to save space?
    // Let's show a "Notifications Active" banner that links to settings.
    if (permission === 'granted') {
        return (
            <div className="bg-primary/10 backdrop-blur-md border border-primary/20 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 relative overflow-hidden group shadow-sm">
                <div className="absolute inset-0 bg-primary/5 blur-xl group-hover:bg-primary/10 transition-colors duration-500 pointer-events-none" />
                <div className="flex items-center gap-3 relative z-10">
                    <div className="p-2 bg-primary/20 text-primary rounded-lg">
                        <BellRing size={20} />
                    </div>
                    <div>
                        <p className="text-foreground font-bold text-sm">Notifications Active</p>
                        <p className="text-muted-foreground text-xs">You will receive updates on tournaments</p>
                    </div>
                </div>
                <div className="flex items-center gap-3 w-full sm:w-auto relative z-10">
                    <Link href="/dashboard/settings" className="flex-1 sm:flex-none px-4 py-2 bg-background border border-border text-foreground hover:bg-muted font-bold rounded-xl text-xs transition-all text-center">
                        Manage Settings
                    </Link>
                </div>
            </div>
        );
    }

    // Default state: Prompt to enable
    return (
        <div className="bg-card backdrop-blur-md border border-border rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 relative overflow-hidden group shadow-sm">
            <div className="absolute inset-0 bg-primary/5 blur-xl group-hover:bg-primary/10 transition-colors duration-500 pointer-events-none" />

            <div className="flex items-center gap-3 relative z-10">
                <div className="p-2 bg-primary/10 text-primary rounded-lg border border-primary/20">
                    <Bell size={20} />
                </div>
                <div>
                    <p className="text-foreground font-bold text-sm">Enable Notifications</p>
                    <p className="text-muted-foreground text-xs">Don't miss out on tournament updates</p>
                </div>
            </div>

            <div className="flex items-center gap-3 w-full sm:w-auto relative z-10">
                <button
                    onClick={requestPermission}
                    className="flex-1 sm:flex-none px-4 py-2 bg-primary text-primary-foreground font-bold rounded-xl text-xs hover:opacity-90 transition-opacity shadow-lg shadow-primary/20 whitespace-nowrap"
                >
                    Allow Push
                </button>
                <Link href="/dashboard/settings" className="p-2 bg-muted/50 border border-border text-muted-foreground rounded-xl hover:bg-muted transition-colors" aria-label="Settings">
                    <ArrowUpRight size={18} />
                </Link>
            </div>
        </div>
    );
}
