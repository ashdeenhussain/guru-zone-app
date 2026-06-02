"use client";

import { useEffect, useState } from "react";
import { Bell, Check, X, RotateCw } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { NotificationItem, Notification } from "../NotificationItem";

export default function NotificationDropdown() {
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [isOpen, setIsOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const router = useRouter();

    const fetchNotifications = async (force = false) => {
        if (!force && typeof document !== 'undefined' && document.visibilityState !== 'visible') {
            return;
        }
        setIsLoading(true);
        try {
            const res = await fetch("/api/notifications");
            if (res.ok) {
                const data = await res.json();
                setNotifications(data.notifications || []);
                setUnreadCount(data.unreadCount || 0);
            }
        } catch (error) {
            console.error("Failed to fetch notifications", error);
        } finally {
            setIsLoading(false);
        }
    };

    // Poll for notifications every 180 seconds
    useEffect(() => {
        fetchNotifications(true);
        const interval = setInterval(() => fetchNotifications(false), 180000);
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
                            <div className="flex items-center justify-between p-4 border-b border-border bg-card/95 z-10 sticky top-0">
                                <div className="flex items-center gap-2">
                                    <Bell size={16} className="text-primary hidden sm:block" />
                                    <h3 className="font-bold text-foreground">Notifications</h3>
                                    {unreadCount > 0 && (
                                        <span className="bg-primary text-primary-foreground text-xs font-bold px-2 py-0.5 rounded-full">
                                            {unreadCount}
                                        </span>
                                    )}
                                </div>
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={() => fetchNotifications(true)}
                                        disabled={isLoading}
                                        className="p-1.5 hover:bg-muted/50 rounded-full text-muted-foreground hover:text-foreground transition-colors mr-1 flex items-center justify-center"
                                        title="Refresh notifications"
                                    >
                                        <RotateCw size={14} className={isLoading ? "animate-spin text-primary" : ""} />
                                    </button>
                                    {unreadCount > 0 && (
                                        <button
                                            onClick={markAllAsRead}
                                            className="text-xs text-muted-foreground hover:text-primary transition-colors mr-2"
                                        >
                                            Mark all read
                                        </button>
                                    )}
                                    <button
                                        onClick={() => setIsOpen(false)}
                                        className="p-1 hover:bg-muted/50 rounded-full text-muted-foreground hover:text-foreground transition-colors"
                                        title="Close"
                                    >
                                        <X size={18} />
                                    </button>
                                </div>
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
                                        <NotificationItem
                                            key={notification._id}
                                            notification={notification}
                                            onClick={() => markAsRead(notification._id, notification.link)}
                                            variant="adaptive"
                                        />
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
