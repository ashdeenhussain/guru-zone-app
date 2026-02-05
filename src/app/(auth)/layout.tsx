"use client";

import React from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import ThemeToggle from "@/components/ThemeToggle";

export default function AuthLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const pathname = usePathname();
    const isLoginPage = pathname === "/login";

    return (
        <div className="min-h-screen relative overflow-hidden bg-background text-foreground font-sans selection:bg-primary/30">
            {/* Background Image & Overlay */}
            <div className="absolute inset-0 z-0 select-none fixed">
                <Image
                    src="/hero-bg.png"
                    alt="Gaming Background"
                    fill
                    className="object-cover opacity-10 dark:opacity-40 transition-opacity duration-300"
                    priority
                />
                <div className="absolute inset-0 bg-gradient-to-b from-background/90 via-background/50 to-background pointer-events-none" />
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-primary/5 via-transparent to-transparent opacity-40" />
            </div>

            {/* Fixed Header */}
            <div className="fixed top-0 left-0 right-0 z-50 border-b border-border bg-background/80 backdrop-blur-md shadow-sm">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
                    <Link href="/" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
                        <div className="relative w-10 h-10 md:w-11 md:h-11 rounded-xl overflow-hidden shadow-lg border border-white/10">
                            <Image
                                src="/logo.jpg"
                                alt="Guru Warriors Logo"
                                fill
                                className="object-cover"
                            />
                        </div>
                        <span className="font-black text-lg md:text-xl tracking-tighter text-foreground drop-shadow-md">
                            GURU <span className="text-primary">ZONE</span>
                        </span>
                    </Link>

                    {/* Contextual Action Button */}
                    <Link href={isLoginPage ? "/signup" : "/login"}>
                        <button className="px-6 py-2 bg-primary text-black font-bold rounded-lg text-sm hover:scale-105 transition-transform shadow-[0_0_15px_rgba(250,204,21,0.3)]">
                            {isLoginPage ? "Sign Up" : "Login"}
                        </button>
                    </Link>
                </div>
            </div>

            {/* Main Content Area */}
            <div className="relative z-10 flex items-center justify-center min-h-screen pt-20 p-4">
                <div className="w-full max-w-md animate-in fade-in zoom-in duration-500">
                    {children}
                </div>
            </div>

            {/* Theme Toggle (Consistent with Landing Page) */}
            <div className="fixed bottom-6 right-6 z-[100] shadow-2xl rounded-xl">
                <ThemeToggle />
            </div>
        </div>
    );
}
