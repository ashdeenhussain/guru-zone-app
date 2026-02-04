
"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Check, X, Loader2, AlertCircle } from 'lucide-react';

export default function WithdrawalActions({ transactionId }: { transactionId: string }) {
    const [isLoading, setIsLoading] = useState(false);
    const [showRejectInput, setShowRejectInput] = useState(false);
    const [rejectionReason, setRejectionReason] = useState('');
    const router = useRouter();

    const handleAction = async (action: 'approve' | 'reject') => {
        if (action === 'reject' && !showRejectInput) {
            setShowRejectInput(true);
            return;
        }

        if (action === 'reject' && !rejectionReason.trim()) {
            alert("Please provide a reason for rejection.");
            return;
        }

        if (!confirm(`Are you sure you want to ${action} this request?`)) return;

        setIsLoading(true);

        try {
            const res = await fetch('/api/admin/transactions', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    transactionId,
                    action,
                    rejectionReason: action === 'reject' ? rejectionReason : undefined
                })
            });

            const data = await res.json();

            if (!res.ok) {
                alert(data.error || "Something went wrong");
            } else {
                router.refresh(); // Refresh server data
                alert(data.message);
            }
        } catch (error) {
            console.error(error);
            alert("Failed to process request");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="flex flex-col gap-2">
            {!showRejectInput ? (
                <div className="flex gap-2">
                    <button
                        onClick={() => handleAction('approve')}
                        disabled={isLoading}
                        className="bg-green-500/20 hover:bg-green-500/30 text-green-400 p-2 rounded-lg transition-colors disabled:opacity-50"
                        title="Approve"
                    >
                        {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Check className="w-5 h-5" />}
                    </button>
                    <button
                        onClick={() => handleAction('reject')}
                        disabled={isLoading}
                        className="bg-red-500/20 hover:bg-red-500/30 text-red-400 p-2 rounded-lg transition-colors disabled:opacity-50"
                        title="Reject"
                    >
                        {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <X className="w-5 h-5" />}
                    </button>
                </div>
            ) : (
                <div className="flex flex-col gap-2 animate-in fade-in slide-in-from-top-2">
                    <input
                        type="text"
                        placeholder="Reason for rejection..."
                        value={rejectionReason}
                        onChange={(e) => setRejectionReason(e.target.value)}
                        className="bg-neutral-900 border border-neutral-700 rounded-md px-3 py-1 text-sm text-white focus:outline-none focus:border-red-500"
                    />
                    <div className="flex gap-2">
                        <button
                            onClick={() => handleAction('reject')}
                            disabled={isLoading}
                            className="bg-red-600 hover:bg-red-700 text-white text-xs px-3 py-1 rounded-md transition-colors"
                        >
                            {isLoading ? 'Processing...' : 'Confirm Reject'}
                        </button>
                        <button
                            onClick={() => setShowRejectInput(false)}
                            className="text-neutral-400 text-xs px-2 py-1 hover:text-white"
                        >
                            Cancel
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
