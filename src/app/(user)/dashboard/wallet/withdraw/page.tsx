"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Wallet, AlertCircle } from "lucide-react";
import Link from "next/link";
import { motion } from "framer-motion";

interface PaymentMethod {
    _id: string;
    bankName: string;
}

export const dynamic = "force-dynamic";

export default function WithdrawPage() {
    const router = useRouter();
    const [balance, setBalance] = useState(0);
    const [methods, setMethods] = useState<PaymentMethod[]>([]);
    const [amount, setAmount] = useState<number | "">("");
    const [method, setMethod] = useState("");
    const [accountTitle, setAccountTitle] = useState("");
    const [accountNumber, setAccountNumber] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");
    const [dailyLimit, setDailyLimit] = useState({ used: 0, limit: 1000, remaining: 1000 });
    const [timeLeft, setTimeLeft] = useState("");

    useEffect(() => {
        fetchData();
        const timer = setInterval(updateCountdown, 1000);
        return () => clearInterval(timer);
    }, []);

    const updateCountdown = () => {
        const now = new Date();
        const tomorrow = new Date();
        tomorrow.setHours(24, 0, 0, 0);
        const diff = tomorrow.getTime() - now.getTime();

        const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((diff % (1000 * 60)) / 1000);

        setTimeLeft(`${hours}h ${minutes}m ${seconds}s`);
    };

    const fetchData = async () => {
        try {
            // Fetch Balance
            const balanceRes = await fetch("/api/finance/balance");
            const balanceData = await balanceRes.json();
            if (balanceData.balance !== undefined) {
                setBalance(balanceData.balance);
            }

            // Fetch Limit
            const limitRes = await fetch("/api/finance/withdraw"); // GET now returns limit info
            const limitData = await limitRes.json();
            if (limitData.limit) {
                setDailyLimit(limitData);
            }

            // Fetch Payment Methods
            const methodsRes = await fetch("/api/finance/methods");
            const methodsData = await methodsRes.json();
            if (Array.isArray(methodsData)) {
                setMethods(methodsData);
                if (methodsData.length > 0) {
                    setMethod(methodsData[0].bankName);
                }
            }
        } catch (error) {
            console.error("Failed to fetch data", error);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        setSuccess("");

        if (!amount || Number(amount) < 250) {
            setError("Minimum withdrawal amount is 250 coins.");
            return;
        }

        if (Number(amount) > balance) {
            setError("Insufficient balance.");
            return;
        }

        if (Number(amount) > dailyLimit.remaining) {
            setError(`Daily limit exceeded. You can only withdraw ${dailyLimit.remaining} more coins today.`);
            return;
        }

        setLoading(true);

        try {
            const res = await fetch("/api/finance/withdraw", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    amount: Number(amount),
                    method,
                    accountTitle,
                    accountNumber
                }),
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.message || "Withdrawal failed");
            }

            setSuccess("Withdrawal request submitted successfully!");
            setBalance((prev) => prev - Number(amount));
            // Update local limit state immediately
            setDailyLimit(prev => ({
                ...prev,
                used: prev.used + Number(amount),
                remaining: prev.remaining - Number(amount)
            }));

            setAmount("");
            setAccountTitle("");
            setAccountNumber("");

            // Redirect after short delay
            setTimeout(() => {
                router.push("/dashboard/wallet");
            }, 2000);

        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-8 pb-24 lg:pb-8">
            {/* Minimal Header */}
            <div className="pt-2 pb-3 px-4 border-b border-border/40 bg-background/50 backdrop-blur-md sticky top-0 z-30 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <Link href="/dashboard/wallet" className="p-1.5 bg-primary/10 rounded-lg shrink-0 text-primary hover:bg-primary/20 transition-colors">
                        <ArrowLeft className="w-5 h-5" />
                    </Link>
                    <div>
                        <h1 className="text-base font-bold text-foreground leading-none">
                            Withdraw
                        </h1>
                        <p className="text-[10px] text-muted-foreground font-medium mt-0.5">
                            Transfer winnings
                        </p>
                    </div>
                </div>
            </div>

            <div className="max-w-4xl mx-auto p-4 md:p-6 space-y-6">

                {/* Balance Card */}
                <div className="bg-card border border-border rounded-2xl p-6 flex justify-between items-center shadow-sm">
                    <div>
                        <p className="text-muted-foreground text-sm font-medium mb-1">Available Balance</p>
                        <div className="flex items-baseline gap-2">
                            <span className="text-3xl font-bold text-foreground">{balance}</span>
                            <span className="text-primary font-bold">Coins</span>
                        </div>
                    </div>
                    <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                        <Wallet size={24} />
                    </div>
                </div>

                {/* Daily Limit Card */}
                <div className="bg-card border border-border rounded-2xl p-6 shadow-sm space-y-3">
                    <div className="flex justify-between items-center">
                        <h3 className="text-sm font-bold text-foreground">Daily Limit (1,000 Coins)</h3>
                        <span className="text-xs font-mono text-muted-foreground">{dailyLimit.used} / {dailyLimit.limit} Used</span>
                    </div>

                    {/* Progress Bar */}
                    <div className="h-2 w-full bg-secondary rounded-full overflow-hidden">
                        <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${Math.min(100, (dailyLimit.used / dailyLimit.limit) * 100)}%` }}
                            className={`h-full ${dailyLimit.remaining === 0 ? 'bg-red-500' : 'bg-primary'} transition-all duration-500`}
                        />
                    </div>

                    {dailyLimit.remaining === 0 ? (
                        <div className="flex items-center justify-between p-3 bg-red-500/10 border border-red-500/20 rounded-xl">
                            <span className="text-xs text-red-400 font-bold">Limit Reached</span>
                            <span className="text-xs text-red-400 font-mono">Reset in: {timeLeft}</span>
                        </div>
                    ) : (
                        <p className="text-xs text-muted-foreground">
                            You can withdraw <span className="font-bold text-foreground">{dailyLimit.remaining}</span> more coins today.
                        </p>
                    )}
                </div>

                {/* Form */}
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-card border border-border rounded-2xl p-6 md:p-8 space-y-6 shadow-sm"
                >
                    {error && (
                        <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-xl flex items-start gap-3 text-sm">
                            <AlertCircle size={18} className="mt-0.5 shrink-0" />
                            <p>{error}</p>
                        </div>
                    )}

                    {success && (
                        <div className="bg-green-500/10 border border-green-500/20 text-green-400 p-4 rounded-xl flex items-center gap-3 text-sm">
                            <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse"></div>
                            <p>{success}</p>
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-5">
                        <div>
                            <label className="block text-sm font-medium text-muted-foreground mb-1.5">Amount</label>
                            <div className="relative">
                                <input
                                    type="number"
                                    value={amount}
                                    onChange={(e) => setAmount(Number(e.target.value))}
                                    disabled={dailyLimit.remaining === 0}
                                    className={`w-full bg-muted/30 border ${Number(amount) > balance || (dailyLimit.remaining > 0 && Number(amount) > dailyLimit.remaining) ? 'border-red-500/50' : 'border-border'} rounded-xl px-4 py-3 text-foreground placeholder-muted-foreground focus:outline-none focus:border-primary transition-colors disabled:opacity-50`}
                                    placeholder={dailyLimit.remaining === 0 ? "Daily limit reached" : "Min 250"}
                                />
                                <span className="absolute right-4 top-3 text-muted-foreground text-sm font-medium">Coins</span>
                            </div>

                            {/* Real-time Validation Messages */}
                            {amount && Number(amount) > balance && (
                                <p className="text-red-500 text-xs mt-1.5 font-medium flex items-center gap-1">
                                    <AlertCircle size={12} /> Insufficient balance. You have {balance} coins.
                                </p>
                            )}

                            {amount && dailyLimit.remaining > 0 && Number(amount) > dailyLimit.remaining && (
                                <p className="text-red-500 text-xs mt-1.5 font-medium flex items-center gap-1">
                                    <AlertCircle size={12} /> Daily limit exceeded. You can only withdraw {dailyLimit.remaining} more coins today.
                                </p>
                            )}
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-muted-foreground mb-1.5">Bank / Wallet</label>
                            <select
                                value={method}
                                onChange={(e) => setMethod(e.target.value)}
                                disabled={dailyLimit.remaining === 0}
                                className="w-full bg-muted/30 border border-border rounded-xl px-4 py-3 text-foreground focus:outline-none focus:border-primary appearance-none cursor-pointer disabled:opacity-50"
                            >
                                {methods.length === 0 && <option>Loading methods...</option>}
                                {methods.map((m) => (
                                    <option key={m._id} value={m.bankName} className="bg-card text-foreground">
                                        {m.bankName}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div className="grid md:grid-cols-2 gap-5">
                            <div>
                                <label className="block text-sm font-medium text-muted-foreground mb-1.5">Account Title</label>
                                <input
                                    type="text"
                                    value={accountTitle}
                                    onChange={(e) => setAccountTitle(e.target.value)}
                                    disabled={dailyLimit.remaining === 0}
                                    className="w-full bg-muted/30 border border-border rounded-xl px-4 py-3 text-foreground placeholder-muted-foreground focus:outline-none focus:border-primary transition-colors disabled:opacity-50"
                                    placeholder="e.g. Ali Ahmed"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-muted-foreground mb-1.5">Account Number</label>
                                <input
                                    type="text"
                                    value={accountNumber}
                                    onChange={(e) => setAccountNumber(e.target.value)}
                                    disabled={dailyLimit.remaining === 0}
                                    className="w-full bg-muted/30 border border-border rounded-xl px-4 py-3 text-foreground placeholder-muted-foreground focus:outline-none focus:border-primary transition-colors disabled:opacity-50"
                                    placeholder="0300..."
                                    required
                                />
                            </div>
                        </div>

                        <div className="pt-2">
                            <button
                                type="submit"
                                disabled={loading || !amount || Number(amount) < 250 || Number(amount) > balance || (dailyLimit.remaining > 0 && Number(amount) > dailyLimit.remaining) || dailyLimit.remaining === 0}
                                className="w-full bg-primary hover:bg-primary/90 disabled:bg-primary/50 disabled:cursor-not-allowed text-primary-foreground font-bold py-4 rounded-xl transition-all shadow-lg shadow-primary/20 active:scale-[0.98]"
                            >
                                {loading ? "Processing..." : dailyLimit.remaining === 0 ? "Come Back Tomorrow" : "Withdraw Funds"}
                            </button>
                            {dailyLimit.remaining === 0 && (
                                <p className="text-center text-xs text-red-400 mt-2 font-mono">
                                    Resets in: {timeLeft}
                                </p>
                            )}
                            <p className="text-center text-xs text-muted-foreground mt-4">
                                Funds will be locked immediately. Processing may take up to 24 hours.
                            </p>
                        </div>
                    </form>
                </motion.div>
            </div>
        </div>
    );
}
