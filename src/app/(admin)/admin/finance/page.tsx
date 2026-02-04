
'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { RefreshCcw, X, ShieldAlert, DollarSign, TrendingUp, Eye, AlertCircle, CheckCircle, XCircle, Calendar, Filter, CreditCard } from 'lucide-react';

interface Transaction {
    _id: string;
    amount: number;
    type: string;
    status: string;
    trxID?: string;
    proofImage?: string;
    rejectionReason?: string;
    details?: any; // Flexible type for withdrawal details
    user: {
        _id: string;
        name: string;
        email: string;
        inGameName: string;
    };
    createdAt: string;
    method?: string;
    description: string;
}

interface FinanceStats {
    summary: {
        cashInHand: number;
        totalRevenue: number;
        totalDeposits: number;
        totalWithdrawals: number;
    };
    profitTable: {
        id: string;
        name: string;
        revenue: number;
        expenses: number;
        netProfit: number;
    }[];
}

export default function AdminFinancePage() {
    const [activeTab, setActiveTab] = useState<'deposits' | 'withdrawals' | 'reports'>('deposits');
    const [isLoading, setIsLoading] = useState(false);

    // Data States
    const [deposits, setDeposits] = useState<Transaction[]>([]);
    const [withdrawals, setWithdrawals] = useState<Transaction[]>([]);
    const [stats, setStats] = useState<FinanceStats | null>(null);

    // Modal States
    const [selectedTrx, setSelectedTrx] = useState<Transaction | null>(null);
    const [editAmount, setEditAmount] = useState<number>(0);
    const [rejectionReason, setRejectionReason] = useState('');
    const [isProcessing, setIsProcessing] = useState(false);

    const [showSafetyCheck, setShowSafetyCheck] = useState(false);
    const [showFinalReview, setShowFinalReview] = useState(false);
    const [showRejectReview, setShowRejectReview] = useState(false);



    const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('pending');
    const [dateFilter, setDateFilter] = useState<'today' | 'week' | 'month' | '3m' | '6m' | 'year'>('today');
    const [methodFilter, setMethodFilter] = useState('all');
    const [availableMethods, setAvailableMethods] = useState<string[]>([]);
    const [pendingCounts, setPendingCounts] = useState({ deposits: 0, withdrawals: 0, methods: {} as any });
    const [activeFilterModal, setActiveFilterModal] = useState<'status' | 'method' | 'date' | null>(null);

    useEffect(() => {
        const fetchMethods = async () => {
            try {
                const res = await fetch('/api/finance/methods');
                if (res.ok) {
                    const data = await res.json();
                    const methods = Array.from(new Set(data.map((m: any) => m.bankName)));
                    setAvailableMethods(methods as string[]);
                }
            } catch (error) {
                console.error('Failed to fetch payment methods', error);
            }
        };

        const fetchStats = async () => {
            try {
                const res = await fetch('/api/admin/finance/stats');
                if (res.ok) {
                    const data = await res.json();
                    if (data.summary) {
                        setPendingCounts({
                            deposits: data.summary.pendingDepositsCount || 0,
                            withdrawals: data.summary.pendingWithdrawalsCount || 0,
                            methods: data.summary.methodCounts || {}
                        });
                    }
                }
            } catch (error) {
                console.error('Failed to fetch stats', error);
            }
        };

        fetchMethods();
        fetchStats();
    }, []);

    useEffect(() => {
        fetchData();
    }, [activeTab, statusFilter, dateFilter, methodFilter]);

    const fetchData = async () => {
        setIsLoading(true);
        try {
            const query = `?status=${statusFilter}&dateRange=${dateFilter}&method=${methodFilter}`;
            if (activeTab === 'deposits') {
                const res = await fetch(`/api/admin/finance/transactions${query}&type=deposit`);
                const data = await res.json();
                setDeposits(Array.isArray(data) ? data : []);
            } else if (activeTab === 'withdrawals') {
                const res = await fetch(`/api/admin/finance/transactions${query}&type=withdrawal`);
                const data = await res.json();
                setWithdrawals(Array.isArray(data) ? data : []);
            } else if (activeTab === 'reports') {
                const res = await fetch('/api/admin/finance/stats');
                const data = await res.json();
                setStats(data);
            }
        } catch (error) {
            console.error('Error fetching data:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleOpenReview = (trx: Transaction) => {
        setSelectedTrx(trx);
        setEditAmount(trx.amount);
        setRejectionReason('');
    };

    const handleCloseReview = () => {
        setSelectedTrx(null);
        setIsProcessing(false);
        setShowSafetyCheck(false);
        setShowFinalReview(false);
        setShowSafetyCheck(false);
        setShowFinalReview(false);
        setShowRejectReview(false);
    };

    const processTransaction = async (action: 'approved' | 'rejected') => {
        console.log('Processing Transaction:', action, selectedTrx); // DEBUG
        if (!selectedTrx) {
            console.error('No selected transaction!');
            return;
        }
        setIsProcessing(true);

        try {
            console.log(`Sending PATCH to /api/admin/finance/deposit/${selectedTrx._id}`);
            const res = await fetch(`/api/admin/finance/deposit/${selectedTrx._id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    status: action,
                    amount: editAmount,
                    rejectionReason: action === 'rejected' ? rejectionReason : undefined
                })
            });

            console.log('Response status:', res.status);

            if (res.ok) {
                if (selectedTrx.type === 'deposit') {
                    setDeposits(prev => prev.filter(t => t._id !== selectedTrx._id));
                } else {
                    setWithdrawals(prev => prev.filter(t => t._id !== selectedTrx._id));
                }
                handleCloseReview();
                // alert(`Transaction ${action} successfully!`); 
            } else {

                const text = await res.text();
                console.error('API Error Status:', res.status);
                console.error('API Error Raw Body:', text);
                try {
                    const err = JSON.parse(text);
                    console.error('API Error Parsed:', err);
                    alert(`Error: ${err.message || 'Unknown error'}`);
                } catch (e) {
                    console.error('Failed to parse error JSON:', e);
                    alert(`Error: Transaction failed (Status: ${res.status})`);
                }
            }
        } catch (error) {
            console.error('Action failed:', error);
            alert('Something went wrong.');
        } finally {
            setIsProcessing(false);
        }
    };

    const handleAction = async (action: 'approved' | 'rejected') => {
        if (!selectedTrx) return;

        if (action === 'rejected' && !showRejectReview) {
            setShowRejectReview(true);
            return;
        }

        // Direct call for non-rejected or if logic changes
        processTransaction(action);
    };

    return (
        <div className="-m-4 lg:-m-8">
            {/* Sticky Header */}
            <div className="sticky top-16 lg:top-0 z-30 border-b border-border/40 bg-background/80 backdrop-blur-xl px-4 lg:px-6 py-3 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="p-1.5 bg-blue-500/10 rounded-lg shrink-0">
                        <DollarSign className="w-5 h-5 text-blue-500" />
                    </div>
                    <div>
                        <h1 className="text-base font-bold text-foreground leading-none">
                            Finance Management
                        </h1>
                        <p className="text-[10px] text-muted-foreground font-medium mt-0.5">
                            Manage & Control
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <button
                        onClick={fetchData}
                        className="p-2 hover:bg-muted/50 rounded-full text-muted-foreground hover:text-foreground transition-colors"
                        title="Refresh Data"
                    >
                        <RefreshCcw size={18} className={isLoading ? "animate-spin" : ""} />
                    </button>
                </div>
            </div>

            {/* Main Content Area */}
            <div className="p-4 lg:p-8 space-y-6 pt-24 lg:pt-8">

                {/* Navigation Pills */}
                <div className="flex items-center gap-3 mb-6 overflow-x-auto pb-4 w-full min-h-[60px] z-20 relative no-scrollbar">
                    <button
                        onClick={() => setActiveTab('deposits')}
                        className={`flex items-center gap-2 px-6 py-2.5 rounded-full text-sm font-bold border transition-all shrink-0 whitespace-nowrap ${activeTab === 'deposits'
                            ? 'bg-blue-600 text-white border-blue-600 shadow-md'
                            : 'bg-zinc-800 text-gray-300 border-zinc-700 hover:bg-zinc-700'
                            }`}
                    >
                        <DollarSign size={16} /> Deposit
                    </button>
                    <button
                        onClick={() => setActiveTab('withdrawals')}
                        className={`flex items-center gap-2 px-6 py-2.5 rounded-full text-sm font-bold border transition-all shrink-0 whitespace-nowrap ${activeTab === 'withdrawals'
                            ? 'bg-blue-600 text-white border-blue-600 shadow-md'
                            : 'bg-zinc-800 text-gray-300 border-zinc-700 hover:bg-zinc-700'
                            }`}
                    >
                        <RefreshCcw size={16} /> Withdraw
                    </button>
                    <button
                        onClick={() => setActiveTab('reports')}
                        className={`flex items-center gap-2 px-6 py-2.5 rounded-full text-sm font-bold border transition-all shrink-0 whitespace-nowrap ${activeTab === 'reports'
                            ? 'bg-blue-600 text-white border-blue-600 shadow-md'
                            : 'bg-zinc-800 text-gray-300 border-zinc-700 hover:bg-zinc-700'
                            }`}
                    >
                        <TrendingUp size={16} /> Stats
                    </button>
                </div>

                {/* Mobile Optimized Filter Triggers (3 Rectangles) */}
                {activeTab !== 'reports' && (
                    <>
                        <div className="grid grid-cols-3 gap-3 mb-6">
                            {/* Status Trigger */}
                            <button
                                onClick={() => setActiveFilterModal('status')}
                                className={`
                                    relative flex flex-col items-center justify-center gap-2 p-3 rounded-2xl border transition-all active:scale-95
                                    ${statusFilter !== 'all' ? 'bg-primary/10 border-primary/50' : 'bg-card/40 border-white/5 hover:bg-white/5'}
                                `}
                            >
                                <div className={`p-2 rounded-full ${statusFilter !== 'all' ? 'bg-primary/20 text-primary' : 'bg-white/5 text-muted-foreground'}`}>
                                    <Filter size={18} />
                                </div>
                                <div className="flex flex-col items-center">
                                    <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Status</span>
                                    <span className="text-xs font-bold capitalize text-foreground">{statusFilter}</span>
                                </div>
                                {(activeTab === 'deposits' ? pendingCounts.deposits : pendingCounts.withdrawals) > 0 && (
                                    <span className="absolute top-2 right-2 flex items-center justify-center min-w-[18px] h-[18px] px-1 bg-red-500 text-[10px] font-bold text-white rounded-full shadow-lg shadow-red-500/40">
                                        {activeTab === 'deposits' ? pendingCounts.deposits : pendingCounts.withdrawals}
                                    </span>
                                )}
                            </button>

                            {/* Method Trigger */}
                            <button
                                onClick={() => setActiveFilterModal('method')}
                                className={`
                                    flex flex-col items-center justify-center gap-2 p-3 rounded-2xl border transition-all active:scale-95
                                    ${methodFilter !== 'all' ? 'bg-blue-500/10 border-blue-500/50' : 'bg-card/40 border-white/5 hover:bg-white/5'}
                                `}
                            >
                                <div className={`p-2 rounded-full ${methodFilter !== 'all' ? 'bg-blue-500/20 text-blue-500' : 'bg-white/5 text-muted-foreground'}`}>
                                    <CreditCard size={18} />
                                </div>
                                <div className="flex flex-col items-center">
                                    <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Method</span>
                                    <span className="text-xs font-bold capitalize text-foreground max-w-[80px] truncate">{methodFilter}</span>
                                </div>
                            </button>

                            {/* Date Trigger */}
                            <button
                                onClick={() => setActiveFilterModal('date')}
                                className={`
                                    flex flex-col items-center justify-center gap-2 p-3 rounded-2xl border transition-all active:scale-95
                                    ${dateFilter !== 'month' ? 'bg-purple-500/10 border-purple-500/50' : 'bg-card/40 border-white/5 hover:bg-white/5'}
                                `}
                            >
                                <div className={`p-2 rounded-full ${dateFilter !== 'month' ? 'bg-purple-500/20 text-purple-500' : 'bg-white/5 text-muted-foreground'}`}>
                                    <Calendar size={18} />
                                </div>
                                <div className="flex flex-col items-center">
                                    <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">History</span>
                                    <span className="text-xs font-bold capitalize text-foreground">{dateFilter === 'month' ? 'Month' : dateFilter}</span>
                                </div>
                            </button>
                        </div>

                        {/* Filter Popup Modal */}
                        {activeFilterModal && (
                            <div
                                className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200"
                                onClick={() => setActiveFilterModal(null)}
                            >
                                <div
                                    className="bg-card w-full max-w-sm rounded-3xl overflow-hidden shadow-2xl border border-border animate-in zoom-in-95 duration-200"
                                    onClick={(e) => e.stopPropagation()}
                                >
                                    <div className="p-4 border-b border-border flex items-center justify-between bg-muted/30">
                                        <h3 className="text-sm font-bold uppercase tracking-widest text-foreground">
                                            Select {activeFilterModal}
                                        </h3>
                                        <button onClick={() => setActiveFilterModal(null)} className="p-1 rounded-full hover:bg-muted text-muted-foreground hover:text-foreground transition-colors">
                                            <X size={20} />
                                        </button>
                                    </div>

                                    <div className="p-4 max-h-[60vh] overflow-y-auto space-y-2">
                                        {activeFilterModal === 'status' && (
                                            ['all', 'pending', 'approved', 'rejected'].map(s => (
                                                <button
                                                    key={s}
                                                    onClick={() => { setStatusFilter(s as any); setActiveFilterModal(null); }}
                                                    className={`w-full flex items-center justify-between p-3.5 rounded-xl border transition-all ${statusFilter === s ? 'bg-primary/10 border-primary/50 text-foreground shadow-sm' : 'bg-muted/30 border-transparent text-muted-foreground hover:bg-muted group'
                                                        }`}
                                                >
                                                    <div className="flex items-center gap-3">
                                                        {s === 'pending' && <AlertCircle size={18} className="text-yellow-500" />}
                                                        {s === 'approved' && <CheckCircle size={18} className="text-green-500" />}
                                                        {s === 'rejected' && <XCircle size={18} className="text-red-500" />}
                                                        {s === 'all' && <Filter size={18} className="group-hover:text-foreground transition-colors" />}
                                                        <span className={`capitalize font-bold tracking-wide ${statusFilter === s ? 'text-primary' : ''}`}>{s}</span>
                                                    </div>
                                                    {s === 'pending' && (activeTab === 'deposits' ? pendingCounts.deposits : pendingCounts.withdrawals) > 0 && (
                                                        <span className="bg-yellow-500 text-black text-xs font-bold px-2 py-0.5 rounded-full shadow-sm">
                                                            {activeTab === 'deposits' ? pendingCounts.deposits : pendingCounts.withdrawals}
                                                        </span>
                                                    )}
                                                </button>
                                            ))
                                        )}

                                        {activeFilterModal === 'method' && (
                                            ['all', ...availableMethods].map(m => (
                                                <button
                                                    key={m}
                                                    onClick={() => { setMethodFilter(m); setActiveFilterModal(null); }}
                                                    className={`w-full flex items-center justify-between p-3.5 rounded-xl border transition-all ${methodFilter === m ? 'bg-blue-600/10 border-blue-500/50 text-foreground shadow-sm' : 'bg-muted/30 border-transparent text-muted-foreground hover:bg-muted'
                                                        }`}
                                                >
                                                    <div className="flex items-center gap-3">
                                                        <CreditCard size={18} className={methodFilter === m ? 'text-blue-500' : ''} />
                                                        <span className={`capitalize font-bold tracking-wide ${methodFilter === m ? 'text-blue-600' : ''}`}>{m === 'all' ? 'All Payment Methods' : m}</span>
                                                    </div>
                                                    {(pendingCounts.methods[m] || 0) > 0 && (
                                                        <span className="bg-blue-500/20 text-blue-600 text-xs font-bold px-2 py-0.5 rounded-full border border-blue-500/20">
                                                            {pendingCounts.methods[m]} Pending
                                                        </span>
                                                    )}
                                                </button>
                                            ))
                                        )}

                                        {activeFilterModal === 'date' && (
                                            [
                                                { id: 'today', label: 'Today' },
                                                { id: 'week', label: 'This Week' },
                                                { id: 'month', label: 'This Month' },
                                                { id: '3m', label: 'Last 3 Months' },
                                                { id: '6m', label: 'Last 6 Months' },
                                                { id: 'year', label: 'Last Year' }
                                            ].map(d => (
                                                <button
                                                    key={d.id}
                                                    onClick={() => { setDateFilter(d.id as any); setActiveFilterModal(null); }}
                                                    className={`w-full flex items-center gap-3 p-3.5 rounded-xl border transition-all ${dateFilter === d.id ? 'bg-purple-600/10 border-purple-500/50 text-foreground shadow-sm' : 'bg-muted/30 border-transparent text-muted-foreground hover:bg-muted'
                                                        }`}
                                                >
                                                    <Calendar size={18} className={dateFilter === d.id ? 'text-purple-500' : ''} />
                                                    <span className={`capitalize font-bold tracking-wide ${dateFilter === d.id ? 'text-purple-600' : ''}`}>{d.label}</span>
                                                </button>
                                            ))
                                        )}
                                    </div>
                                    <div className="p-4 border-t border-border bg-muted/30">
                                        <button
                                            onClick={() => setActiveFilterModal(null)}
                                            className="w-full py-3.5 rounded-xl bg-card hover:bg-muted text-muted-foreground hover:text-foreground font-bold border border-border transition-colors shadow-sm"
                                        >
                                            Close
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}
                    </>
                )}

                {/* Content Areas */}
                <div className="min-h-[400px]">

                    {/* DEPOSITS TAB */}
                    {activeTab === 'deposits' && (
                        <>
                            {/* Mobile List View */}
                            <div className="md:hidden space-y-3">
                                {deposits.length === 0 ? (
                                    <div className="text-center py-10 text-muted-foreground bg-card rounded-xl border border-border">No pending deposits today.</div>
                                ) : (
                                    deposits.map((trx) => (
                                        <div
                                            key={trx._id}
                                            onClick={() => handleOpenReview(trx)}
                                            className="bg-card border border-border p-4 rounded-xl shadow-sm active:scale-[0.98] transition-transform cursor-pointer"
                                        >
                                            <div className="flex justify-between items-start mb-3">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 rounded-full bg-blue-500/10 flex items-center justify-center text-xs font-bold text-blue-600 border border-blue-500/20 uppercase">
                                                        {trx.user.name.slice(0, 2)}
                                                    </div>
                                                    <div>
                                                        <h4 className="font-bold text-foreground text-sm">
                                                            {trx.type === 'deposit'
                                                                ? (trx.details?.senderName || trx.user.name)
                                                                : (trx.details?.accountTitle || trx.user.name)}
                                                        </h4>
                                                        <div className="flex flex-col gap-0.5 mt-0.5">
                                                            <p className="text-[10px] text-blue-400 font-medium">{trx.method}</p>
                                                            <p className="text-[10px] font-mono text-muted-foreground">
                                                                {trx.type === 'deposit'
                                                                    ? (trx.details?.senderNumber || 'No Number')
                                                                    : (trx.details?.accountNumber || 'No Account')
                                                                }
                                                            </p>
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="text-right">
                                                    <span className="text-green-600 font-mono font-bold text-base block">
                                                        Rs {trx.amount.toLocaleString()}
                                                    </span>
                                                    <span className="text-[10px] text-muted-foreground">
                                                        {new Date(trx.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                    </span>
                                                </div>
                                            </div>
                                            <div className="flex justify-between items-center pt-3 border-t border-border/50">
                                                <span className="text-[10px] font-mono text-muted-foreground bg-muted px-2 py-0.5 rounded">
                                                    {trx.type === 'deposit'
                                                        ? (trx.details?.senderNumber || 'No Number')
                                                        : (trx.details?.accountNumber || 'No Account')}
                                                </span>
                                                <div className="flex items-center gap-2">
                                                    {trx.proofImage && <span className="text-[10px] text-blue-500 flex items-center gap-1"><Eye size={10} /> Proof</span>}
                                                    <span className="bg-yellow-500/10 text-yellow-600 text-[10px] font-bold px-2 py-0.5 rounded-full border border-yellow-500/20">
                                                        Pending
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>

                            {/* Desktop Table View */}
                            <div className="hidden md:block overflow-hidden rounded-2xl border border-white/5 bg-card/30 backdrop-blur-md shadow-2xl">
                                <div className="overflow-x-auto">
                                    <table className="w-full text-left text-sm">
                                        <thead className="bg-white/5 text-muted-foreground uppercase tracking-widest text-[10px] font-bold">
                                            <tr>
                                                <th className="px-6 py-5">User</th>
                                                <th className="px-6 py-5">Transaction Info</th>
                                                <th className="px-6 py-5">Amount</th>
                                                <th className="px-6 py-5">Proof</th>
                                                <th className="px-6 py-5">Date</th>
                                                <th className="px-6 py-5 text-right">Action</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-white/5">
                                            {deposits.length === 0 ? (
                                                <tr>
                                                    <td colSpan={6} className="px-6 py-16 text-center text-muted-foreground/50">
                                                        No pending deposits found.
                                                    </td>
                                                </tr>
                                            ) : (
                                                deposits.map((trx) => (
                                                    <tr key={trx._id} onClick={() => handleOpenReview(trx)} className="hover:bg-white/5 transition-colors group cursor-pointer">
                                                        <td className="px-6 py-4">
                                                            <div className="flex items-center gap-3">
                                                                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500/20 to-purple-500/20 flex items-center justify-center text-xs font-bold text-blue-400 border border-white/5 uppercase shrink-0">
                                                                    {trx.user.name.slice(0, 2)}
                                                                </div>
                                                                <div>
                                                                    <div className="text-foreground font-semibold text-sm">{trx.user.name}</div>
                                                                    <div className="text-[11px] text-muted-foreground">{trx.user.email}</div>
                                                                </div>
                                                            </div>
                                                        </td>
                                                        <td className="px-6 py-4">
                                                            <div className="flex flex-col gap-1.5">
                                                                {/* Row 1: Sender Name / Account Title */}
                                                                <div className="text-sm font-bold text-foreground">
                                                                    {trx.type === 'deposit'
                                                                        ? (trx.details?.senderName || 'Unknown Sender')
                                                                        : (trx.details?.accountTitle || 'Unknown Account')
                                                                    }
                                                                </div>

                                                                {/* Row 2: Method */}
                                                                <div className="text-xs font-medium text-blue-400 flex items-center gap-1.5">
                                                                    <div className="p-1 rounded-full bg-blue-500/10">
                                                                        <CreditCard size={10} />
                                                                    </div>
                                                                    {trx.method}
                                                                </div>

                                                                {/* Row 3: Sender Number / Account Number */}
                                                                <div className="text-[11px] font-mono text-muted-foreground bg-white/5 self-start px-2 py-0.5 rounded border border-white/5">
                                                                    {trx.type === 'deposit'
                                                                        ? (trx.details?.senderNumber || 'No Number')
                                                                        : (trx.details?.accountNumber || 'No Account')
                                                                    }
                                                                </div>

                                                                {/* Rejection Reason Display */}
                                                                {trx.status === 'rejected' && trx.rejectionReason && (
                                                                    <div className="mt-1 p-1.5 bg-red-500/10 border border-red-500/20 rounded text-[10px] text-red-400">
                                                                        <span className="font-bold">Reason:</span> {trx.rejectionReason}
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </td>
                                                        <td className="px-6 py-4">
                                                            <span className="text-green-400 font-mono font-bold text-base tracking-tight">
                                                                Rs {trx.amount.toLocaleString()}
                                                            </span>
                                                        </td>
                                                        <td className="px-6 py-4">
                                                            {trx.proofImage ? (
                                                                <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-500/10 text-blue-400 text-xs font-medium border border-blue-500/10">
                                                                    <Eye size={12} /> View
                                                                </div>
                                                            ) : <span className="text-muted-foreground text-xs italic">No Proof</span>}
                                                        </td>
                                                        <td className="px-6 py-4 text-xs text-muted-foreground">
                                                            {new Date(trx.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                                        </td>
                                                        <td className="px-6 py-4 text-right">
                                                            <button className="bg-primary/90 hover:bg-primary text-primary-foreground px-5 py-2 rounded-xl text-xs font-bold transition-all shadow-lg shadow-primary/20 hover:shadow-primary/40 active:scale-95">
                                                                Review
                                                            </button>
                                                        </td>
                                                    </tr>
                                                ))
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </>
                    )}

                    {/* WITHDRAWALS TAB */}
                    {activeTab === 'withdrawals' && (
                        <>
                            {/* Mobile List View */}
                            <div className="md:hidden space-y-3">
                                {withdrawals.length === 0 ? (
                                    <div className="text-center py-10 text-muted-foreground bg-card rounded-xl border border-border">No pending withdrawals.</div>
                                ) : (
                                    withdrawals.map((trx) => (
                                        <div
                                            key={trx._id}
                                            onClick={() => handleOpenReview(trx)}
                                            className="bg-card border border-border p-4 rounded-xl shadow-sm active:scale-[0.98] transition-transform cursor-pointer"
                                        >
                                            <div className="flex justify-between items-start mb-3">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 rounded-full bg-red-500/10 flex items-center justify-center text-xs font-bold text-red-600 border border-red-500/20 uppercase">
                                                        {trx.user.name.slice(0, 2)}
                                                    </div>
                                                    <div>
                                                        <h4 className="font-bold text-foreground text-sm">{trx.user.name}</h4>
                                                        <p className="text-[10px] text-muted-foreground">{trx.method}</p>
                                                    </div>
                                                </div>
                                                <div className="text-right">
                                                    <div className="flex items-center gap-1 justify-end text-red-600">
                                                        <TrendingUp size={12} className="rotate-180" />
                                                        <span className="font-mono font-bold text-base">
                                                            Rs {trx.amount.toLocaleString()}
                                                        </span>
                                                    </div>
                                                    <span className="text-[10px] text-muted-foreground">
                                                        {new Date(trx.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                    </span>
                                                </div>
                                            </div>
                                            <div className="flex justify-between items-center pt-3 border-t border-border/50">
                                                <div className="max-w-[70%] truncate text-[11px] text-muted-foreground">
                                                    {trx.details?.accountNumber || 'No Account Info'}
                                                </div>
                                                <span className="bg-yellow-500/10 text-yellow-600 text-[10px] font-bold px-2 py-0.5 rounded-full border border-yellow-500/20">
                                                    Pending
                                                </span>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>

                            {/* Desktop Table */}
                            <div className="hidden md:block overflow-hidden rounded-2xl border border-white/5 bg-card/30 backdrop-blur-md shadow-2xl">
                                <div className="overflow-x-auto">
                                    <table className="w-full text-left text-sm">
                                        <thead className="bg-white/5 text-muted-foreground uppercase tracking-widest text-[10px] font-bold">
                                            <tr>
                                                <th className="px-6 py-5">User</th>
                                                <th className="px-6 py-5">Amount</th>
                                                <th className="px-6 py-5">Method</th>
                                                <th className="px-6 py-5">Details</th>
                                                <th className="px-6 py-5">Date</th>
                                                <th className="px-6 py-5 text-right">Action</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-white/5">
                                            {withdrawals.length === 0 ? (
                                                <tr>
                                                    <td colSpan={6} className="px-6 py-16 text-center text-muted-foreground/50">
                                                        No pending withdrawals found.
                                                    </td>
                                                </tr>
                                            ) : (
                                                withdrawals.map((trx) => (
                                                    <tr key={trx._id} onClick={() => handleOpenReview(trx)} className="hover:bg-white/5 transition-colors group cursor-pointer">
                                                        <td className="px-6 py-4">
                                                            <div className="flex items-center gap-3">
                                                                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-orange-500/20 to-red-500/20 flex items-center justify-center text-xs font-bold text-orange-400 border border-white/5 uppercase shrink-0">
                                                                    {trx.user.name.slice(0, 2)}
                                                                </div>
                                                                <div>
                                                                    <div className="text-foreground font-semibold text-sm">{trx.user.name}</div>
                                                                    <div className="text-[11px] text-muted-foreground">{trx.user.email}</div>
                                                                </div>
                                                            </div>
                                                        </td>
                                                        <td className="px-6 py-4">
                                                            <div className="flex items-center gap-2">
                                                                <TrendingUp className="w-4 h-4 text-red-400 rotate-180" />
                                                                <span className="text-foreground font-mono font-bold text-base tracking-tight">
                                                                    Rs {trx.amount.toLocaleString()}
                                                                </span>
                                                            </div>
                                                        </td>
                                                        <td className="px-6 py-4">
                                                            <span className="inline-flex px-2.5 py-1 rounded-md bg-white/5 text-xs font-medium border border-white/5">
                                                                {trx.method}
                                                            </span>
                                                        </td>
                                                        <td className="px-6 py-4">
                                                            <div className="max-w-[150px] truncate text-xs text-muted-foreground" title={JSON.stringify(trx.details)}>
                                                                {trx.details?.accountNumber || JSON.stringify(trx.details)}
                                                            </div>
                                                        </td>
                                                        <td className="px-6 py-4 text-xs text-muted-foreground">
                                                            {new Date(trx.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                                                        </td>
                                                        <td className="px-6 py-4 text-right">
                                                            <button
                                                                className="bg-zinc-800 hover:bg-zinc-700 text-white border border-white/10 px-5 py-2 rounded-xl text-xs font-bold transition-all active:scale-95"
                                                            >
                                                                Details
                                                            </button>
                                                        </td>
                                                    </tr>
                                                ))
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </>
                    )}

                    {/* REPORTS TAB */}
                    {activeTab === 'reports' && stats && (
                        <div className="space-y-6 animate-in fade-in duration-500">
                            {/* Cards */}
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                                <div className="bg-gradient-to-br from-green-600/20 to-green-900/10 border border-green-500/20 p-6 rounded-xl">
                                    <div className="flex items-center gap-3 mb-2">
                                        <div className="p-2 bg-green-500/10 rounded-lg text-green-500"><DollarSign size={20} /></div>
                                        <h3 className="text-muted-foreground text-sm font-medium">Cash In Hand</h3>
                                    </div>
                                    <p className="text-2xl font-bold text-foreground">PKR {stats.summary.cashInHand.toLocaleString()}</p>
                                </div>

                                <div className="bg-gradient-to-br from-purple-600/20 to-purple-900/10 border border-purple-500/20 p-6 rounded-xl">
                                    <div className="flex items-center gap-3 mb-2">
                                        <div className="p-2 bg-purple-500/10 rounded-lg text-purple-500"><TrendingUp size={20} /></div>
                                        <h3 className="text-muted-foreground text-sm font-medium">Platform Revenue</h3>
                                    </div>
                                    <p className="text-2xl font-bold text-foreground">PKR {stats.summary.totalRevenue.toLocaleString()}</p>
                                </div>

                                <div className="bg-card border border-border p-6 rounded-xl shadow-sm">
                                    <h3 className="text-muted-foreground text-sm font-medium mb-2">Total Deposits</h3>
                                    <p className="text-xl font-bold text-foreground">PKR {stats.summary.totalDeposits.toLocaleString()}</p>
                                </div>

                                <div className="bg-card border border-border p-6 rounded-xl shadow-sm">
                                    <h3 className="text-muted-foreground text-sm font-medium mb-2">Total Withdrawals</h3>
                                    <p className="text-xl font-bold text-foreground">PKR {stats.summary.totalWithdrawals.toLocaleString()}</p>
                                </div>
                            </div>

                            {/* Profit Table */}
                            <div className="rounded-xl border border-border bg-card overflow-hidden">
                                <div className="px-6 py-4 border-b border-border bg-muted/30">
                                    <h3 className="text-lg font-bold text-foreground">Tournament Profitability</h3>
                                </div>
                                <table className="w-full text-left text-sm text-muted-foreground">
                                    <thead className="bg-muted/50 text-foreground uppercase font-semibold text-xs text-center border-b border-border">
                                        <tr>
                                            <th className="px-6 py-4 text-left">Tournament</th>
                                            <th className="px-6 py-4">Total Fees (Revenue)</th>
                                            <th className="px-6 py-4">Prize Pool (Expense)</th>
                                            <th className="px-6 py-4">Net Profit</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-border">
                                        {stats.profitTable.length === 0 ? (
                                            <tr><td colSpan={4} className="p-6 text-center">No completed tournaments data.</td></tr>
                                        ) : (
                                            stats.profitTable.map((t) => (
                                                <tr key={t.id} className="hover:bg-muted/30 transition-colors text-center">
                                                    <td className="px-6 py-4 text-left font-medium text-foreground">{t.name}</td>
                                                    <td className="px-6 py-4 text-green-500">+ {t.revenue}</td>
                                                    <td className="px-6 py-4 text-red-500">- {t.expenses}</td>
                                                    <td className={`px-6 py-4 font-bold ${t.netProfit >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                                                        {t.netProfit}
                                                    </td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}
                </div>

                {/* REVIEW MODAL */}
                {selectedTrx && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
                        <div className="bg-card border border-border rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl animate-in zoom-in-95 duration-200">
                            {/* Modal Header */}
                            <div className="p-6 border-b border-border flex justify-between items-center bg-muted/20">
                                <h2 className="text-xl font-bold text-foreground">
                                    {selectedTrx.type === 'deposit' ? 'Review Deposit' : 'Withdrawal Request'}
                                </h2>
                                <button onClick={handleCloseReview} className="p-2 hover:bg-muted rounded-full text-muted-foreground hover:text-foreground transition-colors">
                                    <X size={20} />
                                </button>
                            </div>

                            <div className="p-8 space-y-6">

                                {/* DYNAMIC CONTENT BASED ON TYPE */}
                                {selectedTrx.type === 'deposit' ? (
                                    // DEPOSIT: Show Proof Image
                                    <div className="space-y-4">
                                        <div className="bg-muted/10 rounded-lg border border-border p-2 flex justify-center items-center h-48 relative overflow-hidden group">
                                            {selectedTrx.proofImage ? (
                                                <Image
                                                    src={selectedTrx.proofImage}
                                                    alt="Proof"
                                                    fill
                                                    className="object-contain"
                                                />
                                            ) : (
                                                <p className="text-muted-foreground flex items-center gap-2"><ShieldAlert /> No Proof Image Attached</p>
                                            )}
                                        </div>

                                        {/* DEPOSIT DETAILS GRID */}
                                        <div className="grid grid-cols-2 gap-3">
                                            <div className="p-3 bg-card rounded-lg border border-border">
                                                <span className="text-[10px] text-muted-foreground uppercase font-bold">Method</span>
                                                <p className="text-foreground font-bold">{selectedTrx.method}</p>
                                            </div>
                                            <div className="p-3 bg-card rounded-lg border border-border">
                                                <span className="text-[10px] text-muted-foreground uppercase font-bold">Transaction ID</span>
                                                <p className="text-foreground font-mono font-bold tracking-tight truncate" title={selectedTrx.trxID}>
                                                    {selectedTrx.trxID || 'N/A'}
                                                </p>
                                            </div>
                                            <div className="p-3 bg-card rounded-lg border border-border">
                                                <span className="text-[10px] text-muted-foreground uppercase font-bold">Sender Name</span>
                                                <p className="text-foreground font-bold truncate">
                                                    {selectedTrx.details?.senderName || 'Unknown'}
                                                </p>
                                            </div>
                                            <div className="p-3 bg-card rounded-lg border border-border">
                                                <span className="text-[10px] text-muted-foreground uppercase font-bold">Sender Number</span>
                                                <p className="text-foreground font-mono font-bold truncate">
                                                    {selectedTrx.details?.senderNumber || 'Unknown'}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                ) : (
                                    // WITHDRAWAL: Show Account Details
                                    <div className="bg-muted/10 rounded-lg border border-border p-6">
                                        <h3 className="text-sm font-semibold text-muted-foreground uppercase mb-4 text-center">Transfer To Details</h3>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="p-3 bg-card rounded-lg border border-border">
                                                <span className="text-[10px] text-muted-foreground uppercase font-bold">Bank / Method</span>
                                                <p className="text-foreground font-bold">{selectedTrx.method}</p>
                                            </div>
                                            <div className="p-3 bg-card rounded-lg border border-border">
                                                <span className="text-[10px] text-muted-foreground uppercase font-bold">Account Number</span>
                                                <p className="text-foreground font-mono font-bold text-lg tracking-wider">
                                                    {selectedTrx.details?.accountNumber || 'N/A'}
                                                </p>
                                            </div>
                                            <div className="col-span-2 p-3 bg-card rounded-lg border border-border">
                                                <span className="text-[10px] text-muted-foreground uppercase font-bold">Account Title</span>
                                                <p className="text-foreground font-bold">{selectedTrx.details?.accountTitle || 'N/A'}</p>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* Details & Actions Grid */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                                    <div className="space-y-1">
                                        <label className="text-xs font-semibold text-muted-foreground uppercase">User Name</label>
                                        <div className="flex items-center gap-3 p-3 bg-muted/10 rounded-lg border border-border">
                                            <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold text-xs">
                                                {selectedTrx.user.name.slice(0, 2)}
                                            </div>
                                            <div>
                                                <p className="text-foreground font-bold text-sm">{selectedTrx.user.name}</p>
                                                <p className="text-xs text-muted-foreground">{selectedTrx.user.email}</p>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="space-y-1">
                                        <label className="text-xs font-semibold text-muted-foreground uppercase">Amount</label>
                                        <div className="relative">
                                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">Rs</span>
                                            <input
                                                type="number"
                                                value={editAmount}
                                                onChange={(e) => setEditAmount(Number(e.target.value))}
                                                className="w-full bg-background border border-input text-foreground rounded-lg pl-10 pr-4 py-2.5 focus:ring-2 focus:ring-blue-500 outline-none transition-all font-mono font-bold"
                                            />
                                        </div>
                                        {selectedTrx.type === 'deposit' && <p className="text-xs text-blue-500/80 mt-1">* Edit if user made a typo.</p>}
                                    </div>

                                    <div className="col-span-1 md:col-span-2 space-y-2 mt-2">
                                        <label className="text-xs font-semibold text-muted-foreground uppercase">
                                            {selectedTrx.type === 'deposit' ? 'Rejection Reason (If Rejecting)' : 'Admin Note (Optional)'}
                                        </label>
                                        <textarea
                                            rows={2}
                                            value={rejectionReason}
                                            onChange={(e) => setRejectionReason(e.target.value)}
                                            placeholder={selectedTrx.type === 'deposit' ? "e.g. Fake Receipt..." : "Note for user..."}
                                            className="w-full bg-background border border-input text-foreground rounded-lg px-4 py-2 focus:ring-2 focus:ring-red-500/50 outline-none transition-all resize-none text-sm"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Modal Footer */}
                            <div className="p-6 border-t border-border bg-muted/10 flex gap-4 justify-end">
                                <button
                                    onClick={() => handleAction('rejected')}
                                    disabled={isProcessing}
                                    className="flex-1 bg-red-500/10 hover:bg-red-500/20 text-red-500 border border-red-500/50 sm:flex-none px-6 py-2.5 rounded-lg font-bold transition-colors disabled:opacity-50"
                                >
                                    {isProcessing ? 'Processing...' : 'Reject'}
                                </button>
                                <button
                                    onClick={() => {
                                        if (selectedTrx.type === 'deposit') {
                                            setShowSafetyCheck(true);
                                        } else {
                                            setShowFinalReview(true); // Direct to final review for withdrawals
                                        }
                                    }}
                                    disabled={isProcessing}
                                    className="flex-1 bg-green-500 hover:bg-green-600 text-white shadow-lg shadow-green-500/20 sm:flex-none px-8 py-2.5 rounded-lg font-bold transition-all hover:scale-[1.02] active:scale-95 disabled:opacity-50"
                                >
                                    {isProcessing ? 'Processing...' : 'Approve'}
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* STEP 1: SAFETY CHECK MODAL (Only for Deposits) */}
                {showSafetyCheck && selectedTrx?.type === 'deposit' && (
                    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
                        <div className="bg-card border border-border rounded-2xl w-full max-w-sm p-6 shadow-2xl animate-in zoom-in-95 duration-200">
                            <div className="flex flex-col items-center text-center space-y-4">
                                <div className="w-16 h-16 rounded-full bg-yellow-500/10 flex items-center justify-center mb-2">
                                    <AlertCircle className="w-8 h-8 text-yellow-500" />
                                </div>
                                <h3 className="text-xl font-bold text-foreground">Safety Check</h3>
                                <p className="text-muted-foreground text-sm leading-relaxed">
                                    Have you checked your bank account? <br />
                                    <span className="text-foreground font-semibold">Has the money definitely arrived?</span>
                                </p>
                                <div className="grid grid-cols-2 gap-3 w-full pt-2">
                                    <button
                                        onClick={() => setShowSafetyCheck(false)}
                                        className="py-3 rounded-xl border border-border bg-muted/20 text-muted-foreground font-semibold hover:bg-muted/40 transition-colors"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        onClick={() => {
                                            setShowSafetyCheck(false);
                                            setShowFinalReview(true);
                                        }}
                                        className="py-3 rounded-xl bg-yellow-500 text-black font-bold hover:bg-yellow-400 transition-colors shadow-lg shadow-yellow-500/20"
                                    >
                                        Yes, Arrived
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* STEP 2: FINAL AUDIT MODAL (Review Details) */}
                {selectedTrx && showFinalReview && (
                    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-in fade-in duration-200">
                        <div className="bg-card border border-border rounded-2xl w-full max-w-md p-0 shadow-2xl animate-in zoom-in-95 duration-200 overflow-hidden">
                            <div className="p-6 border-b border-border bg-muted/20 text-center">
                                <h2 className="text-lg font-bold text-foreground flex items-center justify-center gap-2">
                                    <CheckCircle className="w-5 h-5 text-green-500" />
                                    Final Review
                                </h2>
                                <p className="text-xs text-muted-foreground mt-1">
                                    {selectedTrx.type === 'deposit' ? 'Double check details before crediting' : 'Confirm transfer completion'}
                                </p>
                            </div>

                            <div className="p-6 space-y-6">
                                {/* Amount Highlight */}
                                <div className={`text-center rounded-xl p-4 border ${selectedTrx.type === 'deposit' ? 'bg-green-500/10 border-green-500/20' : 'bg-blue-500/10 border-blue-500/20'}`}>
                                    <p className={`text-xs font-semibold mb-1 uppercase tracking-wider ${selectedTrx.type === 'deposit' ? 'text-green-500' : 'text-blue-500'}`}>
                                        {selectedTrx.type === 'deposit' ? 'Amount To Add' : 'Amount To Send'}
                                    </p>
                                    <p className={`text-3xl font-black font-mono ${selectedTrx.type === 'deposit' ? 'text-green-500' : 'text-blue-500'}`}>
                                        Rs {editAmount.toLocaleString()}
                                    </p>
                                </div>

                                <div className="space-y-3">
                                    <div className="flex justify-between items-center p-3 bg-muted/10 rounded-lg border border-border">
                                        <span className="text-xs text-muted-foreground font-medium uppercase">User</span>
                                        <span className="text-sm font-bold text-foreground">{selectedTrx.user.name}</span>
                                    </div>
                                    <div className="flex justify-between items-center p-3 bg-muted/10 rounded-lg border border-border">
                                        <span className="text-xs text-muted-foreground font-medium uppercase">
                                            {selectedTrx.type === 'deposit' ? 'Sender Name' : 'Account Title'}
                                        </span>
                                        <span className="text-sm font-bold text-foreground">
                                            {selectedTrx.type === 'deposit' ? (selectedTrx.details?.senderName || 'Unknown') : (selectedTrx.details?.accountTitle || 'Unknown')}
                                        </span>
                                    </div>
                                    <div className="flex justify-between items-center p-3 bg-muted/10 rounded-lg border border-border">
                                        <span className="text-xs text-muted-foreground font-medium uppercase">
                                            {selectedTrx.type === 'deposit' ? 'Sender Number' : 'Account Number'}
                                        </span>
                                        <span className="text-sm font-mono font-bold text-foreground">
                                            {selectedTrx.type === 'deposit' ? (selectedTrx.details?.senderNumber || 'Unknown') : (selectedTrx.details?.accountNumber || 'Unknown')}
                                        </span>
                                    </div>
                                </div>

                                <div className={`flex items-start gap-3 p-3 rounded-lg border ${selectedTrx.type === 'deposit' ? 'bg-red-500/5 border-red-500/10' : 'bg-blue-500/5 border-blue-500/10'}`}>
                                    <AlertCircle className={`w-5 h-5 shrink-0 mt-0.5 ${selectedTrx.type === 'deposit' ? 'text-red-500' : 'text-blue-500'}`} />
                                    <p className={`text-xs leading-relaxed ${selectedTrx.type === 'deposit' ? 'text-red-400' : 'text-blue-400'}`}>
                                        {selectedTrx.type === 'deposit'
                                            ? <span><strong>Warning:</strong> This cannot be undone. Coins will be instantly added to the user's wallet.</span>
                                            : <span><strong>Confirmation:</strong> By approving, you confirm that you have MANUALLY transferred the funds to the user.</span>
                                        }
                                    </p>
                                </div>
                            </div>

                            <div className="p-6 border-t border-border bg-muted/10 grid grid-cols-2 gap-4">
                                <button
                                    onClick={() => setShowFinalReview(false)}
                                    className="py-3 rounded-xl border border-border bg-muted/20 text-muted-foreground font-bold hover:bg-muted/40 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={() => handleAction('approved')}
                                    disabled={isProcessing}
                                    className="py-3 rounded-xl bg-green-500 text-white font-bold hover:bg-green-600 transition-colors shadow-lg shadow-green-500/20 flex items-center justify-center gap-2"
                                >
                                    {isProcessing ? <RefreshCcw className="animate-spin w-4 h-4" /> : (selectedTrx.type === 'deposit' ? 'CONFIRM & ADD' : 'CONFIRM SENT')}
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* STEP 3: REJECTION REVIEW MODAL */}
                {selectedTrx && showRejectReview && (
                    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-in fade-in duration-200">
                        <div className="bg-card border border-border rounded-2xl w-full max-w-md p-0 shadow-2xl animate-in zoom-in-95 duration-200 overflow-hidden">
                            <div className="p-6 border-b border-border bg-muted/20 text-center">
                                <h2 className="text-lg font-bold text-foreground flex items-center justify-center gap-2">
                                    <XCircle className="w-5 h-5 text-red-500" />
                                    Confirm Rejection
                                </h2>
                                <p className="text-xs text-muted-foreground mt-1">Double check details before rejecting</p>
                            </div>

                            <div className="p-6 space-y-6">
                                <div className="space-y-3">
                                    <div className="flex justify-between items-center p-3 bg-muted/10 rounded-lg border border-border">
                                        <span className="text-xs text-muted-foreground font-medium uppercase">User</span>
                                        <span className="text-sm font-bold text-foreground">{selectedTrx.user.name}</span>
                                    </div>
                                    <div className="flex justify-between items-center p-3 bg-muted/10 rounded-lg border border-border">
                                        <span className="text-xs text-muted-foreground font-medium uppercase">Amount</span>
                                        <span className="text-sm font-bold text-foreground">Rs {selectedTrx.amount.toLocaleString()}</span>
                                    </div>
                                    <div className="p-3 bg-red-500/5 border border-red-500/10 rounded-lg">
                                        <span className="text-xs text-red-500 font-medium uppercase block mb-1">Rejection Reason</span>
                                        <p className="text-sm font-medium text-foreground">{rejectionReason || 'No reason provided'}</p>
                                    </div>
                                </div>

                                <div className="flex items-start gap-3 p-3 bg-red-500/5 border border-red-500/10 rounded-lg">
                                    <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
                                    <p className="text-xs text-red-400 leading-relaxed">
                                        <strong>Warning:</strong> This will reject the transaction and notify the user.
                                    </p>
                                </div>
                            </div>

                            <div className="p-6 border-t border-border bg-muted/10 grid grid-cols-2 gap-4">
                                <button
                                    onClick={() => setShowRejectReview(false)}
                                    className="py-3 rounded-xl border border-border bg-muted/20 text-muted-foreground font-bold hover:bg-muted/40 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={() => processTransaction('rejected')}
                                    disabled={isProcessing}
                                    className="py-3 rounded-xl bg-red-500 text-white font-bold hover:bg-red-600 transition-colors shadow-lg shadow-red-500/20 flex items-center justify-center gap-2"
                                >
                                    {isProcessing ? <RefreshCcw className="animate-spin w-4 h-4" /> : 'CONFIRM REJECT'}
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
