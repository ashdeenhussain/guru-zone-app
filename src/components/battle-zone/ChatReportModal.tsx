'use client';

import { useState } from 'react';
import { Flag, X, AlertTriangle, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface ChatReportModalProps {
    isOpen: boolean;
    onClose: () => void;
    matchId: string;
    reportedUserId: string;
    reportedUserName: string;
    messageText: string;
}

export default function ChatReportModal({
    isOpen,
    onClose,
    matchId,
    reportedUserId,
    reportedUserName,
    messageText
}: ChatReportModalProps) {
    const [reason, setReason] = useState('Abusive Language');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const reasons = [
        "Abusive Language",
        "Refusing to give Room ID",
        "Spam",
        "Hate Speech",
        "Inappropriate Behavior"
    ];

    if (!isOpen) return null;

    const handleSubmit = async () => {
        setIsSubmitting(true);
        try {
            const res = await fetch('/api/battle-zone/report-chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    matchId,
                    reportedUserId,
                    messageText,
                    reason
                }),
            });

            const data = await res.json();
            if (data.success) {
                toast.success('Report submitted. Admins will review the message.');
                onClose();
            } else {
                toast.error(data.error || 'Failed to submit report');
            }
        } catch (error) {
            toast.error('An error occurred. Please try again.');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-card border border-border w-full max-w-md rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
                <div className="p-4 border-b border-border flex items-center justify-between bg-muted/20">
                    <div className="flex items-center gap-2 text-primary">
                        <Flag className="w-5 h-5 fill-current" />
                        <h2 className="font-bold">Report Chat Message</h2>
                    </div>
                    <button onClick={onClose} className="p-1 hover:bg-muted rounded-full transition-colors text-muted-foreground hover:text-foreground">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="p-6 space-y-6">
                    <div className="bg-red-500/5 border border-red-500/10 rounded-xl p-4">
                        <div className="flex items-center gap-2 text-red-500 mb-2">
                            <AlertTriangle className="w-4 h-4" />
                            <span className="text-xs font-bold uppercase tracking-wider">Reported Message</span>
                        </div>
                        <p className="text-sm italic text-foreground/80 break-words">
                            "{messageText}"
                        </p>
                        <p className="text-[10px] text-muted-foreground mt-2 font-medium">
                            By: {reportedUserName}
                        </p>
                    </div>

                    <div className="space-y-3">
                        <label className="text-sm font-bold text-muted-foreground block">Reason for reporting:</label>
                        <div className="grid grid-cols-1 gap-2">
                            {reasons.map((r) => (
                                <button
                                    key={r}
                                    onClick={() => setReason(r)}
                                    className={`text-left px-4 py-3 rounded-xl text-sm font-medium transition-all border ${reason === r
                                            ? 'bg-primary/10 border-primary text-primary shadow-[0_0_15px_rgba(var(--primary-rgb),0.1)]'
                                            : 'bg-muted/30 border-border/50 text-muted-foreground hover:bg-muted hover:border-border'
                                        }`}
                                >
                                    {r}
                                </button>
                            ))}
                        </div>
                    </div>

                    <button
                        onClick={handleSubmit}
                        disabled={isSubmitting}
                        className="w-full bg-primary hover:bg-primary/90 text-primary-foreground py-3.5 rounded-xl font-bold shadow-lg shadow-primary/20 transition-all flex items-center justify-center gap-2 group disabled:opacity-50"
                    >
                        {isSubmitting ? (
                            <Loader2 className="w-5 h-5 animate-spin" />
                        ) : (
                            <>
                                <Flag className="w-4 h-4" />
                                Submit Report
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
}
