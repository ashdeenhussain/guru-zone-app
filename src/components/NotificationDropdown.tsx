"use client";

import { useEffect, useState } from "react";
import { X, Check, Bell, Trophy, ShoppingBag, Info, AlertTriangle, AlertCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { formatDistanceToNow } from "date-fns";

interface Notification {
    _id: string;
    title: string;
    message: string;
    isRead: boolean;
    type: 'info' | 'success' | 'warning' | 'error';
    link?: string;
    createdAt: string;
}

interface NotificationDropdownProps {
    isOpen: boolean;
    onClose: () => void;
    onUnreadCountChange?: (count: number) => void;
}

export default function NotificationDropdown({ isOpen, onClose, onUnreadCountChange }: NotificationDropdownProps) {
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [loading, setLoading] = useState(false);
    const [unreadCount, setUnreadCount] = useState(0);
    const router = useRouter();

    const fetchNotifications = async () => {
        try {
            setLoading(true);
            const res = await fetch("/api/notifications");
            const data = await res.json();

            if (res.ok) {
                setNotifications(data.notifications || []);
                const count = data.unreadCount || 0;
                setUnreadCount(count);
                if (onUnreadCountChange) onUnreadCountChange(count);
            }
        } catch (error) {
            console.error("Failed to fetch notifications", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchNotifications();
        // Poll for new notifications every minute
        const interval = setInterval(fetchNotifications, 60000);
        return () => clearInterval(interval);
    }, []);

    // Refresh when opened
    useEffect(() => {
        if (isOpen) {
            fetchNotifications();
        }
    }, [isOpen]);

    const markAsRead = async (id: string) => {
        try {
            await fetch("/api/notifications", {
                method: "PATCH",
                body: JSON.stringify({ notificationId: id, markAll: false }),
            });

            setNotifications(prev => prev.map(n =>
                n._id === id ? { ...n, isRead: true } : n
            ));

            setUnreadCount(prev => Math.max(0, prev - 1));
            if (onUnreadCountChange) onUnreadCountChange(Math.max(0, unreadCount - 1));
        } catch (error) {
            console.error("Failed to mark notification as read", error);
        }
    };

    const markAllAsRead = async () => {
        try {
            await fetch("/api/notifications", {
                method: "PATCH",
                body: JSON.stringify({ markAll: true }),
            });

            setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
            setUnreadCount(0);
            if (onUnreadCountChange) onUnreadCountChange(0);
        } catch (error) {
            console.error("Failed to mark all as read", error);
        }
    };

    const getIcon = (type: string) => {
        switch (type) {
            case 'success': return <Check size={16} className="text-green-500" />;
            case 'warning': return <AlertTriangle size={16} className="text-yellow-500" />;
            case 'error': return <AlertCircle size={16} className="text-red-500" />;
            default: return <Info size={16} className="text-blue-500" />;
        }
    };

    const handleNotificationClick = async (notification: Notification) => {
        if (!notification.isRead) {
            markAsRead(notification._id);
        }

        onClose();

        // Redirect logic
        if (notification.link) {
            router.push(notification.link);
            return;
        }

        // Fallback redirection logic based on content
        const titleLower = notification.title.toLowerCase();
        const msgLower = notification.message.toLowerCase();

        if (titleLower.includes("tournament") || msgLower.includes("tournament")) {
            router.push("/dashboard"); // Or specific tournament page if ID could be extracted
        } else if (titleLower.includes("order") || msgLower.includes("order")) {
            router.push("/dashboard/shop");
        } else if (titleLower.includes("wallet") || msgLower.includes("deposit") || msgLower.includes("withdraw")) {
            router.push("/dashboard/wallet");
        }
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    transition={{ duration: 0.2 }}
                    className="absolute right-0 top-12 w-80 md:w-96 bg-[#0f172a] border border-white/10 rounded-xl shadow-2xl overflow-hidden z-50 backdrop-blur-xl"
                >
                    {/* Header */}
                    <div className="flex items-center justify-between p-4 border-b border-white/5 bg-white/5">
                        <div className="flex items-center gap-2">
                            <Bell size={16} className="text-primary" />
                            <h3 className="font-bold text-white">Notifications</h3>
                            {unreadCount > 0 && (
                                <span className="bg-primary text-primary-foreground text-xs font-bold px-2 py-0.5 rounded-full">
                                    {unreadCount}
                                </span>
                            )}
                        </div>
                        <div className="flex items-center gap-2">
                            {unreadCount > 0 && (
                                <button
                                    onClick={markAllAsRead}
                                    className="text-xs text-muted-foreground hover:text-primary transition-colors mr-2"
                                >
                                    Mark all read
                                </button>
                            )}
                            <button
                                onClick={onClose}
                                className="p-1 hover:bg-white/10 rounded-full text-gray-400 hover:text-white transition-colors"
                                title="Close"
                            >
                                <X size={18} />
                            </button>
                        </div>
                    </div>

                    {/* Content */}
                    <div className="max-h-[400px] overflow-y-auto custom-scrollbar">
                        {loading && notifications.length === 0 ? (
                            <div className="flex justify-center p-8">
                                <div className="h-6 w-6 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
                            </div>
                        ) : notifications.length > 0 ? (
                            <div className="flex flex-col">
                                {notifications.map((notification) => (
                                    <button
                                        key={notification._id}
                                        onClick={() => handleNotificationClick(notification)}
                                        className={`flex gap-3 p-4 text-left transition-colors border-b border-white/5 last:border-0 relative hover:bg-white/5
                                            ${!notification.isRead ? 'bg-primary/5' : ''}
                                        `}
                                    >
                                        <div className={`mt-1 p-2 rounded-full bg-white/5 h-fit`}>
                                            {getIcon(notification.type)}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex justify-between items-start gap-2">
                                                <p className={`text-sm font-semibold truncate ${!notification.isRead ? 'text-white' : 'text-gray-400'}`}>
                                                    {notification.title}
                                                </p>
                                                {!notification.isRead && (
                                                    <span className="h-2 w-2 rounded-full bg-primary flex-shrink-0 mt-1.5" />
                                                )}
                                            </div>
                                            <p className="text-xs text-gray-400 mt-1 line-clamp-2">
                                                {notification.message}
                                            </p>
                                            <p className="text-[10px] text-gray-500 mt-2">
                                                {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
                                            </p>
                                        </div>
                                    </button>
                                ))}
                            </div>
                        ) : (
                            <div className="flex flex-col items-center justify-center p-8 text-center text-gray-400">
                                <Bell size={32} className="mb-2 opacity-20" />
                                <p className="text-sm">No notifications yet</p>
                            </div>
                        )}
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
