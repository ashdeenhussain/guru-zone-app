"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight } from "lucide-react";

export interface Banner {
    storageUrl: string;
    location: 'home' | 'shop' | 'both';
    activeStatus: boolean;
}

interface PromotionalBannersProps {
    images: string[] | Banner[];
    context: 'home' | 'shop';
}

export default function PromotionalBanners({ images = [], context }: PromotionalBannersProps) {
    // Standardize input to an array of valid URLs based on context and activeStatus
    const displayImages: string[] = images
        .filter((banner: any) => {
            // Handle legacy string array or falsy cases
            if (!banner) return false;
            if (typeof banner === "string") return true; 
            
            // Handle new object schema
            if (banner.activeStatus === false) return false;
            if (banner.location !== context && banner.location !== 'both') return false;
            return !!banner.storageUrl || !!banner.url;
        })
        .map((banner: any) => typeof banner === "string" ? banner : (banner.storageUrl || banner.url))
        .filter(Boolean);

    // If no valid images are provided, use placeholders based on context
    const finalImages = displayImages.length > 0
        ? displayImages
        : context === 'home'
            ? ["/shop/event.svg", "/shop/monthly.svg"] // Fallback home banners (Matches LEADERBOARD)
            : ["/shop/weekly.svg", "/shop/monthly.svg"]; // Fallback shop banners

    const [currentIndex, setCurrentIndex] = useState(0);
    const [isPaused, setIsPaused] = useState(false);
    const [direction, setDirection] = useState(0);

    const nextSlide = useCallback(() => {
        setDirection(1);
        setCurrentIndex((prev) => (prev + 1) % finalImages.length);
    }, [finalImages.length]);

    const prevSlide = useCallback(() => {
        setDirection(-1);
        setCurrentIndex((prev) =>
            prev === 0 ? finalImages.length - 1 : prev - 1
        );
    }, [finalImages.length]);

    // Auto-scroll effect
    useEffect(() => {
        if (finalImages.length <= 1 || isPaused) return;

        const interval = setInterval(() => {
            nextSlide();
        }, 3500);

        return () => clearInterval(interval);
    }, [finalImages.length, nextSlide, isPaused]);

    // Swipe Handling
    const swipeConfidenceThreshold = 10000;
    const swipePower = (offset: number, velocity: number) => Math.abs(offset) * velocity;

    const handleDragEnd = (e: any, { offset, velocity }: any) => {
        const swipe = swipePower(offset.x, velocity.x);
        if (swipe < -swipeConfidenceThreshold) {
            nextSlide();
        } else if (swipe > swipeConfidenceThreshold) {
            prevSlide();
        }
    };

    if (finalImages.length === 0) return null;

    // Framer Motion Variants
    const variants = {
        enter: (direction: number) => ({
            x: direction > 0 ? 1000 : -1000,
            opacity: 0
        }),
        center: {
            zIndex: 1,
            x: 0,
            opacity: 1
        },
        exit: (direction: number) => ({
            zIndex: 0,
            x: direction < 0 ? 1000 : -1000,
            opacity: 0
        })
    };

    return (
        <div className="w-full my-6">
            <div
                className={`relative w-full rounded-2xl overflow-hidden shadow-lg group bg-black/20 ${context === 'home' ? 'aspect-[21/9] md:aspect-[3/1]' : 'aspect-square md:aspect-[2/1] grid md:grid-cols-1'}`}
                onMouseEnter={() => setIsPaused(true)}
                onMouseLeave={() => setIsPaused(false)}
                onTouchStart={() => setIsPaused(true)}
                onTouchEnd={() => setIsPaused(false)}
            >
                {/* 
                  Since we are rendering a carousel primarily (like the original code), 
                  the object-fit/responsive aspects are handled here. 
                  If future requirements need a grid of multiple banners at once on Desktop shop,
                  this component can be extended to map through `finalImages` rather than using AnimatePresence.
                  For now, we unify the carousel behavior and keep responsive aspect ratios.
                */}
                <AnimatePresence initial={false} custom={direction} mode="popLayout">
                    <motion.div
                        key={currentIndex}
                        custom={direction}
                        variants={variants}
                        initial="enter"
                        animate="center"
                        exit="exit"
                        transition={{
                            x: { type: "spring", stiffness: 300, damping: 30 },
                            opacity: { duration: 0.2 }
                        }}
                        drag="x"
                        dragConstraints={{ left: 0, right: 0 }}
                        dragElastic={1}
                        onDragEnd={handleDragEnd}
                        className="absolute inset-0 w-full h-full cursor-grab active:cursor-grabbing"
                    >
                        <div
                            className="w-full h-full bg-cover bg-center"
                            style={{ backgroundImage: `url('${finalImages[currentIndex]}')` }}
                        />
                        <img
                            src={finalImages[currentIndex]}
                            alt={`Promotional Banner ${currentIndex + 1}`}
                            className="hidden"
                        />
                    </motion.div>
                </AnimatePresence>

                {/* Navigation Arrows */}
                <button
                    onClick={(e) => { e.stopPropagation(); prevSlide(); }}
                    className="absolute left-2 top-1/2 -translate-y-1/2 p-2 bg-black/30 hover:bg-black/50 backdrop-blur-sm rounded-full text-white opacity-0 group-hover:opacity-100 transition-opacity disabled:opacity-0 z-10"
                    disabled={finalImages.length <= 1}
                    aria-label="Previous banner"
                >
                    <ChevronLeft size={24} />
                </button>
                <button
                    onClick={(e) => { e.stopPropagation(); nextSlide(); }}
                    className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-black/30 hover:bg-black/50 backdrop-blur-sm rounded-full text-white opacity-0 group-hover:opacity-100 transition-opacity disabled:opacity-0 z-10"
                    disabled={finalImages.length <= 1}
                    aria-label="Next banner"
                >
                    <ChevronRight size={24} />
                </button>

                {/* Dots Indicator */}
                <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-2 z-10">
                    {finalImages.map((_, index) => (
                        <button
                            key={index}
                            onClick={(e) => {
                                e.stopPropagation();
                                setCurrentIndex(index);
                                setDirection(index > currentIndex ? 1 : -1);
                            }}
                            className={`h-2 rounded-full transition-all duration-300 ${index === currentIndex
                                ? "bg-white w-6"
                                : "bg-white/50 w-2 hover:bg-white/80"
                                }`}
                            aria-label={`Go to banner ${index + 1}`}
                        />
                    ))}
                </div>
            </div>
        </div>
    );
}
