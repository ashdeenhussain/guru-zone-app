'use client';

import { useState, useEffect } from 'react';
import { Flag, Trash2, Clock, Swords, User, MessageSquare, CheckCircle, XCircle, AlertCircle, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import PageHeader from '@/components/PageHeader';

export default function AdminChatReportsPage() {
    const [reports, setReports] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isProcessing, setIsProcessing] = useState<string | null>(null);

    const fetchReports = async () => {
        try {
            const res = await fetch('/api/admin/battle-zone/reports');
            const data = await res.json();
            if (data.success) {
                setReports(data.data);
            }
        } catch (error) {
            toast.error('Failed to fetch reports');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchReports();
    }, []);

    const handleAction = async (reportId: string, action: 'penalize' | 'dismiss') => {
        setIsProcessing(reportId);
        try {
            const res = await fetch('/api/admin/battle-zone/reports', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ reportId, action }),
            });

            const data = await res.json();
            if (data.success) {
                toast.success(action === 'penalize' ? 'User penalized successfully' : 'Report dismissed');
                setReports(reports.filter(r => r._id !== reportId));
            } else {
                toast.error(data.error || 'Action failed');
            }
        } catch (error) {
            toast.error('An error occurred');
        } finally {
            setIsProcessing(null);
        }
    };

    return (
        <div className="min-h-screen bg-background pb-12">
            <PageHeader
                title="Chat Reports"
                description="Review and moderate reported chat messages from Battle Zone."
                icon={Flag}
            />

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {isLoading ? (
                    <div className="flex flex-col items-center justify-center py-24 gap-4">
                        <Loader2 className="w-10 h-10 animate-spin text-primary" />
                        <p className="text-muted-foreground animate-pulse">Scanning for pending reports...</p>
                    </div>
                ) : reports.length === 0 ? (
                    <div className="bg-card border border-border rounded-2xl p-12 text-center max-w-md mx-auto shadow-sm">
                        <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                            <CheckCircle className="w-8 h-8 text-primary" />
                        </div>
                        <h3 className="text-xl font-bold mb-2">No Pending Reports</h3>
                        <p className="text-sm text-muted-foreground">
                            Great job! The battlefield is currently free of reported violations.
                        </p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 gap-6">
                        {reports.map((report) => (
                            <div key={report._id} className="bg-card border border-border rounded-3xl overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                                <div className="p-1 flex flex-col md:flex-row">
                                    {/* Left Info Column */}
                                    <div className="md:w-1/3 p-6 bg-muted/20 border-r border-border/50">
                                        <div className="flex items-center gap-2 text-primary mb-4">
                                            <Swords className="w-4 h-4" />
                                            <span className="text-xs font-bold uppercase tracking-widest">{report.matchId?.title || 'Unknown Match'}</span>
                                        </div>

                                        <div className="space-y-4">
                                            <div className="flex items-start gap-3">
                                                <div className="p-2 bg-background border border-border rounded-lg">
                                                    <Flag className="w-4 h-4 text-red-500" />
                                                </div>
                                                <div>
                                                    <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-tighter">Reporter</p>
                                                    <p className="text-sm font-bold truncate">@{report.reporterId?.username || 'Reported'}</p>
                                                </div>
                                            </div>

                                            <div className="flex items-start gap-3">
                                                <div className="p-2 bg-background border border-border rounded-lg">
                                                    <User className="w-4 h-4 text-blue-500" />
                                                </div>
                                                <div>
                                                    <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-tighter">Reported User</p>
                                                    <p className="text-sm font-bold truncate">@{report.reportedUserId?.username || 'User'}</p>
                                                    <div className="mt-1 inline-flex items-center px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-500 text-[10px] font-bold">
                                                        ⭐ {report.reportedUserId?.trustScore || 100}% Trust
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="flex items-start gap-3">
                                                <div className="p-2 bg-background border border-border rounded-lg text-muted-foreground">
                                                    <Clock className="w-4 h-4" />
                                                </div>
                                                <div>
                                                    <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-tighter">Timestamp</p>
                                                    <p className="text-xs">{format(new Date(report.createdAt), 'MMM dd, HH:mm')}</p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Center Content Column */}
                                    <div className="md:w-2/3 p-8 flex flex-col justify-between">
                                        <div>
                                            <div className="flex items-center justify-between mb-2">
                                                <div className="flex items-center gap-2 text-amber-500">
                                                    <AlertCircle className="w-4 h-4" />
                                                    <span className="text-xs font-bold uppercase tracking-widest">Reason: {report.reason}</span>
                                                </div>
                                            </div>

                                            <div className="relative">
                                                <div className="absolute -left-3 top-0 bottom-0 w-1 bg-red-500 rounded-full" />
                                                <div className="bg-red-500/5 p-6 rounded-2xl border border-red-500/10">
                                                    <p className="text-lg leading-relaxed font-medium italic text-foreground/90">
                                                        "{report.messageText}"
                                                    </p>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex flex-wrap items-center gap-3 mt-8">
                                            <button
                                                onClick={() => handleAction(report._id, 'penalize')}
                                                disabled={isProcessing === report._id}
                                                className="flex-1 min-w-[150px] bg-red-600 hover:bg-red-700 text-white px-6 py-3.5 rounded-2xl font-bold flex items-center justify-center gap-2 shadow-lg shadow-red-500/20 transition-all disabled:opacity-50 active:scale-95"
                                            >
                                                {isProcessing === report._id ? <Loader2 className="w-5 h-5 animate-spin" /> : <XCircle className="w-5 h-5" />}
                                                Penalize User (-10)
                                            </button>

                                            <button
                                                onClick={() => handleAction(report._id, 'dismiss')}
                                                disabled={isProcessing === report._id}
                                                className="flex-1 min-w-[150px] bg-muted hover:bg-muted/80 text-foreground px-6 py-3.5 rounded-2xl font-bold flex items-center justify-center gap-2 border border-border transition-all disabled:opacity-50 active:scale-95"
                                            >
                                                {isProcessing === report._id ? <Loader2 className="w-5 h-5 animate-spin" /> : <Trash2 className="w-5 h-5 text-muted-foreground" />}
                                                Dismiss Report
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
