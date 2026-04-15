"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    Gift, Coins, Loader2, Clock, Sparkles, Lock,
    CheckCircle, Star, Flame, Trophy, ChevronRight, History
} from "lucide-react";

/* ─── Types ─── */
interface SpinItem { _id: string; label: string; value: number; color: string; }
interface SpinStatus { canSpin: boolean; hasEnoughCoins: boolean; walletBalance: number; minCoinsRequired: number; nextSpinAt: string | null; }
interface DayInfo { day: number; coins: number; status: "claimed" | "current" | "upcoming" | "locked"; }
interface FreeCoinsStatus { canClaim: boolean; currentStreak: number; nextDay: number; nextCoins: number; nextClaimAt: string | null; schedule: DayInfo[]; lastClaimAt: string | null; }
interface HistoryItem { _id: string; type: string; amount: number; description: string; status: string; createdAt: string; }

const DAY_ICONS = ["", "🌱", "🌿", "🌙", "⚡", "🔥", "💫", "👑"];

export default function DailyRewardPage() {
    const [activeTab, setActiveTab] = useState<"free" | "spin" | "history">("free");

    /* Spin state */
    const [spinItems, setSpinItems] = useState<SpinItem[]>([]);
    const [spinStatus, setSpinStatus] = useState<SpinStatus | null>(null);
    const [spinning, setSpinning] = useState(false);
    const [rotation, setRotation] = useState(0);
    const [winItem, setWinItem] = useState<SpinItem | null>(null);
    const [spinAlert, setSpinAlert] = useState<string | null>(null);
    const [spinCountdown, setSpinCountdown] = useState("");

    /* Free Coins state */
    const [freeStatus, setFreeStatus] = useState<FreeCoinsStatus | null>(null);
    const [claiming, setClaiming] = useState(false);
    const [claimResult, setClaimResult] = useState<{ coinsAwarded: number; dayCompleted: number } | null>(null);
    const [freeCountdown, setFreeCountdown] = useState("");

    /* History */
    const [history, setHistory] = useState<HistoryItem[]>([]);
    const [histLoading, setHistLoading] = useState(false);

    const [loading, setLoading] = useState(true);

    const spinIntervalRef = useRef<NodeJS.Timeout | null>(null);
    const freeIntervalRef = useRef<NodeJS.Timeout | null>(null);

    useEffect(() => {
        Promise.all([fetchSpinData(), fetchFreeData()]).finally(() => setLoading(false));
        return () => {
            if (spinIntervalRef.current) clearInterval(spinIntervalRef.current);
            if (freeIntervalRef.current) clearInterval(freeIntervalRef.current);
        };
    }, []);

    useEffect(() => {
        if (activeTab === "history") fetchHistory();
    }, [activeTab]);

    /* Countdown timers */
    useEffect(() => {
        if (spinStatus?.nextSpinAt) {
            if (spinIntervalRef.current) clearInterval(spinIntervalRef.current);
            const tick = () => {
                const diff = new Date(spinStatus.nextSpinAt!).getTime() - Date.now();
                if (diff <= 0) { setSpinCountdown(""); fetchSpinData(); clearInterval(spinIntervalRef.current!); return; }
                const h = Math.floor(diff / 3600000), m = Math.floor((diff % 3600000) / 60000), s = Math.floor((diff % 60000) / 1000);
                setSpinCountdown(`${String(h).padStart(2,"0")}:${String(m).padStart(2,"0")}:${String(s).padStart(2,"0")}`);
            };
            tick(); spinIntervalRef.current = setInterval(tick, 1000);
        }
    }, [spinStatus?.nextSpinAt]);

    useEffect(() => {
        if (freeStatus?.nextClaimAt) {
            if (freeIntervalRef.current) clearInterval(freeIntervalRef.current);
            const tick = () => {
                const diff = new Date(freeStatus.nextClaimAt!).getTime() - Date.now();
                if (diff <= 0) { setFreeCountdown(""); fetchFreeData(); clearInterval(freeIntervalRef.current!); return; }
                const h = Math.floor(diff / 3600000), m = Math.floor((diff % 3600000) / 60000), s = Math.floor((diff % 60000) / 1000);
                setFreeCountdown(`${String(h).padStart(2,"0")}:${String(m).padStart(2,"0")}:${String(s).padStart(2,"0")}`);
            };
            tick(); freeIntervalRef.current = setInterval(tick, 1000);
        }
    }, [freeStatus?.nextClaimAt]);

    useEffect(() => {
        if (spinAlert) { const t = setTimeout(() => setSpinAlert(null), 3000); return () => clearTimeout(t); }
    }, [spinAlert]);

    const fetchSpinData = async () => {
        const [statusRes, itemsRes] = await Promise.all([
            fetch("/api/daily-reward/spin"),
            fetch("/api/daily-reward/spin-items"),
        ]);
        const s = await statusRes.json(); if (statusRes.ok) setSpinStatus(s);
        const i = await itemsRes.json(); if (i.success) setSpinItems(i.items || []);
    };

    const fetchFreeData = async () => {
        const res = await fetch("/api/daily-reward/free-coins");
        if (res.ok) { const d = await res.json(); setFreeStatus(d); }
    };

    const fetchHistory = async () => {
        setHistLoading(true);
        const res = await fetch("/api/daily-reward/history");
        if (res.ok) { const d = await res.json(); setHistory(d.history || []); }
        setHistLoading(false);
    };

    /* ─── Spin Logic ─── */
    const handleSpin = async () => {
        if (spinning || !spinStatus?.canSpin || !spinStatus?.hasEnoughCoins) return;
        setSpinning(true); setWinItem(null); setSpinAlert(null);
        try {
            const res = await fetch("/api/daily-reward/spin", { method: "POST" });
            const data = await res.json();
            if (!res.ok) { setSpinAlert(data.error || "Spin failed"); setSpinning(false); return; }
            animateWheel(data.winnerIndex, data.winningItem, data.newBalance);
        } catch { setSpinning(false); setSpinAlert("Connection error. Try again."); }
    };

    const animateWheel = (winnerIndex: number, winningItem: SpinItem, newBalance: number) => {
        if (!spinItems.length) return;
        const seg = 360 / spinItems.length;
        const center = winnerIndex * seg + seg / 2;
        let target = 270 - center;
        while (target < rotation + 1800) target += 360;
        setRotation(target);
        setTimeout(() => { setSpinning(false); setWinItem(winningItem); fetchSpinData(); }, 5000);
    };

    /* ─── Free Coins Claim ─── */
    const handleClaim = async () => {
        if (claiming || !freeStatus?.canClaim) return;
        setClaiming(true);
        try {
            const res = await fetch("/api/daily-reward/free-coins", { method: "POST" });
            const data = await res.json();
            if (res.ok) { setClaimResult({ coinsAwarded: data.coinsAwarded, dayCompleted: data.dayCompleted }); fetchFreeData(); }
            else { setSpinAlert(data.error || "Claim failed"); }
        } catch { setSpinAlert("Error. Try again."); }
        finally { setClaiming(false); }
    };

    const PURPLE = "#9333ea"; const GOLD = "#eab308";

    return (
        <div className="min-h-screen pb-24 lg:pb-8">
            {/* Header */}
            <div className="relative bg-gradient-to-r from-purple-700 via-fuchsia-600 to-purple-800 px-5 pt-6 pb-8 overflow-hidden">
                <div className="absolute inset-0 opacity-20" style={{ backgroundImage: "radial-gradient(circle at 20% 50%, #fff 1px, transparent 1px), radial-gradient(circle at 80% 20%, #fff 1px, transparent 1px)", backgroundSize: "30px 30px" }} />
                <div className="relative flex items-center gap-4 max-w-lg mx-auto">
                    <div className="w-14 h-14 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center text-3xl border border-white/30 shadow-xl">🎁</div>
                    <div>
                        <h1 className="text-2xl font-black text-white tracking-tight">Daily Rewards</h1>
                        <p className="text-white/70 text-sm">Come back every day to earn more!</p>
                    </div>
                </div>
                {/* Tabs */}
                <div className="relative flex gap-2 mt-5 max-w-lg mx-auto">
                    {[
                        { id: "free", label: "🪙 Free Coins" },
                        { id: "spin", label: "🎰 Win 1K Spin" },
                        { id: "history", label: "📋 History" },
                    ].map(t => (
                        <button key={t.id} onClick={() => setActiveTab(t.id as any)}
                            className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all ${activeTab === t.id ? "bg-white text-purple-700 shadow-lg" : "bg-white/15 text-white/80 hover:bg-white/25"}`}>
                            {t.label}
                        </button>
                    ))}
                </div>
            </div>

            <div className="max-w-lg mx-auto px-4 pt-5 space-y-5">
                {loading ? (
                    <div className="flex flex-col items-center py-16 gap-3">
                        <Loader2 className="animate-spin text-primary" size={36} />
                        <p className="text-muted-foreground text-sm">Loading rewards...</p>
                    </div>
                ) : (
                    <>
                        {/* ═══════════ FREE COINS TAB ═══════════ */}
                        {activeTab === "free" && (
                            <div className="space-y-5">
                                {/* Weekly Streak */}
                                <div className="bg-card border border-border rounded-3xl p-5 space-y-4 shadow-sm">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <Flame size={18} className="text-orange-500" />
                                            <h2 className="font-black text-foreground">Weekly Streak</h2>
                                        </div>
                                        {(freeStatus?.currentStreak ?? 0) > 0 && (
                                            <span className="flex items-center gap-1 bg-orange-500/10 text-orange-500 border border-orange-500/20 text-xs font-bold px-2.5 py-1 rounded-full">
                                                <Flame size={12} /> Day {freeStatus?.currentStreak}
                                            </span>
                                        )}
                                    </div>

                                    {/* 7-Day Grid */}
                                    <div className="grid grid-cols-7 gap-1.5">
                                        {(freeStatus?.schedule || Array.from({length:7},(_,i)=>({day:i+1,coins:(i===0?1:i<3?2:i<5?4:5),status:"upcoming"as const}))).map((d) => (
                                            <div key={d.day} className={`flex flex-col items-center p-2 rounded-xl border transition-all ${
                                                d.status === "claimed" ? "bg-green-500/10 border-green-500/30" :
                                                d.status === "current" ? "bg-purple-500/15 border-purple-500/50 shadow-[0_0_12px_rgba(168,85,247,0.3)] scale-105" :
                                                d.status === "locked"  ? "bg-yellow-500/10 border-yellow-500/30" :
                                                "bg-muted/30 border-border/50 opacity-60"
                                            }`}>
                                                <span className="text-base leading-none mb-1">{DAY_ICONS[d.day]}</span>
                                                <span className={`text-[10px] font-black ${d.status==="claimed"?"text-green-500":d.status==="current"?"text-purple-400":d.status==="locked"?"text-yellow-500":"text-muted-foreground"}`}>
                                                    {d.status === "claimed" ? "✓" : `+${d.coins}`}
                                                </span>
                                                <span className="text-[9px] text-muted-foreground font-medium mt-0.5">D{d.day}</span>
                                            </div>
                                        ))}
                                    </div>

                                    {/* Claim / Countdown */}
                                    {freeStatus?.canClaim ? (
                                        <button onClick={handleClaim} disabled={claiming}
                                            className="w-full py-4 rounded-2xl bg-gradient-to-r from-yellow-500 via-orange-500 to-yellow-500 text-black font-black text-lg uppercase tracking-wider shadow-lg hover:brightness-110 active:scale-95 transition-all disabled:opacity-50">
                                            {claiming ? <span className="flex items-center justify-center gap-2"><Loader2 size={20} className="animate-spin"/>Claiming...</span>
                                                : `🎉 Claim +${freeStatus.nextCoins} Coins — Day ${freeStatus.nextDay}`}
                                        </button>
                                    ) : (
                                        <div className="bg-muted/30 border border-border rounded-2xl p-4 flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-xl bg-yellow-500/20 flex items-center justify-center shrink-0"><Clock size={18} className="text-yellow-500" /></div>
                                            <div>
                                                <p className="text-sm font-bold text-yellow-500">Next Claim In</p>
                                                <p className="text-2xl font-black font-mono tracking-widest text-foreground">{freeCountdown || "Loading..."}</p>
                                            </div>
                                        </div>
                                    )}

                                    <p className="text-xs text-center text-muted-foreground">
                                        ⚠️ Miss a day and your streak resets from Day 1!
                                    </p>
                                </div>

                                {/* Rules Card */}
                                <div className="bg-gradient-to-br from-purple-500/5 to-fuchsia-500/5 border border-purple-500/20 rounded-2xl p-4 space-y-2">
                                    <h3 className="text-sm font-bold text-foreground flex items-center gap-2"><Star size={14} className="text-yellow-500"/>How it Works</h3>
                                    <ul className="space-y-1.5 text-xs text-muted-foreground">
                                        {[
                                            "Claim free coins every 24 hours",
                                            "Complete all 7 days for maximum rewards",
                                            "Miss a day? Streak resets from Day 1",
                                            "After Week 7, the cycle repeats!",
                                        ].map((r,i) => (
                                            <li key={i} className="flex items-center gap-2"><ChevronRight size={12} className="text-purple-400 shrink-0"/>{r}</li>
                                        ))}
                                    </ul>
                                </div>
                            </div>
                        )}

                        {/* ═══════════ SPIN TAB ═══════════ */}
                        {activeTab === "spin" && (
                            <div className="space-y-5">
                                {/* Eligibility */}
                                {!spinStatus?.hasEnoughCoins ? (
                                    <div className="bg-red-500/10 border border-red-500/20 rounded-2xl p-4 flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-xl bg-red-500/20 flex items-center justify-center shrink-0"><Lock size={18} className="text-red-500"/></div>
                                        <div>
                                            <p className="text-sm font-bold text-red-500">Locked — Need {spinStatus?.minCoinsRequired?.toLocaleString()} Coins</p>
                                            <p className="text-xs text-muted-foreground">Balance: <span className="font-bold text-foreground">{spinStatus?.walletBalance?.toLocaleString()}</span> coins</p>
                                        </div>
                                    </div>
                                ) : !spinStatus?.canSpin && spinCountdown ? (
                                    <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-2xl p-4 flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-xl bg-yellow-500/20 flex items-center justify-center shrink-0"><Clock size={18} className="text-yellow-500"/></div>
                                        <div><p className="text-sm font-bold text-yellow-500">Next Spin In</p><p className="text-2xl font-black font-mono tracking-widest text-foreground">{spinCountdown}</p></div>
                                    </div>
                                ) : (
                                    <div className="bg-green-500/10 border border-green-500/20 rounded-2xl p-4 flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-xl bg-green-500/20 flex items-center justify-center text-xl shrink-0">✅</div>
                                        <div><p className="text-sm font-bold text-green-500">Ready to Spin!</p><p className="text-xs text-muted-foreground">Hold {spinStatus?.minCoinsRequired?.toLocaleString()} coins to spin daily.</p></div>
                                    </div>
                                )}

                                {/* Wheel */}
                                {spinItems.length > 0 ? (
                                    <div className="flex flex-col items-center gap-5">
                                        <div className="relative w-[280px] h-[280px] select-none">
                                            {/* Pointer */}
                                            <div className="absolute -top-[8%] left-1/2 -translate-x-1/2 z-30 flex flex-col items-center filter drop-shadow-[0_4px_8px_rgba(0,0,0,0.6)]">
                                                <div className="w-3 h-3 rounded-full bg-white border-2 border-yellow-500 z-10 -mb-1 ring-1 ring-purple-800/50"/>
                                                <div className="w-11 h-14 bg-gradient-to-b from-[#FFD700] via-[#FDB931] to-[#C99618] shadow-xl" style={{clipPath:"polygon(15% 0%,85% 0%,50% 100%)"}}/>
                                            </div>
                                            {/* Outer Ring */}
                                            <div className="absolute -inset-[5%] rounded-full bg-gradient-to-b from-purple-600 to-purple-900 shadow-[0_10px_40px_rgba(0,0,0,0.7)] border-[6px] border-yellow-500 z-0">
                                                {Array.from({length:12}).map((_,i)=>{
                                                    const a=(i*30*Math.PI)/180, r=48;
                                                    return <div key={i} className="absolute w-2 h-2 bg-white rounded-full shadow-[0_0_6px_rgba(255,255,255,0.9)]" style={{left:`${50+r*Math.cos(a)}%`,top:`${50+r*Math.sin(a)}%`,transform:"translate(-50%,-50%)"}}/>;
                                                })}
                                            </div>
                                            {/* Rotating Wheel */}
                                            <div className="w-full h-full rounded-full overflow-hidden relative z-10 border-[6px] border-yellow-500 shadow-[inset_0_0_25px_rgba(0,0,0,0.6)] bg-[#2c3e50]"
                                                style={{transform:`rotate(${rotation}deg)`,transition:spinning?"transform 5s cubic-bezier(0.15,0,0,1)":"none"}}>
                                                {spinItems.map((item,idx)=>{
                                                    const seg=360/spinItems.length, rot=idx*seg, skew=90-seg;
                                                    return <div key={item._id} className="absolute top-0 right-0 w-1/2 h-1/2 origin-bottom-left"
                                                        style={{backgroundColor:idx%2===0?PURPLE:GOLD,transform:`rotate(${rot}deg) skewY(-${skew}deg)`,borderLeft:"2px solid rgba(255,255,255,0.1)"}}/>;
                                                })}
                                                <div className="absolute inset-0 rounded-full pointer-events-none">
                                                    {spinItems.map((item,idx)=>{
                                                        const seg=360/spinItems.length, mid=idx*seg+seg/2, rad=(mid*Math.PI)/180, r=25;
                                                        return <div key={`t-${item._id}`} className="absolute flex items-center justify-center text-center"
                                                            style={{left:`${50+r*Math.cos(rad)}%`,top:`${50+r*Math.sin(rad)}%`,width:"40%",transform:`translate(-50%,-50%) rotate(${mid}deg)`}}>
                                                            <span className="text-white font-black uppercase drop-shadow-[0_2px_3px_rgba(0,0,0,0.9)] whitespace-nowrap" style={{fontSize:"clamp(9px,2.5vw,13px)",lineHeight:"1"}}>{item.label}</span>
                                                        </div>;
                                                    })}
                                                </div>
                                            </div>
                                            {/* Center Cap */}
                                            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-20">
                                                <div className="w-14 h-14 rounded-full bg-gradient-to-br from-[#FDB931] to-[#C99618] border-4 border-[#8a6e15] shadow-2xl flex items-center justify-center">
                                                    <div className="w-7 h-7 rounded-full bg-gradient-to-tl from-[#e0b745] to-[#fff5c3]"/>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="text-center text-xs text-muted-foreground">
                                            Hold <span className="text-yellow-500 font-bold">1,000+ coins</span> · 1 spin per 24 hours
                                        </div>

                                        <button onClick={handleSpin} disabled={spinning||!spinStatus?.canSpin||!spinStatus?.hasEnoughCoins}
                                            className={`w-full py-4 rounded-2xl font-black text-xl tracking-wider uppercase transition-all active:scale-95 shadow-xl ${
                                                spinning?"bg-muted text-muted-foreground cursor-wait":
                                                spinStatus?.canSpin&&spinStatus?.hasEnoughCoins?"bg-gradient-to-r from-purple-600 via-fuchsia-600 to-purple-600 text-white hover:brightness-110 border border-purple-400/30 animate-pulse":
                                                "bg-muted/50 text-muted-foreground cursor-not-allowed opacity-50"}`}>
                                            {spinning?<span className="flex items-center justify-center gap-2"><Loader2 className="animate-spin" size={22}/> Spinning...</span>:
                                             !spinStatus?.hasEnoughCoins?"🔒 Need 1K Coins":
                                             !spinStatus?.canSpin?`⏰ ${spinCountdown||"Come Back"}`:
                                             "🎰 Spin Now!"}
                                        </button>
                                    </div>
                                ) : (
                                    <div className="text-center py-10 text-muted-foreground text-sm bg-card border border-dashed border-border rounded-2xl">
                                        <p className="text-3xl mb-3">🎰</p>
                                        <p className="font-medium">Spin wheel is being configured.</p>
                                        <p className="text-xs mt-1 opacity-60">Check back soon!</p>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* ═══════════ HISTORY TAB ═══════════ */}
                        {activeTab === "history" && (
                            <div className="space-y-3">
                                {histLoading ? (
                                    <div className="flex flex-col items-center py-12 gap-3">
                                        <Loader2 className="animate-spin text-primary" size={28}/>
                                        <p className="text-muted-foreground text-sm">Loading history...</p>
                                    </div>
                                ) : history.length === 0 ? (
                                    <div className="text-center py-14 space-y-3 bg-card border border-dashed border-border rounded-2xl">
                                        <div className="w-14 h-14 rounded-full bg-muted/30 flex items-center justify-center mx-auto text-2xl">📋</div>
                                        <p className="font-bold text-foreground">No history yet</p>
                                        <p className="text-sm text-muted-foreground">Start claiming daily rewards!</p>
                                    </div>
                                ) : (
                                    history.map(item => (
                                        <div key={item._id} className="bg-card border border-border rounded-2xl p-4 flex items-center gap-4">
                                            <div className={`w-11 h-11 rounded-xl flex items-center justify-center text-xl shrink-0 ${item.type==="daily_free_coins"?"bg-yellow-500/10":"bg-purple-500/10"}`}>
                                                {item.type==="daily_free_coins"?"🪙":"🎰"}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-bold text-foreground truncate">{item.description}</p>
                                                <p className="text-xs text-muted-foreground">{new Date(item.createdAt).toLocaleDateString(undefined,{month:"short",day:"numeric",hour:"2-digit",minute:"2-digit"})}</p>
                                            </div>
                                            <div className="text-right shrink-0">
                                                <p className={`font-black text-base ${item.amount>0?"text-yellow-500":"text-muted-foreground"}`}>
                                                    {item.amount>0?`+${item.amount}`:"—"}
                                                </p>
                                                <p className="text-[10px] text-muted-foreground">coins</p>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        )}
                    </>
                )}
            </div>

            {/* Toast Alert */}
            <AnimatePresence>
                {spinAlert && (
                    <motion.div initial={{opacity:0,y:20}} animate={{opacity:1,y:0}} exit={{opacity:0,y:20}}
                        className="fixed bottom-28 left-1/2 -translate-x-1/2 z-[80] bg-red-600/95 text-white px-6 py-3 rounded-full shadow-xl border border-red-400/50 flex items-center gap-2 font-bold text-sm whitespace-nowrap">
                        ⚠️ {spinAlert}
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Claim Celebration */}
            <AnimatePresence>
                {claimResult && (
                    <div className="fixed inset-0 z-[80] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
                        <motion.div initial={{scale:0.5,opacity:0}} animate={{scale:1,opacity:1}} exit={{scale:0.5,opacity:0}}
                            className="bg-card border border-yellow-500/30 rounded-[2rem] p-8 text-center max-w-sm w-full shadow-2xl relative overflow-hidden">
                            <div className="absolute inset-0 bg-gradient-to-br from-yellow-500/10 to-orange-500/5 pointer-events-none"/>
                            <div className="text-6xl mb-4 animate-bounce">🎉</div>
                            <h2 className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-b from-yellow-300 to-yellow-600 uppercase mb-1">Day {claimResult.dayCompleted}!</h2>
                            <p className="text-4xl font-black text-yellow-500 mb-1">+{claimResult.coinsAwarded}</p>
                            <p className="text-sm text-muted-foreground mb-6">coins added to your wallet</p>
                            <button onClick={() => setClaimResult(null)} className="w-full py-3.5 bg-gradient-to-r from-yellow-500 to-orange-500 text-black font-black rounded-xl text-lg uppercase tracking-wider hover:scale-105 transition-transform">
                                Awesome! 🚀
                            </button>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Spin Win Modal */}
            <AnimatePresence>
                {winItem && (
                    <div className="fixed inset-0 z-[80] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md">
                        <motion.div initial={{scale:0.5,opacity:0}} animate={{scale:1,opacity:1}}
                            className="bg-card border border-yellow-500/30 rounded-[2rem] p-8 text-center max-w-sm w-full shadow-2xl relative overflow-hidden">
                            <div className="absolute inset-0 bg-gradient-to-br from-yellow-500/10 to-purple-500/10 pointer-events-none"/>
                            <div className="text-6xl mb-5 animate-bounce">💰</div>
                            <h2 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-b from-yellow-300 to-yellow-600 uppercase italic mb-2">You Won!</h2>
                            <p className="text-4xl font-bold text-yellow-500 mb-1">{winItem.label}</p>
                            <p className="text-sm text-muted-foreground mb-6">added to your wallet</p>
                            <button onClick={() => setWinItem(null)} className="w-full py-3.5 bg-gradient-to-r from-green-500 to-emerald-700 text-white font-black rounded-xl text-lg uppercase tracking-widest hover:scale-105 transition-transform shadow-lg">
                                Collect! 🎉
                            </button>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}
