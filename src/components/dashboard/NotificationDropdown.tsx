"use client";

import { useEffect, useState } from "react";
import { Bell, Check, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { useRouter } from "next/navigation";

interface Notification {
    _id: string;
    title: string;
    message: string;
    isRead: boolean;
    type: 'info' | 'success' | 'warning' | 'error';
    link?: string;
    createdAt: string;
}

export default function NotificationDropdown() {
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [isOpen, setIsOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const router = useRouter();

    const fetchNotifications = async () => {
        try {
            const res = await fetch("/api/notifications");
            if (res.ok) {
                const data = await res.json();
                setNotifications(data.notifications || []);
                setUnreadCount(data.unreadCount || 0);
            }
        } catch (error) {
            console.error("Failed to fetch notifications", error);
        }
    };

    // Poll for notifications every 60 seconds
    useEffect(() => {
        fetchNotifications();
        const interval = setInterval(fetchNotifications, 60000);
        return () => clearInterval(interval);
    }, []);

    const markAsRead = async (id: string, link?: string) => {
        try {
            // Optimistic update
            setNotifications(prev => prev.map(n => n._id === id ? { ...n, isRead: true } : n));
            setUnreadCount(prev => Math.max(0, prev - 1));

            await fetch("/api/notifications", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ notificationId: id }),
            });

            // Navigation removed as per user request (Read Only mode)
            // if (link) {
            //     setIsOpen(false);
            //     router.push(link);
            // }
        } catch (error) {
            console.error("Failed to mark as read", error);
        }
    };

    const markAllAsRead = async () => {
        try {
            setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
            setUnreadCount(0);

            await fetch("/api/notifications", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ markAll: true }),
            });
        } catch (error) {
            console.error("Failed to mark all as read", error);
        }
    };

    return (
        <div className="relative z-50">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="relative p-2 rounded-xl bg-muted/40 hover:bg-muted border border-transparent hover:border-border transition-all"
            >
                <Bell size={20} className="text-muted-foreground hover:text-foreground transition-colors" />
                {unreadCount > 0 && (
                    <span className="absolute top-2 right-2 h-2.5 w-2.5 bg-red-500 rounded-full ring-2 ring-background animate-pulse" />
                )}
            </button>

            <AnimatePresence>
                {isOpen && (
                    <>
                        {/* Backdrop for mobile to close */}
                        <div className="fixed inset-0 z-40 bg-black/10 backdrop-blur-[1px]" onClick={() => setIsOpen(false)} />

                        <motion.div
                            initial={{ opacity: 0, y: 10, scale: 0.95 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: 10, scale: 0.95 }}
                            transition={{ duration: 0.2 }}
                            className="fixed left-4 right-4 top-20 md:fixed-none md:absolute md:right-0 md:left-auto md:top-full md:mt-2 md:w-96 max-h-[80vh] overflow-hidden bg-card/95 backdrop-blur-xl border border-border rounded-xl shadow-2xl z-50 flex flex-col"
                        >
                            {/* Header */}
                            <div className="p-4 border-b border-border flex items-center justify-between sticky top-0 bg-card/95 z-10">
                                <h3 className="font-bold text-foreground">Notifications</h3>
                                {unreadCount > 0 && (
                                    <button
                                        onClick={markAllAsRead}
                                        className="text-xs text-primary hover:text-primary/80 font-medium transition-colors"
                                    >
                                        Mark all read
                                    </button>
                                )}
                            </div>

                            {/* List */}
                            <div className="overflow-y-auto flex-1 p-2 space-y-1 custom-scrollbar">
                                {notifications.length === 0 ? (
                                    <div className="text-center py-8 text-muted-foreground">
                                        <Bell size={32} className="mx-auto mb-2 opacity-20" />
                                        <p className="text-sm">No notifications yet</p>
                                    </div>
                                ) : (
                                    notifications.map((notification) => (
                                        <div
                                            key={notification._id}
                                            onClick={() => markAsRead(notification._id, notification.link)}
                                            className={`
                                                relative p-3 rounded-lg transition-all border border-transparent
                                                ${notification.isRead ? 'bg-transparent' : 'bg-muted/30 border-l-2 border-l-primary'}
                                            `}
                                        >
                                            <div className="flex gap-3">
                                                <div className={`
                                                    mt-1 w-2 h-2 shrink-0 rounded-full
                                                    ${notification.type === 'success' ? 'bg-green-500' :
                                                        notification.type === 'warning' ? 'bg-yellow-500' :
                                                            notification.type === 'error' ? 'bg-red-500' : 'bg-blue-500'}
                                                `} />
                                                <div className="flex-1 overflow-hidden">
                                                    <h4 className={`text-sm font-semibold truncate ${notification.isRead ? 'text-muted-foreground' : 'text-foreground'}`}>
                                                        {notification.title}
                                                    </h4>
                                                    <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">
                                                        {notification.message}
                                                    </p>
                                                    <span className="text-[10px] text-muted-foreground/50 mt-2 block">
                                                        {new Date(notification.createdAt).toLocaleDateString()} • {new Date(notification.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </div>
    );
}
