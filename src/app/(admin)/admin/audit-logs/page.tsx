'use client';

import { useState, useEffect } from 'react';
import {
    Search,
    Filter,
    ChevronLeft,
    ChevronRight,
    ShieldAlert,
    UserCog,
    FileText,
    Settings,
    ShoppingBag,
    Trophy
} from 'lucide-react';
import { format } from 'date-fns';

interface AuditLog {
    _id: string;
    adminName: string;
    actionType: string;
    targetId?: string;
    details: string;
    createdAt: string;
}

export default function AuditLogsPage() {
    const [logs, setLogs] = useState<AuditLog[]>([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalDocs, setTotalDocs] = useState(0);

    // Filters
    const [filterAction, setFilterAction] = useState('all');
    const [search, setSearch] = useState('');
    const [debouncedSearch, setDebouncedSearch] = useState('');

    // Debounce Search
    useEffect(() => {
        const timer = setTimeout(() => setDebouncedSearch(search), 500);
        return () => clearTimeout(timer);
    }, [search]);

    const fetchLogs = async () => {
        setLoading(true);
        try {
            const query = new URLSearchParams({
                page: page.toString(),
                limit: '20',
                actionType: filterAction,
                search: debouncedSearch
            });

            const res = await fetch(`/api/admin/audit-logs?${query}`);
            const data = await res.json();

            if (data.logs) {
                setLogs(data.logs);
                setTotalPages(data.pagination.pages);
                setTotalDocs(data.pagination.total);
            }
        } catch (error) {
            console.error('Failed to fetch audit logs', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchLogs();
    }, [page, filterAction, debouncedSearch]);

    const getActionIcon = (type: string) => {
        if (type.includes('USER')) return <UserCog className="text-blue-500" size={16} />;
        if (type.includes('DEPOSIT') || type.includes('WITHDRAWAL')) return <FileText className="text-green-500" size={16} />;
        if (type.includes('TOURNAMENT')) return <Trophy className="text-yellow-500" size={16} />;
        if (type.includes('Product') || type.includes('ORDER')) return <ShoppingBag className="text-purple-500" size={16} />;
        if (type.includes('SETTINGS')) return <Settings className="text-gray-500" size={16} />;
        return <ShieldAlert className="text-red-500" size={16} />;
    };

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold">Audit Logs</h1>
                <p className="text-muted-foreground text-sm">Track all administrative actions and system changes.</p>
            </div>

            {/* Filters Bar */}
            <div className="p-4 bg-card border border-border rounded-xl space-y-4 md:space-y-0 md:flex md:items-center md:gap-4">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
                    <input
                        type="text"
                        placeholder="Search by Admin Name, Details, or Target ID..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                    />
                </div>

                <div className="flex items-center gap-2 overflow-x-auto pb-2 md:pb-0">
                    <select
                        value={filterAction}
                        onChange={(e) => { setPage(1); setFilterAction(e.target.value); }}
                        className="px-3 py-2 bg-background border border-border rounded-lg text-sm min-w-[180px]"
                    >
                        <option value="all">All Actions</option>
                        <option value="UPDATE_USER">Update User</option>
                        <option value="BAN_USER">Ban User</option>
                        <option value="APPROVE_DEPOSIT">Approve Deposit</option>
                        <option value="REJECT_DEPOSIT">Reject Deposit</option>
                        <option value="APPROVE_WITHDRAWAL">Approve Withdrawal</option>
                        <option value="REJECT_WITHDRAWAL">Reject Withdrawal</option>
                        <option value="CREATE_TOURNAMENT">Create Tournament</option>
                        <option value="UPDATE_STORE_ITEM">Update Store</option>
                    </select>
                </div>
            </div>

            {/* Data Table */}
            <div className="bg-card border border-border rounded-xl overflow-hidden shadow-sm">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-muted/50 text-muted-foreground uppercase text-xs font-semibold">
                            <tr>
                                <th className="px-6 py-4">Admin</th>
                                <th className="px-6 py-4">Action</th>
                                <th className="px-6 py-4">Details</th>
                                <th className="px-6 py-4">Date</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border/50">
                            {loading ? (
                                <tr>
                                    <td colSpan={4} className="px-6 py-12 text-center text-muted-foreground">
                                        Loading logs...
                                    </td>
                                </tr>
                            ) : logs.length === 0 ? (
                                <tr>
                                    <td colSpan={4} className="px-6 py-12 text-center text-muted-foreground">
                                        No audit logs found matching your criteria.
                                    </td>
                                </tr>
                            ) : (
                                logs.map((log) => (
                                    <tr key={log._id} className="hover:bg-muted/30 transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="font-medium text-foreground">{log.adminName}</div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2">
                                                {getActionIcon(log.actionType)}
                                                <span className="capitalize">{log.actionType.replace(/_/g, ' ').toLowerCase()}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="text-sm text-muted-foreground">
                                                {log.details}
                                                {log.targetId && <span className="block text-[10px] font-mono text-muted-foreground/70 mt-1">ID: {log.targetId}</span>}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-muted-foreground">
                                            {format(new Date(log.createdAt), 'MMM dd, yyyy HH:mm')}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                <div className="p-4 border-t border-border flex items-center justify-between">
                    <div className="text-sm text-muted-foreground">
                        Showing <span className="font-bold">{logs.length}</span> of <span className="font-bold">{totalDocs}</span> records
                    </div>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => setPage(p => Math.max(1, p - 1))}
                            disabled={page === 1}
                            className="p-2 rounded-lg hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <ChevronLeft size={16} />
                        </button>
                        <span className="text-sm font-bold">Page {page} of {totalPages}</span>
                        <button
                            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                            disabled={page === totalPages}
                            className="p-2 rounded-lg hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <ChevronRight size={16} />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
