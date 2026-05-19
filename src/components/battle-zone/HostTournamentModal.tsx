'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Swords, Users, Shield, ArrowRight, Coins, Trophy, Loader2 } from 'lucide-react';
import Image from 'next/image';

interface HostTournamentModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: (tournamentId: string) => void;
}

type FormatOption = '1v1' | '2v2' | '4v4';

export default function HostTournamentModal({ isOpen, onClose, onSuccess }: HostTournamentModalProps) {
    const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
    const [format, setFormat] = useState<FormatOption>('1v1');
    const [entryFee, setEntryFee] = useState<string>('');
    
    // Advanced Rules State
    const [gameMode, setGameMode] = useState<'Clash Squad' | 'Lone Wolf'>('Clash Squad');
    const [mapName, setMapName] = useState('Bermuda');
    const [rounds, setRounds] = useState(7);
    const [limitedAmmo, setLimitedAmmo] = useState(true);
    const [headshotOnly, setHeadshotOnly] = useState(false);
    const [availabilityDuration, setAvailabilityDuration] = useState(60); // minutes

    // Dynamic Logic for Advanced Rules
    useEffect(() => {
        if (gameMode === 'Clash Squad') {
            setMapName('Bermuda');
            setRounds(7);
        } else if (gameMode === 'Lone Wolf') {
            setMapName('Iron Cage');
            setRounds(9);
        }
    }, [gameMode]);

    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const formatDetails = {
        '1v1': { icon: Swords, label: 'Solo', players: 2, desc: '1 vs 1 Showdown (Captains Only)' },
        '2v2': { icon: Users, label: 'Duo', players: 2, desc: 'Bring your friend (Captains Only)' },
        '4v4': { icon: Shield, label: 'Squad', players: 2, desc: 'Full squad battle (Captains Only)' }
    };

    const handleFormatSelect = (selected: FormatOption) => {
        setFormat(selected);
        setStep(2);
    };

    const calculatePrizePool = (fee: number, players: number) => {
        const total = fee * players;
        return Math.floor(total - (total * 0.10)); // 10% platform fee
    };

    const parsedFee = parseInt(entryFee) || 0;
    const prizePool = calculatePrizePool(parsedFee, formatDetails[format].players);

    const handleCreate = async () => {
        if (parsedFee < 10 || parsedFee > 100) return;

        setIsLoading(true);
        setError(null);

        try {
            const res = await fetch('/api/battle-zone/create', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    format, 
                    entryFee: parsedFee,
                    gameMode,
                    mapName,
                    advancedRules: {
                        rounds,
                        limitedAmmo,
                        headshotOnly
                    },
                    availabilityDuration
                })
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.error || 'Failed to create match');
            }

            if (data.success) {
                // Return the ID to the caller which will handle redirection
                onSuccess(data.data._id);
            }
        } catch (err: any) {
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm">
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-card w-full max-w-md rounded-2xl shadow-2xl border border-border overflow-hidden flex flex-col"
            >
                {/* Header */}
                <div className="p-4 border-b border-border flex items-center justify-between bg-muted/30">
                    <h2 className="text-lg font-bold flex items-center gap-2">
                        <Swords className="w-5 h-5 text-primary" />
                        Host Tournament
                    </h2>
                    <div className="flex gap-1">
                        {[1, 2, 3, 4].map((i) => (
                            <div
                                key={i}
                                className={`h-1.5 w-6 rounded-full transition-colors ${step >= i ? 'bg-primary' : 'bg-muted'}`}
                            />
                        ))}
                    </div>
                </div>

                <div className="p-6 relative min-h-[300px]">
                    <AnimatePresence mode="wait">
                        {/* STEP 1: SELECT FORMAT */}
                        {step === 1 && (
                            <motion.div
                                key="step1"
                                initial={{ x: 20, opacity: 0 }}
                                animate={{ x: 0, opacity: 1 }}
                                exit={{ x: -20, opacity: 0 }}
                                className="space-y-4"
                            >
                                <div className="text-center mb-6">
                                    <h3 className="text-xl font-bold">Select Match Format</h3>
                                    <p className="text-sm text-muted-foreground mt-1">Choose how many players will battle.</p>
                                </div>

                                <div className="grid gap-3">
                                    {(Object.keys(formatDetails) as FormatOption[]).map((f) => {
                                        const details = formatDetails[f];
                                        const Icon = details.icon;
                                        return (
                                            <button
                                                key={f}
                                                onClick={() => handleFormatSelect(f)}
                                                className="flex items-center justify-between p-4 rounded-xl border border-border bg-card hover:bg-muted/50 hover:border-primary/50 transition-all group"
                                            >
                                                <div className="flex items-center gap-4">
                                                    <div className="p-3 bg-primary/10 text-primary rounded-lg group-hover:scale-110 transition-transform">
                                                        <Icon className="w-6 h-6" />
                                                    </div>
                                                    <div className="text-left">
                                                        <div className="font-bold text-lg">{f} {details.label}</div>
                                                        <div className="text-xs text-muted-foreground">{details.desc}</div>
                                                    </div>
                                                </div>
                                                <ArrowRight className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors group-hover:translate-x-1" />
                                            </button>
                                        );
                                    })}
                                </div>
                            </motion.div>
                        )}

                        {/* STEP 2: SET ENTRY FEE */}
                        {step === 2 && (
                            <motion.div
                                key="step2"
                                initial={{ x: 20, opacity: 0 }}
                                animate={{ x: 0, opacity: 1 }}
                                exit={{ x: -20, opacity: 0 }}
                                className="space-y-6"
                            >
                                <div className="text-center mb-6">
                                    <h3 className="text-xl font-bold">Set Entry Fee</h3>
                                    <p className="text-sm text-muted-foreground mt-1">How many coins to enter?</p>
                                </div>

                                <div className="space-y-4">
                                    <div className="relative">
                                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                            <Coins className="w-6 h-6 text-primary" />
                                        </div>
                                        <input
                                            type="number"
                                            value={entryFee}
                                            onChange={(e) => setEntryFee(e.target.value)}
                                            placeholder="10 - 100"
                                            min="10"
                                            max="100"
                                            className={`w-full pl-12 pr-4 py-4 bg-muted/30 border-2 rounded-xl text-3xl font-black focus:outline-none transition-colors text-center ${
                                                parsedFee > 0 && (parsedFee < 10 || parsedFee > 100) 
                                                ? 'border-red-500 focus:border-red-500' 
                                                : 'border-border focus:border-primary'
                                            }`}
                                            autoFocus
                                        />
                                        {parsedFee > 0 && (parsedFee < 10 || parsedFee > 100) && (
                                            <p className="text-red-500 text-xs font-bold mt-2 animate-pulse text-center">
                                                ⚠️ Entry fee must be between 10 and 100 coins.
                                            </p>
                                        )}
                                    </div>

                                    {/* Quick Select Chips */}
                                    <div className="flex flex-wrap justify-center gap-2">
                                        {[10, 20, 30, 50, 100].map((amount) => (
                                            <button
                                                key={amount}
                                                type="button"
                                                onClick={() => setEntryFee(amount.toString())}
                                                className={`px-3 py-1.5 rounded-lg border text-xs font-bold transition-all ${
                                                    parsedFee === amount 
                                                    ? 'bg-primary border-primary text-primary-foreground shadow-[0_0_10px_rgba(var(--primary),0.3)]' 
                                                    : 'bg-muted/50 border-border text-muted-foreground hover:border-primary/50 hover:text-foreground'
                                                }`}
                                            >
                                                {amount}
                                            </button>
                                        ))}
                                    </div>

                                    <AnimatePresence>
                                        {parsedFee > 0 && (
                                            <motion.div
                                                initial={{ opacity: 0, scale: 0.95 }}
                                                animate={{ opacity: 1, scale: 1 }}
                                                className="bg-primary/10 border border-primary/30 rounded-xl px-4 py-3 text-center"
                                            >
                                                <div className="flex items-center justify-center gap-2 text-primary font-black text-sm uppercase tracking-tight">
                                                    <Trophy className="w-4 h-4" />
                                                    Prize Pool: {prizePool} Coins
                                                </div>
                                                <div className="text-[10px] text-muted-foreground mt-0.5 opacity-80">
                                                    Pot: {parsedFee * 2} | Fee: 10%
                                                </div>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </div>

                                <div className="flex gap-3 pt-4">
                                    <button
                                        onClick={() => setStep(1)}
                                        className="px-6 py-3 rounded-xl border border-border font-medium hover:bg-muted transition-colors"
                                    >
                                        Back
                                    </button>
                                    <button
                                        onClick={() => setStep(3)}
                                        disabled={parsedFee < 10 || parsedFee > 100 || isNaN(parsedFee)}
                                        className="flex-1 px-6 py-3 rounded-xl bg-primary text-primary-foreground font-bold hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                    >
                                        Next
                                        <ArrowRight className="w-4 h-4" />
                                    </button>
                                </div>
                            </motion.div>
                        )}

                        {/* STEP 3: ADVANCED RULES */}
                        {step === 3 && (
                            <motion.div
                                key="step3"
                                initial={{ x: 20, opacity: 0 }}
                                animate={{ x: 0, opacity: 1 }}
                                exit={{ x: -20, opacity: 0 }}
                                className="space-y-5"
                            >
                                <div className="text-center mb-2">
                                    <h3 className="text-xl font-bold">Advanced Rules</h3>
                                    <p className="text-xs text-muted-foreground mt-1">Configure Free Fire room settings.</p>
                                </div>

                                {/* Game Mode Dropdown */}
                                <div>
                                    <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-1.5 block">Game Mode</label>
                                    <div className="relative group">
                                        <select 
                                            value={gameMode}
                                            onChange={(e) => setGameMode(e.target.value as any)}
                                            className="w-full bg-muted/40 border border-border rounded-xl px-4 py-3 appearance-none focus:outline-none focus:ring-2 focus:ring-primary/50 font-bold transition-all"
                                        >
                                            <option value="Clash Squad">Clash Squad</option>
                                            <option value="Lone Wolf">Lone Wolf</option>
                                        </select>
                                        <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-primary">
                                            <ArrowRight className="w-4 h-4 rotate-90" />
                                        </div>
                                    </div>
                                </div>

                                {/* Map Selector */}
                                <div>
                                    <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-1.5 block">Map Selection</label>
                                    <div className="flex gap-3 overflow-x-auto pb-2 -mx-1 px-1 scrollbar-hide no-scrollbar">
                                        {[
                                            { name: 'Bermuda', img: '/assets/maps/bermuda.png', modes: ['Clash Squad'] },
                                            { name: 'Purgatory', img: '/assets/maps/purgatory.png', modes: ['Clash Squad'] },
                                            { name: 'Kalahari', img: '/assets/maps/kalahari.png', modes: ['Clash Squad'] },
                                            { name: 'Nexterra', img: '/assets/maps/nexterra.png', modes: ['Clash Squad'] },
                                            { name: 'Alpine', img: '/assets/maps/alpine.png', modes: ['Clash Squad'] },
                                            { name: 'Iron Cage', img: '/assets/maps/iron_cage.png', modes: ['Lone Wolf'] }
                                        ].filter(m => m.modes.includes(gameMode)).map((map) => (
                                            <button
                                                key={map.name}
                                                onClick={() => setMapName(map.name)}
                                                className={`relative min-w-[120px] aspect-[4/3] rounded-xl overflow-hidden border-2 transition-all flex-shrink-0 group ${
                                                    mapName === map.name ? 'border-primary shadow-[0_0_15px_rgba(var(--primary),0.4)]' : 'border-transparent opacity-60 hover:opacity-100'
                                                }`}
                                            >
                                                <Image src={map.img} alt={map.name} fill sizes="120px" className="object-cover group-hover:scale-110 transition-transform duration-500" />
                                                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent p-2 text-center">
                                                    <span className={`text-[10px] font-black uppercase ${mapName === map.name ? 'text-primary' : 'text-white'}`}>
                                                        {map.name}
                                                    </span>
                                                </div>
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Game Settings Grid */}
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-1.5">
                                        <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest block">Rounds</label>
                                        {gameMode === 'Clash Squad' ? (
                                            <select 
                                                value={rounds}
                                                onChange={(e) => setRounds(parseInt(e.target.value))}
                                                className="w-full bg-muted/40 border border-border rounded-lg px-3 py-2 text-sm font-bold focus:outline-none focus:ring-1 focus:ring-primary/30"
                                            >
                                                <option value={7}>7 Rounds</option>
                                                <option value={11}>11 Rounds</option>
                                                <option value={13}>13 Rounds</option>
                                            </select>
                                        ) : (
                                            <div className="w-full bg-muted/20 border border-border/50 rounded-lg px-3 py-2 text-sm font-black text-primary uppercase">
                                                9 Rounds
                                            </div>
                                        )}
                                    </div>

                                    <div className="space-y-1.5">
                                        <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest block">Limited Ammo</label>
                                        <div className="flex bg-muted/40 rounded-lg p-0.5 border border-border">
                                            {[true, false].map((val) => (
                                                <button
                                                    key={val ? 'yes' : 'no'}
                                                    onClick={() => setLimitedAmmo(val)}
                                                    className={`flex-1 py-1.5 text-xs font-black uppercase rounded-md transition-all ${
                                                        limitedAmmo === val ? 'bg-primary text-primary-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
                                                    }`}
                                                >
                                                    {val ? 'Yes' : 'No'}
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    <div className="col-span-2 space-y-1.5">
                                        <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest block">Headshot Only</label>
                                        <div className="flex bg-muted/40 rounded-lg p-0.5 border border-border items-center justify-between px-3 h-10">
                                            <span className="text-xs font-bold text-muted-foreground uppercase">Body Shot Blocked</span>
                                            <button 
                                                onClick={() => setHeadshotOnly(!headshotOnly)}
                                                className={`w-12 h-6 rounded-full relative transition-colors ${headshotOnly ? 'bg-primary' : 'bg-muted-foreground/30'}`}
                                            >
                                                <motion.div 
                                                    animate={{ x: headshotOnly ? 24 : 2 }}
                                                    className="absolute top-1 left-1 w-4 h-4 bg-white rounded-full shadow-md"
                                                />
                                            </button>
                                        </div>
                                    </div>

                                    {/* Availability Duration */}
                                    <div className="col-span-2 space-y-1.5 mt-2">
                                        <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest block">Availability Duration</label>
                                        <div className="relative group">
                                            <select 
                                                value={availabilityDuration}
                                                onChange={(e) => setAvailabilityDuration(parseInt(e.target.value))}
                                                className="w-full bg-muted/40 border border-border rounded-xl px-4 py-3 appearance-none focus:outline-none focus:ring-2 focus:ring-primary/50 font-bold transition-all"
                                            >
                                                <option value={15}>15 Minutes</option>
                                                <option value={30}>30 Minutes</option>
                                                <option value={60}>1 Hour</option>
                                                <option value={90}>1.5 Hours</option>
                                                <option value={120}>2 Hours</option>
                                                <option value={180}>3 Hours</option>
                                                <option value={300}>5 Hours</option>
                                            </select>
                                            <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-primary">
                                                <ArrowRight className="w-4 h-4 rotate-90" />
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex gap-3 pt-2">
                                    <button
                                        onClick={() => setStep(2)}
                                        className="px-6 py-3 rounded-xl border border-border font-medium hover:bg-muted transition-colors"
                                    >
                                        Back
                                    </button>
                                    <button
                                        onClick={() => setStep(4)}
                                        className="flex-1 px-6 py-3 rounded-xl bg-primary text-primary-foreground font-bold hover:bg-primary/90 transition-colors flex items-center justify-center gap-2"
                                    >
                                        Next
                                        <ArrowRight className="w-4 h-4" />
                                    </button>
                                </div>
                            </motion.div>
                        )}

                        {/* STEP 4: CONFIRMATION */}
                        {step === 4 && (
                            <motion.div
                                key="step4"
                                initial={{ x: 20, opacity: 0 }}
                                animate={{ x: 0, opacity: 1 }}
                                exit={{ x: -20, opacity: 0 }}
                                className="space-y-6 text-center"
                            >
                                <div className="mb-2">
                                    <div className="w-20 h-20 bg-primary/20 rounded-full flex items-center justify-center mx-auto mb-4 relative">
                                        <Swords className="w-10 h-10 text-primary" />
                                        <div className="absolute -bottom-2 -right-2 bg-background rounded-full p-1">
                                            <Trophy className="w-6 h-6 text-yellow-500" />
                                        </div>
                                    </div>
                                    <h3 className="text-2xl font-black">Ready to Host!</h3>
                                    <p className="text-sm text-muted-foreground mt-1">Review your match details</p>
                                </div>

                                <div className="bg-muted/30 border border-border rounded-xl p-4 space-y-3">
                                    <div className="flex justify-between items-center pb-2 border-b border-border/50">
                                        <span className="text-[10px] uppercase font-bold text-muted-foreground">Match Setup</span>
                                        <span className="text-[10px] uppercase font-bold text-primary">{gameMode} | {mapName}</span>
                                    </div>
                                    <div className="grid grid-cols-2 gap-x-6 gap-y-2 pb-3 border-b border-border/50">
                                        <div className="flex justify-between items-center">
                                            <span className="text-xs text-muted-foreground">Format</span>
                                            <span className="text-xs font-bold">{format}</span>
                                        </div>
                                        <div className="flex justify-between items-center">
                                            <span className="text-xs text-muted-foreground">Entry</span>
                                            <span className="text-xs font-bold text-primary">{parsedFee}</span>
                                        </div>
                                        <div className="flex justify-between items-center">
                                            <span className="text-xs text-muted-foreground">Rounds</span>
                                            <span className="text-xs font-bold">{rounds}</span>
                                        </div>
                                        <div className="flex justify-between items-center">
                                            <span className="text-xs text-muted-foreground">Ammo</span>
                                            <span className="text-xs font-bold">{limitedAmmo ? 'Limited' : 'Unlimited'}</span>
                                        </div>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span className="text-muted-foreground font-bold">Total Prize Pool</span>
                                        <span className="font-black text-primary flex items-center gap-1 text-lg">
                                            <Trophy className="w-5 h-5" /> {prizePool}
                                        </span>
                                    </div>
                                </div>

                                {error && (
                                    <div className="p-3 bg-red-500/10 border border-red-500/30 text-red-500 text-sm rounded-lg text-left">
                                        {error}
                                    </div>
                                )}

                                <div className="flex gap-3 pt-2">
                                    <button
                                        onClick={() => setStep(3)}
                                        className="px-4 py-3 rounded-xl border border-border font-medium hover:bg-muted transition-colors disabled:opacity-50"
                                        disabled={isLoading}
                                    >
                                        Back
                                    </button>
                                    <button
                                        onClick={handleCreate}
                                        disabled={isLoading}
                                        className="flex-1 px-6 py-3 rounded-xl bg-primary text-primary-foreground font-bold hover:bg-primary/90 transition-all active:scale-95 disabled:opacity-70 disabled:active:scale-100 flex items-center justify-center gap-2 shadow-lg shadow-primary/20"
                                    >
                                        {isLoading ? (
                                            <>
                                                <Loader2 className="w-5 h-5 animate-spin" />
                                                Creating...
                                            </>
                                        ) : (
                                            <>
                                                Create Tournament
                                                <div className="text-xs bg-black/20 px-2 py-0.5 rounded-md ml-1 -my-1 border border-white/10">
                                                    -{parsedFee} Coins
                                                </div>
                                            </>
                                        )}
                                    </button>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                {/* Close button for all steps */}
                {!isLoading && (
                    <button
                        onClick={onClose}
                        className="absolute top-4 right-4 text-muted-foreground hover:text-foreground p-1 transition-colors"
                    >
                        ✕
                    </button>
                )}
            </motion.div>
        </div>
    );
}
