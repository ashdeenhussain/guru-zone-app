'use client';

import { useState, useEffect, useRef } from 'react';
import { Bell, Check, ArrowDownCircle, ArrowUpCircle, ShoppingBag, AlertCircle, Info, CreditCard, ExternalLink } from 'lucide-react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { motion, AnimatePresence } from 'framer-motion';

interface AdminNotificationType {
    _id: string;
    title: string;
    message: string;
    type: 'deposit' | 'withdraw' | 'order' | 'request' | 'ticket' | 'system';
    link?: string;
    isRead: string[];
    createdAt: string;
}

const getNotificationTypeConfig = (type: string) => {
    switch (type) {
        case 'deposit':
            return { icon: <ArrowDownCircle className="w-5 h-5" />, color: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20' };
        case 'withdraw':
            return { icon: <ArrowUpCircle className="w-5 h-5" />, color: 'text-rose-400', bg: 'bg-rose-500/10', border: 'border-rose-500/20' };
        case 'order':
            return { icon: <ShoppingBag className="w-5 h-5" />, color: 'text-amber-400', bg: 'bg-amber-500/10', border: 'border-amber-500/20' };
        case 'request':
            return { icon: <AlertCircle className="w-5 h-5" />, color: 'text-indigo-400', bg: 'bg-indigo-500/10', border: 'border-indigo-500/20' };
        case 'ticket':
            return { icon: <CreditCard className="w-5 h-5" />, color: 'text-fuchsia-400', bg: 'bg-fuchsia-500/10', border: 'border-fuchsia-500/20' };
        default:
            return { icon: <Info className="w-5 h-5" />, color: 'text-slate-400', bg: 'bg-slate-500/10', border: 'border-slate-500/20' };
    }
};

export default function AdminNotificationDropdown() {
    const { data: session } = useSession();
    const [notifications, setNotifications] = useState<AdminNotificationType[]>([]);
    const [isOpen, setIsOpen] = useState(false);
    const [unreadCount, setUnreadCount] = useState(0);
    const [mounted, setMounted] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);
    const userId = (session?.user as any)?.id;

    useEffect(() => {
        setMounted(true);
    }, []);

    const fixDate = (dateStr: string) => {
        const date = new Date(dateStr);
        const now = new Date();
        // If date is more than 1 minute in the future, it's likely a double offset (+5 hours)
        if (date.getTime() > now.getTime() + 60000) {
            return new Date(date.getTime() - 5 * 60 * 60 * 1000);
        }
        return date;
    };

    const formatMessage = (message: string) => {
        // Regex to find ISO date strings: 2026-04-26T12:00:00.000Z or similar
        const isoRegex = /\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d+)?Z/g;
        return message.replace(isoRegex, (match) => {
            try {
                return fixDate(match).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            } catch (e) {
                return match;
            }
        });
    };

    const fetchNotifications = async () => {
        try {
            const res = await fetch('/api/admin/notifications');
            if (res.ok) {
                const data = await res.json();
                setNotifications(data);
                if (userId) {
                    const unread = data.filter((n: AdminNotificationType) => !n.isRead.includes(userId));
                    setUnreadCount(prev => {
                        if (unread.length > prev && typeof window !== 'undefined' && Notification.permission === 'granted') {
                            const latest = unread[0];
                            if (latest) {
                                new Notification(`Guru Zone: ${latest.title}`, {
                                    body: latest.message,
                                    icon: '/logo.png'
                                });
                            }
                        }
                        return unread.length;
                    });
                }
            }
        } catch (error) {
            console.error('Failed to fetch admin notifications', error);
        }
    };

    // Polling every 15 seconds
    useEffect(() => {
        if (!session?.user || (session.user as any).role !== 'admin') return;
        fetchNotifications();
        const interval = setInterval(fetchNotifications, 15000);
        return () => clearInterval(interval);
    }, [session?.user]);

    // Request desktop notification permission
    useEffect(() => {
        if (typeof window !== 'undefined' && Notification.permission === 'default') {
            Notification.requestPermission();
        }
    }, []);

    // Close on click outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const markAsRead = async (id: string) => {
        try {
            await fetch('/api/admin/notifications', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id })
            });
            fetchNotifications();
        } catch (error) {
            console.error('Failed to mark read', error);
        }
    };

    const markAllAsRead = async () => {
        try {
            await fetch('/api/admin/notifications', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ markAllRead: true })
            });
            fetchNotifications();
        } catch (error) {
            console.error('Failed to mark all read', error);
        }
    };

    return (
        <div className="relative" ref={dropdownRef}>
            {/* Bell Button */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="relative p-2 rounded-xl transition-all duration-200 hover:bg-indigo-500/10 group focus:outline-none"
            >
                <Bell className={`w-6 h-6 transition-colors duration-200 ${isOpen ? 'text-indigo-400' : 'text-muted-foreground group-hover:text-indigo-400'}`} />
                {unreadCount > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 flex h-4 w-4">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-60"></span>
                        <span className="relative inline-flex items-center justify-center h-4 w-4 rounded-full bg-rose-500 border-2 border-background text-[9px] font-black text-white">
                            {unreadCount > 9 ? '9+' : unreadCount}
                        </span>
                    </span>
                )}
            </button>

            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: 12, scale: 0.96 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 12, scale: 0.96 }}
                        transition={{ type: 'spring', damping: 22, stiffness: 320 }}
                        className="absolute right-0 mt-3 w-80 sm:w-96 z-[200] overflow-hidden rounded-2xl border border-white/10 shadow-2xl shadow-black/60"
                        style={{
                            background: 'linear-gradient(145deg, rgba(15,23,42,0.97) 0%, rgba(17,24,39,0.97) 100%)',
                            backdropFilter: 'blur(24px)',
                            originX: 0.9,
                            originY: 0
                        }}
                    >
                        {/* Header */}
                        <div className="px-5 py-4 border-b border-white/5 flex items-center justify-between"
                            style={{ background: 'linear-gradient(90deg, rgba(99,102,241,0.1) 0%, transparent 100%)' }}
                        >
                            <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
                                Notifications
                                {unreadCount > 0 && (
                                    <span className="text-[10px] font-black bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 px-2 py-0.5 rounded-full uppercase tracking-wide">
                                        {unreadCount} New
                                    </span>
                                )}
                            </h3>
                            {unreadCount > 0 && (
                                <button
                                    onClick={markAllAsRead}
                                    className="flex items-center gap-1 text-[11px] font-bold text-indigo-400 hover:text-indigo-300 bg-indigo-500/10 hover:bg-indigo-500/20 border border-indigo-500/20 px-2.5 py-1 rounded-lg transition-all"
                                >
                                    <Check className="w-3 h-3" /> Mark all read
                                </button>
                            )}
                        </div>

                        {/* Notification List */}
                        <div className="max-h-[420px] overflow-y-auto" style={{ scrollbarWidth: 'thin', scrollbarColor: 'rgba(255,255,255,0.08) transparent' }}>
                            {notifications.length === 0 ? (
                                <div className="py-14 flex flex-col items-center gap-3">
                                    <div className="w-14 h-14 rounded-2xl bg-slate-800/80 border border-white/5 flex items-center justify-center">
                                        <Bell className="w-6 h-6 text-slate-600" />
                                    </div>
                                    <div className="text-center">
                                        <p className="text-sm font-semibold text-slate-400">All caught up!</p>
                                        <p className="text-xs text-slate-600 mt-0.5">No new notifications right now.</p>
                                    </div>
                                </div>
                            ) : (
                                <div className="p-2 space-y-1">
                                    {notifications.map((notification) => {
                                        const isUnread = userId && !notification.isRead.includes(userId);
                                        const config = getNotificationTypeConfig(notification.type);
                                        return (
                                            <div
                                                key={notification._id}
                                                className={`relative group p-3.5 rounded-xl border transition-all duration-200 ${isUnread
                                                    ? 'bg-white/[0.04] border-white/[0.06] hover:bg-white/[0.07]'
                                                    : 'bg-transparent border-transparent opacity-55 hover:opacity-80 hover:bg-white/[0.02]'
                                                }`}
                                            >
                                                <div className="flex gap-3">
                                                    {/* Icon */}
                                                    <div className={`shrink-0 w-10 h-10 rounded-xl flex items-center justify-center border ${config.bg} ${config.border} ${config.color}`}>
                                                        {config.icon}
                                                    </div>
                                                    {/* Content */}
                                                    <div className="flex-1 min-w-0">
                                                        <div className="flex items-start justify-between gap-2 mb-1">
                                                            <h4 className={`text-[13px] font-bold leading-tight truncate ${isUnread ? 'text-foreground' : 'text-muted-foreground'}`}>
                                                                {notification.title}
                                                            </h4>
                                                            <span className="text-[10px] text-muted-foreground whitespace-nowrap font-medium shrink-0 mt-0.5">
                                                                {mounted ? fixDate(notification.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '--:--'}
                                                            </span>
                                                        </div>
                                                        <p className="text-[12px] text-muted-foreground leading-relaxed line-clamp-2">
                                                            {formatMessage(notification.message)}
                                                        </p>
                                                        <div className="flex items-center gap-3 mt-2.5">
                                                            {notification.link && (
                                                                <Link
                                                                    href={notification.link}
                                                                    onClick={() => {
                                                                        if (isUnread) markAsRead(notification._id);
                                                                        setIsOpen(false);
                                                                    }}
                                                                    className="inline-flex items-center gap-1 text-[11px] font-bold text-indigo-400 hover:text-indigo-300 transition-colors"
                                                                >
                                                                    View <ExternalLink className="w-3 h-3" />
                                                                </Link>
                                                            )}
                                                            {isUnread && (
                                                                <button
                                                                    onClick={() => markAsRead(notification._id)}
                                                                    className="text-[11px] font-medium text-slate-500 hover:text-slate-300 transition-colors"
                                                                >
                                                                    Dismiss
                                                                </button>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                                {/* Unread dot */}
                                                {isUnread && (
                                                    <div className="absolute top-4 right-3.5 w-1.5 h-1.5 rounded-full bg-indigo-500 shadow-[0_0_6px_rgba(99,102,241,0.9)]" />
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>

                        {/* Footer */}
                        <div className="px-5 py-3 border-t border-white/5 bg-slate-900/60 text-center">
                            <span className="text-[9px] text-muted-foreground/40 uppercase tracking-[0.2em] font-black">
                                Guru Zone Admin Panel
                            </span>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
