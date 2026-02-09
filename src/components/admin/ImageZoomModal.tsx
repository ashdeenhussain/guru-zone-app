import { X, ZoomIn, ZoomOut, RotateCcw } from 'lucide-react';
import { TransformWrapper, TransformComponent } from 'react-zoom-pan-pinch';
import Image from 'next/image';
import { useEffect } from 'react';

interface ImageZoomModalProps {
    src: string;
    alt: string;
    isOpen: boolean;
    onClose: () => void;
}

export default function ImageZoomModal({ src, alt, isOpen, onClose }: ImageZoomModalProps) {
    // Handle Escape key
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
        };
        if (isOpen) {
            window.addEventListener('keydown', handleKeyDown);
        }
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    return (
        <div
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 backdrop-blur-md animate-in fade-in duration-200"
            onClick={onClose}
        >
            {/* Controls Bar */}
            <div
                className="absolute top-4 left-1/2 -translate-x-1/2 flex items-center gap-2 px-4 py-2 bg-black/50 border border-white/10 rounded-full backdrop-blur-md z-[110]"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="text-xs font-semibold text-white/50 mr-2 border-r border-white/10 pr-3">
                    Scroll / Pinch to Zoom
                </div>
                <button
                    onClick={onClose}
                    className="p-2 rounded-full hover:bg-white/10 text-white/70 hover:text-white transition-colors"
                    title="Close (Esc)"
                >
                    <X size={20} />
                </button>
            </div>

            <div
                className="w-full h-full flex items-center justify-center p-4"
                onClick={(e) => e.stopPropagation()}
            >
                <TransformWrapper
                    initialScale={1}
                    minScale={0.5}
                    maxScale={4}
                    centerOnInit
                    wheel={{ step: 0.1 }}
                >
                    {({ zoomIn, zoomOut, resetTransform }) => (
                        <>
                            {/* Floating Toolbar */}
                            <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex items-center gap-2 p-1.5 bg-zinc-900/90 border border-white/10 rounded-xl shadow-2xl z-[110]">
                                <button
                                    onClick={() => zoomOut()}
                                    className="p-2.5 rounded-lg hover:bg-white/10 text-white transition-colors"
                                >
                                    <ZoomOut size={18} />
                                </button>
                                <button
                                    onClick={() => resetTransform()}
                                    className="p-2.5 rounded-lg hover:bg-white/10 text-white transition-colors border-x border-white/5 mx-1"
                                >
                                    <RotateCcw size={16} />
                                </button>
                                <button
                                    onClick={() => zoomIn()}
                                    className="p-2.5 rounded-lg hover:bg-white/10 text-white transition-colors"
                                >
                                    <ZoomIn size={18} />
                                </button>
                            </div>

                            <TransformComponent
                                wrapperClass="!w-full !h-full flex items-center justify-center"
                                contentClass="!w-full !h-full flex items-center justify-center"
                            >
                                <div className="relative w-[90vw] h-[85vh]">
                                    <Image
                                        src={src}
                                        alt={alt}
                                        fill
                                        className="object-contain"
                                        draggable={false}
                                    />
                                </div>
                            </TransformComponent>
                        </>
                    )}
                </TransformWrapper>
            </div>
        </div>
    );
}
