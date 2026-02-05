"use client";

import Link from "next/link";
import { Bell, Sun, Moon, Sunset } from "lucide-react";
import { useTheme } from "@/context/ThemeContext";

import NotificationDropdown from "./NotificationDropdown";
import { useState, useRef, useEffect } from "react";

export default function DashboardHeader() {
    const { theme, setTheme } = useTheme();
    const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
    const [unreadCount, setUnreadCount] = useState(0);
    const notificationRef = useRef<HTMLDivElement>(null);

    // Handle click outside to close notifications
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (notificationRef.current && !notificationRef.current.contains(event.target as Node)) {
                setIsNotificationsOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, []);

    return (
        <header className="hidden lg:flex fixed top-0 right-0 left-0 z-50 h-20 bg-background/80 backdrop-blur-xl border-b border-border items-center justify-between px-6 transition-all duration-300">
            {/* Left Side: Logo/Title */}
            <div className="flex items-center gap-3">
                <div className="relative h-10 w-10 overflow-hidden rounded-lg">
                    <img src="/logo.jpg" alt="Guru Zone Logo" className="h-full w-full object-cover" />
                </div>
                <span className="text-xl font-bold bg-gradient-to-r from-primary to-yellow-200 bg-clip-text text-transparent tracking-tighter block">
                    GURU ZONE
                </span>
            </div>

            {/* Right Side: Actions */}
            <div className="flex items-center gap-4">
                {/* Notifications */}
                <div className="relative" ref={notificationRef}>
                    <button
                        onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
                        className="relative p-2 text-muted-foreground hover:text-white transition-all duration-200 hover:bg-white/5 rounded-full hover:scale-110 active:scale-95"
                    >
                        <Bell size={20} />
                        {unreadCount > 0 && (
                            <span className="absolute top-2 right-2 h-2 w-2 bg-red-500 rounded-full animate-pulse"></span>
                        )}
                    </button>

                    <NotificationDropdown
                        isOpen={isNotificationsOpen}
                        onClose={() => setIsNotificationsOpen(false)}
                        onUnreadCountChange={setUnreadCount}
                    />
                </div>

                {/* Theme Toggle */}
                <div className="flex items-center bg-muted/20 backdrop-blur-sm border border-border rounded-full p-1">
                    <button
                        onClick={() => setTheme('light')}
                        className={`p-1.5 rounded-full transition-all duration-200 hover:scale-110 active:scale-95 ${theme === 'light'
                            ? 'bg-primary text-primary-foreground shadow-sm'
                            : 'text-muted-foreground hover:text-foreground'
                            }`}
                        title="Light Mode"
                    >
                        <Sun size={16} />
                    </button>
                    <button
                        onClick={() => setTheme('dark')}
                        className={`p-1.5 rounded-full transition-all duration-200 hover:scale-110 active:scale-95 ${theme === 'dark'
                            ? 'bg-primary text-primary-foreground shadow-sm'
                            : 'text-muted-foreground hover:text-foreground'
                            }`}
                        title="Dark Mode"
                    >
                        <Moon size={16} />
                    </button>
                    <button
                        onClick={() => setTheme('mix')}
                        className={`p-1.5 rounded-full transition-all duration-200 hover:scale-110 active:scale-95 ${theme === 'mix'
                            ? 'bg-primary text-primary-foreground shadow-sm'
                            : 'text-muted-foreground hover:text-foreground'
                            }`}
                        title="Mix Mode"
                    >
                        <Sunset size={16} />
                    </button>
                </div>
            </div>
        </header>
    );
}
