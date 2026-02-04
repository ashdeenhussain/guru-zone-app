"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface BannerCarouselProps {
    images: string[];
}

export default function BannerCarousel({ images = [] }: BannerCarouselProps) {
    // If no images provided, use placeholders for demo
    const displayImages =
        images.length > 0
            ? images
            : [
                "/shop/weekly.svg", // Reuse our created SVGs as placeholders
                "/shop/monthly.svg",
            ];

    const [currentIndex, setCurrentIndex] = useState(0);
    const [isPaused, setIsPaused] = useState(false);
    const [direction, setDirection] = useState(0);

    const nextSlide = useCallback(() => {
        setDirection(1);
        setCurrentIndex((prev) => (prev + 1) % displayImages.length);
    }, [displayImages.length]);

    const prevSlide = useCallback(() => {
        setDirection(-1);
        setCurrentIndex((prev) =>
            prev === 0 ? displayImages.length - 1 : prev - 1
        );
    }, [displayImages.length]);

    // Auto-scroll effect
    useEffect(() => {
        if (displayImages.length <= 1 || isPaused) return;

        // Auto-scroll every 3 seconds (faster as requested "3 4 sec")
        const interval = setInterval(() => {
            nextSlide();
        }, 3500);

        return () => clearInterval(interval);
    }, [displayImages.length, nextSlide, isPaused]);

    // Swipe Handling
    const swipeConfidenceThreshold = 10000;
    const swipePower = (offset: number, velocity: number) => {
        return Math.abs(offset) * velocity;
    };

    const handleDragEnd = (e: any, { offset, velocity }: any) => {
        const swipe = swipePower(offset.x, velocity.x);

        if (swipe < -swipeConfidenceThreshold) {
            nextSlide();
        } else if (swipe > swipeConfidenceThreshold) {
            prevSlide();
        }
    };

    if (displayImages.length === 0) return null;

    // Framer Motion Variants
    const variants = {
        enter: (direction: number) => {
            return {
                x: direction > 0 ? 1000 : -1000,
                opacity: 0
            };
        },
        center: {
            zIndex: 1,
            x: 0,
            opacity: 1
        },
        exit: (direction: number) => {
            return {
                zIndex: 0,
                x: direction < 0 ? 1000 : -1000,
                opacity: 0
            };
        }
    };

    return (
        <div
            className="relative w-full aspect-[21/9] md:aspect-[3/1] rounded-2xl overflow-hidden shadow-lg group my-6 bg-black/20"
            onMouseEnter={() => setIsPaused(true)}
            onMouseLeave={() => setIsPaused(false)}
            onTouchStart={() => setIsPaused(true)}
            onTouchEnd={() => setIsPaused(false)}
        >
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
                    {/* Ensure image covers the area completely */}
                    <div
                        className="w-full h-full bg-cover bg-center"
                        style={{ backgroundImage: `url('${displayImages[currentIndex]}')` }}
                    />
                    {/* Fallback img tag for accessibility/SEO if background image fails */}
                    <img
                        src={displayImages[currentIndex]}
                        alt={`Banner ${currentIndex + 1}`}
                        className="hidden"
                    />
                </motion.div>
            </AnimatePresence>

            {/* Navigation Arrows (Visible on hover) */}
            <button
                onClick={(e) => { e.stopPropagation(); prevSlide(); }}
                className="absolute left-2 top-1/2 -translate-y-1/2 p-2 bg-black/30 hover:bg-black/50 backdrop-blur-sm rounded-full text-white opacity-0 group-hover:opacity-100 transition-opacity disabled:opacity-0 z-10"
                disabled={displayImages.length <= 1}
            >
                <ChevronLeft size={24} />
            </button>

            <button
                onClick={(e) => { e.stopPropagation(); nextSlide(); }}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-black/30 hover:bg-black/50 backdrop-blur-sm rounded-full text-white opacity-0 group-hover:opacity-100 transition-opacity disabled:opacity-0 z-10"
                disabled={displayImages.length <= 1}
            >
                <ChevronRight size={24} />
            </button>

            {/* Dots Indicator */}
            <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-2 z-10">
                {displayImages.map((_, index) => (
                    <button
                        key={index}
                        onClick={(e) => { e.stopPropagation(); setCurrentIndex(index); setDirection(index > currentIndex ? 1 : -1); }}
                        className={`h-2 rounded-full transition-all duration-300 ${index === currentIndex
                            ? "bg-white w-6"
                            : "bg-white/50 w-2 hover:bg-white/80"
                            }`}
                    />
                ))}
            </div>
        </div>
    );
}
