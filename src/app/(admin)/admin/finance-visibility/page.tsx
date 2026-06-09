"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState, useRef } from "react";
import { 
    Wallet, 
    ArrowUpRight, 
    ArrowDownLeft, 
    Sparkles, 
    TrendingUp, 
    Calendar, 
    Filter, 
    RefreshCw,
    Search,
    X,
    Info,
    Download
} from "lucide-react";

interface SummaryData {
    actualProfit: number;
    cashOnHand: number;
    totalDeposits: number;
    totalWithdrawals: number;
    totalFreebies: number;
    totalCommissions: number;
    totalPrizesPaid: number;
    totalShopSales: number;
    totalShopProfit?: number;
    totalShopExpenses?: number;
    totalFreebies1k?: number;
    totalFreebiesDaily?: number;
    totalFreebiesLucky?: number;
    totalFreebiesRank?: number;
    totalCommissionsPlatform?: number;
    totalCommissionsUser?: number;
    totalAdminAdjustments: number;
}

interface ChartItem {
    date: string;
    Deposits: number;
    Withdrawals: number;
    ShopSales: number;
    ShopProfit: number;
    TournamentProfitPlatform: number;
    TournamentProfitUser: number;
    Freebies1k: number;
    FreebiesDaily: number;
    FreebiesLucky: number;
    FreebiesRank: number;
    PrizePayouts: number;
    AdminAdjustments: number;
}

interface LogItem {
    _id: string;
    type: string;
    amount: number;
    currency: string;
    userId?: {
        name: string;
        email: string;
        inGameName?: string;
    };
    description: string;
    timestamp: string;
}

