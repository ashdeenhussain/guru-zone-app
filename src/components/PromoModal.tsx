'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

type PromoBanner = {
    imageUrl: string;
    redirectUrl: string;
    isActive: boolean;
    updatedAt: string;
};

export default function PromoModal() {
    const [banners, setBanners] = useState<PromoBanner[]>([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isVisible, setIsVisible] = useState(false);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const checkPromo = async () => {
            try {
                const res = await fetch('/api/promo-banner');
                if (!res.ok) return;
                
                const data: PromoBanner[] = await res.json();
                
                if (!data || data.length === 0) {
                    setLoading(false);
                    return;
                }

                // Use the most recently updated banner for the "seen" logic
                const latestBanner = data[0]; 

                // Smart Logic: Check localStorage
                const lastSeenStr = localStorage.getItem('promo_banner_last_seen');
                const now = new Date().getTime();
                const TWELVE_HOURS = 12 * 60 * 60 * 1000;

                let shouldShow = false;

                if (lastSeenStr) {
                    const { updatedAt, timestamp } = JSON.parse(lastSeenStr);
                    
                    const isNewVersion = updatedAt !== latestBanner.updatedAt;
                    const isExpired = now - timestamp > TWELVE_HOURS;

                    if (isNewVersion || isExpired) {
                        shouldShow = true;
                    }
                } else {
                    shouldShow = true;
                }

                if (shouldShow) {
                    // Preload first image at least
                    const img = new (window as any).Image();
                    img.src = latestBanner.imageUrl;
                    img.onload = () => {
                        setBanners(data);
                        setIsVisible(true);
                        setLoading(false);
                    };
                    img.onerror = () => {
                        setLoading(false);
                    };
                } else {
                    setLoading(false);
                }
            } catch (error) {
                console.error("Error fetching promo banner:", error);
                setLoading(false);
            }
        };

        checkPromo();
    }, []);

    const handleClose = () => {
        setIsVisible(false);
        if (banners.length > 0) {
            localStorage.setItem('promo_banner_last_seen', JSON.stringify({
                updatedAt: banners[0].updatedAt,
                timestamp: new Date().getTime()
            }));
        }
    };

    const handleRedirect = () => {
        const currentBanner = banners[currentIndex];
        if (currentBanner?.redirectUrl) {
            window.open(currentBanner.redirectUrl, '_blank');
            handleClose();
        }
    };

    const nextBanner = () => {
        setCurrentIndex((prev) => (prev + 1) % banners.length);
    };

    const prevBanner = () => {
        setCurrentIndex((prev) => (prev - 1 + banners.length) % banners.length);
    };

    const getOptimizedUrl = (url: string) => {
        if (!url.includes('res.cloudinary.com')) return url;
        return url.replace('/upload/', '/upload/f_auto,q_auto:best,w_1080/');
    };

    if (!isVisible || banners.length === 0) return null;

    const currentBanner = banners[currentIndex];

    return (
        <AnimatePresence>
            <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-[9999] flex items-center justify-center p-4"
            >
                {/* Backdrop with extreme glassmorphism */}
                <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="absolute inset-0 bg-black/60 backdrop-blur-md"
                    onClick={handleClose}
                />

                {/* Modal Container */}
                <motion.div 
                    initial={{ scale: 0.9, opacity: 0, y: 20 }}
                    animate={{ scale: 1, opacity: 1, y: 0 }}
                    exit={{ scale: 0.9, opacity: 0, y: 20 }}
                    transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                    className="relative w-full max-w-md aspect-[4/5] bg-neutral-900 rounded-[2.5rem] overflow-hidden shadow-[0_0_100px_rgba(0,0,0,0.5)] border border-white/10"
                >
                    {/* The Banner Image */}
                    <AnimatePresence mode="wait">
                        <motion.div 
                            key={currentIndex}
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            className={`w-full h-full relative ${currentBanner.redirectUrl ? 'cursor-pointer' : ''}`}
                            onClick={currentBanner.redirectUrl ? handleRedirect : undefined}
                        >
                            <Image
                                src={getOptimizedUrl(currentBanner.imageUrl)}
                                alt="Promotion"
                                fill
                                priority
                                quality={100}
                                className="object-cover"
                                sizes="(max-w-md) 100vw, 450px"
                            />
                            
                            <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-black/20 pointer-events-none" />
                        </motion.div>
                    </AnimatePresence>

                    {/* Pagination Dots */}
                    {banners.length > 1 && (
                        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-2 z-20">
                            {banners.map((_, i) => (
                                <button 
                                    key={i}
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setCurrentIndex(i);
                                    }}
                                    className={`w-2 h-2 rounded-full transition-all ${i === currentIndex ? 'bg-white w-6' : 'bg-white/30'}`}
                                />
                            ))}
                        </div>
                    )}

                    {/* Controls for Carousel */}
                    {banners.length > 1 && (
                        <>
                            <button 
                                onClick={(e) => { e.stopPropagation(); prevBanner(); }}
                                className="absolute left-4 top-1/2 -translate-y-1/2 p-2 bg-black/20 hover:bg-black/40 backdrop-blur-md rounded-full text-white/50 hover:text-white transition-all z-20"
                            >
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
                            </button>
                            <button 
                                onClick={(e) => { e.stopPropagation(); nextBanner(); }}
                                className="absolute right-4 top-1/2 -translate-y-1/2 p-2 bg-black/20 hover:bg-black/40 backdrop-blur-md rounded-full text-white/50 hover:text-white transition-all z-20"
                            >
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6"/></svg>
                            </button>
                        </>
                    )}

                    {/* Close Button */}
                    <button 
                        onClick={handleClose}
                        className="absolute top-6 right-6 p-2 bg-black/40 hover:bg-black/60 backdrop-blur-xl border border-white/20 rounded-full text-white transition-all transform hover:scale-110 active:scale-95 z-30"
                    >
                        <X size={24} />
                    </button>

                    {/* Shine effect */}
                    <motion.div 
                        animate={{ 
                            left: ['-100%', '200%'],
                        }}
                        transition={{ 
                            duration: 2, 
                            repeat: Infinity, 
                            repeatDelay: 3,
                            ease: "easeInOut"
                        }}
                        className="absolute top-0 bottom-0 w-1/2 bg-gradient-to-r from-transparent via-white/10 to-transparent skew-x-[-25deg] pointer-events-none"
                    />
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
}
