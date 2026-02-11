"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { X, Loader2 } from "lucide-react";

interface WithdrawModalProps {
    isOpen: boolean;
    onClose: () => void;
    availableBalance: number;
}

export default function WithdrawModal({ isOpen, onClose, availableBalance }: WithdrawModalProps) {
    const [amount, setAmount] = useState<number | "">("");
    const [accountNumber, setAccountNumber] = useState("");
    const [accountTitle, setAccountTitle] = useState("");
    const [method, setMethod] = useState("Easypaisa");

    if (!isOpen) return null;

    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async () => {
        if (!amount || !method || !accountNumber || !accountTitle) return;
        setIsSubmitting(true);

        try {
            const res = await fetch('/api/finance/withdraw', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    amount,
                    method,
                    accountNumber,
                    accountTitle
                })
            });

            const data = await res.json();

            if (res.ok) {
                alert('Withdrawal request submitted!');
                onClose();
                window.location.reload(); // Refresh to update balance
            } else {
                alert('Error: ' + data.message);
            }
        } catch (error) {
            console.error('Withdrawal error:', error);
            alert('Something went wrong.');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="w-full max-w-md overflow-hidden rounded-2xl bg-[#0f141f] border border-blue-900/50 shadow-2xl"
            >
                <div className="flex items-center justify-between border-b border-blue-900/30 p-4">
                    <h2 className="text-xl font-bold text-white">Withdraw Funds</h2>
                    <button
                        onClick={onClose}
                        className="rounded-full p-1 text-gray-400 hover:bg-white/10 hover:text-white"
                    >
                        <X size={20} />
                    </button>
                </div>


                <div className="p-6 space-y-4 max-h-[65vh] overflow-y-auto">
                    <div className="bg-blue-900/20 p-3 rounded-lg flex justify-between items-center">
                        <span className="text-gray-400 text-sm">Available Balance</span>
                        <span className="text-yellow-500 font-bold">{availableBalance} Coins</span>
                    </div>

                    <div>
                        <label className="mb-1 block text-sm text-gray-400">Amount to Withdraw</label>
                        <input
                            type="number"
                            value={amount}
                            onChange={(e) => setAmount(Number(e.target.value))}
                            className={`w-full rounded-lg border p-3 text-white focus:outline-none ${(Number(amount) > availableBalance || (amount !== "" && Number(amount) < 250))
                                ? "border-red-500 bg-red-500/10 focus:border-red-500"
                                : "border-blue-900/30 bg-blue-900/10 focus:border-yellow-500"
                                }`}
                            placeholder="Min: 250"
                        />
                        {amount !== "" && Number(amount) < 250 && (
                            <p className="mt-1 text-xs text-red-400">Minimum withdrawal is 250 coins.</p>
                        )}
                        {Number(amount) > availableBalance && (
                            <p className="mt-1 text-xs text-red-500 font-medium">Insufficient balance! You only have {availableBalance} coins.</p>
                        )}
                    </div>

                    <div>
                        <label className="mb-1 block text-sm text-gray-400">Payment Method</label>
                        <select
                            value={method}
                            onChange={(e) => setMethod(e.target.value)}
                            className="w-full rounded-lg border border-blue-900/30 bg-[#0a0f16] p-3 text-white focus:border-yellow-500 focus:outline-none"
                        >
                            <option value="Easypaisa">Easypaisa</option>
                            <option value="JazzCash">JazzCash</option>
                            <option value="Sadapay">Sadapay</option>
                            <option value="Nayapay">Nayapay</option>
                        </select>
                    </div>

                    <div>
                        <label className="mb-1 block text-sm text-gray-400">Account Title (Name)</label>
                        <input
                            type="text"
                            value={accountTitle}
                            onChange={(e) => setAccountTitle(e.target.value)}
                            className="w-full rounded-lg border border-blue-900/30 bg-blue-900/10 p-3 text-white focus:border-yellow-500 focus:outline-none"
                            placeholder="e.g. Ali Ahmed"
                        />
                    </div>

                    <div>
                        <label className="mb-1 block text-sm text-gray-400">Account Number</label>
                        <input
                            type="text"
                            value={accountNumber}
                            onChange={(e) => setAccountNumber(e.target.value)}
                            className="w-full rounded-lg border border-blue-900/30 bg-blue-900/10 p-3 text-white focus:border-yellow-500 focus:outline-none"
                            placeholder="0300..."
                        />
                    </div>
                </div>

                {/* Fixed Button Footer */}
                <div className="p-4 border-t border-blue-900/30 bg-[#0a0f16]">
                    <button
                        onClick={handleSubmit}
                        disabled={!amount || Number(amount) < 250 || Number(amount) > availableBalance || !accountNumber || !accountTitle || isSubmitting}
                        className="w-full rounded-xl bg-red-500/90 hover:bg-red-500 p-4 font-bold text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {isSubmitting ? (
                            <div className="flex items-center justify-center gap-2">
                                <Loader2 className="animate-spin" /> Submitting...
                            </div>
                        ) : "Submit Withdrawal"}
                    </button>
                </div>
            </motion.div>
        </div>
    );
}
