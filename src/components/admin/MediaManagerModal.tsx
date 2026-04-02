'use client';

import { X, Image as ImageIcon } from 'lucide-react';
import MediaLibrary from './MediaLibrary';

interface MediaManagerModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSelect: (url: string) => void;
    allowMultiple?: boolean;
}

export default function MediaManagerModal({ isOpen, onClose, onSelect, allowMultiple = false }: MediaManagerModalProps) {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
            <div className="bg-card w-full max-w-4xl h-[80vh] rounded-2xl border border-border shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">

                {/* Header */}
                <div className="p-4 border-b border-border flex items-center justify-between bg-muted/20">
                    <h2 className="text-xl font-bold flex items-center gap-2">
                        <ImageIcon className="text-primary" />
                        Media Library
                    </h2>
                    <button onClick={onClose} className="p-2 hover:bg-muted rounded-full transition-colors">
                        <X size={20} />
                    </button>
                </div>

                {/* Reusable Library */}
                <div className="flex-1 overflow-hidden">
                    <MediaLibrary
                        selectionMode={true}
                        onSelect={(url) => {
                            onSelect(url);
                        }}
                    />
                </div>
            </div>
        </div>
    );
}
