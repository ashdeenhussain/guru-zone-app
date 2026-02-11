"use client";

import React, { useEffect, useState } from 'react';
import { X, AlertTriangle, ArrowDownLeft, ArrowUpRight, Trophy, History, Loader2, Info, CheckCircle, XCircle, Clock } from 'lucide-react';

interface UserLedgerModalProps {
    isOpen: boolean;
    onClose: () => void;
    userId: string;
    userName: string;
}

interface LedgerData {
    user: {
        _id: string;
        name: string;
        email: string;
        walletBalance: number;
        totalWins: number;
        netEarnings: number;
    };
    stats: {
        totalDeposits: number;
        totalWinnings: number; // Prizes + Spin Wins
        totalWithdrawn: number;
    };
    transactions: any[];
}

export default function UserLedgerModal({ isOpen, onClose, userId, userName }: UserLedgerModalProps) {
    const [data, setData] = useState<LedgerData | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [runningBalances, setRunningBalances] = useState<number[]>([]);
    const [calculatedBalance, setCalculatedBalance] = useState<number>(0);

    useEffect(() => {
        if (isOpen && userId) {
            fetchLedger();
        } else {
            setData(null); // Reset on close
            setRunningBalances([]);
            setCalculatedBalance(0);
        }
    }, [isOpen, userId]);

    const fetchLedger = async () => {
        setIsLoading(true);
        setError(null);
        try {
            const res = await fetch(`/api/admin/user-ledger/${userId}`);
            if (!res.ok) {
                const errorData = await res.json().catch(() => ({}));
                throw new Error(errorData.error || `Failed to fetch: ${res.status}`);
            }
            const result = await res.json();
            setData(result);
            calculateRunningBalances(result.transactions);
        } catch (err) {
            setError(err instanceof Error ? err.message : "Unknown error");
        } finally {
            setIsLoading(false);
        }
    };

    const getSignedAmount = (trx: any) => {
        const status = trx.status?.toLowerCase() || 'pending';
        const type = trx.type;

        // 1. Filter out transactions that have no net effect on balance or handle them specifically
        // Generally rejected/failed don't change balance
        if (['rejected', 'failed', 'cancelled'].includes(status)) {
            return 0;
        }

        // 2. Pending Deposits don't add to balance yet
        if (type === 'deposit' && status === 'pending') {
            return 0;
        }

        const absAmount = Math.abs(trx.amount || 0);

        // 3. Calculate impact
        switch (type) {
            // Credits (+)
            case 'deposit':
            case 'prize_winnings':
            case 'spin_win':
            case 'refund':
            case 'MANUAL_ADJUSTMENT': // For ghost transactions (usually positive if fixing shortfall, but could be negative)
                // For manual adjustment ghost, we trust the amount sign if passed directly, but usually we pass positive absAmount.
                // Ghost transaction logic handling:
                if (trx.isGhost) return trx.amount; // Allow ghost to be negative directly
                return absAmount;

            // Debits (-)
            case 'withdrawal':
            case 'entry_fee':
            case 'admin_deduction': // Legacy type?
            case 'shop_purchase':
                return -absAmount;

            // Variable (+/-)
            case 'ADMIN_ADJUSTMENT':
                // Check the adjustmentType from details
                if (trx.details?.adjustmentType === 'CREDIT') {
                    return absAmount;
                } else if (trx.details?.adjustmentType === 'DEBIT') {
                    return -absAmount;
                }
                // Fallback: If no type, assume negative if 'deduction' logic was used before.
                return -absAmount; // Default to debit for safety if unknown

            default:
                return 0;
        }
    };

    const calculateRunningBalances = (transactions: any[]) => {
        // Calculate Chronologically (Oldest to Newest) starting from 0
        // We need to reverse the *copy* of transactions array since display is Newest-First.
        const chronological = [...transactions].reverse();
        const calculatedHistory: number[] = [];
        let current = 0;

        chronological.forEach(trx => {
            const amount = getSignedAmount(trx);
            current += amount;
            calculatedHistory.push(current);
        });

        // Current 'current' is the Final Calculated Balance from transactions.
        setCalculatedBalance(current);

        // Detect Discrepancy (Manual DB Edits)
        if (data && data.user) {
            const discrepancy = data.user.walletBalance - current;
            // Allow small float tolerance
            if (Math.abs(discrepancy) > 1) {
                // If there is a discrepancy, we insert a "Ghost" adjustment at the beginning of time
                // to make the running balance math work out correctly for the latest transactions.

                const ghostTrx = {
                    _id: 'manual-adjustment-ghost',
                    type: 'MANUAL_ADJUSTMENT',
                    amount: discrepancy, // Can be negative
                    status: 'completed',
                    description: 'System Adjustment (Legacy/Manual DB Edit)',
                    createdAt: new Date(0).toISOString(), // Epoch
                    isGhost: true
                };

                // Re-calculate with ghost at the start
                current = discrepancy;
                calculatedHistory.length = 0; // Reset

                chronological.forEach(trx => {
                    const amount = getSignedAmount(trx);
                    current += amount;
                    calculatedHistory.push(current);
                });

                // Add ghost to transactions list for display (It should be at the end since we are displaying Newest First)
                transactions.push(ghostTrx);

                // Update Final Calculation
                setCalculatedBalance(current);
            }
        }

        // Map back to Newest-First order for display
        // calculatedHistory was built Oldest->Newest.
        // calculatedHistory[last] corresponds to transactions[first] (Newest)
        setRunningBalances(calculatedHistory.reverse());
    };

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleString('en-GB', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            hour12: true
        }).replace(',', ' -');
    };

    const getBadgeStyle = (type: string) => {
        switch (type) {
            case 'deposit': return 'bg-green-500/10 text-green-500 border-green-500/20';
            case 'withdrawal': return 'bg-red-500/10 text-red-500 border-red-500/20';
            case 'entry_fee': return 'bg-neutral-800 text-neutral-400 border-neutral-700';
            case 'prize_winnings': return 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20';
            case 'spin_win': return 'bg-purple-500/10 text-purple-500 border-purple-500/20';
            case 'ADMIN_ADJUSTMENT': return 'bg-indigo-500/10 text-indigo-500 border-indigo-500/20';
            case 'MANUAL_ADJUSTMENT': return 'bg-gray-500/10 text-gray-500 border-gray-500/20';
            default: return 'bg-neutral-800 text-neutral-400';
        }
    };

    const getFormattedType = (trx: any) => {
        if (trx.type === 'ADMIN_ADJUSTMENT') return 'ADMIN ADJ';
        return trx.type.replace(/_/g, ' ').toUpperCase();
    };

    if (!isOpen) return null;

    const calculatedSafeLimit = data ? (data.stats.totalDeposits + data.stats.totalWinnings) : 0;
    const isSuspicious = data ? (data.user.walletBalance > calculatedSafeLimit) : false;
    const isDesync = data ? (Math.abs(data.user.walletBalance - calculatedBalance) > 1) : false;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-neutral-900 border border-neutral-800 w-full max-w-6xl h-[90vh] rounded-2xl flex flex-col shadow-2xl overflow-hidden relative">

                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-neutral-800 bg-neutral-900 z-10">
                    <div>
                        <h2 className="text-xl font-bold text-white flex items-center gap-2">
                            <History className="w-5 h-5 text-indigo-400" />
                            Wallet Audit: <span className="text-indigo-400">{userName}</span>
                        </h2>
                        <p className="text-sm text-neutral-400">Comprehensive financial statement</p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-neutral-800 rounded-full transition-colors">
                        <X className="w-6 h-6 text-neutral-400" />
                    </button>
                </div>

                {isLoading ? (
                    <div className="flex-1 flex items-center justify-center">
                        <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
                    </div>
                ) : error ? (
                    <div className="flex-1 flex items-center justify-center text-red-400">
                        <AlertTriangle className="w-6 h-6 mr-2" /> {error}
                    </div>
                ) : data ? (
                    <div className="flex-1 overflow-y-auto p-6 space-y-6">

                        {/* Financial Summary */}
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                            <div className="bg-neutral-950 p-4 rounded-xl border border-neutral-800">
                                <div className="flex items-center gap-2 text-neutral-400 mb-2">
                                    <ArrowDownLeft className="w-4 h-4 text-green-400" />
                                    <span className="text-xs uppercase font-bold tracking-wider">Total Deposits</span>
                                </div>
                                <p className="text-2xl font-mono text-white">Rs. {data.stats.totalDeposits.toLocaleString()}</p>
                            </div>

                            <div className="bg-neutral-950 p-4 rounded-xl border border-neutral-800">
                                <div className="flex items-center gap-2 text-neutral-400 mb-2">
                                    <Trophy className="w-4 h-4 text-yellow-400" />
                                    <span className="text-xs uppercase font-bold tracking-wider">Total Winnings</span>
                                </div>
                                <p className="text-2xl font-mono text-white">Rs. {data.stats.totalWinnings.toLocaleString()}</p>
                            </div>

                            <div className="bg-neutral-950 p-4 rounded-xl border border-neutral-800">
                                <div className="flex items-center gap-2 text-neutral-400 mb-2">
                                    <ArrowUpRight className="w-4 h-4 text-red-400" />
                                    <span className="text-xs uppercase font-bold tracking-wider">Total Withdrawn</span>
                                </div>
                                <p className="text-2xl font-mono text-white">Rs. {data.stats.totalWithdrawn.toLocaleString()}</p>
                            </div>

                            <div className={`p-4 rounded-xl border relative overflow-hidden ${isSuspicious || isDesync ? 'bg-red-500/10 border-red-500 animate-pulse' : 'bg-neutral-800/50 border-indigo-500/30'}`}>
                                <div className="flex items-center gap-2 text-neutral-400 mb-2">
                                    <span className="text-xs uppercase font-bold tracking-wider text-white">Current Balance</span>
                                    {isSuspicious && (
                                        <span className="ml-auto flex items-center gap-1 text-[10px] bg-red-500 text-white px-2 py-0.5 rounded-full font-bold">
                                            SUSPICIOUS
                                        </span>
                                    )}
                                </div>
                                <p className={`text-3xl font-mono font-bold ${isSuspicious || isDesync ? 'text-red-400' : 'text-indigo-400'}`}>
                                    Rs. {data.user.walletBalance.toLocaleString()}
                                </p>
                            </div>
                        </div>

                        {/* Transaction Ledger Table */}
                        <div className="bg-neutral-950 border border-neutral-800 rounded-xl overflow-hidden shadow-sm">
                            <div className="p-4 border-b border-neutral-800 bg-neutral-900/80 flex justify-between items-center">
                                <h3 className="font-bold text-white text-sm uppercase tracking-wider">Statement of Accounts</h3>
                                <span className="text-xs text-neutral-500 font-mono">
                                    Generated: {new Date().toLocaleString()}
                                </span>
                            </div>
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm text-left border-collapse">
                                    <thead className="text-xs text-neutral-400 uppercase bg-neutral-900 border-b border-neutral-800">
                                        <tr>
                                            <th className="px-6 py-4 font-semibold tracking-wider">Date & Time</th>
                                            <th className="px-6 py-4 font-semibold tracking-wider">Type</th>
                                            <th className="px-6 py-4 font-semibold tracking-wider text-right">Amount</th>
                                            <th className="px-6 py-4 font-semibold tracking-wider text-right">Running Balance</th>
                                            <th className="px-6 py-4 font-semibold tracking-wider">Reference / Description</th>
                                            <th className="px-6 py-4 font-semibold tracking-wider text-center">Status</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-neutral-800/50">
                                        {data.transactions.map((trx, index) => {
                                            const signedAmount = getSignedAmount(trx);
                                            const isPositive = signedAmount > 0;
                                            const isNegative = signedAmount < 0;
                                            const runningBalance = runningBalances[index] ?? 0;

                                            return (
                                                <tr key={trx._id} className="hover:bg-neutral-900/40 transition-colors group">

                                                    {/* 1. Date & Time */}
                                                    <td className="px-6 py-4 whitespace-nowrap text-neutral-400 font-mono text-xs">
                                                        {formatDate(trx.createdAt)}
                                                    </td>

                                                    {/* 2. Type */}
                                                    <td className="px-6 py-4">
                                                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded text-[10px] font-bold border ${getBadgeStyle(trx.type)}`}>
                                                            {getFormattedType(trx)}
                                                        </span>
                                                    </td>

                                                    {/* 3. Amount */}
                                                    <td className={`px-6 py-4 text-right font-mono font-bold ${isPositive ? 'text-green-400' :
                                                            isNegative ? 'text-red-400' :
                                                                'text-neutral-500'
                                                        }`}>
                                                        {isPositive ? '+' : isNegative ? '-' : ''}
                                                        {Math.abs(trx.amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                                                    </td>

                                                    {/* 4. Running Balance */}
                                                    <td className="px-6 py-4 text-right font-mono font-medium text-neutral-300">
                                                        {runningBalance.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                                                    </td>

                                                    {/* 5. Reference / Description */}
                                                    <td className="px-6 py-4">
                                                        <div className="flex flex-col max-w-[250px]">
                                                            <span className="text-neutral-300 truncate text-sm" title={trx.description}>
                                                                {trx.description}
                                                            </span>
                                                            <span className="text-[10px] text-neutral-500 font-mono mt-0.5 flex items-center gap-1">
                                                                Ref: {trx.referenceId || trx._id.slice(-8)}
                                                                {(trx.rejectionReason || trx.details?.adminNote) && (
                                                                    <div className="group/tooltip relative inline-block ml-1">
                                                                        <Info className="w-3 h-3 text-blue-400/70 hover:text-blue-400 cursor-help" />
                                                                        <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 w-48 p-2 bg-neutral-800 border border-neutral-700 rounded shadow-lg text-xs text-neutral-200 opacity-0 group-hover/tooltip:opacity-100 transition-opacity pointer-events-none z-50">
                                                                            {trx.rejectionReason || trx.details?.adminNote}
                                                                        </div>
                                                                    </div>
                                                                )}
                                                            </span>
                                                        </div>
                                                    </td>

                                                    {/* 6. Status */}
                                                    <td className="px-6 py-4 text-center">
                                                        <span className={`
                                                            inline-flex items-center gap-1 px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide
                                                            ${trx.status === 'approved' || trx.status === 'completed' ? 'bg-green-500/10 text-green-500' :
                                                                trx.status === 'rejected' || trx.status === 'failed' ? 'bg-red-500/10 text-red-500' :
                                                                    'bg-yellow-500/10 text-yellow-500'}
                                                        `}>
                                                            {/* Icons are imported, but if not we can use custom SVG components */}
                                                            {trx.status === 'approved' || trx.status === 'completed' ? <CheckCircle className="w-3 h-3" /> :
                                                                trx.status === 'rejected' || trx.status === 'failed' ? <XCircle className="w-3 h-3" /> :
                                                                    <Clock className="w-3 h-3" />}
                                                            {trx.status}
                                                        </span>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                    </div>
                ) : null}
            </div>
        </div>
    );
}
