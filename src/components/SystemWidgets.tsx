'use client';

import { motion } from 'framer-motion';
import { Megaphone, ChevronRight } from 'lucide-react';
import BannerCarousel from '@/components/shop/BannerCarousel';

export default function SystemWidgets({
    announcement,
    banners = []
}: {
    announcement?: string,
    banners?: string[]
}) {

    return (
        <div className="space-y-6 w-full">
            {/* Announcement Marquee */}
            {announcement && (
                <div className="relative overflow-hidden bg-card backdrop-blur-md border border-border py-2.5 rounded-xl flex items-center shadow-sm">
                    <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 to-purple-500/5 pointer-events-none" />
                    <div className="absolute left-0 z-10 bg-gradient-to-r from-background via-background/80 to-transparent pr-4 pl-3 py-2 h-full flex items-center border-r border-border shrink-0">
                        <Megaphone size={16} className="text-primary animate-pulse" />
                    </div>
                    <div className="flex-1 overflow-hidden relative h-6 mask-linear-fade">
                        <div className="whitespace-nowrap animate-marquee flex items-center gap-12 text-sm font-medium text-foreground h-full absolute top-0 left-0">
                            <span>{announcement}</span>
                            <span>{announcement}</span>
                            <span>{announcement}</span>
                            <span>{announcement}</span>
                        </div>
                    </div>
                </div>
            )}

            {/* Banners Slider - Now using the Enhanced Carousel */}
            {banners && banners.length > 0 && (
                <BannerCarousel images={banners} />
            )}
        </div>
    )
}
