"use client";

import { useState } from "react";
import { ArrowDownLeft, ArrowUpRight, Clock, CheckCircle, XCircle, AlertCircle, X, ExternalLink, Copy, ShieldCheck } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { AnimatePresence, motion } from "framer-motion";

interface Transaction {
    _id: string;
    type: string;
    amount: number;
    status: string;
    createdAt: string;
    description?: string;
    rejectionReason?: string;
    method?: string;
    trxID?: string;
    details?: {
        adjustmentType?: 'CREDIT' | 'DEBIT';
        adjustedBy?: string;
        [key: string]: any;
    };
}

interface TransactionHistoryProps {
    transactions: Transaction[];
    loading?: boolean;
}

type FilterCategory = "all" | "deposits" | "withdrawals" | "games" | "other";

export default function TransactionHistory({ transactions, loading }: TransactionHistoryProps) {
    const [activeFilter, setActiveFilter] = useState<FilterCategory>("all");
    const [selectedTrx, setSelectedTrx] = useState<Transaction | null>(null);

    if (loading) {
        return <div className="text-center text-muted-foreground py-10">Loading transactions...</div>;
    }

    if (transactions.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                <Clock size={48} className="mb-4 opacity-50" />
                <p>No transactions yet.</p>
            </div>
        );
    }

    // Helper to determine if a transaction is a "credit" (money in)
    const isCreditTransaction = (trx: Transaction) => {
        const type = trx.type.toLowerCase();
        if (type === 'deposit' || type === 'prize_winnings' || type === 'refund') return true;
        if (type === 'admin_adjustment') {
            return trx.details?.adjustmentType === 'CREDIT';
        }
        return false;
    };

    const filteredTransactions = transactions.filter((trx) => {
        const type = trx.type.toLowerCase();
        const isCredit = isCreditTransaction(trx);

        switch (activeFilter) {
            case "all":
                return true;
            case "deposits":
                return type === "deposit" || (type === "admin_adjustment" && isCredit);
            case "withdrawals":
                return type === "withdrawal" || (type === "admin_adjustment" && !isCredit);
            case "games":
                return type === "entry_fee" || type === "prize_winnings" || type === "refund";
            case "other":
                // Catch spins, shop purchases, and anything else
                return type === "spin_win" || type === "shop_purchase";
            default:
                return true;
        }
    });

    const categories: { key: FilterCategory; label: string }[] = [
        { key: "all", label: "All" },
        { key: "deposits", label: "Deposits" },
        { key: "withdrawals", label: "Withdrawals" },
        { key: "games", label: "Tournaments" },
        { key: "other", label: "Spins & Rewards" }
    ];

    const getStatusColor = (status: string) => {
        switch (status.toLowerCase()) {
            case 'approved': case 'completed': return 'text-green-600 bg-green-500/15 dark:text-green-400 dark:bg-green-500/10';
            case 'rejected': case 'failed': return 'text-red-600 bg-red-500/15 dark:text-red-400 dark:bg-red-500/10';
            default: return 'text-amber-600 bg-amber-500/15 dark:text-amber-400 dark:bg-amber-500/10';
        }
    };

    const getStatusIcon = (status: string) => {
        switch (status.toLowerCase()) {
            case 'approved': case 'completed': return <CheckCircle size={16} />;
            case 'rejected': case 'failed': return <XCircle size={16} />;
            default: return <Clock size={16} />;
        }
    };

    const getTypeIcon = (trx: Transaction) => {
        const isCredit = isCreditTransaction(trx);
        if (trx.type === 'ADMIN_ADJUSTMENT') return <ShieldCheck size={20} />;
        return isCredit ? <ArrowDownLeft size={20} /> : <ArrowUpRight size={20} />;
    };

    const formatType = (type: string) => {
        if (type === 'ADMIN_ADJUSTMENT') return 'Wallet Adjustment';
        return type.replace(/_/g, " ");
    };

    return (
        <div className="space-y-4">
            {/* Filters */}
            <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                {categories.map((category) => (
                    <button
                        key={category.key}
                        onClick={() => setActiveFilter(category.key)}
                        className={cn(
                            "px-4 py-1.5 rounded-full text-sm font-medium transition-colors capitalize whitespace-nowrap",
                            activeFilter === category.key
                                ? "bg-primary text-primary-foreground"
                                : "bg-muted text-muted-foreground hover:bg-muted/80"
                        )}
                    >
                        {category.label}
                    </button>
                ))}
            </div>

            <div className="space-y-3">
                {filteredTransactions.length === 0 ? (
                    <div className="text-center text-muted-foreground py-8">
                        No {categories.find(c => c.key === activeFilter)?.label.toLowerCase()} found.
                    </div>
                ) : (
                    filteredTransactions.map((trx) => {
                        const isCredit = isCreditTransaction(trx);
                        const status = trx.status.toLowerCase();

                        return (
                            <div
                                key={trx._id}
                                onClick={() => setSelectedTrx(trx)}
                                className="flex items-center justify-between rounded-xl border border-border bg-card p-4 transition-all hover:bg-muted/30 cursor-pointer active:scale-[0.98]"
                            >
                                <div className="flex items-center gap-4">
                                    <div
                                        className={`flex h-10 w-10 items-center justify-center rounded-full ${isCredit ? "bg-green-500/20 text-green-500" : "bg-red-500/20 text-red-500"
                                            }`}
                                    >
                                        {getTypeIcon(trx)}
                                    </div>
                                    <div>
                                        <p className="font-medium text-foreground capitalize">
                                            {formatType(trx.type)}
                                        </p>
                                        <p className="text-xs text-muted-foreground">
                                            {format(new Date(trx.createdAt), "MMM d, yyyy • h:mm a")}
                                        </p>
                                    </div>
                                </div>

                                <div className="text-right">
                                    <p
                                        className={`font-bold ${isCredit ? "text-green-500" : "text-red-500"
                                            }`}
                                    >
                                        {isCredit ? "+" : "-"}{trx.amount}
                                    </p>
                                    <div className="flex justify-end mt-1">
                                        <span className={cn("inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-bold", getStatusColor(status))}>
                                            {getStatusIcon(status)}
                                            <span className="capitalize">{status}</span>
                                        </span>
                                    </div>
                                </div>
                            </div>
                        );
                    })
                )}
            </div>

            {/* Transaction Details Modal */}
            <AnimatePresence>
                {selectedTrx && (
                    <div
                        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm cursor-pointer"
                        onClick={() => setSelectedTrx(null)}
                    >
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            onClick={(e) => e.stopPropagation()}
                            className="bg-card w-full max-w-md rounded-3xl overflow-hidden shadow-2xl border border-border cursor-default"
                        >
                            {/* Modal Header */}
                            <div className="bg-muted/30 p-6 flex flex-col items-center relative border-b border-border">
                                <button
                                    onClick={() => setSelectedTrx(null)}
                                    className="absolute right-4 top-4 p-2 bg-muted/50 hover:bg-muted rounded-full text-muted-foreground transition-colors"
                                >
                                    <X size={20} />
                                </button>

                                <span className="text-sm font-medium text-muted-foreground uppercase tracking-wide mb-2">Transaction Details</span>
                                <h2 className={cn("text-4xl font-black mb-2",
                                    isCreditTransaction(selectedTrx) ? "text-green-500" : "text-red-500"
                                )}>
                                    {isCreditTransaction(selectedTrx) ? "+" : "-"}{selectedTrx.amount}
                                </h2>

                                <span className={cn("inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold border", getStatusColor(selectedTrx.status))}>
                                    {getStatusIcon(selectedTrx.status)}
                                    <span className="capitalize">{selectedTrx.status}</span>
                                </span>
                            </div>

                            {/* Modal Body */}
                            <div className="p-6 space-y-4">
                                <div className="space-y-1">
                                    <label className="text-xs text-muted-foreground font-medium uppercase">Type</label>
                                    <div className="font-medium text-foreground capitalize flex items-center gap-2">
                                        {formatType(selectedTrx.type)}
                                        {selectedTrx.details?.adjustmentType && (
                                            <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-md">
                                                {selectedTrx.details.adjustmentType}
                                            </span>
                                        )}
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-1">
                                        <label className="text-xs text-muted-foreground font-medium uppercase">Date</label>
                                        <div className="text-sm font-medium">{format(new Date(selectedTrx.createdAt), "MMM d, yyyy")}</div>
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-xs text-muted-foreground font-medium uppercase">Time</label>
                                        <div className="text-sm font-medium">{format(new Date(selectedTrx.createdAt), "h:mm a")}</div>
                                    </div>
                                </div>

                                <div className="space-y-1">
                                    <label className="text-xs text-muted-foreground font-medium uppercase">Transaction ID</label>
                                    <div className="flex items-center justify-between bg-muted/30 p-2.5 rounded-lg border border-border/50">
                                        <span className="text-sm font-mono text-foreground truncate select-all">
                                            {selectedTrx._id}
                                        </span>
                                        <button className="text-muted-foreground hover:text-primary transition-colors">
                                            <Copy size={14} />
                                        </button>
                                    </div>
                                </div>

                                {/* Extra Details based on type */}
                                {selectedTrx.description && (
                                    <div className="space-y-1">
                                        <label className="text-xs text-muted-foreground font-medium uppercase">Description</label>
                                        <div className="text-sm text-foreground/80 bg-muted/20 p-3 rounded-xl border border-border/50">
                                            {selectedTrx.description}
                                        </div>
                                    </div>
                                )}

                                {selectedTrx.rejectionReason && (
                                    <div className="space-y-1">
                                        <label className="text-xs text-red-500/80 font-medium uppercase">Rejection Reason</label>
                                        <div className="text-sm text-red-500 bg-red-500/5 p-3 rounded-xl border border-red-500/20">
                                            {selectedTrx.rejectionReason}
                                        </div>
                                    </div>
                                )}
                            </div>

                            <button
                                onClick={() => setSelectedTrx(null)}
                                className="w-full p-4 text-center font-bold text-sm bg-muted/30 hover:bg-muted/50 border-t border-border transition-colors text-muted-foreground"
                            >
                                Close Receipt
                            </button>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}