const CATEGORY_OPTIONS = [
    { value: 'deposit', label: 'Deposits', color: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' },
    { value: 'withdrawal', label: 'Withdrawals', color: 'bg-rose-500/10 text-rose-400 border-rose-500/20' },
    { value: 'shop_purchase', label: 'Shop Purchases', color: 'bg-blue-500/10 text-blue-400 border-blue-500/20' },
    { value: 'tournament_commission_platform', label: 'Platform Tournaments (Comm.)', color: 'bg-fuchsia-500/10 text-fuchsia-400 border-fuchsia-500/20' },
    { value: 'tournament_commission_user', label: 'User Tournaments (Comm.)', color: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20' },
    { value: 'free_spin_1k', label: '1k Coin Spin (Freebie)', color: 'bg-purple-500/10 text-purple-400 border-purple-500/20' },
    { value: 'daily_collect', label: 'Daily Collect (Freebie)', color: 'bg-amber-500/10 text-amber-400 border-amber-500/20' },
    { value: 'lucky_spin', label: '2500+ Lucky Spin (Freebie)', color: 'bg-pink-500/10 text-pink-400 border-pink-500/20' },
    { value: 'rank_reward', label: 'Rank Rewards (Freebie)', color: 'bg-blue-400/10 text-blue-400 border-blue-400/20' },
    { value: 'prize_winnings', label: 'Prize Winnings', color: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20' },
    { value: 'admin_adjustment', label: 'Admin Adjustments', color: 'bg-orange-500/10 text-orange-400 border-orange-500/20' }
];

export default function FinanceVisibilityPage() {
    const { data: session, status } = useSession();
    const router = useRouter();

    // Filters state
    const [datePreset, setDatePreset] = useState<string>("month");
    const [startDate, setStartDate] = useState<string>("");
    const [endDate, setEndDate] = useState<string>("");
    const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
    const [tempStartDate, setTempStartDate] = useState<string>("");
    const [tempEndDate, setTempEndDate] = useState<string>("");
    
    // API Data state
    const [summary, setSummary] = useState<SummaryData>({
        actualProfit: 0,
        cashOnHand: 0,
        totalDeposits: 0,
        totalWithdrawals: 0,
        totalFreebies: 0,
        totalCommissions: 0,
        totalPrizesPaid: 0,
        totalShopSales: 0,
        totalShopProfit: 0,
        totalShopExpenses: 0,
        totalAdminAdjustments: 0,
        totalFreebiesRank: 0
    });
    const [chartData, setChartData] = useState<ChartItem[]>([]);
    const [logs, setLogs] = useState<LogItem[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [refreshing, setRefreshing] = useState<boolean>(false);

    // Chart toggle visibility
    const [visibleLines, setVisibleLines] = useState({
        Deposits: true,
        Withdrawals: true,
        ShopSales: true,
        ShopProfit: false,
        TournamentProfitPlatform: false,
        TournamentProfitUser: false,
        Freebies1k: false,
        FreebiesDaily: false,
        FreebiesLucky: false,
        FreebiesRank: false,
        PrizePayouts: false,
        AdminAdjustments: false
    });

    const [showMoreFilters, setShowMoreFilters] = useState<boolean>(false);
    const [showGlobalMoreFilters, setShowGlobalMoreFilters] = useState<boolean>(false);

    // Accordion details toggle states
    const [showFreebiesDetails, setShowFreebiesDetails] = useState<boolean>(false);
    const [showTournamentDetails, setShowTournamentDetails] = useState<boolean>(false);

    // User-specific filtering states
    const [selectedUser, setSelectedUser] = useState<{ id: string; name: string; email: string } | null>(null);
    const [userSearchQuery, setUserSearchQuery] = useState<string>("");
    const [userSearchResults, setUserSearchResults] = useState<any[]>([]);
    const [searchingUsers, setSearchingUsers] = useState<boolean>(false);
    const [showAdminAdjustmentsDropdown, setShowAdminAdjustmentsDropdown] = useState<boolean>(false);

    // Debounced user search effect
    useEffect(() => {
        if (!userSearchQuery.trim()) {
            setUserSearchResults([]);
            return;
        }

        const delayDebounceFn = setTimeout(async () => {
            try {
                setSearchingUsers(true);
                const res = await fetch(`/api/admin/users?limit=5&search=${encodeURIComponent(userSearchQuery)}`);
                if (res.ok) {
                    const data = await res.json();
                    setUserSearchResults(data.users || []);
                }
            } catch (err) {
                console.error("Failed to search users:", err);
            } finally {
                setSearchingUsers(false);
            }
        }, 300);

        return () => clearTimeout(delayDebounceFn);
    }, [userSearchQuery]);

    // Cross-linking handler for sub-categories
    const toggleSubCategoryFilter = (cat: string) => {
        if (selectedCategories.includes(cat) && selectedCategories.length === 1) {
            setSelectedCategories([]);
        } else {
            setSelectedCategories([cat]);
            if (['tournament_commission_platform', 'tournament_commission_user', 'free_spin_1k', 'daily_collect', 'lucky_spin', 'rank_reward'].includes(cat)) {
                setShowGlobalMoreFilters(true);
            }
        }
    };

    // Pagination states
    const [page, setPage] = useState<number>(1);
    const [totalPages, setTotalPages] = useState<number>(1);
    const [totalLogs, setTotalLogs] = useState<number>(0);
    const limit = 10;

    // Chart Hover Tooltip State
    const [hoverIndex, setHoverIndex] = useState<number | null>(null);
    const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 });
    const chartRef = useRef<HTMLDivElement>(null);

    // Handle preset changes
    useEffect(() => {
        const now = new Date();
        let start = new Date();

        switch (datePreset) {
            case "today":
                start.setHours(0, 0, 0, 0);
                break;
            case "week":
                start.setDate(now.getDate() - 7);
                break;
            case "month":
                start.setMonth(now.getMonth() - 1);
                break;
            case "3m":
                start.setMonth(now.getMonth() - 3);
                break;
            case "year":
                start.setFullYear(now.getFullYear() - 1);
                break;
            case "lifetime":
                start = new Date(0); // Epoch start (1970-01-01)
                break;
            case "custom":
                return; // Let user manually select date
            default:
                break;
        }

        setStartDate(start.toISOString().split("T")[0]);
        setEndDate(now.toISOString().split("T")[0]);
    }, [datePreset]);

    // Keep temporary dates in sync with active presets
    useEffect(() => {
        if (datePreset !== "custom") {
            setTempStartDate(startDate);
            setTempEndDate(endDate);
        }
    }, [startDate, endDate, datePreset]);

    // Fetch report data
    const fetchReport = async () => {
        if (!session) return;
        
        try {
            setRefreshing(true);
            const queryParams = new URLSearchParams();
            if (startDate) queryParams.append("startDate", startDate);
            if (endDate) queryParams.append("endDate", endDate);
            queryParams.append("page", page.toString());
            queryParams.append("limit", limit.toString());
            
            if (selectedCategories.length > 0) {
                queryParams.append("categories", selectedCategories.join(","));
            } else {
                queryParams.append("categories", "all");
            }

            if (selectedUser) {
                queryParams.append("userId", selectedUser.id);
            }

            const res = await fetch(`/api/finance/report?${queryParams.toString()}`);
            if (res.ok) {
                const data = await res.json();
                if (data.success) {
                    setSummary(data.summary);
                    setChartData(data.chartData);
                    setLogs(data.logs);
                    if (data.pagination) {
                        setTotalPages(data.pagination.totalPages || 1);
                        setTotalLogs(data.pagination.totalLogs || 0);
                    }
                }
            }
        } catch (error) {
            console.error("Failed to fetch finance report", error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    // Reset to page 1 on filter changes
    useEffect(() => {
        setPage(1);
    }, [startDate, endDate, selectedCategories, selectedUser]);

    useEffect(() => {
        if (startDate && endDate && status === "authenticated") {
            fetchReport();
        }
    }, [startDate, endDate, selectedCategories, status, page, selectedUser]);

    const toggleCategory = (cat: string) => {
        if (selectedCategories.includes(cat)) {
            setSelectedCategories(selectedCategories.filter(c => c !== cat));
        } else {
            setSelectedCategories([...selectedCategories, cat]);
        }
    };

    const clearCategories = () => {
        setSelectedCategories([]);
    };

    const resetChartFilters = () => {
        setVisibleLines({
            Deposits: true,
            Withdrawals: true,
            ShopSales: true,
            ShopProfit: false,
            TournamentProfitPlatform: false,
            TournamentProfitUser: false,
            Freebies1k: false,
            FreebiesDaily: false,
            FreebiesLucky: false,
            FreebiesRank: false,
            PrizePayouts: false,
            AdminAdjustments: false
        });
    };

    const resetAllFilters = () => {
        setSelectedCategories([]);
        setDatePreset("month");
        setSelectedUser(null);
        resetChartFilters();
        setPage(1);
        const now = new Date();
        const start = new Date();
        start.setMonth(now.getMonth() - 1);
        const startStr = start.toISOString().split("T")[0];
        const endStr = now.toISOString().split("T")[0];
        setTempStartDate(startStr);
        setTempEndDate(endStr);
    };

    const handleExportCSV = () => {
        const queryParams = new URLSearchParams();
        if (startDate) queryParams.append("startDate", startDate);
        if (endDate) queryParams.append("endDate", endDate);
        
        if (selectedCategories.length > 0) {
            queryParams.append("categories", selectedCategories.join(","));
        } else {
            queryParams.append("categories", "all");
        }

        if (selectedUser) {
            queryParams.append("userId", selectedUser.id);
        }

        window.location.href = `/api/finance/export?${queryParams.toString()}`;
    };

    // SVG Graph Plotting Math
    const plotHeight = 220;
    const plotWidth = 600;
    const padding = { top: 20, right: 30, bottom: 30, left: 50 };

    const getChartCoordinates = () => {
        if (chartData.length === 0) return { points: [], dates: [], yTicks: [], maxLimit: 100 };

        // Determine min and max Y limits
        const activeLines = Object.keys(visibleLines).filter(k => visibleLines[k as keyof typeof visibleLines]);
        let maxVal = 100;
        
        chartData.forEach(d => {
            activeLines.forEach(l => {
                const val = d[l as keyof ChartItem] as number;
                if (val > maxVal) maxVal = val;
            });
        });

        // Round maxVal up to nearest clean step
        const roundTo = Math.pow(10, Math.floor(Math.log10(maxVal)));
        const maxLimit = Math.ceil(maxVal / (roundTo / 2)) * (roundTo / 2);

        // Generate lines path data
        const points = chartData.map((d, index) => {
            const x = padding.left + (index / (chartData.length - 1 || 1)) * (plotWidth - padding.left - padding.right);
            const item: Record<string, number> = {};
            activeLines.forEach(l => {
                const val = d[l as keyof ChartItem] as number;
                // invert y because svg 0 is top
                const y = padding.top + (1 - (val / (maxLimit || 1))) * (plotHeight - padding.top - padding.bottom);
                item[l] = y;
            });
            return { x, ...item, date: d.date, raw: d };
        });

        // Y Axis ticks
        const yTicks = Array.from({ length: 5 }, (_, i) => {
            const val = (maxLimit / 4) * i;
            const y = padding.top + (1 - (i / 4)) * (plotHeight - padding.top - padding.bottom);
            return { val, y };
        });

        // X Axis labels (limit to max 6 labels to avoid overlap)
        const step = Math.max(1, Math.floor(chartData.length / 5));
        const dates = chartData.filter((_, i) => i % step === 0 || i === chartData.length - 1).map(d => {
            const index = chartData.findIndex(cd => cd.date === d.date);
            const x = padding.left + (index / (chartData.length - 1 || 1)) * (plotWidth - padding.left - padding.right);
            // Format to show Month/Day e.g., 'Jun 03'
            const dateObj = new Date(d.date);
            const dateLabel = dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' });
            return { label: dateLabel, x };
        });

        return { points, dates, yTicks, maxLimit };
    };

    const { points, dates, yTicks } = getChartCoordinates();

    const handleMouseMove = (e: React.MouseEvent<SVGSVGElement, MouseEvent>) => {
        if (!chartRef.current || points.length === 0) return;
        const rect = chartRef.current.getBoundingClientRect();
        const clientX = e.clientX - rect.left;
        
        // Find closest point index based on clientX mapping to SVG coordinates
        const relativeX = (clientX / rect.width) * plotWidth;
        
        let closestIndex = 0;
        let minDiff = Infinity;
        
        points.forEach((p, idx) => {
            const diff = Math.abs(p.x - relativeX);
            if (diff < minDiff) {
                minDiff = diff;
                closestIndex = idx;
            }
        });

        setHoverIndex(closestIndex);
        
        // Position tooltips
        const tooltipX = (points[closestIndex].x / plotWidth) * rect.width;
        setTooltipPos({
            x: tooltipX,
            y: (e.clientY - rect.top) - 105
        });
    };

    return (
        <div className="space-y-8 max-w-7xl mx-auto px-2 animate-in fade-in-50 duration-500">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold bg-gradient-to-r from-indigo-400 to-cyan-400 bg-clip-text text-transparent">
                        Finance Visibility Center
                    </h1>
                    <p className="text-muted-foreground mt-1">
                        Real-time audit tracking, profit calculation, and revenue visibility.
                    </p>
                </div>
                <div className="flex items-center gap-3 relative">
                    {/* Admin Adjustments Dropdown */}
                    <div className="relative">
                        <button 
                            onClick={() => setShowAdminAdjustmentsDropdown(!showAdminAdjustmentsDropdown)}
                            className="flex items-center justify-center gap-2 bg-rose-600/10 hover:bg-rose-600/20 text-rose-400 px-4 py-2.5 rounded-xl text-sm font-semibold border border-rose-500/20 shadow-sm transition-all cursor-pointer"
                        >
                            <TrendingUp size={16} className="text-rose-400" />
                            <span>Admin Adjustments</span>
                        </button>

                        {showAdminAdjustmentsDropdown && (
                            <div className="absolute right-0 mt-2 w-72 bg-zinc-950 border border-zinc-800 rounded-2xl p-4 shadow-xl z-50 animate-in fade-in-50 slide-in-from-top-1 duration-200">
                                <div className="flex justify-between items-center mb-3 pb-3 border-b border-zinc-800">
                                    <span className="text-xs text-zinc-400 font-bold uppercase">Leakage Summary</span>
                                    <span className="text-[10px] px-2 py-0.5 bg-rose-500/15 border border-rose-500/30 rounded text-rose-400 font-bold font-mono">
                                        Expense
                                    </span>
                                </div>
                                
                                <div className="space-y-3">
                                    <div className="flex justify-between items-center bg-rose-500/5 p-3 rounded-xl border border-rose-500/10">
                                        <div className="flex items-center gap-1.5">
                                            <span className="text-xs text-muted-foreground font-semibold">Total Adjustments:</span>
                                            <div className="group relative inline-block">
                                                <Info size={12} className="text-muted-foreground hover:text-foreground cursor-help transition-colors" />
                                                <div className="absolute z-[60] bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 p-2 bg-zinc-900 border border-zinc-800 text-zinc-300 text-[10px] rounded-xl shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 text-center font-normal whitespace-normal pointer-events-none">
                                                    Sum of manual admin credits minus debits. Treated as an expense/lost potential revenue.
                                                </div>
                                            </div>
                                        </div>
                                        <span className="text-base font-black text-rose-400 font-mono">
                                            {(summary.totalAdminAdjustments ?? 0) >= 0 ? '+' : ''}{(summary.totalAdminAdjustments ?? 0).toLocaleString()} Coins
                                        </span>
                                    </div>

                                    {/* User Specific filter input */}
                                    <div className="space-y-1.5 text-left">
                                        <label className="text-[10px] text-muted-foreground font-bold uppercase block">Filter by User</label>
                                        <div className="relative">
                                            <input 
                                                type="text" 
                                                placeholder="Search user name or email..." 
                                                value={userSearchQuery}
                                                onChange={(e) => setUserSearchQuery(e.target.value)}
                                                className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-foreground focus:outline-none focus:border-indigo-500 transition-colors"
                                            />
                                            {searchingUsers && (
                                                <RefreshCw className="animate-spin absolute right-3 top-2.5 text-zinc-500" size={12} />
                                            )}
                                        </div>

                                        {/* User results search dropdown */}
                                        {userSearchResults.length > 0 && (
                                            <div className="bg-zinc-900 border border-zinc-800 rounded-xl mt-1 overflow-hidden divide-y divide-zinc-800/50 max-h-36 overflow-y-auto shadow-md">
                                                {userSearchResults.map((usr) => (
                                                    <div 
                                                        key={usr._id} 
                                                        onClick={() => {
                                                            setSelectedUser({ id: usr._id, name: usr.name, email: usr.email });
                                                            setUserSearchQuery("");
                                                            setUserSearchResults([]);
                                                            setShowAdminAdjustmentsDropdown(false);
                                                        }}
                                                        className="p-2 text-left hover:bg-zinc-800 cursor-pointer transition-colors animate-in fade-in-20 duration-100"
                                                    >
                                                        <p className="text-xs text-foreground font-bold leading-tight">{usr.name}</p>
                                                        <p className="text-[10px] text-muted-foreground leading-none">{usr.email}</p>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    <button 
                        onClick={fetchReport}
                        disabled={refreshing}
                        className="flex items-center justify-center gap-2 bg-indigo-600/10 hover:bg-indigo-600/20 text-indigo-400 px-4 py-2.5 rounded-xl text-sm font-semibold border border-indigo-500/20 shadow-sm transition-all"
                    >
                        <RefreshCw className={`${refreshing ? 'animate-spin' : ''}`} size={16} />
                        {refreshing ? 'Refreshing...' : 'Refresh Data'}
                    </button>
                </div>
            </div>

            {/* Filter Status Badge */}
            {selectedUser && (
                <div className="flex items-center gap-3 bg-indigo-600/10 border border-indigo-500/20 px-4 py-3 rounded-2xl animate-in slide-in-from-top-1 duration-200">
                    <div className="w-2 h-2 bg-indigo-400 rounded-full animate-pulse" />
                    <span className="text-xs text-indigo-400 font-medium">
                        Showing metrics for user: <span className="font-bold text-foreground">{selectedUser.name} ({selectedUser.email})</span>
                    </span>
                    <button 
                        onClick={() => setSelectedUser(null)}
                        className="bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-400 hover:text-foreground text-xs font-bold px-2.5 py-1 rounded-lg border border-indigo-500/20 transition-all cursor-pointer ml-auto"
                    >
                        Clear Filter
                    </button>
                </div>
            )}

            {/* Global Filter Bar */}
            <div className="bg-card border border-border rounded-2xl p-6 shadow-sm space-y-4">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-center gap-2 text-foreground font-bold text-sm">
                        <Calendar size={18} className="text-indigo-400" />
                        <span>Filter Period</span>
                    </div>
                    
                    {/* Date Presets */}
                    <div className="flex flex-wrap items-center gap-2">
                        {['today', 'week', 'month', '3m', 'year', 'lifetime', 'custom'].map((preset) => (
                            <button
                                key={preset}
                                onClick={() => setDatePreset(preset)}
                                className={`px-3 py-1.5 rounded-lg text-xs font-bold capitalize transition-all border ${
                                    datePreset === preset 
                                    ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm shadow-indigo-500/20' 
                                    : 'bg-muted/40 hover:bg-muted text-muted-foreground border-border'
                                }`}
                            >
                                {preset === '3m' ? '3 Months' : preset === 'custom' ? 'Custom Range' : preset === 'lifetime' ? 'Lifetime' : preset}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Custom Date Pickers */}
                {datePreset === 'custom' && (
                    <div className="flex flex-col sm:flex-row items-end gap-4 pt-4 border-t border-border/40 animate-in slide-in-from-top-2 duration-300">
                        <div className="flex flex-col gap-1.5 min-w-[160px] w-full sm:w-auto">
                            <span className="text-xs text-muted-foreground font-semibold">Start Date</span>
                            <input 
                                type="date" 
                                value={tempStartDate}
                                onChange={(e) => setTempStartDate(e.target.value)}
                                className="bg-background border border-border rounded-xl px-3 py-2 text-sm text-foreground focus:outline-none focus:border-indigo-500 transition-colors w-full"
                            />
                        </div>
                        <div className="flex flex-col gap-1.5 min-w-[160px] w-full sm:w-auto">
                            <span className="text-xs text-muted-foreground font-semibold">End Date</span>
                            <input 
                                type="date" 
                                value={tempEndDate}
                                onChange={(e) => setTempEndDate(e.target.value)}
                                className="bg-background border border-border rounded-xl px-3 py-2 text-sm text-foreground focus:outline-none focus:border-indigo-500 transition-colors w-full"
                            />
                        </div>
                        <button
                            onClick={() => {
                                setStartDate(tempStartDate);
                                setEndDate(tempEndDate);
                            }}
                            className="flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-xl text-sm font-bold shadow-md shadow-indigo-500/20 transition-all border border-indigo-500 w-full sm:w-auto mt-2 sm:mt-0"
                        >
                            <Search size={16} />
                            <span>Search</span>
                        </button>
                    </div>
                )}

            </div>

            {/* Top Summary Cards */}
            {loading ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6">
                    {Array.from({ length: 5 }).map((_, i) => (
                        <div key={i} className="h-32 bg-card border border-border rounded-2xl animate-pulse" />
                    ))}
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6">
                    {/* Actual Profit */}
                    <div className="relative bg-card border border-indigo-500/20 p-5 rounded-2xl shadow-sm">
                        <div className="absolute inset-0 rounded-2xl overflow-hidden pointer-events-none">
                            <div className="absolute right-0 bottom-0 w-24 h-24 bg-indigo-500/5 blur-[50px] rounded-full" />
                        </div>
                        <div className="flex justify-between items-start mb-3">
                            <div className="p-2 bg-indigo-500/10 text-indigo-400 rounded-xl border border-indigo-500/20 shadow-md">
                                <TrendingUp size={20} />
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="text-[10px] text-indigo-400 bg-indigo-500/10 border border-indigo-500/25 px-2 py-0.5 rounded-full font-bold uppercase">
                                    Formula Net
                                </span>
                                <div className="group relative inline-block">
                                    <Info size={14} className="text-muted-foreground hover:text-foreground cursor-help transition-colors" />
                                    <div className="absolute z-50 bottom-full left-1/2 -translate-x-1/2 mb-2 w-56 p-2.5 bg-zinc-950/95 backdrop-blur border border-zinc-800 text-zinc-300 text-[10px] rounded-xl shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 text-center font-normal whitespace-normal pointer-events-none">
                                        Actual Profit = Shop Net Profit + Tournament Commissions (User Rake + Platform Net) - Freebies Given. Represents net earnings/gains of the platform.
                                    </div>
                                </div>
                            </div>
                        </div>
                        <p className="text-muted-foreground text-xs font-semibold mb-0.5">Actual Profit</p>
                        <h3 className="text-2xl font-black text-foreground truncate">
                            {summary.actualProfit >= 0 ? '+' : ''}{(summary.actualProfit ?? 0).toLocaleString()}
                            <span className="text-xs font-normal text-muted-foreground ml-1">Coins</span>
                        </h3>
                    </div>

                    {/* Cash on Hand */}
                    <div className="relative bg-card border border-amber-500/20 p-5 rounded-2xl shadow-sm">
                        <div className="absolute inset-0 rounded-2xl overflow-hidden pointer-events-none">
                            <div className="absolute right-0 bottom-0 w-24 h-24 bg-amber-500/5 blur-[50px] rounded-full" />
                        </div>
                        <div className="flex justify-between items-start mb-3">
                            <div className="p-2 bg-amber-500/10 text-amber-400 rounded-xl border border-amber-500/20 shadow-md">
                                <Wallet size={20} />
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="text-[10px] text-amber-400 bg-amber-500/10 border border-amber-500/25 px-2 py-0.5 rounded-full font-bold uppercase">
                                    Cash Flow Net
                                </span>
                                <div className="group relative inline-block">
                                    <Info size={14} className="text-muted-foreground hover:text-foreground cursor-help transition-colors" />
                                    <div className="absolute z-50 bottom-full left-1/2 -translate-x-1/2 mb-2 w-56 p-2.5 bg-zinc-950/95 backdrop-blur border border-zinc-800 text-zinc-300 text-[10px] rounded-xl shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 text-center font-normal whitespace-normal pointer-events-none">
                                        Cash on Hand = Total Deposits - Total Withdrawals - Shop Expenses. Represents actual liquid cash/balance currently held by the system.
                                    </div>
                                </div>
                            </div>
                        </div>
                        <p className="text-muted-foreground text-xs font-semibold mb-0.5">Cash on Hand</p>
                        <h3 className="text-2xl font-black text-foreground truncate">
                            Rs {(summary.cashOnHand ?? 0).toLocaleString()}
                        </h3>
                    </div>

                    {/* Total Deposits */}
                    <div className="relative bg-card border border-emerald-500/10 p-5 rounded-2xl shadow-sm">
                        <div className="absolute inset-0 rounded-2xl overflow-hidden pointer-events-none">
                            <div className="absolute right-0 bottom-0 w-24 h-24 bg-emerald-500/5 blur-[50px] rounded-full" />
                        </div>
                        <div className="flex justify-between items-start mb-3">
                            <div className="p-2 bg-emerald-500/10 text-emerald-400 rounded-xl border border-emerald-500/20 shadow-md">
                                <ArrowUpRight size={20} />
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="text-[10px] text-emerald-400 bg-emerald-500/10 border border-emerald-500/25 px-2 py-0.5 rounded-full font-bold uppercase">
                                    Inflow
                                </span>
                                <div className="group relative inline-block">
                                    <Info size={14} className="text-muted-foreground hover:text-foreground cursor-help transition-colors" />
                                    <div className="absolute z-50 bottom-full left-1/2 -translate-x-1/2 mb-2 w-56 p-2.5 bg-zinc-950/95 backdrop-blur border border-zinc-800 text-zinc-300 text-[10px] rounded-xl shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 text-center font-normal whitespace-normal pointer-events-none">
                                        Total money deposited into user wallets by the system (in PKR).
                                    </div>
                                </div>
                            </div>
                        </div>
                        <p className="text-muted-foreground text-xs font-semibold mb-0.5">Total Deposits</p>
                        <h3 className="text-2xl font-black text-foreground truncate">
                            Rs {(summary.totalDeposits ?? 0).toLocaleString()}
                        </h3>
                    </div>

                    {/* Total Withdrawals */}
                    <div className="relative bg-card border border-rose-500/10 p-5 rounded-2xl shadow-sm">
                        <div className="absolute inset-0 rounded-2xl overflow-hidden pointer-events-none">
                            <div className="absolute right-0 bottom-0 w-24 h-24 bg-rose-500/5 blur-[50px] rounded-full" />
                        </div>
                        <div className="flex justify-between items-start mb-3">
                            <div className="p-2 bg-rose-500/10 text-rose-400 rounded-xl border border-rose-500/20 shadow-md">
                                <ArrowDownLeft size={20} />
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="text-[10px] text-rose-400 bg-rose-500/10 border border-rose-500/25 px-2 py-0.5 rounded-full font-bold uppercase">
                                    Outflow
                                </span>
                                <div className="group relative inline-block">
                                    <Info size={14} className="text-muted-foreground hover:text-foreground cursor-help transition-colors" />
                                    <div className="absolute z-50 bottom-full left-1/2 -translate-x-1/2 mb-2 w-56 p-2.5 bg-zinc-950/95 backdrop-blur border border-zinc-800 text-zinc-300 text-[10px] rounded-xl shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 text-center font-normal whitespace-normal pointer-events-none">
                                        Total money withdrawn from user wallets by the system (in PKR).
                                    </div>
                                </div>
                            </div>
                        </div>
                        <p className="text-muted-foreground text-xs font-semibold mb-0.5">Total Withdrawals</p>
                        <h3 className="text-2xl font-black text-foreground truncate">
                            Rs {(summary.totalWithdrawals ?? 0).toLocaleString()}
                        </h3>
                    </div>

                    {/* Total Freebies Given */}
                    <div 
                        onClick={() => setShowFreebiesDetails(!showFreebiesDetails)}
                        className="relative bg-card border border-purple-500/10 p-5 rounded-2xl shadow-sm cursor-pointer hover:border-purple-500/30 transition-all select-none"
                    >
                        <div className="absolute inset-0 rounded-2xl overflow-hidden pointer-events-none">
                            <div className="absolute right-0 bottom-0 w-24 h-24 bg-purple-500/5 blur-[50px] rounded-full" />
                        </div>
                        <div className="flex justify-between items-start mb-3">
                            <div className="p-2 bg-purple-500/10 text-purple-400 rounded-xl border border-purple-500/20 shadow-md">
                                <Sparkles size={20} />
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="text-[10px] text-purple-400 bg-purple-500/10 border border-purple-500/25 px-2.5 py-0.5 rounded-full font-bold uppercase flex items-center gap-1">
                                    <span>Liabilities</span>
                                    <span className={`transition-transform duration-200 text-[8px] font-black ${showFreebiesDetails ? 'rotate-180' : ''}`}>▼</span>
                                </span>
                                <div className="group relative inline-block">
                                    <Info size={14} className="text-muted-foreground hover:text-foreground cursor-help transition-colors" />
                                    <div className="absolute z-50 bottom-full left-1/2 -translate-x-1/2 mb-2 w-56 p-2.5 bg-zinc-950/95 backdrop-blur border border-zinc-800 text-zinc-300 text-[10px] rounded-xl shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 text-center font-normal whitespace-normal pointer-events-none">
                                        Total free coins given out via Lucky Spins, Daily Collects, and other promotional rewards.
                                    </div>
                                </div>
                            </div>
                        </div>
                        <p className="text-muted-foreground text-xs font-semibold mb-0.5">Total Freebies Given</p>
                        <h3 className="text-2xl font-black text-foreground truncate">
                            {(summary.totalFreebies ?? 0).toLocaleString()}
                            <span className="text-xs font-normal text-muted-foreground ml-1">Coins</span>
                        </h3>
                        
                        {/* Accordion content */}
                        {showFreebiesDetails && (
                            <div className="mt-4 pt-3 border-t border-purple-500/15 space-y-2 text-xs text-muted-foreground animate-in slide-in-from-top-1 duration-200">
                                <div 
                                    onClick={(e) => { e.stopPropagation(); toggleSubCategoryFilter('free_spin_1k'); }}
                                    className={`flex justify-between items-center hover:text-foreground transition-colors p-1 rounded hover:bg-purple-500/5 ${selectedCategories.includes('free_spin_1k') ? 'text-foreground font-semibold bg-purple-500/10' : ''}`}
                                >
                                    <span>[1k Coin Spin]</span>
                                    <span className="font-mono font-bold text-purple-400">{summary.totalFreebies1k?.toLocaleString() || 0} Coins</span>
                                </div>
                                <div 
                                    onClick={(e) => { e.stopPropagation(); toggleSubCategoryFilter('daily_collect'); }}
                                    className={`flex justify-between items-center hover:text-foreground transition-colors p-1 rounded hover:bg-purple-500/5 ${selectedCategories.includes('daily_collect') ? 'text-foreground font-semibold bg-purple-500/10' : ''}`}
                                >
                                    <span>[Daily Collect]</span>
                                    <span className="font-mono font-bold text-amber-400">{summary.totalFreebiesDaily?.toLocaleString() || 0} Coins</span>
                                </div>
                                <div 
                                    onClick={(e) => { e.stopPropagation(); toggleSubCategoryFilter('lucky_spin'); }}
                                    className={`flex justify-between items-center hover:text-foreground transition-colors p-1 rounded hover:bg-purple-500/5 ${selectedCategories.includes('lucky_spin') ? 'text-foreground font-semibold bg-purple-500/10' : ''}`}
                                >
                                    <span>[2500+ Top-up Lucky Spin]</span>
                                    <span className="font-mono font-bold text-pink-400">{summary.totalFreebiesLucky?.toLocaleString() || 0} Coins</span>
                                </div>
                                <div 
                                    onClick={(e) => { e.stopPropagation(); toggleSubCategoryFilter('rank_reward'); }}
                                    className={`flex justify-between items-center hover:text-foreground transition-colors p-1 rounded hover:bg-purple-500/5 ${selectedCategories.includes('rank_reward') ? 'text-foreground font-semibold bg-purple-500/10' : ''}`}
                                >
                                    <span>[Rank Up Rewards]</span>
                                    <span className="font-mono font-bold text-blue-400">{summary.totalFreebiesRank?.toLocaleString() || 0} Coins</span>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Sub-aggregation Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
                <div 
                    onClick={() => toggleSubCategoryFilter('tournament_commission_user')}
                    className={`bg-card border p-4 rounded-xl flex items-center justify-between cursor-pointer hover:border-fuchsia-500/30 transition-all select-none ${selectedCategories.includes('tournament_commission_user') ? 'border-fuchsia-500 shadow-sm' : 'border-border'}`}
                >
                    <div>
                        <span className="text-xs text-muted-foreground font-bold uppercase block">Tournament Commissions</span>
                        <span className="text-lg font-black text-fuchsia-400 font-mono">
                            {summary.totalCommissions >= 0 ? '+' : ''}
                            {(summary.totalCommissions ?? 0).toLocaleString()} Coins
                        </span>
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="text-[10px] px-2 py-0.5 bg-fuchsia-500/10 border border-fuchsia-500/20 rounded text-fuchsia-400 font-bold font-mono">
                            10% Rake
                        </span>
                        <div className="group relative inline-block">
                            <Info size={14} className="text-muted-foreground hover:text-foreground cursor-help transition-colors" onClick={(e) => e.stopPropagation()} />
                            <div className="absolute z-50 bottom-full left-1/2 -translate-x-1/2 mb-2 w-56 p-2.5 bg-zinc-950/95 backdrop-blur border border-zinc-800 text-zinc-300 text-[10px] rounded-xl shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 text-center font-normal whitespace-normal pointer-events-none">
                                Total rake commission (10%) earned from user-created tournaments.
                            </div>
                        </div>
                    </div>
                </div>
                <div 
                    onClick={() => toggleSubCategoryFilter('tournament_commission_platform')}
                    className={`bg-card border p-4 rounded-xl flex items-center justify-between cursor-pointer hover:border-cyan-500/30 transition-all select-none ${selectedCategories.includes('tournament_commission_platform') ? 'border-cyan-500 shadow-sm' : 'border-border'}`}
                >
                    <div>
                        <span className="text-xs text-muted-foreground font-bold uppercase block">Platform Tournaments Net</span>
                        <span className={`text-lg font-black font-mono ${(summary.totalCommissionsPlatform ?? 0) >= 0 ? 'text-cyan-400' : 'text-rose-400'}`}>
                            {(summary.totalCommissionsPlatform ?? 0) >= 0 ? '+' : ''}
                            {(summary.totalCommissionsPlatform ?? 0).toLocaleString()} Coins
                        </span>
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="text-[10px] px-2 py-0.5 bg-cyan-500/10 border border-cyan-500/20 rounded text-cyan-400 font-bold font-mono">Net</span>
                        <div className="group relative inline-block">
                            <Info size={14} className="text-muted-foreground hover:text-foreground cursor-help transition-colors" onClick={(e) => e.stopPropagation()} />
                            <div className="absolute z-50 bottom-full left-1/2 -translate-x-1/2 mb-2 w-56 p-2.5 bg-zinc-950/95 backdrop-blur border border-zinc-800 text-zinc-300 text-[10px] rounded-xl shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 text-center font-normal whitespace-normal pointer-events-none">
                                Net profit or loss from completed official tournaments (Platform Entry Fees Collected - Actual Prizes Paid Out).
                            </div>
                        </div>
                    </div>
                </div>
                <div 
                    onClick={() => toggleSubCategoryFilter('prize_winnings')}
                    className={`bg-card border p-4 rounded-xl flex items-center justify-between cursor-pointer hover:border-cyan-500/30 transition-all select-none ${selectedCategories.includes('prize_winnings') ? 'border-cyan-500 shadow-sm' : 'border-border'}`}
                >
                    <div>
                        <span className="text-xs text-muted-foreground font-bold uppercase block">Tournament Prizes Paid</span>
                        <span className="text-lg font-black text-cyan-400 font-mono">-{(summary.totalPrizesPaid ?? 0).toLocaleString()} Coins</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="text-[10px] px-2 py-0.5 bg-cyan-500/10 border border-cyan-500/20 rounded text-cyan-400 font-bold font-mono">Prizes</span>
                        <div className="group relative inline-block">
                            <Info size={14} className="text-muted-foreground hover:text-foreground cursor-help transition-colors" onClick={(e) => e.stopPropagation()} />
                            <div className="absolute z-50 bottom-full left-1/2 -translate-x-1/2 mb-2 w-56 p-2.5 bg-zinc-950/95 backdrop-blur border border-zinc-800 text-zinc-300 text-[10px] rounded-xl shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 text-center font-normal whitespace-normal pointer-events-none">
                                Total tournament prizes paid out to winners from completed matches.
                            </div>
                        </div>
                    </div>
                </div>
                <div 
                    onClick={() => toggleSubCategoryFilter('shop_purchase')}
                    className={`bg-card border p-4 rounded-xl flex items-center justify-between cursor-pointer hover:border-blue-500/30 transition-all select-none ${selectedCategories.includes('shop_purchase') ? 'border-blue-500 shadow-sm' : 'border-border'}`}
                >
                    <div>
                        <span className="text-xs text-muted-foreground font-bold uppercase block">Shop Sales Volume</span>
                        <span className="text-lg font-black text-blue-400 font-mono">+{(summary.totalShopSales ?? 0).toLocaleString()} Coins</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="text-[10px] px-2 py-0.5 bg-blue-500/10 border border-blue-500/20 rounded text-blue-400 font-bold font-mono">Sales Vol</span>
                        <div className="group relative inline-block">
                            <Info size={14} className="text-muted-foreground hover:text-foreground cursor-help transition-colors" onClick={(e) => e.stopPropagation()} />
                            <div className="absolute z-50 bottom-full left-1/2 -translate-x-1/2 mb-2 w-56 p-2.5 bg-zinc-950/95 backdrop-blur border border-zinc-800 text-zinc-300 text-[10px] rounded-xl shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 text-center font-normal whitespace-normal pointer-events-none">
                                Total volume of coins spent by users on store purchases.
                            </div>
                        </div>
                    </div>
                </div>
                <div 
                    onClick={() => toggleSubCategoryFilter('shop_purchase')}
                    className={`bg-card border p-4 rounded-xl flex items-center justify-between cursor-pointer hover:border-indigo-500/30 transition-all select-none ${selectedCategories.includes('shop_purchase') ? 'border-indigo-500 shadow-sm' : 'border-border'}`}
                >
                    <div>
                        <span className="text-xs text-muted-foreground font-bold uppercase block">Shop Profit Net</span>
                        <span className="text-lg font-black text-indigo-400 font-mono">+{summary.totalShopProfit?.toLocaleString() || 0} Coins</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="text-[10px] px-2 py-0.5 bg-indigo-500/10 border border-indigo-500/20 rounded text-indigo-400 font-bold font-mono">Profit</span>
                        <div className="group relative inline-block">
                            <Info size={14} className="text-muted-foreground hover:text-foreground cursor-help transition-colors" onClick={(e) => e.stopPropagation()} />
                            <div className="absolute z-50 bottom-full left-1/2 -translate-x-1/2 mb-2 w-56 p-2.5 bg-zinc-950/95 backdrop-blur border border-zinc-800 text-zinc-300 text-[10px] rounded-xl shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 text-center font-normal whitespace-normal pointer-events-none">
                                Shop Sales Volume - Shop Product Expenses (cost prices of purchased items).
                            </div>
                        </div>
                    </div>
                </div>
                <div 
                    onClick={() => toggleSubCategoryFilter('rank_reward')}
                    className={`bg-card border p-4 rounded-xl flex items-center justify-between cursor-pointer hover:border-blue-500/30 transition-all select-none ${selectedCategories.includes('rank_reward') ? 'border-blue-500 shadow-sm' : 'border-border'}`}
                >
                    <div>
                        <span className="text-xs text-muted-foreground font-bold uppercase block">Rank Rewards Paid</span>
                        <span className="text-lg font-black text-blue-400 font-mono">
                            -{(summary.totalFreebiesRank ?? 0).toLocaleString()} Coins
                        </span>
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="text-[10px] px-2 py-0.5 bg-blue-500/10 border border-blue-500/20 rounded text-blue-400 font-bold font-mono">Ranks</span>
                        <div className="group relative inline-block">
                            <Info size={14} className="text-muted-foreground hover:text-foreground cursor-help transition-colors" onClick={(e) => e.stopPropagation()} />
                            <div className="absolute z-50 bottom-full left-1/2 -translate-x-1/2 mb-2 w-56 p-2.5 bg-zinc-950/95 backdrop-blur border border-zinc-800 text-zinc-300 text-[10px] rounded-xl shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 text-center font-normal whitespace-normal pointer-events-none">
                                Total free coins distributed to users as rank-up rewards.
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Interactive Graph */}
            <div className="bg-card border border-border p-6 rounded-2xl shadow-sm">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                    <div>
                        <h2 className="text-lg font-bold text-foreground">Financial Trend Chart</h2>
                        <p className="text-xs text-muted-foreground">Historical daily view of deposits, withdrawals, and shop sales volumes</p>
                    </div>

                    {/* Chart toggles */}
                    <div className="flex flex-col items-end gap-2.5">
                        <div className="flex flex-wrap items-center gap-3 bg-muted/30 border border-border/40 p-1.5 rounded-xl">
                            <button
                                onClick={() => setVisibleLines({...visibleLines, Deposits: !visibleLines.Deposits})}
                                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                                    visibleLines.Deposits 
                                    ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' 
                                    : 'text-muted-foreground opacity-50 border border-transparent'
                                }`}
                            >
                                <span className="w-2 h-2 bg-emerald-500 rounded-full inline-block" />
                                Deposits
                            </button>
                            <button
                                onClick={() => setVisibleLines({...visibleLines, Withdrawals: !visibleLines.Withdrawals})}
                                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                                    visibleLines.Withdrawals 
                                    ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20' 
                                    : 'text-muted-foreground opacity-50 border border-transparent'
                                }`}
                            >
                                <span className="w-2 h-2 bg-rose-500 rounded-full inline-block" />
                                Withdrawals
                            </button>
                            <button
                                onClick={() => setVisibleLines({...visibleLines, ShopSales: !visibleLines.ShopSales})}
                                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                                    visibleLines.ShopSales 
                                    ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20' 
                                    : 'text-muted-foreground opacity-50 border border-transparent'
                                }`}
                            >
                                <span className="w-2 h-2 bg-blue-500 rounded-full inline-block" />
                                Shop Sales
                            </button>
                            
                            <div className="h-4 w-px bg-border/60 mx-1" />
                            
                            <button
                                onClick={() => setShowMoreFilters(!showMoreFilters)}
                                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                                    showMoreFilters 
                                    ? 'bg-indigo-600/20 text-indigo-400 border border-indigo-500/30' 
                                    : 'bg-background/40 hover:bg-background/80 text-muted-foreground border border-border/50'
                                }`}
                            >
                                <Filter size={12} />
                                <span>More Filters</span>
                            </button>

                            <button
                                onClick={resetChartFilters}
                                className="px-2.5 py-1.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 rounded-lg text-xs font-bold transition-all"
                            >
                                Clear
                            </button>
                        </div>

                        {/* Collapsible More Filters Row */}
                        {showMoreFilters && (
                            <div className="flex flex-wrap items-center gap-3 bg-card border border-border/40 p-1.5 rounded-xl shadow-md animate-in slide-in-from-top-2 duration-200">
                                <button
                                    onClick={() => setVisibleLines({...visibleLines, ShopProfit: !visibleLines.ShopProfit})}
                                    className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                                        visibleLines.ShopProfit 
                                        ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20' 
                                        : 'text-muted-foreground opacity-50 border border-transparent'
                                    }`}
                                >
                                    <span className="w-2 h-2 bg-indigo-500 rounded-full inline-block" />
                                    Shop Profit
                                </button>
                                <button
                                    onClick={() => setVisibleLines({...visibleLines, TournamentProfitPlatform: !visibleLines.TournamentProfitPlatform})}
                                    className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                                        visibleLines.TournamentProfitPlatform 
                                        ? 'bg-fuchsia-500/10 text-fuchsia-400 border border-fuchsia-500/20' 
                                        : 'text-muted-foreground opacity-50 border border-transparent'
                                    }`}
                                >
                                    <span className="w-2 h-2 bg-fuchsia-500 rounded-full inline-block" />
                                    Platform Tournaments (Comm.)
                                </button>
                                <button
                                    onClick={() => setVisibleLines({...visibleLines, TournamentProfitUser: !visibleLines.TournamentProfitUser})}
                                    className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                                        visibleLines.TournamentProfitUser 
                                        ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20' 
                                        : 'text-muted-foreground opacity-50 border border-transparent'
                                    }`}
                                >
                                    <span className="w-2 h-2 bg-indigo-400 rounded-full inline-block" />
                                    User Tournaments (Comm.)
                                </button>
                                <button
                                    onClick={() => setVisibleLines({...visibleLines, Freebies1k: !visibleLines.Freebies1k})}
                                    className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                                        visibleLines.Freebies1k 
                                        ? 'bg-purple-500/10 text-purple-400 border border-purple-500/20' 
                                        : 'text-muted-foreground opacity-50 border border-transparent'
                                    }`}
                                >
                                    <span className="w-2 h-2 bg-purple-400 rounded-full inline-block" />
                                    1k Spin Freebie
                                </button>
                                <button
                                    onClick={() => setVisibleLines({...visibleLines, FreebiesDaily: !visibleLines.FreebiesDaily})}
                                    className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                                        visibleLines.FreebiesDaily 
                                        ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' 
                                        : 'text-muted-foreground opacity-50 border border-transparent'
                                    }`}
                                >
                                    <span className="w-2 h-2 bg-amber-400 rounded-full inline-block" />
                                    Daily Collect Freebie
                                </button>
                                <button
                                    onClick={() => setVisibleLines({...visibleLines, FreebiesLucky: !visibleLines.FreebiesLucky})}
                                    className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                                        visibleLines.FreebiesLucky 
                                        ? 'bg-pink-500/10 text-pink-400 border border-pink-500/20' 
                                        : 'text-muted-foreground opacity-50 border border-transparent'
                                    }`}
                                >
                                    <span className="w-2 h-2 bg-pink-400 rounded-full inline-block" />
                                    Lucky Spin Freebie
                                </button>
                                <button
                                    onClick={() => setVisibleLines({...visibleLines, FreebiesRank: !visibleLines.FreebiesRank})}
                                    className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                                        visibleLines.FreebiesRank 
                                        ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20' 
                                        : 'text-muted-foreground opacity-50 border border-transparent'
                                    }`}
                                >
                                    <span className="w-2 h-2 bg-blue-400 rounded-full inline-block" />
                                    Rank Up Rewards
                                </button>
                                <button
                                    onClick={() => setVisibleLines({...visibleLines, PrizePayouts: !visibleLines.PrizePayouts})}
                                    className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                                        visibleLines.PrizePayouts 
                                        ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20' 
                                        : 'text-muted-foreground opacity-50 border border-transparent'
                                    }`}
                                >
                                    <span className="w-2 h-2 bg-cyan-500 rounded-full inline-block" />
                                    Prize Payouts
                                </button>
                                <button
                                    onClick={() => setVisibleLines({...visibleLines, AdminAdjustments: !visibleLines.AdminAdjustments})}
                                    className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                                        visibleLines.AdminAdjustments 
                                        ? 'bg-orange-500/10 text-orange-400 border border-orange-500/20' 
                                        : 'text-muted-foreground opacity-50 border border-transparent'
                                    }`}
                                >
                                    <span className="w-2 h-2 bg-orange-500 rounded-full inline-block" />
                                    Admin Adjustments
                                </button>
                            </div>
                        )}
                    </div>
                </div>

                {loading ? (
                    <div className="h-[240px] flex items-center justify-center">
                        <RefreshCw className="animate-spin text-indigo-500/50" size={28} />
                    </div>
                ) : chartData.length === 0 ? (
                    <div className="h-[240px] flex flex-col items-center justify-center text-center border border-dashed border-border rounded-xl bg-muted/10">
                        <TrendingUp size={36} className="text-muted-foreground mb-2" />
                        <span className="font-bold text-foreground">No Trend Data Logged</span>
                        <span className="text-xs text-muted-foreground">Adjust filters or date range selector to reload chart.</span>
                    </div>
                ) : (
                    <div ref={chartRef} className="relative w-full overflow-hidden select-none">
                        {/* Custom Interactive Tooltip */}
                        {hoverIndex !== null && chartData[hoverIndex] && (
                            <div 
                                className="absolute bg-card/95 backdrop-blur-md border border-border p-3 rounded-xl shadow-xl z-20 pointer-events-none transition-all duration-75 text-xs min-w-[140px]"
                                style={{ 
                                    left: `${Math.min(tooltipPos.x, (chartRef.current?.getBoundingClientRect().width || plotWidth) - 150)}px`, 
                                    top: `${Math.max(10, tooltipPos.y)}px` 
                                }}
                            >
                                <div className="font-bold text-foreground pb-1.5 border-b border-border/50 mb-1.5">
                                    {new Date(chartData[hoverIndex].date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', timeZone: 'UTC' })}
                                </div>
                                <div className="space-y-1.5">
                                    {visibleLines.Deposits && (
                                        <div className="flex justify-between items-center text-emerald-400">
                                            <span>Deposits:</span>
                                            <span className="font-mono font-bold">Rs {chartData[hoverIndex].Deposits.toLocaleString()}</span>
                                        </div>
                                    )}
                                    {visibleLines.Withdrawals && (
                                        <div className="flex justify-between items-center text-rose-400">
                                            <span>Withdrawals:</span>
                                            <span className="font-mono font-bold">Rs {chartData[hoverIndex].Withdrawals.toLocaleString()}</span>
                                        </div>
                                    )}
                                    {visibleLines.ShopSales && (
                                        <div className="flex justify-between items-center text-blue-400">
                                            <span>Shop Sales:</span>
                                            <span className="font-mono font-bold">{chartData[hoverIndex].ShopSales.toLocaleString()} Coins</span>
                                        </div>
                                    )}
                                    {visibleLines.ShopProfit && (
                                        <div className="flex justify-between items-center text-indigo-400">
                                            <span>Shop Profit:</span>
                                            <span className="font-mono font-bold">{chartData[hoverIndex].ShopProfit.toLocaleString()} Coins</span>
                                        </div>
                                    )}
                                    {visibleLines.TournamentProfitPlatform && (
                                        <div className="flex justify-between items-center text-fuchsia-400">
                                            <span>Platform Tournaments (Comm.):</span>
                                            <span className="font-mono font-bold">{chartData[hoverIndex].TournamentProfitPlatform.toLocaleString()} Coins</span>
                                        </div>
                                    )}
                                    {visibleLines.TournamentProfitUser && (
                                        <div className="flex justify-between items-center text-indigo-400">
                                            <span>User Tournaments (Comm.):</span>
                                            <span className="font-mono font-bold">{chartData[hoverIndex].TournamentProfitUser.toLocaleString()} Coins</span>
                                        </div>
                                    )}
                                    {visibleLines.Freebies1k && (
                                        <div className="flex justify-between items-center text-purple-400">
                                            <span>1k Spin Freebie:</span>
                                            <span className="font-mono font-bold">{chartData[hoverIndex].Freebies1k.toLocaleString()} Coins</span>
                                        </div>
                                    )}
                                    {visibleLines.FreebiesDaily && (
                                        <div className="flex justify-between items-center text-amber-400">
                                            <span>Daily Collect Freebie:</span>
                                            <span className="font-mono font-bold">{chartData[hoverIndex].FreebiesDaily.toLocaleString()} Coins</span>
                                        </div>
                                    )}
                                    {visibleLines.FreebiesLucky && (
                                        <div className="flex justify-between items-center text-pink-400">
                                            <span>Lucky Spin Freebie:</span>
                                            <span className="font-mono font-bold">{chartData[hoverIndex].FreebiesLucky.toLocaleString()} Coins</span>
                                        </div>
                                    )}
                                    {visibleLines.FreebiesRank && (
                                        <div className="flex justify-between items-center text-blue-400">
                                            <span>Rank Up Rewards:</span>
                                            <span className="font-mono font-bold">{chartData[hoverIndex].FreebiesRank.toLocaleString()} Coins</span>
                                        </div>
                                    )}
                                    {visibleLines.PrizePayouts && (
                                        <div className="flex justify-between items-center text-cyan-400">
                                            <span>Prize Payouts:</span>
                                            <span className="font-mono font-bold">{chartData[hoverIndex].PrizePayouts.toLocaleString()} Coins</span>
                                        </div>
                                    )}
                                    {visibleLines.AdminAdjustments && (
                                        <div className="flex justify-between items-center text-orange-400">
                                            <span>Admin Adjustments:</span>
                                            <span className="font-mono font-bold">{chartData[hoverIndex].AdminAdjustments.toLocaleString()} Coins</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Chart Render */}
                        <svg 
                            viewBox={`0 0 ${plotWidth} ${plotHeight}`} 
                            width="100%" 
                            height="100%"
                            className="overflow-visible"
                            onMouseMove={handleMouseMove}
                            onMouseLeave={() => setHoverIndex(null)}
                        >
                            {/* Grids */}
                            {yTicks.map((tick, i) => (
                                <g key={i}>
                                    <line 
                                        x1={padding.left} 
                                        y1={tick.y} 
                                        x2={plotWidth - padding.right} 
                                        y2={tick.y} 
                                        stroke="currentColor" 
                                        className="text-border/40" 
                                        strokeWidth={1}
                                        strokeDasharray="2 4"
                                    />
                                    <text 
                                        x={padding.left - 10} 
                                        y={tick.y + 4} 
                                        textAnchor="end" 
                                        className="text-[9px] font-mono fill-muted-foreground"
                                    >
                                        {tick.val >= 1000 ? `${(tick.val / 1000).toFixed(0)}k` : tick.val}
                                    </text>
                                </g>
                            ))}

                            {/* Hover Tracker line */}
                            {hoverIndex !== null && points[hoverIndex] && (
                                <line 
                                    x1={points[hoverIndex].x} 
                                    y1={padding.top} 
                                    x2={points[hoverIndex].x} 
                                    y2={plotHeight - padding.bottom} 
                                    stroke="var(--primary)" 
                                    strokeWidth={1.5}
                                    strokeDasharray="3 3"
                                    className="opacity-75"
                                />
                            )}

                            {/* Deposits Path Line */}
                            {visibleLines.Deposits && points.length > 1 && (
                                <path 
                                    d={points.map((p, idx) => `${idx === 0 ? 'M' : 'L'} ${p.x} ${(p as any).Deposits}`).join(' ')}
                                    fill="none" 
                                    stroke="#10b981" 
                                    strokeWidth={2.5}
                                    strokeLinecap="round"
                                />
                            )}

                            {/* Withdrawals Path Line */}
                            {visibleLines.Withdrawals && points.length > 1 && (
                                <path 
                                    d={points.map((p, idx) => `${idx === 0 ? 'M' : 'L'} ${p.x} ${(p as any).Withdrawals}`).join(' ')}
                                    fill="none" 
                                    stroke="#f43f5e" 
                                    strokeWidth={2.5}
                                    strokeLinecap="round"
                                />
                            )}

                            {/* Shop Sales Path Line */}
                            {visibleLines.ShopSales && points.length > 1 && (
                                <path 
                                    d={points.map((p, idx) => `${idx === 0 ? 'M' : 'L'} ${p.x} ${(p as any).ShopSales}`).join(' ')}
                                    fill="none" 
                                    stroke="#3b82f6" 
                                    strokeWidth={2.5}
                                    strokeLinecap="round"
                                />
                            )}

                            {/* Shop Profit Path Line */}
                            {visibleLines.ShopProfit && points.length > 1 && (
                                <path 
                                    d={points.map((p, idx) => `${idx === 0 ? 'M' : 'L'} ${p.x} ${(p as any).ShopProfit}`).join(' ')}
                                    fill="none" 
                                    stroke="#6366f1" 
                                    strokeWidth={2.5}
                                    strokeLinecap="round"
                                />
                            )}

                            {/* Platform Tournaments Profit Path Line */}
                            {visibleLines.TournamentProfitPlatform && points.length > 1 && (
                                <path 
                                    d={points.map((p, idx) => `${idx === 0 ? 'M' : 'L'} ${p.x} ${(p as any).TournamentProfitPlatform}`).join(' ')}
                                    fill="none" 
                                    stroke="#d946ef" 
                                    strokeWidth={2.5}
                                    strokeLinecap="round"
                                />
                            )}

                            {/* User Tournaments Profit Path Line */}
                            {visibleLines.TournamentProfitUser && points.length > 1 && (
                                <path 
                                    d={points.map((p, idx) => `${idx === 0 ? 'M' : 'L'} ${p.x} ${(p as any).TournamentProfitUser}`).join(' ')}
                                    fill="none" 
                                    stroke="#818cf8" 
                                    strokeWidth={2.5}
                                    strokeLinecap="round"
                                />
                            )}

                            {/* Freebies 1k Path Line */}
                            {visibleLines.Freebies1k && points.length > 1 && (
                                <path 
                                    d={points.map((p, idx) => `${idx === 0 ? 'M' : 'L'} ${p.x} ${(p as any).Freebies1k}`).join(' ')}
                                    fill="none" 
                                    stroke="#c084fc" 
                                    strokeWidth={2.5}
                                    strokeLinecap="round"
                                />
                            )}

                            {/* Freebies Daily Path Line */}
                            {visibleLines.FreebiesDaily && points.length > 1 && (
                                <path 
                                    d={points.map((p, idx) => `${idx === 0 ? 'M' : 'L'} ${p.x} ${(p as any).FreebiesDaily}`).join(' ')}
                                    fill="none" 
                                    stroke="#fbbf24" 
                                    strokeWidth={2.5}
                                    strokeLinecap="round"
                                />
                            )}

                            {/* Freebies Lucky Path Line */}
                            {visibleLines.FreebiesLucky && points.length > 1 && (
                                <path 
                                    d={points.map((p, idx) => `${idx === 0 ? 'M' : 'L'} ${p.x} ${(p as any).FreebiesLucky}`).join(' ')}
                                    fill="none" 
                                    stroke="#ec4899" 
                                    strokeWidth={2.5}
                                    strokeLinecap="round"
                                />
                            )}

                            {/* Freebies Rank Path Line */}
                            {visibleLines.FreebiesRank && points.length > 1 && (
                                <path 
                                    d={points.map((p, idx) => `${idx === 0 ? 'M' : 'L'} ${p.x} ${(p as any).FreebiesRank}`).join(' ')}
                                    fill="none" 
                                    stroke="#60a5fa" 
                                    strokeWidth={2.5}
                                    strokeLinecap="round"
                                />
                            )}

                            {/* Prize Payouts Path Line */}
                            {visibleLines.PrizePayouts && points.length > 1 && (
                                <path 
                                    d={points.map((p, idx) => `${idx === 0 ? 'M' : 'L'} ${p.x} ${(p as any).PrizePayouts}`).join(' ')}
                                    fill="none" 
                                    stroke="#06b6d4" 
                                    strokeWidth={2.5}
                                    strokeLinecap="round"
                                />
                            )}

                            {/* Admin Adjustments Path Line */}
                            {visibleLines.AdminAdjustments && points.length > 1 && (
                                <path 
                                    d={points.map((p, idx) => `${idx === 0 ? 'M' : 'L'} ${p.x} ${(p as any).AdminAdjustments}`).join(' ')}
                                    fill="none" 
                                    stroke="#f97316" 
                                    strokeWidth={2.5}
                                    strokeLinecap="round"
                                />
                            )}

                            {/* Points nodes indicator dots on Hover */}
                            {hoverIndex !== null && points[hoverIndex] && (
                                <g>
                                    {visibleLines.Deposits && (
                                        <circle 
                                            cx={points[hoverIndex].x} 
                                            cy={(points[hoverIndex] as any).Deposits} 
                                            r={5} 
                                            fill="#10b981" 
                                            stroke="var(--card)"
                                            strokeWidth={1.5}
                                        />
                                    )}
                                    {visibleLines.Withdrawals && (
                                        <circle 
                                            cx={points[hoverIndex].x} 
                                            cy={(points[hoverIndex] as any).Withdrawals} 
                                            r={5} 
                                            fill="#f43f5e" 
                                            stroke="var(--card)"
                                            strokeWidth={1.5}
                                        />
                                    )}
                                    {visibleLines.ShopSales && (
                                        <circle 
                                            cx={points[hoverIndex].x} 
                                            cy={(points[hoverIndex] as any).ShopSales} 
                                            r={5} 
                                            fill="#3b82f6" 
                                            stroke="var(--card)"
                                            strokeWidth={1.5}
                                        />
                                    )}
                                    {visibleLines.ShopProfit && (points[hoverIndex] as any).ShopProfit !== undefined && (
                                        <circle 
                                            cx={points[hoverIndex].x} 
                                            cy={(points[hoverIndex] as any).ShopProfit} 
                                            r={5} 
                                            fill="#6366f1" 
                                            stroke="var(--card)"
                                            strokeWidth={1.5}
                                        />
                                    )}
                                    {visibleLines.TournamentProfitPlatform && (points[hoverIndex] as any).TournamentProfitPlatform !== undefined && (
                                        <circle 
                                            cx={points[hoverIndex].x} 
                                            cy={(points[hoverIndex] as any).TournamentProfitPlatform} 
                                            r={5} 
                                            fill="#d946ef" 
                                            stroke="var(--card)"
                                            strokeWidth={1.5}
                                        />
                                    )}
                                    {visibleLines.TournamentProfitUser && (points[hoverIndex] as any).TournamentProfitUser !== undefined && (
                                        <circle 
                                            cx={points[hoverIndex].x} 
                                            cy={(points[hoverIndex] as any).TournamentProfitUser} 
                                            r={5} 
                                            fill="#818cf8" 
                                            stroke="var(--card)"
                                            strokeWidth={1.5}
                                        />
                                    )}
                                    {visibleLines.Freebies1k && (points[hoverIndex] as any).Freebies1k !== undefined && (
                                        <circle 
                                            cx={points[hoverIndex].x} 
                                            cy={(points[hoverIndex] as any).Freebies1k} 
                                            r={5} 
                                            fill="#c084fc" 
                                            stroke="var(--card)"
                                            strokeWidth={1.5}
                                        />
                                    )}
                                    {visibleLines.FreebiesDaily && (points[hoverIndex] as any).FreebiesDaily !== undefined && (
                                        <circle 
                                            cx={points[hoverIndex].x} 
                                            cy={(points[hoverIndex] as any).FreebiesDaily} 
                                            r={5} 
                                            fill="#fbbf24" 
                                            stroke="var(--card)"
                                            strokeWidth={1.5}
                                        />
                                    )}
                                    {visibleLines.FreebiesLucky && (points[hoverIndex] as any).FreebiesLucky !== undefined && (
                                        <circle 
                                            cx={points[hoverIndex].x} 
                                            cy={(points[hoverIndex] as any).FreebiesLucky} 
                                            r={5} 
                                            fill="#ec4899" 
                                            stroke="var(--card)"
                                            strokeWidth={1.5}
                                        />
                                    )}
                                    {visibleLines.PrizePayouts && (points[hoverIndex] as any).PrizePayouts !== undefined && (
                                        <circle 
                                            cx={points[hoverIndex].x} 
                                            cy={(points[hoverIndex] as any).PrizePayouts} 
                                            r={5} 
                                            fill="#06b6d4" 
                                            stroke="var(--card)"
                                            strokeWidth={1.5}
                                        />
                                    )}
                                    {visibleLines.AdminAdjustments && (points[hoverIndex] as any).AdminAdjustments !== undefined && (
                                        <circle 
                                            cx={points[hoverIndex].x} 
                                            cy={(points[hoverIndex] as any).AdminAdjustments} 
                                            r={5} 
                                            fill="#f97316" 
                                            stroke="var(--card)"
                                            strokeWidth={1.5}
                                        />
                                    )}
                                </g>
                            )}

                            {/* X Axis Line */}
                            <line 
                                x1={padding.left} 
                                y1={plotHeight - padding.bottom} 
                                x2={plotWidth - padding.right} 
                                y2={plotHeight - padding.bottom} 
                                stroke="currentColor" 
                                className="text-border" 
                                strokeWidth={1}
                            />

                            {/* X Axis Labels */}
                            {dates.map((tick, i) => (
                                <g key={i}>
                                    <line 
                                        x1={tick.x} 
                                        y1={plotHeight - padding.bottom} 
                                        x2={tick.x} 
                                        y2={plotHeight - padding.bottom + 4} 
                                        stroke="currentColor" 
                                        className="text-border"
                                    />
                                    <text 
                                        x={tick.x} 
                                        y={plotHeight - padding.bottom + 16} 
                                        textAnchor="middle" 
                                        className="text-[9px] fill-muted-foreground"
                                    >
                                        {tick.label}
                                    </text>
                                </g>
                            ))}
                        </svg>
                    </div>
                )}
            </div>

            {/* Detailed audit logs */}
            <div className="bg-card border border-border p-6 rounded-2xl shadow-sm">
                <div className="mb-6">
                    <h2 className="text-lg font-bold text-foreground">Transaction Audits</h2>
                    <p className="text-xs text-muted-foreground">Audit breakdown of matched logs for verification</p>
                </div>

                {/* Category Filter badges */}
                <div className="pb-6 border-b border-border/40 mb-6">
                    <div className="flex flex-wrap items-center gap-2">
                        <div className="flex items-center gap-2 text-xs text-muted-foreground font-bold mr-2">
                            <Filter size={14} />
                            <span>Categories:</span>
                        </div>
                        
                        {/* Primary Categories */}
                        {CATEGORY_OPTIONS.filter(opt => ['deposit', 'withdrawal', 'shop_purchase', 'prize_winnings'].includes(opt.value)).map((opt) => {
                            const isSelected = selectedCategories.includes(opt.value);
                            return (
                                <button
                                    key={opt.value}
                                    onClick={() => toggleCategory(opt.value)}
                                    className={`px-3 py-1 rounded-full text-xs font-semibold border transition-all cursor-pointer ${
                                        isSelected 
                                        ? `${opt.color.split(' ')[0]} border-indigo-500 text-foreground shadow-sm` 
                                        : 'bg-transparent text-muted-foreground border-border hover:bg-muted/30'
                                    }`}
                                >
                                    {opt.label}
                                </button>
                            );
                        })}

                        <button
                            onClick={() => setShowGlobalMoreFilters(!showGlobalMoreFilters)}
                            className={`flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold border transition-all cursor-pointer ${
                                showGlobalMoreFilters 
                                ? 'bg-indigo-600/20 border-indigo-500 text-indigo-400 font-bold' 
                                : 'bg-transparent text-muted-foreground border-border hover:bg-muted/30'
                            }`}
                        >
                            <span>More Categories</span>
                            <span className={`transition-transform duration-200 text-[8px] ${showGlobalMoreFilters ? 'rotate-180' : ''}`}>▼</span>
                        </button>

                        <div className="flex items-center gap-2 ml-auto">
                            <button
                                onClick={handleExportCSV}
                                className="flex items-center gap-1.5 bg-blue-600/10 hover:bg-blue-600/20 border border-blue-500/20 px-3.5 py-1.5 rounded-xl text-xs text-blue-400 font-bold transition-colors active:scale-95 cursor-pointer"
                            >
                                <Download size={14} />
                                <span>Export to CSV</span>
                            </button>

                            {(selectedCategories.length > 0 || datePreset !== 'month' || !visibleLines.Deposits || !visibleLines.Withdrawals || !visibleLines.ShopSales || visibleLines.ShopProfit || visibleLines.TournamentProfitPlatform || visibleLines.TournamentProfitUser || visibleLines.Freebies1k || visibleLines.FreebiesDaily || visibleLines.FreebiesLucky || visibleLines.PrizePayouts) && (
                                <button
                                    onClick={resetAllFilters}
                                    className="flex items-center gap-1.5 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 px-3.5 py-1.5 rounded-xl text-xs text-red-400 font-bold transition-colors"
                                >
                                    <X size={14} />
                                    <span>Reset Filters</span>
                                </button>
                            )}
                        </div>
                    </div>

                    {showGlobalMoreFilters && (
                        <div className="flex flex-wrap items-center gap-2 mt-3 pt-3 border-t border-border/20 animate-in slide-in-from-top-1 duration-200">
                            {CATEGORY_OPTIONS.filter(opt => !['deposit', 'withdrawal', 'shop_purchase', 'prize_winnings'].includes(opt.value)).map((opt) => {
                                const isSelected = selectedCategories.includes(opt.value);
                                return (
                                    <button
                                        key={opt.value}
                                        onClick={() => toggleCategory(opt.value)}
                                        className={`px-3 py-1 rounded-full text-xs font-semibold border transition-all cursor-pointer ${
                                            isSelected 
                                            ? `${opt.color.split(' ')[0]} border-indigo-500 text-foreground shadow-sm` 
                                            : 'bg-transparent text-muted-foreground border-border hover:bg-muted/30'
                                        }`}
                                    >
                                        {opt.label}
                                    </button>
                                );
                            })}
                        </div>
                    )}
                </div>

                {loading ? (
                    <div className="space-y-3">
                        {Array.from({ length: 5 }).map((_, i) => (
                            <div key={i} className="h-14 bg-muted rounded-xl animate-pulse" />
                        ))}
                    </div>
                ) : logs.length === 0 ? (
                    <div className="text-center py-12 border border-dashed border-border rounded-xl bg-muted/10">
                        <Search size={32} className="text-muted-foreground mx-auto mb-2" />
                        <h3 className="font-bold text-foreground">No Audits Found</h3>
                        <p className="text-xs text-muted-foreground">Adjust category checkboxes or date period to fetch data.</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse min-w-[700px]">
                            <thead>
                                <tr className="border-b border-border text-xs font-bold text-muted-foreground uppercase">
                                    <th className="py-3 px-4">Timestamp</th>
                                    <th className="py-3 px-4">Type</th>
                                    <th className="py-3 px-4">User</th>
                                    <th className="py-3 px-4">Amount</th>
                                    <th className="py-3 px-4">Description</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border/30 text-sm">
                                {logs.map((log) => {
                                    const subCat = (log as any).subCategory || log.type;
                                    const matchingCategory = CATEGORY_OPTIONS.find(o => o.value === subCat);
                                    const typeColor = matchingCategory?.color || 'bg-muted text-muted-foreground';
                                    const typeLabel = matchingCategory?.label || subCat;

                                    return (
                                        <tr key={log._id} className="hover:bg-muted/10 transition-colors">
                                            <td className="py-3 px-4 whitespace-nowrap font-mono text-xs text-muted-foreground">
                                                {new Date(log.timestamp).toLocaleString('en-US', {
                                                    year: 'numeric',
                                                    month: 'short',
                                                    day: 'numeric',
                                                    hour: '2-digit',
                                                    minute: '2-digit'
                                                })}
                                            </td>
                                            <td className="py-3 px-4">
                                                <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold border inline-block ${typeColor}`}>
                                                    {typeLabel}
                                                </span>
                                            </td>
                                            <td className="py-3 px-4">
                                                {log.userId ? (
                                                    <div className="flex flex-col">
                                                        <span className="font-semibold text-foreground leading-tight">{log.userId.name}</span>
                                                        <span className="text-xs text-muted-foreground leading-none">{log.userId.email}</span>
                                                        {log.userId.inGameName && (
                                                            <span className="text-[10px] text-indigo-400 font-mono mt-0.5">IGN: {log.userId.inGameName}</span>
                                                        )}
                                                        {(log as any).adminId && (log as any).adminId.name && (
                                                            <span className="text-[10px] text-amber-500 font-semibold font-sans mt-1 bg-amber-500/5 border border-amber-500/10 px-1.5 py-0.5 rounded w-fit leading-tight">
                                                                By Admin: {(log as any).adminId.name}
                                                            </span>
                                                        )}
                                                    </div>
                                                ) : (
                                                    <span className="text-muted-foreground font-mono text-xs">System / Admin</span>
                                                )}
                                            </td>
                                            <td className={`py-3 px-4 font-mono font-bold whitespace-nowrap text-right ${
                                                subCat === 'admin_adjustment'
                                                    ? log.amount < 0 ? 'text-emerald-400' : 'text-rose-400'
                                                    : ['deposit', 'shop_purchase', 'tournament_commission_platform', 'tournament_commission_user', 'prize_winnings'].includes(subCat) 
                                                        ? 'text-emerald-400' 
                                                        : 'text-rose-400'
                                            }`}>
                                                {['deposit', 'withdrawal'].includes(subCat) ? `Rs ${log.amount.toLocaleString()}` : `${subCat === 'admin_adjustment' && log.amount >= 0 ? '+' : ''}${log.amount.toLocaleString()} coins`}
                                            </td>
                                            <td className="py-3 px-4 max-w-[280px] truncate text-muted-foreground" title={log.description}>
                                                {log.description}
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}

                {/* Pagination Footer */}
                {totalPages > 1 && (
                    <div className="mt-6 flex flex-col sm:flex-row justify-between items-center gap-4 bg-background border border-border p-4 rounded-xl">
                        <span className="text-xs text-muted-foreground font-medium">
                            Showing page <span className="text-foreground font-bold">{page}</span> of <span className="text-foreground font-bold">{totalPages}</span> ({totalLogs} total records)
                        </span>

                        <div className="flex items-center gap-1">
                            <button
                                onClick={() => setPage(prev => Math.max(1, prev - 1))}
                                disabled={page === 1}
                                className="px-3 py-1.5 bg-background border border-border rounded-lg text-xs font-bold text-foreground hover:bg-muted/40 disabled:opacity-50 disabled:pointer-events-none transition-all cursor-pointer"
                            >
                                Previous
                            </button>

                            {Array.from({ length: totalPages }).map((_, i) => {
                                const pageNum = i + 1;
                                // Only show pages close to the current page to avoid clutter
                                if (totalPages > 5 && Math.abs(pageNum - page) > 1 && pageNum !== 1 && pageNum !== totalPages) {
                                    if (pageNum === 2 || pageNum === totalPages - 1) {
                                        return <span key={pageNum} className="px-2 text-muted-foreground text-xs font-bold">...</span>;
                                    }
                                    return null;
                                }

                                return (
                                    <button
                                        key={pageNum}
                                        onClick={() => setPage(pageNum)}
                                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer border ${
                                            page === pageNum
                                            ? 'bg-indigo-600 border-indigo-600 text-white shadow-sm'
                                            : 'bg-background border-border text-muted-foreground hover:bg-muted/40 hover:text-foreground'
                                        }`}
                                    >
                                        {pageNum}
                                    </button>
                                );
                            })}

                            <button
                                onClick={() => setPage(prev => Math.min(totalPages, prev + 1))}
                                disabled={page === totalPages}
                                className="px-3 py-1.5 bg-background border border-border rounded-lg text-xs font-bold text-foreground hover:bg-muted/40 disabled:opacity-50 disabled:pointer-events-none transition-all cursor-pointer"
                            >
                                Next
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
