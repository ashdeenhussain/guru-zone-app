import React from 'react';
import { RankInfo } from '@/lib/ranks';
import { Shield, Crown, Trophy, Medal, Hexagon, Star } from 'lucide-react';

interface RankBadgeProps {
    rank: RankInfo;
    size?: 'sm' | 'md' | 'lg';
    className?: string;
}

const RankBadge: React.FC<RankBadgeProps> = ({ rank, size = 'md', className = '' }) => {
    const sizeClasses = {
        sm: 'w-8 h-8',
        md: 'w-16 h-16',
        lg: 'w-24 h-24',
    };

    const iconSize = {
        sm: 16,
        md: 32,
        lg: 48,
    };

    const getIcon = () => {
        switch (rank.tier) {
            case 'Grandmaster':
            case 'Elite Master':
                return <Crown size={iconSize[size]} className="text-white drop-shadow-md animate-pulse" />;
            case 'Master':
            case 'Heroic':
                return <Trophy size={iconSize[size]} className="text-white drop-shadow-md" />;
            case 'Diamond':
            case 'Platinum':
                return <Shield size={iconSize[size]} className="text-white drop-shadow-md" />;
            default:
                return <Medal size={iconSize[size]} className="text-white drop-shadow-md" />;
        }
    };

    return (
        <div
            className={`relative flex items-center justify-center rounded-full shadow-lg ${sizeClasses[size]} ${className}`}
            style={{
                background: `linear-gradient(135deg, ${rank.color}, #1a1a1a)`,
                border: `2px solid ${rank.color}`
            }}
        >
            {/* Glow effect */}
            <div className="absolute inset-0 rounded-full blur-md opacity-50" style={{ backgroundColor: rank.color }}></div>

            <div className="z-10 relative">
                {getIcon()}
            </div>

            {/* Division star/number if applicable */}
            {rank.division && (
                <div className="absolute -bottom-1 -right-1 bg-gray-900 text-xs font-bold px-1.5 py-0.5 rounded-full border border-gray-700 text-white z-20">
                    {rank.division}
                </div>
            )}
        </div>
    );
};

export default RankBadge;
