"use client";

import { useTheme } from "@/context/ThemeContext";
import { Moon, Sun, Sunset } from "lucide-react";

export default function ThemeToggle() {
    const { theme, setTheme } = useTheme();

    // Cycle through themes: light -> dark -> mix -> light
    const toggleTheme = () => {
        if (theme === 'light') setTheme('dark');
        else if (theme === 'dark') setTheme('mix');
        else setTheme('light');
    };

    return (
        <button
            onClick={toggleTheme}
            className="relative p-2 rounded-xl bg-muted/50 border border-border text-foreground hover:bg-muted transition-all active:scale-95"
            aria-label="Toggle Theme"
        >
            {theme === 'light' && <Sun size={20} className="text-yellow-500" />}
            {theme === 'dark' && <Moon size={20} className="text-blue-400" />}
            {theme === 'mix' && <Sunset size={20} className="text-orange-500" />}
        </button>
    );
}
