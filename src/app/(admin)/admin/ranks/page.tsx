'use client';

import React, { useState, useEffect } from 'react';
import {
    Trophy, Save, Info, CheckCircle, AlertTriangle, Loader2, Calendar, Clock, Award, RotateCcw, Users, Search, Target, Shield, Flame, History, DollarSign, Coins, TrendingUp, AlertCircle
} from 'lucide-react';
import { RANK_THRESHOLDS, formatRankName, RankInfo } from '@/lib/ranks';

export default function AdminRanksPage() {
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [savingSeason, setSavingSeason] = useState(false);
    const [savingRules, setSavingRules] = useState(false);
    const [resetting, setResetting] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
    const [searchTerm, setSearchTerm] = useState('');

    // Season & Rewards States
    const [seasonInfo, setSeasonInfo] = useState({
        currentSeasonName: 'Season 1',
        startDate: '',
        endDate: '',
        remainingDays: 0
    });
    
    // Editable Season Configuration States
    const [seasonNameEdit, setSeasonNameEdit] = useState('');
    const [seasonStartEdit, setSeasonStartEdit] = useState('');
    const [seasonEndEdit, setSeasonEndEdit] = useState('');

    const [rulesMap, setRulesMap] = useState({
        tournamentParticipationPoints: 10,
        tournamentFirstPlacePoints: 15,
        tournamentPerKillBasePoints: 5,
        tournamentPerKillMultiplier: 2,
        bzDailyPointsCap: 50,
        bzOpponentLimitPerDay: 2,
        bzHostPoints: 5,
        bzWinnerPoints: 5,
        bzHostWinnerPoints: 10
    });

    const [rewardsMap, setRewardsMap] = useState<Record<string, number>>({});
    const [showResetModal, setShowResetModal] = useState(false);
    const [confirmResetText, setConfirmResetText] = useState('');

    const [stats, setStats] = useState<{
        activePlayers: number;
        totalClaimsPaid: number;
        unclaimedLiability: number;
        distribution: Record<string, number>;
        seasonHistory: Array<{
            seasonName: string;
            startDate: string;
            endDate: string;
            totalUsers: number;
            totalClaimsPaid: number;
            topPlayer: { name: string, points: number, rank: string }
        }>;
    } | null>(null);

    const [previewLoading, setPreviewLoading] = useState(false);
    const [previewData, setPreviewData] = useState<{
        totalAffected: number;
        drops: { platinum: number, gold: number, silver: number, bronze: number };
        rewardsToLock: number;
    } | null>(null);

    useEffect(() => {
        if (showResetModal) {
            fetchPreview();
        }
    }, [showResetModal]);

    const fetchPreview = async () => {
        setPreviewLoading(true);
        try {
            const res = await fetch('/api/admin/ranks/reset-preview');
            if (res.ok) {
                const data = await res.json();
                if (data.success) {
                    setPreviewData(data.preview);
                }
            }
        } catch (err) {
            console.error("Error loading reset preview:", err);
        } finally {
            setPreviewLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/admin/settings');
            if (res.ok) {
                const data = await res.json();
                
                // Parse season info
                const s = data.rankSeason || {};
                const start = s.startDate ? new Date(s.startDate) : new Date();
                const end = s.endDate ? new Date(s.endDate) : new Date();
                const today = new Date();
                const diffTime = end.getTime() - today.getTime();
                const remaining = Math.max(0, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));

                setSeasonInfo({
                    currentSeasonName: s.currentSeasonName || 'Season 1',
                    startDate: start.toLocaleDateString(),
                    endDate: end.toLocaleDateString(),
                    remainingDays: remaining
                });

                // Format dates for HTML date input: YYYY-MM-DD
                const yyyy = end.getFullYear();
                const mm = String(end.getMonth() + 1).padStart(2, '0');
                const dd = String(end.getDate()).padStart(2, '0');
                const formattedDate = `${yyyy}-${mm}-${dd}`;

                const startYyyy = start.getFullYear();
                const startMm = String(start.getMonth() + 1).padStart(2, '0');
                const startDd = String(start.getDate()).padStart(2, '0');
                const formattedStartDate = `${startYyyy}-${startMm}-${startDd}`;

                setSeasonNameEdit(s.currentSeasonName || 'Season 1');
                setSeasonEndEdit(formattedDate);
                setSeasonStartEdit(formattedStartDate);

                // Parse custom rewards
                setRewardsMap(data.rankRewards || {});

                // Parse custom rules
                if (data.rankRules) {
                    setRulesMap(prev => ({
                        ...prev,
                        ...data.rankRules
                    }));
                }
            } else {
                showToast('error', 'Failed to fetch system settings');
            }

            // Fetch statistics
            const statsRes = await fetch('/api/admin/ranks/stats');
            if (statsRes.ok) {
                const statsData = await statsRes.json();
                if (statsData.success) {
                    setStats(statsData.stats);
                }
            }
        } catch (error) {
            console.error('Error fetching ranks settings:', error);
            showToast('error', 'Error connecting to server');
        } finally {
            setLoading(false);
        }
    };

    const showToast = (type: 'success' | 'error', text: string) => {
        setMessage({ type, text });
        setTimeout(() => setMessage(null), 4000);
    };

    const handleRewardChange = (key: string, value: string) => {
        const numericVal = parseInt(value) || 0;
        setRewardsMap(prev => ({
            ...prev,
            [key]: numericVal
        }));
    };

    const handleSaveRewards = async () => {
        setSaving(true);
        try {
            const res = await fetch('/api/admin/settings', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ rankRewards: rewardsMap }),
            });

            if (!res.ok) throw new Error('Failed to update');
            showToast('success', 'Rank rewards updated successfully');
        } catch (error) {
            console.error(error);
            showToast('error', 'Failed to save rewards');
        } finally {
            setSaving(false);
        }
    };

    const handleSaveSeasonConfig = async () => {
        setSavingSeason(true);
        try {
            const startDateObj = new Date(seasonStartEdit);
            const endDateObj = new Date(seasonEndEdit);
            
            if (startDateObj >= endDateObj) {
                showToast('error', 'Start Date must be earlier than End Date');
                return;
            }
            
            // Calculate dynamic duration in days between start and end date
            const diffTimeTotal = endDateObj.getTime() - startDateObj.getTime();
            const duration = Math.max(1, Math.ceil(diffTimeTotal / (1000 * 60 * 60 * 24)));

            // Calculate remaining days from today to end date
            const today = new Date();
            const diffTimeRemaining = endDateObj.getTime() - today.getTime();
            const remaining = Math.max(0, Math.ceil(diffTimeRemaining / (1000 * 60 * 60 * 24)));

            const res = await fetch('/api/admin/settings', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    rankSeason: {
                        currentSeasonName: seasonNameEdit,
                        startDate: startDateObj,
                        endDate: endDateObj,
                        durationDays: duration
                    }
                }),
            });

            if (!res.ok) throw new Error('Failed to update settings');
            
            showToast('success', 'Season settings updated successfully');

            setSeasonInfo({
                currentSeasonName: seasonNameEdit,
                startDate: startDateObj.toLocaleDateString(),
                endDate: endDateObj.toLocaleDateString(),
                remainingDays: remaining
            });
        } catch (error) {
            console.error(error);
            showToast('error', 'Failed to save season configurations');
        } finally {
            setSavingSeason(false);
        }
    };

    const handleSaveRules = async () => {
        setSavingRules(true);
        try {
            const res = await fetch('/api/admin/settings', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ rankRules: rulesMap }),
            });

            if (!res.ok) throw new Error('Failed to update rules');
            showToast('success', 'Rank rules and caps updated successfully');
        } catch (error) {
            console.error(error);
            showToast('error', 'Failed to save rules configuration');
        } finally {
            setSavingRules(false);
        }
    };

    const handleSeasonReset = async () => {
        if (confirmResetText !== 'RESET') {
            showToast('error', 'Please type RESET to confirm');
            return;
        }

        setResetting(true);
        setShowResetModal(false);
        try {
            const res = await fetch('/api/admin/ranks/reset', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' }
            });

            const data = await res.json();
            if (res.ok && data.success) {
                showToast('success', `Season reset complete! Processed ${data.processedUsers} users. Next season: ${data.newSeason}`);
                setConfirmResetText('');
                fetchData();
            } else {
                showToast('error', data.error || 'Season reset failed');
            }
        } catch (error) {
            console.error(error);
            showToast('error', 'Error during season reset');
        } finally {
            setResetting(false);
        }
    };

    const rewardableRanks = RANK_THRESHOLDS.filter(r => r.rankUpReward);

    const filteredRanks = rewardableRanks.filter(rank => {
        const name = formatRankName(rank).toLowerCase();
        return name.includes(searchTerm.toLowerCase());
    });

    if (loading) {
        return (
            <div className="flex h-screen items-center justify-center text-foreground bg-background">
                <div className="flex flex-col items-center gap-3">
                    <Loader2 className="h-10 w-10 animate-spin text-amber-500" />
                    <span className="text-xs uppercase font-mono tracking-widest text-muted-foreground animate-pulse">Loading Season Control Panel...</span>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#050505] text-foreground p-4 lg:p-8 pb-24 lg:pb-12 relative overflow-hidden font-sans">
            
            {/* Theme Gold/Amber Background Accent Glows */}
            <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-amber-500/[0.03] blur-[130px] pointer-events-none rounded-full -z-10" />
            <div className="absolute bottom-10 right-1/4 w-[600px] h-[600px] bg-yellow-600/[0.03] blur-[130px] pointer-events-none rounded-full -z-10" />
            <div className="absolute top-1/3 right-1/3 w-[400px] h-[400px] bg-amber-600/[0.015] blur-[100px] pointer-events-none rounded-full -z-10 animate-pulse" />

            {/* Full-width container setting to remove large black margins */}
            <div className="w-full max-w-[1650px] mx-auto">
                
                {/* Header Section */}
                <header className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/10 pb-6">
                    <div>
                        <div className="flex items-center gap-2 mb-1.5">
                            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black tracking-wider uppercase bg-amber-500/10 text-amber-400 border border-amber-500/20">
                                Live System Dashboard
                            </span>
                            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black tracking-wider uppercase bg-yellow-500/10 text-yellow-400 border border-yellow-500/20">
                                {seasonInfo.currentSeasonName}
                            </span>
                        </div>
                        <h1 className="text-3xl font-black bg-gradient-to-r from-amber-400 via-yellow-500 to-amber-300 bg-clip-text text-transparent uppercase tracking-tight">
                            Ranks & Season Management
                        </h1>
                        <p className="text-xs lg:text-sm text-muted-foreground mt-1 font-medium">
                            Configure dynamic reward payouts, evaluate players distribution, and orchestrate seasonal resets.
                        </p>
                    </div>

                    <div className="flex items-center gap-3 bg-neutral-900 border border-white/10 px-5 py-3 rounded-2xl shadow-lg">
                        <Clock className="text-amber-500 w-5 h-5 animate-pulse" />
                        <div>
                            <span className="text-[9px] uppercase font-bold text-muted-foreground block leading-none mb-0.5">Remaining Time</span>
                            <span className="text-sm font-black text-white font-mono">{seasonInfo.remainingDays} Days Left</span>
                        </div>
                    </div>
                </header>

                {/* Toasts */}
                {message && (
                    <div className={`fixed top-6 right-6 z-50 px-5 py-3 rounded-2xl shadow-[0_10px_30px_rgba(0,0,0,0.5)] flex items-center gap-3 animate-in fade-in-50 slide-in-from-top-6 duration-300 ${
                        message.type === 'success' 
                            ? 'bg-green-500/10 text-green-400 border border-green-500/30 backdrop-blur-xl' 
                            : 'bg-red-500/10 text-red-400 border border-red-500/30 backdrop-blur-xl'
                    }`}>
                        {message.type === 'success' ? (
                            <span className="p-1.5 bg-green-500/20 rounded-lg"><CheckCircle size={16} /></span>
                        ) : (
                            <span className="p-1.5 bg-red-500/20 rounded-lg"><AlertTriangle size={16} /></span>
                        )}
                        <span className="text-xs font-bold font-mono tracking-wide">{message.text}</span>
                    </div>
                )}

                {/* Top Statistics Grid */}
                {stats && (
                    <div className="space-y-6 mb-8">
                        <div className="grid gap-4 grid-cols-1 md:grid-cols-3">
                            
                            {/* Card 1: Active Players */}
                            <div className="bg-neutral-900/60 border border-white/10 p-5 rounded-2xl relative overflow-hidden shadow-lg flex items-center gap-4 hover:border-amber-500/30 transition-all duration-300 hover:shadow-[0_4px_25px_rgba(245,158,11,0.08)] group">
                                <div className="absolute top-0 right-0 w-24 h-24 bg-amber-500/5 blur-xl pointer-events-none rounded-full transition-all group-hover:scale-125" />
                                <div className="p-3 bg-amber-500/10 text-amber-400 rounded-xl border border-amber-500/20 group-hover:bg-amber-500/20 transition-colors">
                                    <Users size={22} />
                                </div>
                                <div>
                                    <span className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground block mb-0.5">Active Users</span>
                                    <span className="text-2xl font-black bg-gradient-to-r from-white via-white to-amber-200 bg-clip-text text-transparent font-mono">{stats.activePlayers} Players</span>
                                </div>
                            </div>
                            
                            {/* Card 2: Total Claims Paid */}
                            <div className="bg-neutral-900/60 border border-white/10 p-5 rounded-2xl relative overflow-hidden shadow-lg flex items-center gap-4 hover:border-yellow-500/30 transition-all duration-300 hover:shadow-[0_4px_25px_rgba(234,179,8,0.08)] group">
                                <div className="absolute top-0 right-0 w-24 h-24 bg-yellow-500/5 blur-xl pointer-events-none rounded-full transition-all group-hover:scale-125" />
                                <div className="p-3 bg-yellow-500/10 text-yellow-400 rounded-xl border border-yellow-500/20 group-hover:bg-yellow-500/20 transition-colors">
                                    <Coins size={22} />
                                </div>
                                <div>
                                    <span className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground block mb-0.5">Claims Paid This Season</span>
                                    <span className="text-2xl font-black bg-gradient-to-r from-white via-white to-yellow-200 bg-clip-text text-transparent font-mono">{stats.totalClaimsPaid} Coins</span>
                                </div>
                            </div>

                            {/* Card 3: Unclaimed Liabilities */}
                            <div className="bg-neutral-900/60 border border-white/10 p-5 rounded-2xl relative overflow-hidden shadow-lg flex items-center gap-4 hover:border-amber-500/30 transition-all duration-300 hover:shadow-[0_4px_25px_rgba(245,158,11,0.08)] group">
                                <div className="absolute top-0 right-0 w-24 h-24 bg-amber-500/5 blur-xl pointer-events-none rounded-full transition-all group-hover:scale-125" />
                                <div className="p-3 bg-amber-500/10 text-amber-400 rounded-xl border border-amber-500/20 group-hover:bg-amber-500/20 transition-colors">
                                    <DollarSign size={22} />
                                </div>
                                <div>
                                    <span className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground block mb-0.5">Unclaimed Liabilities</span>
                                    <span className="text-2xl font-black bg-gradient-to-r from-white via-white to-amber-100 bg-clip-text text-transparent font-mono">{stats.unclaimedLiability} Coins</span>
                                </div>
                            </div>
                        </div>

                        {/* Player Rank Distribution Visual Segment Bar */}
                        <div className="bg-neutral-900/60 border border-white/10 rounded-2xl p-5 shadow-lg">
                            <div className="flex flex-col md:flex-row justify-between md:items-center gap-2 mb-4">
                                <div className="flex items-center gap-2">
                                    <TrendingUp size={16} className="text-amber-400" />
                                    <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Active Ranks Distribution Bar</h3>
                                </div>
                                <span className="text-[10px] font-mono font-bold text-muted-foreground bg-white/5 border border-white/5 px-2.5 py-1 rounded-md">
                                    Evaluated over {stats.activePlayers} Active Accounts
                                </span>
                            </div>

                            {/* Glossy Progress Bar */}
                            <div className="h-5.5 w-full bg-neutral-950 rounded-full overflow-hidden flex p-1 border border-white/5 shadow-inner">
                                {(() => {
                                    const total = stats.activePlayers || 1;
                                    const colors: Record<string, string> = {
                                        "Bronze": "#CD7F32",
                                        "Silver": "#C0C0C0",
                                        "Gold": "#FFD700",
                                        "Diamond": "#B9F2FF",
                                        "Heroic": "#FF4500",
                                        "Elite Heroic": "#FF0000",
                                        "Master": "#E0115F",
                                        "Elite Master": "#800020",
                                        "Grandmaster": "#DA70D6"
                                    };

                                    return Object.entries(stats.distribution).map(([tier, count]) => {
                                        if (count === 0) return null;
                                        const pct = (count / total) * 100;
                                        return (
                                            <div
                                                key={tier}
                                                style={{ width: `${pct}%`, backgroundColor: colors[tier] || '#fff' }}
                                                title={`${tier}: ${count} players (${pct.toFixed(1)}%)`}
                                                className="h-full rounded-full transition-all relative group cursor-pointer hover:scale-y-110 hover:opacity-90 shadow-sm"
                                            />
                                        );
                                    });
                                })()}
                            </div>

                            {/* Rank Badges Grid */}
                            <div className="flex flex-wrap gap-x-4 gap-y-2.5 mt-4 justify-center text-[10px] text-muted-foreground bg-black/40 p-3.5 border border-white/5 rounded-xl">
                                {Object.entries(stats.distribution).map(([tier, count]) => {
                                    const total = stats.activePlayers || 1;
                                    const pct = (count / total) * 100;
                                    const colors: Record<string, string> = {
                                        "Bronze": "#CD7F32",
                                        "Silver": "#C0C0C0",
                                        "Gold": "#FFD700",
                                        "Diamond": "#B9F2FF",
                                        "Heroic": "#FF4500",
                                        "Elite Heroic": "#FF0000",
                                        "Master": "#E0115F",
                                        "Elite Master": "#800020",
                                        "Grandmaster": "#DA70D6"
                                    };

                                    return (
                                        <div key={tier} className={`flex items-center gap-2 px-3 py-1 rounded-lg border transition-all ${count > 0 ? 'bg-neutral-900 border-white/10 font-bold text-white shadow-sm' : 'border-transparent opacity-30'}`}>
                                            <span className="w-2.5 h-2.5 rounded-full shadow-[0_0_8px]" style={{ backgroundColor: colors[tier], boxShadow: count > 0 ? `0 0 8px ${colors[tier]}` : 'none' }} />
                                            <span className="font-mono">{tier}</span>
                                            {count > 0 && <span className="text-[9px] text-amber-400 bg-amber-500/10 px-1.5 py-0.5 rounded font-normal font-mono">{pct.toFixed(0)}% ({count})</span>}
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                )}

                {/* Main Asymmetric Grid */}
                <div className="grid gap-6 lg:grid-cols-3">
                    
                    {/* Left Column: Coin Rewards Config (Col Span 2) */}
                    <div className="lg:col-span-2 space-y-6">
                        <div className="bg-neutral-900/60 border border-white/10 rounded-2xl p-6 relative overflow-hidden shadow-lg">
                            
                            {/* Background glows inside card */}
                            <div className="absolute top-0 left-0 w-32 h-32 bg-amber-500/5 blur-2xl pointer-events-none rounded-full" />
                            
                            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 border-b border-white/10 pb-4">
                                <div className="flex items-center gap-3">
                                    <div className="p-2.5 bg-amber-500/10 text-amber-400 rounded-xl border border-amber-500/20">
                                        <Award className="w-5.5 h-5.5" />
                                    </div>
                                    <div>
                                        <h2 className="text-xl font-black uppercase tracking-tight text-white">Dynamic Coin Rewards</h2>
                                        <p className="text-[10px] text-muted-foreground font-medium">Define custom coins awarded manually as players level up</p>
                                    </div>
                                </div>
                                <button
                                    onClick={handleSaveRewards}
                                    disabled={saving}
                                    className="flex items-center justify-center gap-2 bg-gradient-to-r from-amber-600 via-yellow-600 to-amber-600 hover:from-amber-500 hover:to-yellow-500 text-white px-5 py-2.5 rounded-xl font-bold shadow-lg shadow-amber-500/10 hover:shadow-amber-500/25 transition-all duration-300 hover:-translate-y-0.5 active:translate-y-0 active:scale-95 disabled:opacity-50 text-xs uppercase tracking-wider cursor-pointer"
                                >
                                    {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
                                    Save Rewards Settings
                                </button>
                            </div>

                            {/* Search and Helper Panel */}
                            <div className="flex flex-col md:flex-row gap-3 items-center justify-between mb-4">
                                <div className="relative w-full md:w-80 bg-black/45 border border-white/10 focus-within:border-amber-500/50 rounded-xl px-3.5 py-2 flex items-center transition-all duration-200 shadow-inner">
                                    <Search size={14} className="text-muted-foreground mr-2 shrink-0" />
                                    <input
                                        type="text"
                                        placeholder="Search rank tier (e.g. Gold)..."
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        className="w-full bg-transparent text-xs outline-none text-white placeholder:text-muted-foreground/35"
                                    />
                                    {searchTerm && (
                                        <button onClick={() => setSearchTerm('')} className="text-[10px] font-bold text-muted-foreground hover:text-white px-1.5 py-0.5 rounded bg-white/10 shrink-0">Clear</button>
                                    )}
                                </div>

                                <div className="w-full md:w-auto text-[10px] text-muted-foreground font-medium leading-normal bg-black/40 border border-white/5 px-4 py-2 rounded-xl flex gap-2 items-start shadow-inner">
                                    <Info size={14} className="text-amber-400 shrink-0 mt-0.5" />
                                    <span>Empty input fields fallback to their standard default hardcoded values. Users claim these rewards manually on their profile.</span>
                                </div>
                            </div>

                            {/* Ranks Scroll Panel */}
                            <div className="space-y-2.5 max-h-[65vh] overflow-y-auto pr-1.5 custom-scrollbar scroll-smooth">
                                {filteredRanks.length > 0 ? (
                                    filteredRanks.map((rank) => {
                                        const key = `${rank.tier}-${rank.division || 0}`;
                                        const customValue = rewardsMap[key];
                                        const defaultValue = rank.rankUpReward?.amount || 0;
                                        const displayValue = customValue !== undefined ? customValue : '';

                                        return (
                                            <div 
                                                key={key} 
                                                style={{ borderLeftColor: rank.color }}
                                                className="flex items-center justify-between p-3.5 bg-neutral-950/40 border-l-4 border-y border-r border-white/[0.04] hover:border-amber-500/25 rounded-r-xl hover:bg-neutral-900/40 transition-all duration-200 group"
                                            >
                                                <div className="flex items-center gap-3">
                                                    <div 
                                                        className="w-3 h-3 rounded-full shadow-[0_0_10px]" 
                                                        style={{ backgroundColor: rank.color, boxShadow: `0 0 10px ${rank.color}` }} 
                                                    />
                                                    <div>
                                                        <span className="font-bold text-sm text-foreground block group-hover:text-white transition-colors">
                                                            {formatRankName(rank)}
                                                        </span>
                                                        <span className="text-[10px] font-mono text-muted-foreground/80 block mt-0.5">
                                                            Min Points Required: <span className="text-white font-bold">{rank.minPoints}</span>
                                                        </span>
                                                    </div>
                                                </div>

                                                <div className="flex items-center gap-4">
                                                    <div className="text-right shrink-0 flex items-center gap-2">
                                                        <Coins size={12} className="text-amber-500/60" />
                                                        <div className="text-right">
                                                            <span className="text-[9px] uppercase font-bold text-muted-foreground/60 block">Default</span>
                                                            <span className="font-bold text-xs text-muted-foreground font-mono">{defaultValue}</span>
                                                        </div>
                                                    </div>

                                                    <div className="w-28 bg-black/50 border border-white/10 focus-within:border-amber-500/50 focus-within:ring-1 focus-within:ring-amber-500/25 transition-all rounded-xl px-2.5 py-1.5 flex items-center">
                                                        <input
                                                            type="number"
                                                            value={displayValue}
                                                            onChange={(e) => handleRewardChange(key, e.target.value)}
                                                            placeholder={defaultValue.toString()}
                                                            className="w-full bg-transparent text-right font-mono font-bold outline-none placeholder:text-muted-foreground/20 text-white text-xs"
                                                        />
                                                        <span className="text-[9px] text-muted-foreground ml-1.5 font-bold uppercase select-none">C</span>
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })
                                ) : (
                                    <div className="flex flex-col items-center justify-center py-12 text-muted-foreground border border-dashed border-white/10 rounded-xl bg-black/40">
                                        <AlertTriangle size={24} className="text-muted-foreground/40 mb-2 animate-bounce" />
                                        <span className="text-xs font-bold font-mono">No matching ranks found</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Right Column: Configuration Forms (Col Span 1) */}
                    <div className="space-y-6">
                        
                        {/* Season Configuration Card */}
                        <div className="bg-neutral-900/60 border border-white/10 rounded-2xl p-6 relative overflow-hidden shadow-lg">
                            <div className="absolute top-0 right-0 w-24 h-24 bg-amber-500/5 blur-2xl pointer-events-none rounded-full" />
                            <div className="flex items-center gap-2 mb-4 border-b border-white/10 pb-3">
                                <Clock className="text-amber-400 w-5 h-5" />
                                <h2 className="text-lg font-black uppercase tracking-tight text-white">Season Settings</h2>
                            </div>

                            <div className="space-y-4">
                                <div className="space-y-1">
                                    <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">Season Title</label>
                                    <input
                                        type="text"
                                        value={seasonNameEdit}
                                        onChange={(e) => setSeasonNameEdit(e.target.value)}
                                        placeholder="e.g. Season 1"
                                        className="w-full bg-black/40 border border-white/10 focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/25 rounded-xl px-4 py-2.5 text-xs text-white font-bold outline-none placeholder:text-muted-foreground/20 transition-all"
                                    />
                                </div>

                                <div className="space-y-1">
                                    <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">Start Date</label>
                                    <div className="relative">
                                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-amber-500/60"><Calendar size={14} /></span>
                                        <input
                                            type="date"
                                            value={seasonStartEdit}
                                            onChange={(e) => setSeasonStartEdit(e.target.value)}
                                            className="w-full bg-black/40 border border-white/10 focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/25 rounded-xl pl-10 pr-4 py-2 text-xs text-white font-mono font-bold outline-none transition-all"
                                        />
                                    </div>
                                </div>

                                <div className="space-y-1">
                                    <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">End Date</label>
                                    <div className="relative">
                                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-amber-500/60"><Calendar size={14} /></span>
                                        <input
                                            type="date"
                                            value={seasonEndEdit}
                                            onChange={(e) => setSeasonEndEdit(e.target.value)}
                                            className="w-full bg-black/40 border border-white/10 focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/25 rounded-xl pl-10 pr-4 py-2 text-xs text-white font-mono font-bold outline-none transition-all"
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-3 pt-2 border-t border-dashed border-white/10">
                                    <div className="p-3 bg-black/40 border border-white/5 rounded-xl text-center">
                                        <div className="text-[9px] uppercase font-bold text-muted-foreground flex items-center gap-1.5 justify-center mb-1">
                                            <Calendar size={11} className="text-amber-400" /> Start
                                        </div>
                                        <div className="text-xs font-black font-mono text-white">{seasonInfo.startDate}</div>
                                    </div>
                                    <div className="p-3 bg-black/40 border border-white/5 rounded-xl text-center">
                                        <div className="text-[9px] uppercase font-bold text-muted-foreground flex items-center gap-1.5 justify-center mb-1">
                                            <Calendar size={11} className="text-amber-400" /> End
                                        </div>
                                        <div className="text-xs font-black font-mono text-white">{seasonInfo.endDate}</div>
                                    </div>
                                </div>

                                <button
                                    onClick={handleSaveSeasonConfig}
                                    disabled={savingSeason}
                                    className="w-full flex items-center justify-center gap-2 mt-2 bg-gradient-to-r from-amber-600 via-yellow-600 to-amber-600 hover:from-amber-500 hover:to-yellow-500 text-white font-bold py-2.5 px-4 rounded-xl transition-all duration-300 shadow-md shadow-amber-500/10 hover:shadow-amber-500/25 text-xs uppercase tracking-wider disabled:opacity-50 cursor-pointer"
                                >
                                    {savingSeason ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
                                    Save Season Config
                                </button>
                            </div>
                        </div>

                        {/* Points & Caps Configuration Card */}
                        <div className="bg-neutral-900/60 border border-white/10 rounded-2xl p-6 relative overflow-hidden shadow-lg">
                            <div className="absolute top-0 left-0 w-24 h-24 bg-yellow-500/5 blur-2xl pointer-events-none rounded-full" />
                            <div className="flex items-center gap-2 mb-4 border-b border-white/10 pb-3">
                                <Trophy className="text-amber-500 w-5 h-5" />
                                <h2 className="text-lg font-black uppercase tracking-tight text-white">Points & Caps Settings</h2>
                            </div>

                            <div className="space-y-4 max-h-[45vh] overflow-y-auto pr-1 custom-scrollbar">
                                <h3 className="text-[10px] font-black text-amber-400 uppercase tracking-widest border-b border-white/10 pb-1 flex items-center gap-1.5">
                                    <Target size={12} /> Tournament Rules
                                </h3>
                                <div className="grid grid-cols-2 gap-3">
                                    <div className="space-y-1">
                                        <label className="text-[9px] font-bold text-muted-foreground uppercase">Participation</label>
                                        <input
                                            type="number"
                                            value={rulesMap.tournamentParticipationPoints}
                                            onChange={(e) => setRulesMap(prev => ({ ...prev, tournamentParticipationPoints: parseInt(e.target.value) || 0 }))}
                                            className="w-full bg-black/40 border border-white/10 focus:border-amber-500/50 rounded-xl px-3 py-2 text-xs text-white font-mono font-bold outline-none transition-all"
                                        />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-[9px] font-bold text-muted-foreground uppercase">Winner (1st)</label>
                                        <input
                                            type="number"
                                            value={rulesMap.tournamentFirstPlacePoints}
                                            onChange={(e) => setRulesMap(prev => ({ ...prev, tournamentFirstPlacePoints: parseInt(e.target.value) || 0 }))}
                                            className="w-full bg-black/40 border border-white/10 focus:border-amber-500/50 rounded-xl px-3 py-2 text-xs text-white font-mono font-bold outline-none transition-all"
                                        />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-[9px] font-bold text-muted-foreground uppercase">Per-Kill Base</label>
                                        <input
                                            type="number"
                                            value={rulesMap.tournamentPerKillBasePoints}
                                            onChange={(e) => setRulesMap(prev => ({ ...prev, tournamentPerKillBasePoints: parseInt(e.target.value) || 0 }))}
                                            className="w-full bg-black/40 border border-white/10 focus:border-amber-500/50 rounded-xl px-3 py-2 text-xs text-white font-mono font-bold outline-none transition-all"
                                        />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-[9px] font-bold text-muted-foreground uppercase">Per-Kill Mult.</label>
                                        <input
                                            type="number"
                                            value={rulesMap.tournamentPerKillMultiplier}
                                            onChange={(e) => setRulesMap(prev => ({ ...prev, tournamentPerKillMultiplier: parseInt(e.target.value) || 0 }))}
                                            className="w-full bg-black/40 border border-white/10 focus:border-amber-500/50 rounded-xl px-3 py-2 text-xs text-white font-mono font-bold outline-none transition-all"
                                        />
                                    </div>
                                </div>

                                <h3 className="text-[10px] font-black text-yellow-500 uppercase tracking-widest border-b border-white/10 pt-3 pb-1 flex items-center gap-1.5">
                                    <Shield size={12} /> Battle Zone Rules
                                </h3>
                                <div className="space-y-3">
                                    <div className="grid grid-cols-2 gap-3">
                                        <div className="space-y-1">
                                            <label className="text-[9px] font-bold text-muted-foreground uppercase">Daily Cap (pts)</label>
                                            <input
                                                type="number"
                                                value={rulesMap.bzDailyPointsCap}
                                                onChange={(e) => setRulesMap(prev => ({ ...prev, bzDailyPointsCap: parseInt(e.target.value) || 0 }))}
                                                className="w-full bg-black/40 border border-white/10 focus:border-amber-500/50 rounded-xl px-3 py-2 text-xs text-white font-mono font-bold outline-none transition-all"
                                            />
                                        </div>
                                        <div className="space-y-1">
                                            <label className="text-[9px] font-bold text-muted-foreground uppercase">Opponent Match Limit</label>
                                            <input
                                                type="number"
                                                value={rulesMap.bzOpponentLimitPerDay}
                                                onChange={(e) => setRulesMap(prev => ({ ...prev, bzOpponentLimitPerDay: parseInt(e.target.value) || 0 }))}
                                                className="w-full bg-black/40 border border-white/10 focus:border-amber-500/50 rounded-xl px-3 py-2 text-xs text-white font-mono font-bold outline-none transition-all"
                                            />
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-3 gap-2">
                                        <div className="space-y-1">
                                            <label className="text-[8px] font-bold text-muted-foreground uppercase">Host pts</label>
                                            <input
                                                type="number"
                                                value={rulesMap.bzHostPoints}
                                                onChange={(e) => setRulesMap(prev => ({ ...prev, bzHostPoints: parseInt(e.target.value) || 0 }))}
                                                className="w-full bg-black/40 border border-white/10 focus:border-amber-500/50 rounded-xl px-2 py-1.5 text-xs text-white font-mono font-bold outline-none transition-all text-center"
                                            />
                                        </div>
                                        <div className="space-y-1">
                                            <label className="text-[8px] font-bold text-muted-foreground uppercase">Winner pts</label>
                                            <input
                                                type="number"
                                                value={rulesMap.bzWinnerPoints}
                                                onChange={(e) => setRulesMap(prev => ({ ...prev, bzWinnerPoints: parseInt(e.target.value) || 0 }))}
                                                className="w-full bg-black/40 border border-white/10 focus:border-amber-500/50 rounded-xl px-2 py-1.5 text-xs text-white font-mono font-bold outline-none transition-all text-center"
                                            />
                                        </div>
                                        <div className="space-y-1">
                                            <label className="text-[8px] font-bold text-muted-foreground uppercase">Host-Win pts</label>
                                            <input
                                                type="number"
                                                value={rulesMap.bzHostWinnerPoints}
                                                onChange={(e) => setRulesMap(prev => ({ ...prev, bzHostWinnerPoints: parseInt(e.target.value) || 0 }))}
                                                className="w-full bg-black/40 border border-white/10 focus:border-amber-500/50 rounded-xl px-2 py-1.5 text-xs text-white font-mono font-bold outline-none transition-all text-center"
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <button
                                onClick={handleSaveRules}
                                disabled={savingRules}
                                className="w-full flex items-center justify-center gap-2 mt-5 bg-gradient-to-r from-amber-600 via-yellow-600 to-amber-600 hover:from-amber-500 hover:to-yellow-500 text-white font-bold py-2.5 px-4 rounded-xl transition-all duration-300 shadow-md shadow-amber-500/10 hover:shadow-amber-500/25 text-xs uppercase tracking-wider disabled:opacity-50 cursor-pointer"
                            >
                                {savingRules ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
                                Save Rules & Caps
                            </button>
                        </div>

                        {/* Caution Danger Zone Reset Card */}
                        <div className="bg-neutral-900/60 border border-red-500/20 rounded-2xl p-6 relative overflow-hidden shadow-md">
                            <div className="absolute top-0 right-0 w-24 h-24 bg-red-500/5 blur-2xl pointer-events-none rounded-full" />
                            <h2 className="text-lg font-black uppercase tracking-tight text-red-500 mb-3 flex items-center gap-2 border-b border-red-500/20 pb-3">
                                <AlertCircle className="w-5 h-5 text-red-500" />
                                Danger Zone
                            </h2>
                            <p className="text-[10px] text-red-400/80 mb-5 font-medium leading-relaxed">
                                Resetting the season archives all user stats, pushes ranks back based on standard drops, expires unclaimed coins, and initiates the next season name automatically.
                            </p>

                            <button
                                onClick={() => setShowResetModal(true)}
                                disabled={resetting}
                                className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-red-700 to-red-600 hover:from-red-600 hover:to-red-500 text-white font-bold py-3 px-4 rounded-xl transition-all duration-200 shadow-lg shadow-red-950/20 text-xs uppercase tracking-wider cursor-pointer"
                            >
                                {resetting ? <Loader2 className="animate-spin" /> : <RotateCcw size={14} />}
                                Reset Season & Drop Ranks
                            </button>
                        </div>
                    </div>
                </div>

                {/* Reset Confirmation Modal */}
                {showResetModal && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
                        <div className="relative w-full max-w-md bg-[#0e0e0e] border border-red-500/20 rounded-2xl shadow-2xl p-6 overflow-hidden">
                            <div className="absolute top-0 left-0 w-full h-[5px] bg-gradient-to-r from-red-600 via-pink-600 to-red-600" />
                            
                            <div className="flex items-center gap-3 text-red-400 mb-4 border-b border-white/5 pb-3">
                                <AlertTriangle size={24} className="text-red-500 animate-bounce" />
                                <h3 className="text-lg font-black uppercase tracking-tight">System Season Reset</h3>
                            </div>

                            {previewLoading ? (
                                <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
                                    <Loader2 className="animate-spin h-8 w-8 text-red-500 mb-3" />
                                    <span className="text-[10px] font-black uppercase tracking-widest text-red-400/70 animate-pulse">Running Reset Calculation...</span>
                                </div>
                            ) : previewData ? (
                                <div className="space-y-4 mb-5 p-4 bg-red-500/5 border border-red-500/10 rounded-xl text-left">
                                    <div className="flex justify-between items-center text-xs">
                                        <span className="font-medium text-muted-foreground">Total Players Affected:</span>
                                        <span className="font-black text-white font-mono">{previewData.totalAffected} Accounts</span>
                                    </div>
                                    <div className="flex justify-between items-center text-xs">
                                        <span className="font-medium text-muted-foreground">Unclaimed Coins to Lock/Expire:</span>
                                        <span className="font-black text-red-400 font-mono">{previewData.rewardsToLock} Rewards</span>
                                    </div>
                                    <div className="border-t border-white/5 pt-3.5 grid grid-cols-2 gap-2.5 text-[10px] font-mono text-muted-foreground">
                                        <div className="flex justify-between bg-white/[0.02] p-2 rounded">
                                            <span>Drop to Plat:</span>
                                            <span className="font-bold text-white">{previewData.drops.platinum}</span>
                                        </div>
                                        <div className="flex justify-between bg-white/[0.02] p-2 rounded">
                                            <span>Drop to Gold:</span>
                                            <span className="font-bold text-white">{previewData.drops.gold}</span>
                                        </div>
                                        <div className="flex justify-between bg-white/[0.02] p-2 rounded">
                                            <span>Drop to Silver:</span>
                                            <span className="font-bold text-white">{previewData.drops.silver}</span>
                                        </div>
                                        <div className="flex justify-between bg-white/[0.02] p-2 rounded">
                                            <span>Drop to Bronze:</span>
                                            <span className="font-bold text-white">{previewData.drops.bronze}</span>
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <p className="text-xs text-muted-foreground leading-relaxed mb-4 font-medium">
                                    This will wipe current season scores, dropping active users back to lower divisions, locking reached rewards, and shifting system timeline parameters.
                                </p>
                            )}

                            <div className="space-y-2 mb-6 text-left">
                                <label className="text-[10px] font-bold text-red-400 uppercase tracking-wider">Type RESET in capital letters to authorize:</label>
                                <input
                                    type="text"
                                    value={confirmResetText}
                                    onChange={(e) => setConfirmResetText(e.target.value)}
                                    placeholder="RESET"
                                    className="w-full bg-black border border-red-500/20 focus:border-red-500 outline-none rounded-xl px-4 py-3 text-red-400 font-mono font-bold text-center tracking-widest text-sm focus:ring-1 focus:ring-red-500/20"
                                />
                            </div>

                            <div className="flex justify-end gap-3">
                                <button
                                    onClick={() => {
                                        setShowResetModal(false);
                                        setConfirmResetText('');
                                        setPreviewData(null);
                                    }}
                                    className="px-4 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider text-muted-foreground hover:text-white transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleSeasonReset}
                                    disabled={confirmResetText !== 'RESET'}
                                    className="px-6 py-2.5 bg-gradient-to-r from-red-700 to-red-600 hover:from-red-600 hover:to-red-500 text-white font-bold rounded-xl transition-all text-xs uppercase tracking-wider disabled:opacity-30 disabled:cursor-not-allowed shadow-md shadow-red-950/20"
                                >
                                    Confirm Reset Action
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Season History Section (Tournament style Leaderboard) */}
                {stats && stats.seasonHistory && stats.seasonHistory.length > 0 && (
                    <div className="mt-8 bg-neutral-900/60 border border-white/10 rounded-2xl p-6 relative overflow-hidden shadow-lg">
                        <div className="absolute top-0 left-0 w-32 h-32 bg-amber-500/5 blur-3xl pointer-events-none rounded-full" />
                        <h2 className="text-xl font-black uppercase tracking-tight text-white mb-6 flex items-center gap-2.5 border-b border-white/10 pb-4">
                            <History className="text-amber-400 w-5.5 h-5.5" />
                            Season History Log Leaders
                        </h2>
                        
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-xs text-muted-foreground border-collapse min-w-[600px]">
                                <thead>
                                    <tr className="border-b border-white/10 text-[9px] uppercase font-bold text-muted-foreground/50 bg-black/40">
                                        <th className="py-3 px-4 rounded-l-xl">Season</th>
                                        <th className="py-3 px-4">Start Date</th>
                                        <th className="py-3 px-4">End Date</th>
                                        <th className="py-3 px-4 text-center">Players Registered</th>
                                        <th className="py-3 px-4 text-right">Payout Paid</th>
                                        <th className="py-3 px-4 text-right rounded-r-xl pr-6">Season MVP / Top Score</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {stats.seasonHistory.map((s, idx) => (
                                        <tr key={idx} className="border-b border-white/[0.04] hover:bg-white/[0.02] transition-colors group">
                                            <td className="py-4 px-4 font-black text-white">{s.seasonName}</td>
                                            <td className="py-4 px-4 font-mono text-muted-foreground/75">{new Date(s.startDate).toLocaleDateString()}</td>
                                            <td className="py-4 px-4 font-mono text-muted-foreground/75">{new Date(s.endDate).toLocaleDateString()}</td>
                                            <td className="py-4 px-4 text-center font-mono font-bold text-white/80">{s.totalUsers}</td>
                                            <td className="py-4 px-4 text-right font-mono font-bold text-green-400">{s.totalClaimsPaid} Coins</td>
                                            <td className="py-4 px-4 text-right pr-6">
                                                {s.topPlayer ? (
                                                    <div className="inline-flex items-center gap-2.5 text-left">
                                                        <span className="p-1.5 bg-yellow-500/10 text-yellow-500 rounded-lg border border-yellow-500/20 group-hover:scale-105 transition-transform">
                                                            <Flame size={12} className="fill-yellow-500" />
                                                        </span>
                                                        <div>
                                                            <span className="font-bold text-white block text-xs">{s.topPlayer.name}</span>
                                                            <span className="text-[10px] text-amber-400 block mt-0.5 font-mono">{s.topPlayer.rank} ({s.topPlayer.points} pts)</span>
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <span className="text-muted-foreground/30 font-bold uppercase text-[10px]">No Record</span>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
