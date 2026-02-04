"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";

interface SpinItem {
    _id: string;
    label: string;
    color: string;
    type: "coins" | "product";
}

interface LuckyWheelGameProps {
    items: SpinItem[];
    spinsAvailable: number;
    userProgress: number;
    onClose?: () => void;
}

export default function LuckyWheelGame({ items, spinsAvailable, userProgress, onClose }: LuckyWheelGameProps) {
    const [spinning, setSpinning] = useState(false);
    const [rotation, setRotation] = useState(0);
    const [winItem, setWinItem] = useState<SpinItem | null>(null);
    const [availableSpins, setAvailableSpins] = useState(spinsAvailable);
    const [alertMsg, setAlertMsg] = useState<string | null>(null);
    const router = useRouter();

    useEffect(() => {
        if (alertMsg) {
            const timer = setTimeout(() => setAlertMsg(null), 3000);
            return () => clearTimeout(timer);
        }
    }, [alertMsg]);

    const handleSpin = async () => {
        if (spinning) return;

        if (userProgress < 2500) {
            setAlertMsg("Please top-up 2500 Coins to unlock!");
            return;
        }

        if (availableSpins <= 0) {
            setAlertMsg("No Spins Available! Top-up to earn more.");
            return;
        }

        setSpinning(true);
        setWinItem(null);
        setAlertMsg(null); // Clear previous

        try {
            const res = await fetch("/api/shop/spin", { method: "POST" });
            const data = await res.json();

            if (!res.ok) {
                setAlertMsg(data.error || "Spin Failed");
                setSpinning(false);
                return;
            }

            const { winnerIndex, winningItem, remainingSpins } = data;
            animateWheel(winnerIndex, winningItem, remainingSpins);

        } catch (error) {
            console.error(error);
            setSpinning(false);
            setAlertMsg("Connection failed. Try again.");
        }
    };

    const animateWheel = (winnerIndex: number, winningItem: SpinItem, finalSpins: number) => {
        const segmentAngle = 360 / items.length;
        // Center of the winning slice
        const currentSliceCenter = (winnerIndex * segmentAngle) + (segmentAngle / 2);

        // We want the slice center to land at 270deg (Top)
        // Visual Rotation = WheelRotation + SliceCenter
        // Target Visual Rotation = 270 (or 270 + N*360)
        // WheelTarget + SliceCenter = 270 + N*360
        // WheelTarget = 270 - SliceCenter + N*360

        // Start from current rotation and add at least 5 full spins (1800deg)
        const minSpin = 1800;
        let targetRotation = 270 - currentSliceCenter;

        // Adjust targetRotation to be greater than (current rotation + minSpin)
        while (targetRotation < rotation + minSpin) {
            targetRotation += 360;
        }

        // Add random slight offset for realism? No, user wants precise pointer.
        // Actually, let's keep it precise to the center of the slice for now.

        setRotation(targetRotation);

        setTimeout(() => {
            setSpinning(false);
            setWinItem(winningItem);
            setAvailableSpins(finalSpins);
            if (finalSpins !== availableSpins) router.refresh();
        }, 5000);
    };

    return (
        <div className="flex flex-col items-center justify-center w-full max-w-md mx-auto p-4">

            {/* 3D Wheel Container - Compact Size */}
            <div className="relative w-[80vw] h-[80vw] max-w-[300px] max-h-[300px] aspect-square mb-6 group select-none">

                {/* Pointer (Sharpened Golden Pin) */}
                <div className="absolute -top-[8%] left-1/2 transform -translate-x-1/2 z-30 filter drop-shadow-[0_4px_4px_rgba(0,0,0,0.5)] flex flex-col items-center">
                    {/* Pin Head Circle - Aligned with Purple Border */}
                    <div className="w-2.5 h-2.5 rounded-full bg-white border border-yellow-600 shadow-sm z-10 -mb-1 ring-1 ring-purple-900/50"></div>

                    {/* Pin Body */}
                    <div
                        className="w-12 h-14 bg-gradient-to-b from-[#FFD700] via-[#FDB931] to-[#C99618] flex items-start justify-center shadow-lg mx-auto"
                        style={{ clipPath: 'polygon(15% 0%, 85% 0%, 50% 100%)' }}
                    >
                        <div className="w-8 h-8 rounded-full bg-yellow-100/30 -mt-2 blur-sm"></div>
                    </div>
                </div>

                {/* Outer Ring (Static) - Thicker Purple & Gold */}
                <div className="absolute -inset-[5%] rounded-full bg-gradient-to-b from-purple-600 to-purple-900 shadow-[0_10px_30px_rgba(0,0,0,0.6)] border-[5px] border-yellow-500 flex items-center justify-center z-0">

                    {/* Border Dots */}
                    {Array.from({ length: 12 }).map((_, i) => {
                        const angleDeg = i * 30;
                        const angleRad = (angleDeg * Math.PI) / 180;
                        const r = 48;
                        const x = 50 + r * Math.cos(angleRad);
                        const y = 50 + r * Math.sin(angleRad);

                        return (
                            <div
                                key={`dot-${i}`}
                                className="absolute w-2 h-2 bg-white rounded-full shadow-[0_0_5px_rgba(255,255,255,0.8)]"
                                style={{
                                    left: `${x}%`,
                                    top: `${y}%`,
                                    transform: 'translate(-50%, -50%)'
                                }}
                            />
                        );
                    })}
                </div>

                {/* Rotating Wheel Inner */}
                <div
                    className="w-full h-full rounded-full overflow-hidden relative z-10 border-[5px] border-yellow-500 shadow-[inset_0_0_20px_rgba(0,0,0,0.5)] bg-[#2c3e50]"
                    style={{
                        transform: `rotate(${rotation}deg)`,
                        transition: spinning ? "transform 5s cubic-bezier(0.15, 0, 0, 1)" : "none"
                    }}
                >
                    {/* 1. Background Slices (Colors) */}
                    {items.map((item, index) => {
                        const segmentAngle = 360 / items.length;
                        const rotate = index * segmentAngle;
                        const skew = 90 - segmentAngle;
                        // Enforce Purple & Gold Theme
                        const sliceColor = index % 2 === 0 ? '#9333ea' : '#eab308'; // purple-600 : yellow-500

                        return (
                            <div
                                key={`slice-${item._id}`}
                                className="absolute top-0 right-0 w-1/2 h-1/2 origin-bottom-left"
                                style={{
                                    backgroundColor: sliceColor,
                                    transform: `rotate(${rotate}deg) skewY(-${skew}deg)`,
                                    borderLeft: '2px solid rgba(255,255,255,0.1)',
                                    boxShadow: 'inset 0 0 10px rgba(0,0,0,0.2)'
                                }}
                            />
                        );
                    })}

                    {/* 2. Text Content Layer (Use Spoke Logic) */}
                    <div className="absolute inset-0 rounded-full pointer-events-none">
                        {items.map((item, index) => {
                            const segmentAngle = 360 / items.length;
                            const midAngle = (index * segmentAngle) + (segmentAngle / 2);
                            const midAngleRad = (midAngle * Math.PI) / 180;

                            // Position: radius/2 (25% of full diameter)
                            // We position the CENTER of the text box at this point.
                            const r = 25; // 25% from center
                            const x = 50 + r * Math.cos(midAngleRad);
                            const y = 50 + r * Math.sin(midAngleRad);

                            return (
                                <div
                                    key={`text-${item._id}`}
                                    className="absolute flex items-center justify-center text-center"
                                    style={{
                                        left: `${x}%`,
                                        top: `${y}%`,
                                        width: '40%', // Restrict width to avoid overflow
                                        // Text is Straight but Rotated. Spoke alignment.
                                        // Rotate by midAngle.
                                        // At 0deg (Right), text is Horizontal (L->R). Reads Inner->Outer.
                                        transform: `translate(-50%, -50%) rotate(${midAngle}deg)`,
                                    }}
                                >
                                    <span
                                        className="text-white font-black uppercase tracking-wider drop-shadow-[0_2px_2px_rgba(0,0,0,0.8)]"
                                        style={{
                                            fontSize: 'clamp(10px, 3vw, 16px)', // Responsive font
                                            lineHeight: '1',
                                            textShadow: '0 2px 4px rgba(0,0,0,0.5)',
                                            whiteSpace: 'nowrap'
                                        }}
                                    >
                                        {item.label}
                                    </span>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Center Cap */}
                <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-20">
                    <div className="w-[20%] h-[20%] min-w-[50px] min-h-[50px] aspect-square rounded-full bg-gradient-to-br from-[#FDB931] to-[#C99618] border-4 border-[#8a6e15] shadow-xl flex items-center justify-center">
                        {/* Using responsive sizing/aspect-square ensures circle */}
                        <div className="w-[60%] h-[60%] rounded-full bg-gradient-to-tl from-[#e0b745] to-[#fff5c3] shadow-inner"></div>
                    </div>
                </div>
            </div>

            {/* Dashboard-Style Rank Bar - Premium Glass Card */}
            <div className="w-full bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-5 mb-6 space-y-4 shadow-lg">
                <div className="flex justify-between items-end">
                    <div>
                        <p className="text-[10px] font-bold uppercase text-muted-foreground tracking-widest mb-1.5 flex items-center gap-1">
                            Loyalty Progress <span className="w-1.5 h-1.5 rounded-full bg-yellow-500 animate-pulse" />
                        </p>
                        <h3 className="font-black text-lg text-yellow-500 leading-none tracking-tight">
                            {userProgress >= 2500 ? "GOAL REACHED!" : `${(2500 - userProgress).toLocaleString()} COINS LEFT`}
                        </h3>
                    </div>
                    <div className="text-right">
                        <span className="font-mono font-bold text-xl text-white drop-shadow-md">{Math.min(userProgress, 2500).toLocaleString()}</span>
                        <span className="text-xs text-muted-foreground font-bold ml-1">/ 2,500</span>
                    </div>
                </div>

                <div className="h-3 w-full bg-black/60 rounded-full overflow-hidden border border-white/5 relative shadow-inner">
                    <div className="absolute inset-0 flex">
                        {[1, 2, 3, 4].map(i => (
                            <div key={i} className="flex-1 border-r border-white/5 h-full last:border-0 ml-px"></div>
                        ))}
                    </div>
                    <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${Math.min((userProgress / 2500) * 100, 100)}%` }}
                        className={`h-full shadow-[0_0_15px_rgba(168,85,247,0.5)] transition-all duration-1000 ${userProgress >= 2500
                            ? "bg-gradient-to-r from-green-400 to-emerald-600 animate-pulse"
                            : "bg-gradient-to-r from-purple-500 via-pink-500 to-purple-500"
                            }`}
                    />
                </div>
                <p className="text-xs text-center text-muted-foreground font-medium">
                    Top-up total of <span className="text-yellow-400 font-bold mx-1">2,500 Coins</span> to unlock a Free Spin!
                </p>
            </div>

            {/* Spin Functionality */}
            <div className="flex flex-col gap-3 w-full">
                <button
                    onClick={handleSpin}
                    disabled={spinning}
                    className={`w-full py-4 rounded-xl font-black text-xl tracking-wider uppercase transition-all transform active:scale-95 shadow-xl shadow-purple-900/20 ${spinning
                        ? "bg-muted text-muted-foreground cursor-wait"
                        : userProgress >= 2500 && availableSpins > 0
                            ? "bg-gradient-to-r from-purple-600 via-fuchsia-600 to-purple-600 bg-[length:200%_auto] text-white hover:brightness-110 border border-purple-400/30 animate-pulse"
                            : "bg-muted text-muted-foreground cursor-pointer border border-white/5 opacity-50 hover:opacity-75"
                        }`}
                >
                    {spinning ? (
                        <span className="flex items-center justify-center gap-2"><Loader2 className="animate-spin" /> Spinning</span>
                    ) : (
                        "Spin Now!"
                    )}
                </button>
            </div>

            {/* Custom Cool Toast Notification */}
            <AnimatePresence>
                {alertMsg && (
                    <motion.div
                        initial={{ opacity: 0, y: 20, scale: 0.9 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 20, scale: 0.9 }}
                        className="fixed bottom-24 left-1/2 transform -translate-x-1/2 z-[60] bg-red-600/95 backdrop-blur-xl text-white px-6 py-3 rounded-full shadow-[0_10px_40px_rgba(220,38,38,0.5)] border border-red-400/50 flex items-center gap-3 font-bold text-sm whitespace-nowrap"
                    >
                        <span className="bg-white/20 p-1 rounded-full text-[10px]">⚠️</span>
                        {alertMsg}
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Win Modal Overlay */}
            <AnimatePresence>
                {winItem && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md">
                        <motion.div
                            initial={{ scale: 0.5, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.5, opacity: 0 }}
                            className="bg-card w-full max-w-sm rounded-[2rem] p-8 text-center shadow-2xl border border-yellow-500/30 relative overflow-hidden"
                        >
                            <div className="absolute inset-0 bg-gradient-to-br from-yellow-500/10 to-transparent pointer-events-none" />

                            <div className="text-7xl mb-6 animate-bounce filter drop-shadow-[0_10px_20px_rgba(0,0,0,0.5)]">
                                {winItem.type === 'coins' ? '💰' : '🎁'}
                            </div>

                            <h2 className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-b from-yellow-300 to-yellow-600 mb-2 uppercase italic tracking-tighter">
                                Big Win!
                            </h2>
                            <p className="text-xl text-foreground mb-8 font-medium">
                                You received <br />
                                <span className="text-3xl font-bold text-yellow-500">{winItem.label}</span>
                            </p>

                            <button
                                onClick={() => { setWinItem(null); if (onClose) onClose(); }}
                                className="w-full py-4 bg-gradient-to-r from-green-500 to-emerald-700 text-white font-black text-lg rounded-xl hover:scale-105 transition-transform shadow-lg shadow-green-500/30 uppercase tracking-widest"
                            >
                                Claim Prize
                            </button>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}
