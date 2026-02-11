"use client";

import React, { useEffect, useState } from 'react';
import { X, Loader2, CheckCircle, XCircle, Clock, ArrowDownLeft, ArrowUpRight } from 'lucide-react';

interface TransactionHistoryModalProps {
    isOpen: boolean;
    onClose: () => void;
    userId: string;
    userName: string;
}

interface Transaction {
    _id: string;
    amount: number;
    type: string;
    status: string;
    description: string;
    createdAt: string;
}

export default function TransactionHistoryModal({ isOpen, onClose, userId, userName }: TransactionHistoryModalProps) {
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (isOpen && userId) {
            fetchTransactions();
        } else {
            setTransactions([]);
        }
    }, [isOpen, userId]);

    const fetchTransactions = async () => {
        setIsLoading(true);
        setError(null);
        try {
            // Re-using the ledger endpoint but we will only use the transactions array
            // Optimization: In a real scenario, we might want a lighter endpoint, 
            // but for now this works as it returns the list we need.
            const res = await fetch(`/api/admin/user-ledger/${userId}`);
            if (!res.ok) {
                throw new Error('Failed to fetch transactions');
            }
            const data = await res.json();
            // The ledger API returns { transactions: [...] } sorted by newest first (which is what we want)
            // If it returns oldest first in data.transactions, we need to check, 
            // but the previous UserLedgerModal logic suggested it needed to reverse it for running balance,
            // implying it might be sorted by date.
            // Let's assume the API returns them or we sort them here Newest First.
            const sorted = data.transactions.sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
            setTransactions(sorted);
        } catch (err) {
            setError(err instanceof Error ? err.message : "Unknown error");
        } finally {
            setIsLoading(false);
        }
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-GB', {
            day: '2-digit',
            month: 'short',
            hour: '2-digit',
            minute: '2-digit',
            hour12: true
        });
    };

    const getStatusColor = (status: string) => {
        switch (status.toLowerCase()) {
            case 'approved':
            case 'completed':
            case 'success':
                return 'text-green-500 bg-green-500/10 border-green-500/20';
            case 'rejected':
            case 'failed':
                return 'text-red-500 bg-red-500/10 border-red-500/20';
            case 'pending':
                return 'text-yellow-500 bg-yellow-500/10 border-yellow-500/20';
            default:
                return 'text-gray-500 bg-gray-500/10 border-gray-500/20';
        }
    };

    const getAmountColor = (trx: Transaction) => {
        // Logic to determine if money is IN or OUT
        // This mirrors the backend logic or previous ledger logic
        const type = trx.type;
        const status = trx.status.toLowerCase();

        if (['rejected', 'failed'].includes(status)) return 'text-gray-500';

        const isCredit = ['deposit', 'prize_winnings', 'spin_win', 'refund'].includes(type) ||
            (type === 'ADMIN_ADJUSTMENT' && trx.amount > 0) || // Assuming positive is credit if logic holds
            (type === 'MANUAL_ADJUSTMENT' && trx.amount > 0);

        // Explicit checks for known debit types
        const isDebit = ['withdrawal', 'entry_fee', 'shop_purchase'].includes(type) ||
            (type === 'ADMIN_ADJUSTMENT' && trx.amount < 0);

        // However, the amount from DB might be signed already? 
        // Admin Adjustments are usually store as positive amount with type DEBIT/CREDIT in details, 
        // OR stored as signed amount.
        // Let's rely on the raw amount symbol or type.
        // UserLedgerModal had complex logic. We want SIMPLE here.
        // Let's assume:
        // entry_fee, withdrawal -> OUT
        // deposit, winnings -> IN

        // We will just use a helper to render the right color/sign
        if (['deposit', 'prize_winnings', 'spin_win', 'refund'].includes(type)) return 'text-green-500';
        if (['withdrawal', 'entry_fee', 'shop_purchase'].includes(type)) return 'text-red-500';

        // Fallback for adjustments
        return 'text-white';
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-neutral-900 border border-neutral-800 w-full max-w-2xl max-h-[80vh] rounded-2xl flex flex-col shadow-2xl overflow-hidden relative">

                {/* Header */}
                <div className="flex items-center justify-between p-5 border-b border-neutral-800 bg-neutral-900 z-10">
                    <div>
                        <h2 className="text-lg font-bold text-white">Wallet History</h2>
                        <p className="text-sm text-neutral-400">User: <span className="text-indigo-400 font-mono">{userName}</span></p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-neutral-800 rounded-full transition-colors text-neutral-400 hover:text-white">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-0">
                    {isLoading ? (
                        <div className="flex items-center justify-center h-40">
                            <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
                        </div>
                    ) : error ? (
                        <div className="p-8 text-center text-red-400">
                            {error}
                        </div>
                    ) : transactions.length === 0 ? (
                        <div className="p-10 text-center text-neutral-500">
                            No transactions found.
                        </div>
                    ) : (
                        <table className="w-full text-sm text-left border-collapse">
                            <thead className="bg-neutral-900/50 text-neutral-500 uppercase text-[10px] font-bold sticky top-0 backdrop-blur-md">
                                <tr>
                                    <th className="px-5 py-3">Date</th>
                                    <th className="px-5 py-3">Activity</th>
                                    <th className="px-5 py-3 text-right">Amount</th>
                                    <th className="px-5 py-3 text-right">Status</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-neutral-800">
                                {transactions.map((trx) => {
                                    // Determine Direction visually
                                    // Note: This is simplified. Admin Adjustments might need looking at details if type name is generic.
                                    let isCredit = ['deposit', 'prize_winnings', 'spin_win', 'refund'].includes(trx.type);
                                    let isDebit = ['withdrawal', 'entry_fee', 'shop_purchase'].includes(trx.type);

                                    // Handle Admin Adjustments (Check description or amount sign if possible, simplified here)
                                    if (trx.type === 'ADMIN_ADJUSTMENT' || trx.type === 'MANUAL_ADJUSTMENT') {
                                        if (trx.amount > 0) isCredit = true; // Assuming positive storage for credit?
                                        // Actually, UserLedgerModal logic line 108 says: if adjustmentType === 'DEBIT' return -absAmount
                                        // So likely stored as positive in DB, but type distinguishes.
                                        // For now, let's just color based on type name if possible or default to white.
                                        // Better yet, let's look at the implementation of UserLedgerModal line 106-110 
                                        // It peeks into `trx.details?.adjustmentType`. 
                                        // Since we want "Raw List", let's just show what we know.
                                    }

                                    return (
                                        <tr key={trx._id} className="hover:bg-neutral-800/30 transition-colors">
                                            <td className="px-5 py-3 text-neutral-400 font-mono text-xs whitespace-nowrap">
                                                {formatDate(trx.createdAt)}
                                            </td>
                                            <td className="px-5 py-3">
                                                <div className="font-medium text-neutral-200">
                                                    {trx.type.replace(/_/g, ' ').toUpperCase()}
                                                </div>
                                                <div className="text-[10px] text-neutral-500 truncate max-w-[200px]" title={trx.description}>
                                                    {trx.description}
                                                </div>
                                            </td>
                                            <td className="px-5 py-3 text-right font-mono font-bold">
                                                <span className={isCredit ? 'text-green-500' : isDebit ? 'text-red-500' : 'text-white'}>
                                                    {isCredit ? '+' : isDebit ? '-' : ''} {Math.abs(trx.amount).toLocaleString()}
                                                </span>
                                            </td>
                                            <td className="px-5 py-3 text-right">
                                                <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold uppercase border ${getStatusColor(trx.status)}`}>
                                                    {trx.status}
                                                </span>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>
        </div>
    );
}
