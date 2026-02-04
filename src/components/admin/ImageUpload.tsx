'use client';

import { useState, useRef } from 'react';
import { Upload, X, Loader2, Image as ImageIcon } from 'lucide-react';
import Image from 'next/image';

interface ImageUploadProps {
    value: string;
    onChange: (url: string) => void;
    label?: string;
    className?: string;
}

export default function ImageUpload({ value, onChange, label = "Upload Image", className = "" }: ImageUploadProps) {
    const [isUploading, setIsUploading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setIsUploading(true);
        const formData = new FormData();
        formData.append('file', file);

        try {
            const res = await fetch('/api/upload', {
                method: 'POST',
                body: formData
            });

            if (!res.ok) throw new Error('Upload failed');

            const data = await res.json();
            if (data.success && data.url) {
                onChange(data.url);
            } else {
                alert(data.error || 'Upload failed');
            }
        } catch (error) {
            console.error('Upload error:', error);
            alert('Something went wrong during upload.');
        } finally {
            setIsUploading(false);
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };

    return (
        <div className={`space-y-2 ${className}`}>
            <label className="text-xs font-bold text-muted-foreground uppercase">{label}</label>

            {!value ? (
                <div
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full h-32 border-2 border-dashed border-border hover:border-primary/50 bg-muted/20 hover:bg-muted/40 rounded-xl flex flex-col items-center justify-center cursor-pointer transition-all group"
                >
                    {isUploading ? (
                        <Loader2 className="w-8 h-8 text-primary animate-spin" />
                    ) : (
                        <>
                            <div className="p-2 bg-background rounded-full mb-2 group-hover:scale-110 transition-transform shadow-sm">
                                <Upload className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
                            </div>
                            <span className="text-xs text-muted-foreground font-medium group-hover:text-primary transition-colors">Click to Upload</span>
                            <span className="text-[10px] text-muted-foreground/60 mt-1">PNG, JPG, GIF max 5MB</span>
                        </>
                    )}
                </div>
            ) : (
                <div className="relative w-full h-32 bg-muted rounded-xl overflow-hidden border border-border group">
                    <Image
                        src={value}
                        alt="Uploaded preview"
                        fill
                        className="object-cover"
                    />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                        <button
                            onClick={() => fileInputRef.current?.click()}
                            className="p-1.5 bg-white/10 hover:bg-white/20 text-white rounded-lg backdrop-blur-sm transition-colors"
                            title="Change Image"
                        >
                            <Upload size={16} />
                        </button>
                        <button
                            onClick={() => onChange('')}
                            className="p-1.5 bg-red-500/20 hover:bg-red-500/40 text-red-500 hover:text-white rounded-lg backdrop-blur-sm transition-colors"
                            title="Remove"
                        >
                            <X size={16} />
                        </button>
                    </div>
                </div>
            )}

            <input
                type="file"
                ref={fileInputRef}
                onChange={handleUpload}
                accept="image/*"
                className="hidden"
            />
        </div>
    );
}
