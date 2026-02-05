"use client";

import { useState, useEffect } from "react";
import { RefreshCw, Plus, ArrowUpRight, Wallet, History } from "lucide-react";
import { motion } from "framer-motion";
import Link from "next/link";
import BuyCoinsModal from "@/components/wallet/BuyCoinsModal";
import TransactionHistory from "@/components/wallet/TransactionHistory";

interface Transaction {
    _id: string;
    type: string;
    amount: number;
    status: string;
    createdAt: string;
    description?: string;
    rejectionReason?: string;
}

export default function WalletPage() {
    const [balance, setBalance] = useState(0);
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [loading, setLoading] = useState(true);
    const [showBuyModal, setShowBuyModal] = useState(false);

    // Initial Fetch
    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setLoading(true);
        try {
            // Fetch Balance
            const balanceRes = await fetch("/api/finance/balance");
            const balanceData = await balanceRes.json();
            if (balanceData.balance !== undefined) {
                setBalance(balanceData.balance);
            }

            // Fetch History
            const historyRes = await fetch("/api/finance/history");
            const historyData = await historyRes.json();
            if (Array.isArray(historyData)) {
                setTransactions(historyData);
            }
        } catch (error) {
            console.error("Failed to fetch wallet data", error);
        } finally {
            setLoading(false);
        }
    };

    const handleRefresh = () => {
        fetchData();
    };

    return (
        <div className="space-y-8 pb-24 lg:pb-8">
            {/* Minimal Header */}
            <div className="pt-2 pb-3 px-4 border-b border-border/40 bg-background/50 backdrop-blur-md sticky top-0 z-30 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="p-1.5 bg-primary/10 rounded-lg shrink-0">
                        <Wallet className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                        <h1 className="text-base font-bold text-foreground leading-none">
                            My Wallet
                        </h1>
                        <p className="text-[10px] text-muted-foreground font-medium mt-0.5">
                            Manage your coins
                        </p>
                    </div>
                </div>
                <button
                    onClick={handleRefresh}
                    className="p-1.5 rounded-full bg-muted/50 hover:bg-muted text-muted-foreground transition-colors"
                >
                    <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
                </button>
            </div>

            <div className="max-w-4xl mx-auto p-4 md:p-6 space-y-8">
                {/* Hero Card */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="relative overflow-hidden rounded-3xl bg-card border border-border p-6 md:p-8 shadow-sm group"
                >
                    <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl pointer-events-none group-hover:bg-primary/10 transition-colors" />

                    <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
                        <div>
                            <div className="flex items-center gap-2 text-muted-foreground mb-2">
                                <div className="p-1 bg-primary/10 rounded-md">
                                    <Wallet size={14} className="text-primary" />
                                </div>
                                <span className="font-bold text-xs uppercase tracking-wider">Available Balance</span>
                            </div>
                            <div className="flex items-baseline gap-2">
                                <h2 className="text-5xl font-black text-foreground tracking-tight">{balance}</h2>
                                <div className="flex flex-col">
                                    <span className="text-xl font-bold text-muted-foreground">Coins</span>
                                    <span className="text-xs text-muted-foreground/60 font-medium">1 Coin = 1 PKR</span>
                                </div>
                            </div>
                        </div>

                        <div className="flex items-center gap-3">
                            <button
                                onClick={() => setShowBuyModal(true)}
                                className="flex items-center gap-2 rounded-xl bg-primary px-6 py-3 font-bold text-primary-foreground shadow-lg shadow-primary/20 transition-transform hover:scale-105 active:scale-95"
                            >
                                <Plus size={20} /> Buy Coins
                            </button>
                            <Link
                                href="/dashboard/wallet/withdraw"
                                className="flex items-center gap-2 rounded-xl border border-input bg-background/50 px-6 py-3 font-bold text-foreground transition-colors hover:bg-accent hover:text-accent-foreground active:scale-95"
                            >
                                <ArrowUpRight size={20} /> Withdraw
                            </Link>
                        </div>
                    </div>
                </motion.div>

                {/* Transactions */}
                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <History size={20} className="text-primary" />
                            <h3 className="text-lg font-bold text-foreground">Transaction History</h3>
                        </div>
                    </div>

                    <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-sm">
                        <TransactionHistory transactions={transactions} loading={loading} />
                    </div>
                </div>
            </div>

            {/* Modals */}
            <BuyCoinsModal
                isOpen={showBuyModal}
                onClose={() => {
                    setShowBuyModal(false);
                }}
            />
        </div>
    );
}
