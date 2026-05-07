'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, BellRing, X, ShieldCheck, Zap, MessageSquare } from 'lucide-react';
import { toast } from 'sonner';
import { setupNativeChannels, registerNativePush } from '@/lib/native-notifications';

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

export default function PushNotificationManager() {
    const { data: session, status } = useSession();
    const [showPrompt, setShowPrompt] = useState(false);
    const [isSubscribing, setIsSubscribing] = useState(false);

    useEffect(() => {
        // Only run on client and if user is logged in
        if (typeof window === 'undefined' || status !== 'authenticated' || !session?.user) return;

        // 1. Native Capacitor Registration
        const handleNativeRegistration = async () => {
            try {
                await setupNativeChannels();
                await registerNativePush(async (token) => {
                    await fetch('/api/notifications/subscribe', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ fcmToken: token }),
                    });
                });
            } catch (err) {
                console.error('Native registration failed:', err);
            }
        };

        handleNativeRegistration();

        // 2. Standard Web Push (PWA) Registration
        // Check if service worker and push are supported
        if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
            console.warn('Push notifications are not supported in this browser.');
            return;
        }

        // Register Service Worker
        navigator.serviceWorker.register('/sw.js').then((registration) => {
            console.log('SW registered:', registration);
            
            // Check current permission status
            if (Notification.permission === 'default') {
                const timer = setTimeout(() => {
                    const hasSeenPrompt = sessionStorage.getItem('hasSeenPushPrompt');
                    if (!hasSeenPrompt) {
                        setShowPrompt(true);
                    }
                }, 3000);
                return () => clearTimeout(timer);
            } else if (Notification.permission === 'granted') {
                syncSubscription(registration);
            }
        }).catch(err => console.error('SW registration failed:', err));

    }, [status, session]);

    const syncSubscription = async (registration: ServiceWorkerRegistration) => {
        try {
            let subscription = await registration.pushManager.getSubscription();
            
            if (!subscription) {
                const publicVapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
                if (!publicVapidKey) return;

                subscription = await registration.pushManager.subscribe({
                    userVisibleOnly: true,
                    applicationServerKey: urlBase64ToUint8Array(publicVapidKey)
                });
            }

            // Send to backend
            await fetch('/api/notifications/subscribe', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(subscription),
            });
        } catch (error) {
            console.error('Failed to sync push subscription:', error);
        }
    };

    const handleEnable = async () => {
        setIsSubscribing(true);
        try {
            const permission = await Notification.requestPermission();
            if (permission === 'granted') {
                const registration = await navigator.serviceWorker.ready;
                await syncSubscription(registration);
                toast.success('Notifications enabled! You won\'t miss any updates.', {
                    icon: <BellRing className="w-5 h-5 text-primary" />
                });
                setShowPrompt(false);
                sessionStorage.setItem('hasSeenPushPrompt', 'true');
            } else {
                toast.error('Notification permission denied.');
                setShowPrompt(false);
                sessionStorage.setItem('hasSeenPushPrompt', 'true');
            }
        } catch (error) {
            toast.error('Failed to enable notifications.');
        } finally {
            setIsSubscribing(false);
        }
    };

    const handleClose = () => {
        setShowPrompt(false);
        sessionStorage.setItem('hasSeenPushPrompt', 'true');
    };

    return (
        <AnimatePresence>
            {showPrompt && (
                <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-4 sm:p-6 pointer-events-none">
                    <motion.div
                        initial={{ opacity: 0, y: 100, scale: 0.9 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 100, scale: 0.9 }}
                        className="w-full max-w-md bg-card border border-border rounded-[2.5rem] shadow-[0_20px_50px_rgba(0,0,0,0.3)] overflow-hidden pointer-events-auto"
                    >
                        {/* Premium Header Decoration */}
                        <div className="relative h-32 bg-gradient-to-br from-primary/20 via-primary/10 to-transparent flex items-center justify-center overflow-hidden">
                            <div className="absolute inset-0 opacity-10">
                                <div className="absolute top-0 left-0 w-32 h-32 bg-primary rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2" />
                                <div className="absolute bottom-0 right-0 w-32 h-32 bg-primary rounded-full blur-3xl translate-x-1/2 translate-y-1/2" />
                            </div>
                            
                            <motion.div 
                                animate={{ 
                                    rotate: [0, -10, 10, -10, 10, 0],
                                    scale: [1, 1.1, 1]
                                }}
                                transition={{ 
                                    duration: 2, 
                                    repeat: Infinity,
                                    repeatDelay: 3
                                }}
                                className="relative"
                            >
                                <div className="w-20 h-20 bg-primary rounded-3xl flex items-center justify-center shadow-xl shadow-primary/20 rotate-3">
                                    <BellRing className="w-10 h-10 text-primary-foreground" />
                                </div>
                                <div className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 rounded-full border-4 border-card animate-pulse" />
                            </motion.div>
                        </div>

                        <div className="p-8 space-y-6">
                            <div className="text-center space-y-2">
                                <h3 className="text-2xl font-black text-foreground uppercase tracking-tight">Stay in the Game</h3>
                                <p className="text-sm text-muted-foreground font-medium leading-relaxed">
                                    Get instant alerts for match starts, room details, and new messages. Never miss a win!
                                </p>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="bg-muted/30 p-4 rounded-2xl flex flex-col items-center gap-2 text-center">
                                    <MessageSquare className="w-5 h-5 text-primary" />
                                    <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Chat Alerts</span>
                                </div>
                                <div className="bg-muted/30 p-4 rounded-2xl flex flex-col items-center gap-2 text-center">
                                    <Zap className="w-5 h-5 text-primary" />
                                    <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Match Updates</span>
                                </div>
                            </div>

                            <div className="flex flex-col gap-3">
                                <button
                                    onClick={handleEnable}
                                    disabled={isSubscribing}
                                    className="group relative flex items-center justify-center gap-3 bg-primary text-primary-foreground px-8 py-4 rounded-2xl font-black uppercase tracking-widest text-sm transition-all hover:scale-[1.02] active:scale-95 shadow-xl shadow-primary/20 disabled:opacity-50"
                                >
                                    {isSubscribing ? (
                                        <Zap className="w-5 h-5 animate-spin" />
                                    ) : (
                                        <>
                                            <ShieldCheck className="w-5 h-5" />
                                            Enable Notifications
                                        </>
                                    )}
                                </button>
                                <button
                                    onClick={handleClose}
                                    className="px-8 py-3 rounded-2xl font-black uppercase tracking-widest text-[10px] text-muted-foreground hover:text-foreground transition-colors"
                                >
                                    Maybe Later
                                </button>
                            </div>
                        </div>

                        {/* Close button */}
                        <button 
                            onClick={handleClose}
                            className="absolute top-4 right-4 p-2 text-muted-foreground/30 hover:text-foreground transition-colors"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}
