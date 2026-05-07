"use client";

import { useState, useEffect } from "react";
import { Bell, BellRing, Settings, ShieldAlert, Zap, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";

function urlBase64ToUint8Array(base64String: string) {
    const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
    const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);
    for (let i = 0; i < rawData.length; ++i) {
        outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
}

export default function NotificationBanner() {
    const [permission, setPermission] = useState<NotificationPermission>("default");
    const [isSupported, setIsSupported] = useState(true);
    const [isSubscribing, setIsSubscribing] = useState(false);

    useEffect(() => {
        if (!("Notification" in window) || !('serviceWorker' in navigator)) {
            setIsSupported(false);
        } else {
            setPermission(Notification.permission);
        }
    }, []);

    const subscribeUser = async () => {
        try {
            const registration = await navigator.serviceWorker.ready;
            let subscription = await registration.pushManager.getSubscription();
            
            if (!subscription) {
                const publicVapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
                if (!publicVapidKey) {
                    console.error("VAPID Key missing");
                    return;
                }

                subscription = await registration.pushManager.subscribe({
                    userVisibleOnly: true,
                    applicationServerKey: urlBase64ToUint8Array(publicVapidKey)
                });
            }

            await fetch('/api/notifications/subscribe', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(subscription),
            });

            return true;
        } catch (error) {
            console.error("Subscription failed:", error);
            return false;
        }
    };

    const handleRequest = async () => {
        if (!isSupported) {
            toast.error("Notifications are not supported on this device.");
            return;
        }

        setIsSubscribing(true);
        try {
            const result = await Notification.requestPermission();
            setPermission(result);

            if (result === "granted") {
                const success = await subscribeUser();
                if (success) {
                    toast.success("Push notifications active!", {
                        icon: <BellRing className="w-5 h-5 text-primary" />
                    });
                } else {
                    toast.error("Permission granted, but subscription failed.");
                }
            } else if (result === "denied") {
                toast.error("Permission denied. Check browser settings.");
            }
        } catch (error) {
            toast.error("Failed to enable notifications.");
        } finally {
            setIsSubscribing(false);
        }
    };

    if (!isSupported) return null;

    return (
        <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="relative overflow-hidden rounded-[2rem] border border-border bg-card p-5 shadow-sm group"
        >
            {/* Ambient Background */}
            <div className={`absolute top-0 right-0 w-32 h-32 blur-[60px] rounded-full pointer-events-none transition-colors duration-700 ${permission === 'granted' ? 'bg-green-500/10' : permission === 'denied' ? 'bg-red-500/10' : 'bg-primary/10'}`} />
            
            <div className="flex flex-col sm:flex-row items-center justify-between gap-6 relative z-10">
                <div className="flex items-center gap-4 text-center sm:text-left">
                    <div className={`p-3 rounded-2xl border flex items-center justify-center shadow-lg transition-all duration-500 ${
                        permission === 'granted' ? 'bg-green-500/10 border-green-500/20 text-green-500' : 
                        permission === 'denied' ? 'bg-red-500/10 border-red-500/20 text-red-500' : 
                        'bg-primary/10 border-primary/20 text-primary group-hover:scale-110'
                    }`}>
                        {permission === 'granted' ? <CheckCircle2 size={24} /> : 
                         permission === 'denied' ? <ShieldAlert size={24} /> : 
                         <BellRing size={24} className="animate-pulse" />}
                    </div>
                    <div>
                        <h4 className="font-black text-sm uppercase tracking-wider text-foreground">
                            {permission === 'granted' ? 'Notifications Active' : 
                             permission === 'denied' ? 'Access Restricted' : 
                             'Push Notifications'}
                        </h4>
                        <p className="text-xs text-muted-foreground font-medium max-w-[240px]">
                            {permission === 'granted' ? 'You are all set! We will notify you of match updates.' : 
                             permission === 'denied' ? 'Enable in browser settings to receive match alerts.' : 
                             'Get instant alerts for match starts, room IDs, and chat messages.'}
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-3 w-full sm:w-auto">
                    {permission === 'default' && (
                        <button
                            onClick={handleRequest}
                            disabled={isSubscribing}
                            className="flex-1 sm:flex-none px-6 py-3 bg-primary text-primary-foreground font-black uppercase tracking-widest text-[10px] rounded-xl hover:scale-[1.02] active:scale-95 transition-all shadow-lg shadow-primary/20 disabled:opacity-50"
                        >
                            {isSubscribing ? 'Processing...' : 'Enable Now'}
                        </button>
                    )}
                    {permission === 'denied' && (
                        <div className="flex items-center gap-2 px-4 py-2 bg-red-500/10 border border-red-500/20 rounded-xl">
                            <span className="text-[10px] font-black text-red-500 uppercase tracking-widest">Blocked by Browser</span>
                        </div>
                    )}
                    {permission === 'granted' && (
                        <div className="flex items-center gap-2 px-4 py-2 bg-green-500/10 border border-green-500/20 rounded-xl">
                            <span className="text-[10px] font-black text-green-500 uppercase tracking-widest">Running Live</span>
                        </div>
                    )}
                    <button className="p-3 bg-muted/50 border border-border text-muted-foreground rounded-xl hover:bg-muted transition-colors">
                        <Settings size={18} />
                    </button>
                </div>
            </div>
        </motion.div>
    );
}

