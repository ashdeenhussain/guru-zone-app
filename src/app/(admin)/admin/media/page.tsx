'use client';

import MediaLibrary from "@/components/admin/MediaLibrary";
import { Image as ImageIcon } from "lucide-react";

export default function AdminMediaPage() {
    return (
        <div className="p-2 lg:p-6 h-[calc(100vh-80px)] lg:h-[calc(100vh-64px)] flex flex-col">
            <header className="mb-6">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-pink-500/10 rounded-lg">
                        <ImageIcon className="text-pink-500 w-6 h-6" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-foreground">Media Control</h1>
                        <p className="text-sm text-muted-foreground">Manage all system assets and uploads</p>
                    </div>
                </div>
            </header>

            <div className="flex-1 bg-card border border-border rounded-2xl overflow-hidden shadow-sm">
                <MediaLibrary selectionMode={false} />
            </div>
        </div>
    );
}
