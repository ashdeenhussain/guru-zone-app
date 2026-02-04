"use client";

import { useEffect, useState } from "react";
import { format } from "date-fns";
import {
    ArrowUp,
    ArrowDown,
    Clock,
    Filter,
    Trophy,
    Gamepad2,
    CheckCircle2,
    XCircle,
    AlertCircle
} from "lucide-react";
import { motion } from "framer-motion";

interface Transaction {
    _id: string;
    type: 'deposit' | 'withdrawal' | 'entry_fee' | 'prize_winnings';
    amount: number;
    status: 'pending' | 'approved' | 'rejected';
    createdAt: string;
    method?: string;
    trxID?: string;
    description?: string;
}

export default function TransactionHistoryPage() {
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState<'all' | 'deposit' | 'withdrawal'>('all');

    useEffect(() => {
        fetchTransactions();
    }, []);

    const fetchTransactions = async () => {
        try {
            const res = await fetch("/api/finance/history");
            const data = await res.json();
            if (res.ok) {
                setTransactions(data.transactions || []);
            }
        } catch (error) {
            console.error("Failed to fetch transactions", error);
        } finally {
            setLoading(false);
        }
    };

    const filteredTransactions = transactions.filter(t => {
        if (filter === 'all') return true;
        if (filter === 'deposit') return t.type === 'deposit';
        if (filter === 'withdrawal') return t.type === 'withdrawal';
        return true;
    });

    const getIcon = (type: string) => {
        switch (type) {
            case 'deposit': return <ArrowUp className="w-5 h-5 text-green-500" />;
            case 'withdrawal': return <ArrowDown className="w-5 h-5 text-red-500" />;
            case 'entry_fee': return <Gamepad2 className="w-5 h-5 text-yellow-500" />;
            case 'prize_winnings': return <Trophy className="w-5 h-5 text-primary" />;
            default: return <Clock className="w-5 h-5 text-muted-foreground" />;
        }
    };

    const getTitle = (type: string) => {
        switch (type) {
            case 'deposit': return "Deposit";
            case 'withdrawal': return "Withdrawal";
            case 'entry_fee': return "Tournament Entry";
            case 'prize_winnings': return "Prize Won";
            default: return "Transaction";
        }
    };

    const isCredit = (type: string) => ['deposit', 'prize_winnings'].includes(type);

    return (
        <div className="min-h-screen bg-background text-foreground p-4 md:p-8 pb-24 lg:pb-8">
            <div className="max-w-6xl mx-auto space-y-8">
                {/* Minimal Header */}
                <div className="pt-2 pb-3 px-4 border-b border-border/40 bg-background/50 backdrop-blur-md sticky top-0 z-30 mb-6 flex items-center justify-between -mx-4 md:-mx-8">
                    <div className="flex items-center gap-3">
                        <div className="p-1.5 bg-primary/10 rounded-lg shrink-0">
                            <Clock className="w-5 h-5 text-primary" />
                        </div>
                        <div>
                            <h1 className="text-base font-bold text-foreground leading-none">
                                History
                            </h1>
                            <p className="text-[10px] text-muted-foreground font-medium mt-0.5">
                                Transactions & Activities
                            </p>
                        </div>
                    </div>
                </div>

                {/* Filter Tabs */}
                <div className="flex space-x-2 overflow-x-auto pb-2 scrollbar-hide">
                    {(['all', 'deposit', 'withdrawal'] as const).map((f) => (
                        <button
                            key={f}
                            onClick={() => setFilter(f)}
                            className={`
                                px-4 py-2 rounded-full text-sm font-medium capitalize transition-all
                                ${filter === f
                                    ? "bg-primary text-primary-foreground font-bold"
                                    : "bg-muted text-muted-foreground hover:bg-muted/80"
                                }
                            `}
                        >
                            {f}
                        </button>
                    ))}
                </div>

                {/* Content */}
                {loading ? (
                    <div className="flex justify-center py-20">
                        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
                    </div>
                ) : filteredTransactions.length === 0 ? (
                    <div className="text-center py-20 bg-card rounded-2xl border border-border">
                        <Clock className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                        <h3 className="text-xl font-bold text-foreground">No transaction history yet</h3>
                        <p className="text-muted-foreground">Your recent financial activities will appear here.</p>
                    </div>
                ) : (
                    <>
                        {/* Mobile List (Cards) */}
                        <div className="md:hidden space-y-4">
                            {filteredTransactions.map((t) => (
                                <motion.div
                                    key={t._id}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="bg-card border border-border rounded-2xl p-4 space-y-4"
                                >
                                    <div className="flex justify-between items-start">
                                        <div className="flex gap-3">
                                            <div className="p-2 rounded-xl bg-muted border border-border">
                                                {getIcon(t.type)}
                                            </div>
                                            <div>
                                                <h3 className="font-bold text-foreground">{getTitle(t.type)}</h3>
                                                <p className="text-xs text-muted-foreground">
                                                    {format(new Date(t.createdAt), "MM/dd/yyyy, h:mm a")}
                                                </p>
                                            </div>
                                        </div>
                                        <div className={`text-right font-bold ${isCredit(t.type) ? 'text-green-500' : 'text-red-500'}`}>
                                            {isCredit(t.type) ? '+' : '-'}{t.amount} coins
                                        </div>
                                    </div>
                                    <div className="pt-3 border-t border-border flex justify-between items-center text-sm">
                                        <span className="text-muted-foreground">{t.method || 'System'}</span>
                                        <StatusBadge status={t.status} />
                                    </div>
                                </motion.div>
                            ))}
                        </div>

                        {/* Desktop Table */}
                        <div className="hidden md:block bg-card border border-border rounded-2xl overflow-hidden shadow-sm">
                            <table className="w-full">
                                <thead className="bg-muted/50 text-muted-foreground text-left text-sm uppercase">
                                    <tr>
                                        <th className="p-4 pl-6">Type</th>
                                        <th className="p-4">Date</th>
                                        <th className="p-4">Method</th>
                                        <th className="p-4 text-right">Amount</th>
                                        <th className="p-4 text-right pr-6">Status</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-white/10">
                                    {filteredTransactions.map((t) => (
                                        <tr key={t._id} className="hover:bg-muted/30 transition-colors border-b border-border/50 last:border-0">
                                            <td className="p-4 pl-6">
                                                <div className="flex items-center gap-3">
                                                    <div className="p-2 rounded-xl bg-muted border border-border">
                                                        {getIcon(t.type)}
                                                    </div>
                                                    <span className="font-medium text-foreground">{getTitle(t.type)}</span>
                                                </div>
                                            </td>
                                            <td className="p-4 text-muted-foreground text-sm">
                                                {format(new Date(t.createdAt), "MM/dd/yyyy, h:mm:ss a")}
                                            </td>
                                            <td className="p-4 text-muted-foreground text-sm">
                                                {t.method || 'System'}
                                            </td>
                                            <td className={`p-4 text-right font-bold ${isCredit(t.type) ? 'text-green-500' : 'text-red-500'}`}>
                                                {isCredit(t.type) ? '+' : '-'}{t.amount} coins
                                            </td>
                                            <td className="p-4 text-right pr-6">
                                                <div className="flex justify-end">
                                                    <StatusBadge status={t.status} />
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}

function StatusBadge({ status }: { status: string }) {
    const styles = {
        approved: "bg-green-500/10 text-green-500 border-green-500/20",
        pending: "bg-yellow-500/10 text-yellow-500 border-yellow-500/20",
        rejected: "bg-red-500/10 text-red-500 border-red-500/20",
    };

    // Normalize status to lowercase to match keys
    const normalizedStatus = status.toLowerCase();
    const activeStyle = styles[normalizedStatus as keyof typeof styles] || styles.pending;

    // Icon
    let Icon = AlertCircle;
    if (normalizedStatus === 'approved') Icon = CheckCircle2;
    if (normalizedStatus === 'rejected') Icon = XCircle;
    if (normalizedStatus === 'pending') Icon = Clock;

    return (
        <span className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${activeStyle}`}>
            <Icon className="w-3.5 h-3.5" />
            <span className="capitalize">{normalizedStatus}</span>
        </span>
    );
}
