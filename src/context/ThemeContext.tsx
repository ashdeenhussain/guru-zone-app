"use client";

import { createContext, useContext, useEffect, useState } from "react";

type Theme = "light" | "dark" | "mix";

interface ThemeContextType {
    theme: Theme;
    setTheme: (theme: Theme) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
    const [theme, setTheme] = useState<Theme>("dark");
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        // Get stored theme or default to dark
        const storedTheme = localStorage.getItem("theme") as Theme | null;
        if (storedTheme) {
            // eslint-disable-next-line react-hooks/exhaustive-deps
            setTheme(storedTheme);
        }
        setMounted(true);
    }, []);

    useEffect(() => {
        if (!mounted) return;

        // Update DOM
        const root = document.documentElement;
        root.setAttribute("data-theme", theme);

        if (theme === "dark") {
            root.classList.add("dark");
        } else {
            root.classList.remove("dark");
        }

        // Save to local storage
        localStorage.setItem("theme", theme);
    }, [theme, mounted]);

    // Avoid hydration mismatch by rendering nothing until mounted
    // OR just render children with default (server theme mismatch might happen but minimal visual flash if default matches)
    // For better UX, we can just render. The useEffect will fix it immediately on client.

    return (
        <ThemeContext.Provider value={{ theme, setTheme }}>
            {children}
        </ThemeContext.Provider>
    );
}

export function useTheme() {
    const context = useContext(ThemeContext);
    if (context === undefined) {
        throw new Error("useTheme must be used within a ThemeProvider");
    }
    return context;
}
