"use client";

import { motion } from "framer-motion";

export default function Loading() {
    return (
        <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-background">
            <div className="relative flex flex-col items-center gap-4">
                {/* Glow ring */}
                <motion.div
                    animate={{
                        scale: [1, 1.2, 1],
                        opacity: [0.3, 0.6, 0.3],
                    }}
                    transition={{
                        duration: 2,
                        ease: "easeInOut",
                        repeat: Infinity,
                    }}
                    className="absolute w-20 h-20 bg-primary/20 blur-xl rounded-full"
                />

                {/* Main loading spinner */}
                <div className="relative w-12 h-12">
                    <div className="absolute inset-0 rounded-full border-4 border-muted-foreground/10" />
                    <motion.div
                        animate={{ rotate: 360 }}
                        transition={{
                            duration: 1,
                            ease: "linear",
                            repeat: Infinity,
                        }}
                        className="absolute inset-0 rounded-full border-4 border-t-primary border-r-transparent border-b-transparent border-l-transparent"
                    />
                </div>

                {/* Loading text */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: [0.4, 1, 0.4] }}
                    transition={{
                        duration: 1.5,
                        repeat: Infinity,
                        ease: "easeInOut"
                    }}
                    className="font-black text-sm uppercase tracking-widest text-primary drop-shadow-[0_0_10px_rgba(250,204,21,0.2)]"
                >
                    Loading Arena...
                </motion.div>
            </div>
        </div>
    );
}
