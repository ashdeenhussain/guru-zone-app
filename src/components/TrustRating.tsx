"use client";

import React from 'react';
import { Star } from 'lucide-react';

interface TrustRatingProps {
    score: number;
    className?: string;
    showLabel?: boolean;
}

const TrustRating = ({ score = 100, className = "", showLabel = false }: TrustRatingProps) => {
    // Ensure score is within 0-100
    const displayScore = Math.max(0, Math.min(100, score));

    // Color coding logic
    let colorClass = "text-emerald-500";
    if (displayScore < 80) {
        colorClass = "text-red-500";
    } else if (displayScore < 90) {
        colorClass = "text-amber-500";
    }

    return (
        <div className={`flex items-center gap-1.5 font-bold ${colorClass} ${className}`}>
            <Star size={14} className="fill-current" />
            <span className="text-sm">{displayScore}%</span>
            {showLabel && <span className="text-xs opacity-80 uppercase tracking-wider ml-1">Trust Score</span>}
        </div>
    );
};

export default TrustRating;
