'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import {
    Search,
    Filter,
    Download,
    ChevronLeft,
    ChevronRight,
    ArrowUpRight,
    ArrowDownLeft,
    Trophy,
    ShoppingBag,
    RefreshCw,
    Calendar
} from 'lucide-react';
import { format } from 'date-fns';

interface Transaction {
    _id: string;
    user: {
        _id: string;
        name: string;
        email: string;
        inGameName?: string;
    };
    amount: number;
    type: string;
    status: string;
    createdAt: string;
    trxID?: string;
    method?: string;
}

export default function TransactionsPage() {
    const { data: session } = useSession();
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalDocs, setTotalDocs] = useState(0);

    // Filters
    const [filterType, setFilterType] = useState('all');
    const [filterStatus, setFilterStatus] = useState('all');
    const [search, setSearch] = useState('');
    const [debouncedSearch, setDebouncedSearch] = useState('');

    // Debounce Search
    useEffect(() => {
        const timer = setTimeout(() => setDebouncedSearch(search), 500);
        return () => clearTimeout(timer);
    }, [search]);

    const fetchTransactions = async () => {
        setLoading(true);
        try {
            const query = new URLSearchParams({
                page: page.toString(),
                limit: '20',
                type: filterType,
                status: filterStatus,
                search: debouncedSearch
            });

            const res = await fetch(`/api/admin/transactions?${query}`);
            const data = await res.json();

            if (data.transactions) {
                setTransactions(data.transactions);
                setTotalPages(data.pagination.pages);
                setTotalDocs(data.pagination.total);
            }
        } catch (error) {
            console.error('Failed to fetch transactions', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchTransactions();
    }, [page, filterType, filterStatus, debouncedSearch]);

    const handleExportCSV = () => {
        // Simple CSV export logic for current view or filtered data
        // For a true "Export All", we might need a separate API endpoint or logic
        const header = ['ID,User,Email,Type,Amount,Status,Date,Method,TrxID\n'];
        const rows = transactions.map(t =>
            `"${t._id}","${t.user?.name || 'Unknown'}","${t.user?.email || 'Unknown'}","${t.type}",${t.amount},"${t.status}","${new Date(t.createdAt).toISOString()}","${t.method || ''}","${t.trxID || ''}"`
        );

        const csvContent = "data:text/csv;charset=utf-8," + header + rows.join("\n");
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", `transactions_export_${format(new Date(), 'yyyy-MM-dd')}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const getTypeIcon = (type: string) => {
        switch (type) {
            case 'deposit': return <ArrowUpRight className="text-green-500" size={16} />;
            case 'withdrawal': return <ArrowDownLeft className="text-red-500" size={16} />;
            case 'entry_fee': return <Trophy className="text-purple-500" size={16} />;
            case 'prize_winnings': return <Trophy className="text-yellow-500" size={16} />;
            case 'shop_purchase': return <ShoppingBag className="text-blue-500" size={16} />;
            default: return <RefreshCw className="text-gray-500" size={16} />;
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold">Global Transactions</h1>
                    <p className="text-muted-foreground text-sm">Monitor all financial movement across the platform.</p>
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={handleExportCSV}
                        className="flex items-center gap-2 px-4 py-2 bg-card border border-border rounded-lg hover:bg-muted transition-colors text-sm font-medium"
                    >
                        <Download size={16} />
                        Export CSV
                    </button>
                </div>
            </div>

            {/* Filters Bar */}
            <div className="p-4 bg-card border border-border rounded-xl space-y-4 md:space-y-0 md:flex md:items-center md:gap-4">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
                    <input
                        type="text"
                        placeholder="Search by User, Email, or Trx ID..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                    />
                </div>

                <div className="flex items-center gap-2 overflow-x-auto pb-2 md:pb-0">
                    <select
                        value={filterType}
                        onChange={(e) => { setPage(1); setFilterType(e.target.value); }}
                        className="px-3 py-2 bg-background border border-border rounded-lg text-sm min-w-[140px]"
                    >
                        <option value="all">All Types</option>
                        <option value="deposit">Deposits</option>
                        <option value="withdrawal">Withdrawals</option>
                        <option value="shop_purchase">Store Purchases</option>
                        <option value="entry_fee">Tournament Fees</option>
                        <option value="prize_winnings">Winnings</option>
                    </select>

                    <select
                        value={filterStatus}
                        onChange={(e) => { setPage(1); setFilterStatus(e.target.value); }}
                        className="px-3 py-2 bg-background border border-border rounded-lg text-sm min-w-[140px]"
                    >
                        <option value="all">All Statuses</option>
                        <option value="approved">Approved</option>
                        <option value="pending">Pending</option>
                        <option value="rejected">Rejected</option>
                    </select>
                </div>
            </div>

            {/* Data Table */}
            <div className="bg-card border border-border rounded-xl overflow-hidden shadow-sm">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-muted/50 text-muted-foreground uppercase text-xs font-semibold">
                            <tr>
                                <th className="px-6 py-4">User</th>
                                <th className="px-6 py-4">Type</th>
                                <th className="px-6 py-4 text-right">Amount</th>
                                <th className="px-6 py-4">Status</th>
                                <th className="px-6 py-4">Date</th>
                                <th className="px-6 py-4">Details</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border/50">
                            {loading ? (
                                <tr>
                                    <td colSpan={6} className="px-6 py-12 text-center text-muted-foreground">
                                        Loading transactions...
                                    </td>
                                </tr>
                            ) : transactions.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="px-6 py-12 text-center text-muted-foreground">
                                        No transactions found matching your criteria.
                                    </td>
                                </tr>
                            ) : (
                                transactions.map((trx) => (
                                    <tr key={trx._id} className="hover:bg-muted/30 transition-colors">
                                        <td className="px-6 py-4">
                                            <div>
                                                <div className="font-medium text-foreground">{trx.user?.name || 'Unknown User'}</div>
                                                <div className="text-xs text-muted-foreground">{trx.user?.email}</div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2">
                                                {getTypeIcon(trx.type)}
                                                <span className="capitalize">{trx.type.replace('_', ' ')}</span>
                                            </div>
                                        </td>
                                        <td className={`px-6 py-4 text-right font-mono font-bold ${['deposit', 'prize_winnings'].includes(trx.type) ? 'text-green-500' : 'text-red-500'
                                            }`}>
                                            {['deposit', 'prize_winnings'].includes(trx.type) ? '+' : '-'} {Math.abs(trx.amount).toLocaleString()}
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`px-2 py-1 rounded-full text-xs font-bold uppercase ${trx.status === 'approved' || trx.status === 'Completed' ? 'bg-green-500/10 text-green-500' :
                                                    trx.status === 'pending' || trx.status === 'Pending' ? 'bg-yellow-500/10 text-yellow-500' :
                                                        'bg-red-500/10 text-red-500'
                                                }`}>
                                                {trx.status}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-muted-foreground">
                                            {format(new Date(trx.createdAt), 'MMM dd, yyyy HH:mm')}
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="text-xs text-muted-foreground max-w-[150px] truncate">
                                                {trx.trxID && <span className="block font-mono bg-muted/50 px-1 rounded text-[10px] w-fit mb-1">{trx.trxID}</span>}
                                                {trx.method}
                                            </div>
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
                        Showing <span className="font-bold">{transactions.length}</span> of <span className="font-bold">{totalDocs}</span> records
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
