"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Gift, Coins, Loader2, Clock, Sparkles, Lock } from "lucide-react";

interface SpinItem {
    _id: string;
    label: string;
    value: number;
    color: string;
}

interface SpinStatus {
    canSpin: boolean;
    hasEnoughCoins: boolean;
    walletBalance: number;
    minCoinsRequired: number;
    nextSpinAt: string | null;
}

interface DailyRewardModalProps {
    onClose: () => void;
    onCoinsUpdated?: (newBalance: number) => void;
}

export default function DailyRewardModal({ onClose, onCoinsUpdated }: DailyRewardModalProps) {
    const [activeTab, setActiveTab] = useState<"free" | "spin">("spin");
    const [spinItems, setSpinItems] = useState<SpinItem[]>([]);
    const [spinStatus, setSpinStatus] = useState<SpinStatus | null>(null);
    const [loading, setLoading] = useState(true);
    const [spinning, setSpinning] = useState(false);
    const [rotation, setRotation] = useState(0);
    const [winItem, setWinItem] = useState<SpinItem | null>(null);
    const [alertMsg, setAlertMsg] = useState<string | null>(null);
    const [countdown, setCountdown] = useState<string>("");

    // Refs for countdown timer
    const countdownInterval = useRef<NodeJS.Timeout | null>(null);

    useEffect(() => {
        fetchData();
        return () => {
            if (countdownInterval.current) clearInterval(countdownInterval.current);
        };
    }, []);

    // Countdown timer for next spin
    useEffect(() => {
        if (spinStatus?.nextSpinAt) {
            const tick = () => {
                const now = new Date();
                const target = new Date(spinStatus.nextSpinAt!);
                const diff = target.getTime() - now.getTime();
                if (diff <= 0) {
                    setCountdown("");
                    fetchData();
                    if (countdownInterval.current) clearInterval(countdownInterval.current);
                    return;
                }
                const h = Math.floor(diff / 3600000);
                const m = Math.floor((diff % 3600000) / 60000);
                const s = Math.floor((diff % 60000) / 1000);
                setCountdown(`${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`);
            };
            tick();
            countdownInterval.current = setInterval(tick, 1000);
        }
        return () => {
            if (countdownInterval.current) clearInterval(countdownInterval.current);
        };
    }, [spinStatus?.nextSpinAt]);

    // Auto-dismiss alert
    useEffect(() => {
        if (alertMsg) {
            const t = setTimeout(() => setAlertMsg(null), 3000);
            return () => clearTimeout(t);
        }
    }, [alertMsg]);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [statusRes, itemsRes] = await Promise.all([
                fetch("/api/daily-reward/spin"),
                fetch("/api/admin/finance/daily-spin/items"),
            ]);
            const statusData = await statusRes.json();
            const itemsData = await itemsRes.json();
            if (statusRes.ok) setSpinStatus(statusData);
            if (itemsData.success && Array.isArray(itemsData.items)) {
                setSpinItems(itemsData.items);
            }
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const handleSpin = async () => {
        if (spinning || !spinStatus?.canSpin) return;
        if (!spinStatus?.hasEnoughCoins) {
            setAlertMsg(`You need at least ${spinStatus?.minCoinsRequired} coins!`);
            return;
        }
        setSpinning(true);
        setWinItem(null);
        setAlertMsg(null);
        try {
            const res = await fetch("/api/daily-reward/spin", { method: "POST" });
            const data = await res.json();
            if (!res.ok) {
                setAlertMsg(data.error || "Spin failed");
                setSpinning(false);
                return;
            }
            const { winnerIndex, winningItem, newBalance } = data;
            animateWheel(winnerIndex, winningItem, newBalance);
        } catch {
            setSpinning(false);
            setAlertMsg("Connection error. Try again.");
        }
    };

    const animateWheel = (winnerIndex: number, winningItem: SpinItem, newBalance: number) => {
        if (spinItems.length === 0) return;
        const segmentAngle = 360 / spinItems.length;
        const currentSliceCenter = winnerIndex * segmentAngle + segmentAngle / 2;
        const minSpin = 1800;
        let targetRotation = 270 - currentSliceCenter;
        while (targetRotation < rotation + minSpin) targetRotation += 360;
        setRotation(targetRotation);
        setTimeout(() => {
            setSpinning(false);
            setWinItem(winningItem);
            if (onCoinsUpdated) onCoinsUpdated(newBalance);
            // Refresh status
            fetchData();
        }, 5000);
    };

    const PURPLE = "#9333ea";
    const GOLD = "#eab308";

    return (
        <div className="fixed inset-0 z-[70] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/70 backdrop-blur-sm">
            <motion.div
                initial={{ opacity: 0, y: 60, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 60, scale: 0.95 }}
                transition={{ type: "spring", damping: 25, stiffness: 200 }}
                className="bg-card w-full max-w-md rounded-t-[2rem] sm:rounded-[2rem] border border-border shadow-2xl overflow-hidden max-h-[90vh] overflow-y-auto"
            >
                {/* Header */}
                <div className="relative bg-gradient-to-r from-purple-600 via-fuchsia-600 to-purple-700 p-5 flex items-center justify-between">
                    <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAiIGhlaWdodD0iMjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGNpcmNsZSBjeD0iMiIgY3k9IjIiIHI9IjEiIGZpbGw9InJnYmEoMjU1LDI1NSwyNTUsMC4xNSkiLz48L3N2Zz4=')] opacity-30" />
                    <div className="relative flex items-center gap-3">
                        <div className="w-10 h-10 rounded-2xl bg-white/20 flex items-center justify-center text-xl">🎁</div>
                        <div>
                            <h2 className="text-lg font-black text-white tracking-tight">Daily Reward</h2>
                            <p className="text-white/70 text-xs font-medium">Spin every 24 hours!</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="relative w-9 h-9 rounded-xl bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors">
                        <X size={18} className="text-white" />
                    </button>
                </div>

                {/* Tabs */}
                <div className="flex border-b border-border bg-muted/30">
                    <button
                        onClick={() => setActiveTab("spin")}
                        className={`flex-1 py-3 text-sm font-bold flex items-center justify-center gap-2 transition-all ${activeTab === "spin" ? "text-primary border-b-2 border-primary" : "text-muted-foreground hover:text-foreground"}`}
                    >
                        🎰 Win 1K Spinner
                    </button>
                    <button
                        onClick={() => setActiveTab("free")}
                        className={`flex-1 py-3 text-sm font-bold flex items-center justify-center gap-2 transition-all ${activeTab === "free" ? "text-primary border-b-2 border-primary" : "text-muted-foreground hover:text-foreground"}`}
                    >
                        🪙 Free Coins
                    </button>
                </div>

                <div className="p-5">
                    {/* FREE COINS TAB — Coming Soon */}
                    {activeTab === "free" && (
                        <div className="flex flex-col items-center justify-center py-10 gap-5">
                            <div className="relative">
                                <div className="w-24 h-24 rounded-full bg-gradient-to-br from-yellow-400/20 to-orange-500/20 border-2 border-yellow-500/30 flex items-center justify-center text-5xl animate-pulse">
                                    🪙
                                </div>
                                <div className="absolute -top-2 -right-2 bg-purple-600 text-white text-[9px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider shadow-lg">
                                    Soon
                                </div>
                            </div>
                            <div className="text-center space-y-2">
                                <h3 className="text-xl font-black text-foreground">Free Daily Coins</h3>
                                <p className="text-sm text-muted-foreground max-w-[260px] leading-relaxed">
                                    Claim free coins every day without spending anything. Coming soon!
                                </p>
                            </div>
                            <div className="w-full bg-gradient-to-r from-yellow-500/10 via-orange-500/10 to-yellow-500/10 border border-yellow-500/20 rounded-2xl p-4 text-center">
                                <div className="flex items-center justify-center gap-2 text-yellow-500 font-bold text-sm">
                                    <Sparkles size={16} />
                                    Coming Very Soon — Stay Tuned!
                                </div>
                            </div>
                        </div>
                    )}

                    {/* WIN 1K SPINNER TAB */}
                    {activeTab === "spin" && (
                        <div className="space-y-5">
                            {loading ? (
                                <div className="flex flex-col items-center py-12 gap-3">
                                    <Loader2 className="animate-spin text-primary" size={32} />
                                    <p className="text-muted-foreground text-sm">Loading...</p>
                                </div>
                            ) : (
                                <>
                                    {/* Eligibility Banner */}
                                    {!spinStatus?.hasEnoughCoins ? (
                                        <div className="bg-red-500/10 border border-red-500/20 rounded-2xl p-4 flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-xl bg-red-500/20 flex items-center justify-center shrink-0">
                                                <Lock size={18} className="text-red-500" />
                                            </div>
                                            <div>
                                                <p className="text-sm font-bold text-red-500">Locked</p>
                                                <p className="text-xs text-muted-foreground">
                                                    Need <span className="text-red-400 font-bold">{spinStatus?.minCoinsRequired?.toLocaleString()} coins</span> in wallet.
                                                    You have <span className="font-bold text-foreground">{spinStatus?.walletBalance?.toLocaleString()}</span>.
                                                </p>
                                            </div>
                                        </div>
                                    ) : !spinStatus?.canSpin && countdown ? (
                                        <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-2xl p-4 flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-xl bg-yellow-500/20 flex items-center justify-center shrink-0">
                                                <Clock size={18} className="text-yellow-500" />
                                            </div>
                                            <div>
                                                <p className="text-sm font-bold text-yellow-500">Next Spin In</p>
                                                <p className="text-2xl font-black text-foreground font-mono tracking-widest">{countdown}</p>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="bg-green-500/10 border border-green-500/20 rounded-2xl p-4 flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-xl bg-green-500/20 flex items-center justify-center shrink-0 text-xl">✅</div>
                                            <div>
                                                <p className="text-sm font-bold text-green-500">Ready to Spin!</p>
                                                <p className="text-xs text-muted-foreground">Your daily spin is available now.</p>
                                            </div>
                                        </div>
                                    )}

                                    {/* Spin Wheel */}
                                    {spinItems.length > 0 ? (
                                        <div className="flex flex-col items-center gap-5">
                                            {/* Wheel */}
                                            <div className="relative w-[70vw] h-[70vw] max-w-[240px] max-h-[240px] aspect-square select-none my-4">
                                                {/* Pointer */}
                                                <div className="absolute -top-[12%] left-1/2 transform -translate-x-1/2 z-30 flex flex-col items-center filter drop-shadow-[0_4px_4px_rgba(0,0,0,0.5)]">
                                                    <div className="w-2.5 h-2.5 rounded-full bg-white border border-yellow-600 z-10 -mb-1 ring-1 ring-purple-900/50" />
                                                    <div
                                                        className="w-10 h-12 bg-gradient-to-b from-[#FFD700] via-[#FDB931] to-[#C99618] flex items-start justify-center shadow-lg"
                                                        style={{ clipPath: "polygon(15% 0%, 85% 0%, 50% 100%)" }}
                                                    />
                                                </div>
                                                {/* Outer Ring */}
                                                <div className="absolute -inset-[5%] rounded-full bg-gradient-to-b from-purple-600 to-purple-900 shadow-[0_10px_30px_rgba(0,0,0,0.6)] border-[5px] border-yellow-500 flex items-center justify-center z-0">
                                                    {Array.from({ length: 12 }).map((_, i) => {
                                                        const angleDeg = i * 30;
                                                        const angleRad = (angleDeg * Math.PI) / 180;
                                                        const r = 48;
                                                        const x = 50 + r * Math.cos(angleRad);
                                                        const y = 50 + r * Math.sin(angleRad);
                                                        return (
                                                            <div
                                                                key={i}
                                                                className="absolute w-2 h-2 bg-white rounded-full shadow-[0_0_5px_rgba(255,255,255,0.8)]"
                                                                style={{ left: `${x}%`, top: `${y}%`, transform: "translate(-50%,-50%)" }}
                                                            />
                                                        );
                                                    })}
                                                </div>
                                                {/* Rotating Wheel */}
                                                <div
                                                    className="w-full h-full rounded-full overflow-hidden relative z-10 border-[5px] border-yellow-500 shadow-[inset_0_0_20px_rgba(0,0,0,0.5)] bg-[#2c3e50]"
                                                    style={{
                                                        transform: `rotate(${rotation}deg)`,
                                                        transition: spinning ? "transform 5s cubic-bezier(0.15, 0, 0, 1)" : "none",
                                                    }}
                                                >
                                                    {/* Slices */}
                                                    {spinItems.map((item, index) => {
                                                        const segAngle = 360 / spinItems.length;
                                                        const rotate = index * segAngle;
                                                        const skew = 90 - segAngle;
                                                        const sliceColor = index % 2 === 0 ? PURPLE : GOLD;
                                                        return (
                                                            <div
                                                                key={item._id}
                                                                className="absolute top-0 right-0 w-1/2 h-1/2 origin-bottom-left"
                                                                style={{
                                                                    backgroundColor: sliceColor,
                                                                    transform: `rotate(${rotate}deg) skewY(-${skew}deg)`,
                                                                    borderLeft: "2px solid rgba(255,255,255,0.1)",
                                                                    boxShadow: "inset 0 0 10px rgba(0,0,0,0.2)",
                                                                }}
                                                            />
                                                        );
                                                    })}
                                                    {/* Text Layer */}
                                                    <div className="absolute inset-0 rounded-full pointer-events-none">
                                                        {spinItems.map((item, index) => {
                                                            const segAngle = 360 / spinItems.length;
                                                            const midAngle = index * segAngle + segAngle / 2;
                                                            const midAngleRad = (midAngle * Math.PI) / 180;
                                                            const r = 25;
                                                            const x = 50 + r * Math.cos(midAngleRad);
                                                            const y = 50 + r * Math.sin(midAngleRad);
                                                            return (
                                                                <div
                                                                    key={`t-${item._id}`}
                                                                    className="absolute flex items-center justify-center text-center"
                                                                    style={{ left: `${x}%`, top: `${y}%`, width: "40%", transform: `translate(-50%,-50%) rotate(${midAngle}deg)` }}
                                                                >
                                                                    <span className="text-white font-black uppercase drop-shadow-[0_2px_2px_rgba(0,0,0,0.8)] whitespace-nowrap" style={{ fontSize: "clamp(9px,3.5vw,12px)", lineHeight: "1" }}>
                                                                        {item.label}
                                                                    </span>
                                                                </div>
                                                            );
                                                        })}
                                                    </div>
                                                </div>
                                                {/* Center Cap */}
                                                <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-20">
                                                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#FDB931] to-[#C99618] border-4 border-[#8a6e15] shadow-xl flex items-center justify-center">
                                                        <div className="w-6 h-6 rounded-full bg-gradient-to-tl from-[#e0b745] to-[#fff5c3] shadow-inner" />
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Info */}
                                            <div className="text-center text-xs text-muted-foreground px-2">
                                                <p>Hold <span className="text-yellow-500 font-bold">1,000+ coins</span> to earn 1 daily spin.</p>
                                                <p className="mt-0.5 opacity-70">Resets every 24 hours.</p>
                                            </div>

                                            {/* Spin Button */}
                                            <button
                                                onClick={handleSpin}
                                                disabled={spinning || !spinStatus?.canSpin || !spinStatus?.hasEnoughCoins}
                                                className={`w-full py-4 rounded-2xl font-black text-lg tracking-wider uppercase transition-all transform active:scale-95 shadow-xl ${
                                                    spinning
                                                        ? "bg-muted text-muted-foreground cursor-wait"
                                                        : spinStatus?.canSpin && spinStatus?.hasEnoughCoins
                                                            ? "bg-gradient-to-r from-purple-600 via-fuchsia-600 to-purple-600 bg-[length:200%_auto] text-white hover:brightness-110 border border-purple-400/30 animate-pulse"
                                                            : "bg-muted/50 text-muted-foreground cursor-not-allowed opacity-50"
                                                }`}
                                            >
                                                {spinning ? (
                                                    <span className="flex items-center justify-center gap-2">
                                                        <Loader2 className="animate-spin" size={20} /> Spinning...
                                                    </span>
                                                ) : !spinStatus?.hasEnoughCoins ? (
                                                    "🔒 Need 1000 Coins"
                                                ) : !spinStatus?.canSpin ? (
                                                    `⏰ ${countdown || "Come Back Later"}`
                                                ) : (
                                                    "🎰 Spin Now!"
                                                )}
                                            </button>
                                        </div>
                                    ) : (
                                        <div className="text-center py-8 text-muted-foreground text-sm">
                                            <p>🎰 Spin wheel is being configured. Check back soon!</p>
                                        </div>
                                    )}
                                </>
                            )}
                        </div>
                    )}
                </div>
            </motion.div>

            {/* Toast Alert */}
            <AnimatePresence>
                {alertMsg && (
                    <motion.div
                        initial={{ opacity: 0, y: 20, scale: 0.9 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 20, scale: 0.9 }}
                        className="fixed bottom-28 left-1/2 -translate-x-1/2 z-[80] bg-red-600/95 backdrop-blur-xl text-white px-6 py-3 rounded-full shadow-xl border border-red-400/50 flex items-center gap-2 font-bold text-sm whitespace-nowrap"
                    >
                        ⚠️ {alertMsg}
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Win Modal */}
            <AnimatePresence>
                {winItem && (
                    <div className="fixed inset-0 z-[80] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md">
                        <motion.div
                            initial={{ scale: 0.5, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.5, opacity: 0 }}
                            className="bg-card w-full max-w-sm rounded-[2rem] p-8 text-center shadow-2xl border border-yellow-500/30 relative overflow-hidden"
                        >
                            <div className="absolute inset-0 bg-gradient-to-br from-yellow-500/10 to-purple-500/10 pointer-events-none" />
                            <div className="text-6xl mb-5 animate-bounce">💰</div>
                            <h2 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-b from-yellow-300 to-yellow-600 mb-2 uppercase italic">
                                You Won!
                            </h2>
                            <p className="text-lg text-foreground mb-6 font-medium">
                                <span className="text-3xl font-bold text-yellow-500">{winItem.label}</span>
                                <br />
                                <span className="text-sm text-muted-foreground">added to your wallet</span>
                            </p>
                            <button
                                onClick={() => { setWinItem(null); onClose(); }}
                                className="w-full py-4 bg-gradient-to-r from-green-500 to-emerald-700 text-white font-black text-lg rounded-xl hover:scale-105 transition-transform shadow-lg shadow-green-500/30 uppercase tracking-widest"
                            >
                                Collect! 🎉
                            </button>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}
