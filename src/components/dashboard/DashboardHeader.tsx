"use client";

import Image from "next/image";
import Link from "next/link";
import { Edit2 } from "lucide-react";
import { AVATARS } from "@/lib/avatars";
import NotificationDropdown from "@/components/dashboard/NotificationDropdown";

interface DashboardHeaderProps {
    userName: string;
    avatarId: number;
}

export default function DashboardHeader({ userName, avatarId }: DashboardHeaderProps) {
    const selectedAvatar = AVATARS.find((a) => a.id === avatarId) || AVATARS[0];

    return (
        <div className="flex items-center gap-4 glass-card p-4 rounded-3xl shadow-sm relative overflow-hidden group">
            {/* Decorative Background */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-primary/20 blur-[50px] rounded-full pointer-events-none transition-opacity duration-500" />

            {/* Avatar Section */}
            <div className="relative shrink-0">
                <div className="w-16 h-16 rounded-full border-2 border-primary/50 p-0.5 shadow-[0_0_20px_rgba(255,215,0,0.3)]">
                    <div className="relative w-full h-full rounded-full overflow-hidden bg-muted">
                        <Image
                            src={selectedAvatar.src}
                            alt={selectedAvatar.name}
                            fill
                            className="object-cover"
                        />
                    </div>
                </div>
            </div>

            {/* Text Section */}
            <div className="flex-1 min-w-0">
                <p className="text-muted-foreground text-xs font-medium uppercase tracking-wider mb-0.5">Welcome Back</p>
                <h1 className="text-xl md:text-2xl font-black text-foreground truncate leading-tight">
                    {userName}
                </h1>
            </div>

            {/* Edit Profile Button (Right Center) */}
            <div className="flex items-center gap-2 z-10">
                <NotificationDropdown />
                <Link
                    href="/dashboard/profile"
                    className="p-3 bg-muted/40 hover:bg-muted rounded-2xl border border-transparent hover:border-border transition-all group/edit z-10"
                    aria-label="Edit Profile"
                >
                    <Edit2 size={20} className="text-muted-foreground group-hover/edit:text-primary transition-colors" />
                </Link>
            </div>
        </div>
    );
}
