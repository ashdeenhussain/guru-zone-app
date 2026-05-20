"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight, Trophy, Gem, Shield, Gamepad2 } from "lucide-react";
import Link from "next/link";
import Image from "next/image";

interface SlideData {
    id: number;
    image: string;
    badge: string;
    badgeIcon: any;
    title: string;
    highlightTitle?: string;
    description: string;
    ctaText: string;
    ctaLink: string;
    btnBg: string;
    glowColor: string;
    accentColor: string;
}

export default function HeroSlider({ heroData }: { heroData?: any }) {
    const [activeIndex, setActiveIndex] = useState(0);
    const [isHovered, setIsHovered] = useState(false);

    // Garena-style centered slides with specific play/action links
    const slides: SlideData[] = [
        {
            id: 1,
            image: "/banner1.png",
            badge: "PAKISTAN'S #1 ESPORTS PLATFORM",
            badgeIcon: Trophy,
            title: "GURU ZONE",
            highlightTitle: "ARENA",
            description: "Fast paced Free Fire tournaments. Play matches anytime and earn cash rewards.",
            ctaText: "Play now",
            ctaLink: "/signup",
            btnBg: "bg-[#e61c23] hover:bg-[#ff2d35] text-white",
            glowColor: "shadow-[0_0_20px_rgba(230,28,35,0.4)] hover:shadow-[0_0_30px_rgba(230,28,35,0.6)]",
            accentColor: "text-primary"
        },
        {
            id: 2,
            image: "/banner2_new.png",
            badge: "FAST & SECURE STORE",
            badgeIcon: Gem,
            title: "DIAMOND",
            highlightTitle: "TOP-UP",
            description: "Official Garena Free Fire diamonds delivered instantly to your Player UID.",
            ctaText: "Top up now",
            ctaLink: "/topup",
            btnBg: "bg-cyan-500 hover:bg-cyan-400 text-black font-extrabold",
            glowColor: "shadow-[0_0_20px_rgba(6,182,212,0.4)] hover:shadow-[0_0_30px_rgba(6,182,212,0.6)]",
            accentColor: "text-cyan-400"
        },
        {
            id: 3,
            image: "/banner3.png",
            badge: "CHAMPIONSHIP TOURNEYS",
            badgeIcon: Shield,
            title: "PRO LEAGUE",
            highlightTitle: "CLASH",
            description: "Compete against Pakistan's best squads and claim massive cash prize pools.",
            ctaText: "Register now",
            ctaLink: "/login",
            btnBg: "bg-yellow-500 hover:bg-yellow-400 text-black font-extrabold",
            glowColor: "shadow-[0_0_20px_rgba(234,179,8,0.4)] hover:shadow-[0_0_30px_rgba(234,179,8,0.6)]",
            accentColor: "text-yellow-500"
        },
        {
            id: 4,
            image: "/banner4.png",
            badge: "1V1 CLASH ARENA",
            badgeIcon: Gamepad2,
            title: "BATTLE",
            highlightTitle: "ZONE",
            description: "Put your coins on the line in intense 1v1 challenges. Winner takes all.",
            ctaText: "Challenge now",
            ctaLink: "/login",
            btnBg: "bg-purple-600 hover:bg-purple-500 text-white",
            glowColor: "shadow-[0_0_20px_rgba(147,51,234,0.4)] hover:shadow-[0_0_30px_rgba(147,51,234,0.6)]",
            accentColor: "text-purple-400"
        }
    ];

    const nextSlide = useCallback(() => {
        setActiveIndex((prev) => (prev + 1) % slides.length);
    }, [slides.length]);

    const prevSlide = useCallback(() => {
        setActiveIndex((prev) => (prev - 1 + slides.length) % slides.length);
    }, [slides.length]);

    // Auto-play timer
    useEffect(() => {
        if (isHovered) return;
        const interval = setInterval(nextSlide, 6500); // Change slides every 6.5s
        return () => clearInterval(interval);
    }, [nextSlide, isHovered]);

    // Text & overlay animation variants (centered layout)
    const contentVariants = {
        hidden: { opacity: 0, y: 15 },
        visible: {
            opacity: 1,
            y: 0,
            transition: {
                staggerChildren: 0.12,
                delayChildren: 0.15
            }
        }
    };

    const badgeVariants = {
        hidden: { opacity: 0, y: -10 },
        visible: { 
            opacity: 1, 
            y: 0,
            transition: { type: "spring" as const, stiffness: 100, damping: 15 }
        }
    };

    const titleVariants = {
        hidden: { opacity: 0, scale: 0.96 },
        visible: { 
            opacity: 1, 
            scale: 1,
            transition: { type: "spring" as const, stiffness: 80, damping: 15 }
        }
    };

    const descVariants = {
        hidden: { opacity: 0, y: 10 },
        visible: { 
            opacity: 1, 
            y: 0,
            transition: { duration: 0.5, ease: "easeOut" as const }
        }
    };

    const actionVariants = {
        hidden: { opacity: 0, scale: 0.9 },
        visible: { 
            opacity: 1, 
            scale: 1,
            transition: { type: "spring" as const, stiffness: 120, damping: 12 }
        }
    };

    // Slow Ken Burns background zoom
    const bgVariants = {
        enter: { opacity: 0, scale: 1.05 },
        center: { 
            opacity: 1, 
            scale: 1,
            transition: { 
                opacity: { duration: 0.8, ease: "easeInOut" as const },
                scale: { duration: 6.5, ease: "easeOut" as const }
            }
        },
        exit: { 
            opacity: 0, 
            scale: 0.98,
            transition: { 
                opacity: { duration: 0.8, ease: "easeInOut" as const }
            }
        }
    };

    const currentSlide = slides[activeIndex];
    const BadgeIcon = currentSlide.badgeIcon;

    return (
        <div 
            className="relative w-full overflow-hidden bg-background border-b border-border/40 select-none group/slider"
            style={{ contentVisibility: "auto" }}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
        >
            {/* Height wrapper matching Garena proportions */}
            <div className="relative w-full h-[55vh] sm:h-[60vh] md:h-[70vh] lg:h-[78vh] flex items-center">
                
                {/* Background Image Slider with Ken Burns effect */}
                <AnimatePresence mode="popLayout" initial={false}>
                    <motion.div
                        key={activeIndex}
                        variants={bgVariants}
                        initial="enter"
                        animate="center"
                        exit="exit"
                        className="absolute inset-0 z-0"
                    >
                        <Image
                            src={currentSlide.image}
                            alt={currentSlide.badge}
                            fill
                            {...(activeIndex === 0
                                ? { priority: true, quality: 85 }
                                : { loading: "lazy", quality: 70 }
                            )}
                            sizes="(max-width: 768px) 100vw, 50vw"
                            className="object-cover object-center"
                        />
                    </motion.div>
                </AnimatePresence>

                {/* Garena-style Vignette Overlay for Focus & Contrast */}
                <div className="absolute inset-0 z-10 pointer-events-none">
                    {/* Top gradient overlay */}
                    <div className="absolute inset-x-0 top-0 h-1/3 bg-gradient-to-b from-black/90 via-black/30 to-transparent" />
                    {/* Bottom gradient overlay - focused on the lower third */}
                    <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black/90 via-black/40 to-transparent" />
                    {/* Left/Right vignette edge shading */}
                    <div className="absolute inset-y-0 left-0 w-24 bg-gradient-to-r from-black/60 to-transparent hidden md:block" />
                    <div className="absolute inset-y-0 right-0 w-24 bg-gradient-to-l from-black/60 to-transparent hidden md:block" />
                </div>

                {/* Centered Content Container */}
                <div className="relative z-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full flex flex-col justify-end items-center h-full pb-20 md:pb-24">
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={activeIndex}
                            variants={contentVariants}
                            initial="hidden"
                            animate="visible"
                            exit="hidden"
                            className="w-full max-w-2xl text-center flex flex-col items-center gap-3 md:gap-4"
                        >
                            {/* Staggered Badge */}
                            <motion.div 
                                variants={badgeVariants}
                                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-white/5 bg-black/40 backdrop-blur-sm shadow-sm"
                            >
                                <BadgeIcon className={`w-3.5 h-3.5 ${currentSlide.accentColor}`} />
                                <span className="text-[9px] sm:text-[10px] uppercase tracking-[0.2em] font-bold text-foreground">
                                    {currentSlide.badge}
                                </span>
                            </motion.div>

                            {/* Headline - Centered, massive and uppercase */}
                            <motion.h1 
                                variants={titleVariants}
                                className="text-3xl sm:text-5xl md:text-6xl font-black tracking-tighter uppercase leading-[1.05] drop-shadow-2xl text-white"
                            >
                                {currentSlide.title}{" "}
                                <span className={`${currentSlide.accentColor} font-black filter drop-shadow-[0_0_20px_rgba(255,215,0,0.15)]`}>
                                    {currentSlide.highlightTitle}
                                </span>
                            </motion.h1>

                            {/* Description - Centered, readable font */}
                            <motion.p 
                                variants={descVariants}
                                className="text-xs sm:text-sm md:text-base text-gray-200/90 leading-relaxed max-w-md md:max-w-xl font-semibold drop-shadow-md"
                            >
                                {currentSlide.description}
                            </motion.p>

                            {/* Garena-style Pill CTA Play Button */}
                            <motion.div 
                                variants={actionVariants}
                                className="mt-1"
                            >
                                <Link href={currentSlide.ctaLink}>
                                    <button 
                                        className={`flex items-center justify-center gap-2 px-8 py-3 rounded-full ${currentSlide.btnBg} font-bold text-sm sm:text-base uppercase tracking-wider transition-all duration-300 hover:scale-105 shadow-lg ${currentSlide.glowColor} cursor-pointer`}
                                    >
                                        <Gamepad2 className="w-5 h-5" />
                                        <span>{currentSlide.ctaText}</span>
                                    </button>
                                </Link>
                            </motion.div>
                        </motion.div>
                    </AnimatePresence>
                </div>

                {/* Left/Right Navigation Arrows - Garena Style */}
                <button
                    onClick={prevSlide}
                    aria-label="Previous slide"
                    className="absolute left-6 top-[55%] -translate-y-1/2 z-30 w-12 h-12 rounded-full bg-black/45 hover:bg-black/60 border border-white/10 text-white/70 hover:text-white transition-all duration-200 flex items-center justify-center hover:scale-105 shadow-md cursor-pointer"
                >
                    <ChevronLeft className="w-6 h-6" />
                </button>

                <button
                    onClick={nextSlide}
                    aria-label="Next slide"
                    className="absolute right-6 top-[55%] -translate-y-1/2 z-30 w-12 h-12 rounded-full bg-black/45 hover:bg-black/60 border border-white/10 text-white/70 hover:text-white transition-all duration-200 flex items-center justify-center hover:scale-105 shadow-md cursor-pointer"
                >
                    <ChevronRight className="w-6 h-6" />
                </button>

                {/* Navigation Dots Indicator (Bottom Center) - Active dot is a wider pill */}
                <div className="absolute bottom-20 left-1/2 -translate-x-1/2 z-30 flex items-center gap-2">
                    {slides.map((_, index) => (
                        <button
                            key={index}
                            onClick={() => setActiveIndex(index)}
                            aria-label={`Go to slide ${index + 1}`}
                            className={`h-2 rounded-full transition-all duration-300 cursor-pointer ${
                                index === activeIndex 
                                    ? "w-8 bg-white" 
                                    : "w-2.5 bg-white/30 hover:bg-white/55"
                            }`}
                        />
                    ))}
                </div>

                {/* Slide Auto-play Visual Progress Bar */}
                <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/10 z-30 overflow-hidden pointer-events-none">
                    <motion.div
                        key={`${activeIndex}-${isHovered}`}
                        initial={{ width: "0%" }}
                        animate={isHovered ? { width: "0%" } : { width: "100%" }}
                        transition={isHovered ? { duration: 0 } : { duration: 6.5, ease: "linear" }}
                        className="h-full bg-white"
                    />
                </div>
            </div>
        </div>
    );
}
