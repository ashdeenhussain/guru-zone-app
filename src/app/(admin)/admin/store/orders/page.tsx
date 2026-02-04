
'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
    Users,
    CheckCircle,
    XCircle,
    Clock,
    Search,
    Copy,
    AlertCircle,
    ShoppingBag,
    ListFilter,
    CheckCircle2,
    RefreshCcw,
    Package
} from 'lucide-react';

interface Order {
    _id: string;
    userId: { _id: string; name: string; email: string };
    productId: { title: string; priceCoins: number; imageType: string; imageUrl?: string; emoji?: string };
    pricePaid: number;
    status: 'Pending' | 'Approved' | 'Rejected';
    userDetails: {
        inGameName: string;
        uid: string;
    };
    createdAt: string;
    adminComment?: string;
}

export default function OrderManagementPage() {
    const [orders, setOrders] = useState<Order[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('Pending');
    const [searchQuery, setSearchQuery] = useState('');

    // Action State
    const [processingId, setProcessingId] = useState<string | null>(null);
    const [rejectId, setRejectId] = useState<string | null>(null);
    const [rejectReason, setRejectReason] = useState('');

    useEffect(() => {
        fetchOrders();
    }, []);

    const fetchOrders = async () => {
        try {
            const res = await fetch('/api/admin/store/orders');
            const data = await res.json();
            if (data.success) {
                setOrders(data.orders);
            }
        } catch (error) {
            console.error('Failed to fetch orders', error);
        } finally {
            setLoading(false);
        }
    };

    const handleProcessOrder = async (id: string, action: 'approve' | 'reject', reason?: string) => {
        if (processingId) return;
        setProcessingId(id);

        try {
            const res = await fetch(`/api/admin/store/orders/${id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action, reason }),
            });
            const data = await res.json();
            if (data.success) {
                // Update local state
                setOrders(prev => prev.map(o => o._id === id ? { ...o, status: action === 'approve' ? 'Approved' : 'Rejected' } : o));
                if (action === 'reject') {
                    setRejectId(null);
                    setRejectReason('');
                }
            } else {
                alert(data.message || 'Action failed');
            }
        } catch (error) {
            console.error('Error processing order', error);
            alert('Error processing order');
        } finally {
            setProcessingId(null);
        }
    };

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text);
        // Optional: Show toast
    };

    const tabs = [
        { id: 'All', label: 'All Orders' },
        { id: 'Pending', label: 'Pending' },
        { id: 'Approved', label: 'Completed' }, // Mapped to 'Approved'
        { id: 'Rejected', label: 'Rejected' },
    ];

    const filteredOrders = orders.filter(order => {
        // 1. Tab Filter
        if (activeTab !== 'All') {
            if (activeTab === 'Approved' && order.status !== 'Approved') return false;
            if (activeTab === 'Rejected' && order.status !== 'Rejected') return false;
            if (activeTab === 'Pending' && order.status !== 'Pending') return false;
        }

        // 2. Search Filter
        const searchLower = searchQuery.toLowerCase();
        return (
            order.userDetails?.inGameName.toLowerCase().includes(searchLower) ||
            order.userDetails?.uid.includes(searchLower) ||
            order.userId?.email?.toLowerCase().includes(searchLower)
        );
    });

    return (
        <div className="space-y-8 pt-24 pb-12">

            {/* Header & Title */}
            <div className="flex items-center justify-between gap-4 px-1">
                <div className="flex items-center gap-4">
                    <div className="p-3 bg-gradient-to-br from-blue-500/20 to-purple-500/20 rounded-2xl shrink-0 border border-white/5 shadow-inner">
                        <ShoppingBag className="w-6 h-6 text-blue-400" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-foreground tracking-tight">
                            Shop
                        </h1>
                        <p className="text-xs text-muted-foreground font-medium mt-1">
                            Monitor and process user purchases
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <Link
                        href="/admin/store/products"
                        className="flex items-center gap-2 px-3 py-2 bg-primary/10 hover:bg-primary/20 text-primary rounded-xl text-xs font-bold transition-all border border-primary/20 hover:border-primary/40 active:scale-95"
                    >
                        <Package size={16} />
                        <span className="hidden md:inline">Manage Items</span>
                    </Link>
                </div>
            </div>

            {/* Separator Line */}
            <div className="h-px w-full bg-border/50" />

            {/* Quick Stats Grid */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                    { label: 'Total Orders', value: orders.length, color: 'text-foreground', bg: 'bg-card', border: 'border-border' },
                    { label: 'Pending', value: orders.filter(o => o.status === 'Pending').length, color: 'text-yellow-500', bg: 'bg-yellow-500/5', border: 'border-yellow-500/20' },
                    { label: 'Completed', value: orders.filter(o => o.status === 'Approved').length, color: 'text-green-500', bg: 'bg-green-500/5', border: 'border-green-500/20' },
                    { label: 'Rejected', value: orders.filter(o => o.status === 'Rejected').length, color: 'text-red-500', bg: 'bg-red-500/5', border: 'border-red-500/20' }
                ].map((stat, i) => (
                    <div key={i} className={`${stat.bg} ${stat.border} border p-5 rounded-2xl flex flex-col justify-center gap-2 shadow-sm transition-transform hover:scale-[1.02]`}>
                        <span className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold">{stat.label}</span>
                        <span className={`text-3xl font-black ${stat.color} tracking-tighter`}>{stat.value}</span>
                    </div>
                ))}
            </div>

            {/* Controls: Tabs & Search */}
            <div className="flex flex-col md:flex-row justify-between items-center gap-4 bg-card/40 backdrop-blur-sm p-2 rounded-2xl border border-white/5 sticky top-20 z-20 shadow-xl shadow-black/5">
                {/* Tabs */}
                <div className="flex items-center gap-1 p-1 bg-background/50 rounded-xl border border-white/5 w-full md:w-auto overflow-x-auto no-scrollbar">
                    {tabs.map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`
                                flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all whitespace-nowrap 
                                ${activeTab === tab.id
                                    ? 'bg-primary text-primary-foreground shadow-md shadow-primary/20'
                                    : 'text-muted-foreground hover:bg-white/5 hover:text-foreground'
                                }
                            `}
                        >
                            {tab.id === 'Pending' && <Clock size={14} />}
                            {tab.id === 'Approved' && <CheckCircle2 size={14} />}
                            {tab.id === 'Rejected' && <XCircle size={14} />}
                            {tab.id === 'All' && <ListFilter size={14} />}
                            {tab.label}
                        </button>
                    ))}
                </div>

                {/* Search */}
                <div className="relative w-full md:w-80 group">
                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                    <input
                        type="text"
                        placeholder="Search UID, Name or Email..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 bg-background/50 border border-white/10 rounded-xl text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary/50 outline-none transition-all placeholder:text-muted-foreground/50"
                    />
                </div>
            </div>

            {/* Orders List (Mobile Cards + Desktop Table) */}
            <div className={`space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500`}>

                {/* STATE: LOADING */}
                {loading && (
                    <div className="py-20 text-center space-y-4">
                        <div className="animate-spin w-10 h-10 border-4 border-primary border-t-transparent rounded-full mx-auto opacity-50"></div>
                        <p className="text-muted-foreground text-sm font-medium animate-pulse">Loading orders...</p>
                    </div>
                )}

                {/* STATE: EMPTY */}
                {!loading && filteredOrders.length === 0 && (
                    <div className="py-20 text-center space-y-4 bg-card/30 rounded-3xl border border-dashed border-white/10">
                        <div className="w-16 h-16 bg-muted/20 rounded-full flex items-center justify-center mx-auto text-muted-foreground/50">
                            <ListFilter size={32} />
                        </div>
                        <div className="space-y-1">
                            <h3 className="text-lg font-bold text-foreground">No orders found</h3>
                            <p className="text-sm text-muted-foreground max-w-xs mx-auto">
                                There are no {activeTab !== 'All' ? activeTab.toLowerCase() : ''} orders matching your filters.
                            </p>
                        </div>
                    </div>
                )}


                {/* CONTENT: MOBILE CARDS */}
                {!loading && filteredOrders.length > 0 && (
                    <div className="md:hidden space-y-3">
                        {filteredOrders.map(order => (
                            <div key={order._id} className="bg-card border border-border p-4 rounded-2xl shadow-sm space-y-4 active:scale-[0.99] transition-transform">
                                <div className="flex justify-between items-start">
                                    <div className="flex items-center gap-3">
                                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-lg shadow-inner border border-white/5
                                            ${order.status === 'Pending' ? 'bg-yellow-500/10 text-yellow-500' :
                                                order.status === 'Approved' ? 'bg-green-500/10 text-green-500' :
                                                    'bg-red-500/10 text-red-500'}
                                        `}>
                                            <ShoppingBag size={20} />
                                        </div>
                                        <div>
                                            <h4 className="font-bold text-foreground text-sm line-clamp-1">{order.productId?.title}</h4>
                                            <p className="text-[10px] text-muted-foreground font-medium flex items-center gap-1.5 mt-0.5">
                                                <span className="w-1.5 h-1.5 rounded-full bg-border"></span>
                                                {new Date(order.createdAt).toLocaleDateString()}
                                            </p>
                                        </div>
                                    </div>
                                    <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold border shadow-sm ${order.status === 'Pending' ? 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20' :
                                        order.status === 'Approved' ? 'bg-green-500/10 text-green-500 border-green-500/20' :
                                            'bg-red-500/10 text-red-500 border-red-500/20'
                                        }`}>
                                        {order.status}
                                    </span>
                                </div>

                                <div className="grid grid-cols-2 gap-2 text-xs">
                                    <div className="bg-muted/30 p-2.5 rounded-xl border border-white/5">
                                        <span className="text-[9px] uppercase tracking-wider text-muted-foreground font-bold block mb-1">User</span>
                                        <div className="flex items-center gap-2">
                                            <div className="w-5 h-5 rounded-full bg-primary/20 flex items-center justify-center text-[9px] text-primary font-bold">
                                                {order.userDetails?.inGameName?.[0] || 'U'}
                                            </div>
                                            <span className="font-bold text-foreground truncate">{order.userDetails?.inGameName}</span>
                                        </div>
                                    </div>
                                    <div className="bg-muted/30 p-2.5 rounded-xl border border-white/5 active:bg-muted/50" onClick={() => copyToClipboard(order.userDetails?.uid)}>
                                        <span className="text-[9px] uppercase tracking-wider text-muted-foreground font-bold block mb-1">Game UID</span>
                                        <div className="flex items-center gap-1.5 font-mono text-blue-500 font-bold">
                                            {order.userDetails?.uid} <Copy size={10} className="opacity-50" />
                                        </div>
                                    </div>
                                    <div className="bg-gradient-to-r from-yellow-500/5 to-orange-500/5 p-2.5 rounded-xl col-span-2 border border-yellow-500/10">
                                        <div className="flex justify-between items-center">
                                            <span className="text-[9px] uppercase tracking-wider text-muted-foreground font-bold">Total Paid</span>
                                            <span className="font-black text-sm text-yellow-500 tracking-tight">{order.pricePaid} Coins</span>
                                        </div>
                                    </div>
                                </div>

                                {order.status === 'Pending' && (
                                    <div className="flex gap-3 pt-2">
                                        <button
                                            onClick={() => setRejectId(order._id)}
                                            disabled={!!processingId}
                                            className="flex-1 bg-red-500/10 hover:bg-red-500/20 text-red-500 border border-red-500/20 py-2.5 rounded-xl text-xs font-bold transition-all active:scale-95"
                                        >
                                            Reject
                                        </button>
                                        <button
                                            onClick={() => handleProcessOrder(order._id, 'approve')}
                                            disabled={!!processingId}
                                            className="flex-1 bg-green-600 hover:bg-green-500 text-white shadow-lg shadow-green-600/25 py-2.5 rounded-xl text-xs font-bold transition-all active:scale-95"
                                        >
                                            Approve Order
                                        </button>
                                    </div>
                                )}
                                {order.status === 'Rejected' && order.adminComment && (
                                    <div className="text-xs bg-red-500/5 text-red-400 p-3 rounded-xl border border-red-500/10 italic">
                                        <span className="font-bold not-italic mr-1">Admin Note:</span> "{order.adminComment}"
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                )}

                {/* CONTENT: DESKTOP TABLE */}
                {!loading && filteredOrders.length > 0 && (
                    <div className="hidden md:block bg-card/40 backdrop-blur-md border border-white/5 rounded-3xl overflow-hidden shadow-xl shadow-black/5">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead className="bg-muted/50 text-muted-foreground uppercase text-[10px] tracking-widest font-bold">
                                    <tr>
                                        <th className="p-5 font-bold">User Details</th>
                                        <th className="p-5 font-bold">Game Info</th>
                                        <th className="p-5 font-bold">Product & Price</th>
                                        <th className="p-5 font-bold">Date</th>
                                        <th className="p-5 font-bold text-center">Status</th>
                                        <th className="p-5 font-bold text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-white/5">
                                    {filteredOrders.map(order => (
                                        <tr key={order._id} className="hover:bg-white/5 transition-colors group">
                                            <td className="p-5">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500/20 to-purple-500/20 flex items-center justify-center text-xs font-bold text-blue-400 border border-white/10 uppercase shrink-0">
                                                        {order.userDetails?.inGameName?.[0] || 'U'}
                                                    </div>
                                                    <div>
                                                        <p className="font-bold text-foreground text-sm">{order.userDetails?.inGameName}</p>
                                                        <p className="text-[11px] text-muted-foreground opacity-70">{order.userId?.email}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="p-5">
                                                <div className="flex flex-col gap-1">
                                                    <span className="font-bold text-foreground text-sm">{order.userDetails?.inGameName}</span>
                                                    <div className="flex items-center gap-2 group/copy cursor-pointer w-fit p-1.5 -ml-1.5 rounded-lg hover:bg-white/5 transition-colors" onClick={() => copyToClipboard(order.userDetails?.uid)}>
                                                        <span className="font-mono text-xs text-blue-400 font-bold tracking-wide">{order.userDetails?.uid}</span>
                                                        <Copy className="w-3 h-3 text-muted-foreground group-hover/copy:text-blue-400 transition-colors opacity-0 group-hover/copy:opacity-100" />
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="p-5">
                                                <div>
                                                    <p className="font-bold text-foreground text-sm">{order.productId?.title}</p>
                                                    <div className="flex items-center gap-1.5 mt-0.5">
                                                        <span className="w-1.5 h-1.5 rounded-full bg-yellow-500"></span>
                                                        <span className="text-xs font-mono font-bold text-yellow-500/90">{order.pricePaid} Coins</span>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="p-5 text-xs font-medium text-muted-foreground">
                                                {new Date(order.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                            </td>
                                            <td className="p-5 text-center">
                                                <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide border shadow-sm ${order.status === 'Pending' ? 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20' :
                                                    order.status === 'Approved' ? 'bg-green-500/10 text-green-500 border-green-500/20' :
                                                        'bg-red-500/10 text-red-500 border-red-500/20'
                                                    }`}>
                                                    <span className={`w-1.5 h-1.5 rounded-full ${order.status === 'Pending' ? 'bg-yellow-500 animate-pulse' :
                                                        order.status === 'Approved' ? 'bg-green-500' : 'bg-red-500'
                                                        }`}></span>
                                                    {order.status}
                                                </span>
                                            </td>
                                            <td className="p-5 text-right relative">
                                                {order.status === 'Pending' ? (
                                                    <div className="flex justify-end gap-2 opacity-100 transition-opacity">
                                                        <button
                                                            onClick={() => handleProcessOrder(order._id, 'approve')}
                                                            disabled={!!processingId}
                                                            className="flex items-center gap-1.5 px-4 py-2 bg-green-600 hover:bg-green-500 text-white rounded-xl text-xs font-bold transition-all shadow-lg shadow-green-600/20 hover:shadow-green-600/40 active:scale-95"
                                                        >
                                                            <CheckCircle className="w-3.5 h-3.5" /> Approve
                                                        </button>
                                                        <button
                                                            onClick={() => setRejectId(order._id)}
                                                            disabled={!!processingId}
                                                            className="flex items-center gap-1.5 px-3 py-2 bg-card hover:bg-red-500/10 text-muted-foreground hover:text-red-500 border border-border hover:border-red-500/50 rounded-xl text-xs font-bold transition-all active:scale-95"
                                                        >
                                                            <XCircle className="w-3.5 h-3.5" />
                                                        </button>
                                                    </div>
                                                ) : (
                                                    <div className="text-xs font-bold text-muted-foreground/50">
                                                        {order.status === 'Approved' ? 'Completed' : 'Rejected'}
                                                    </div>
                                                )}

                                                {/* Inline Status Message if processed */}
                                                {order.status === 'Rejected' && order.adminComment && (
                                                    <div className="absolute bottom-1 right-5 text-[10px] text-red-400 max-w-[200px] truncate opacity-70 hover:opacity-100 transition-opacity cursor-help" title={order.adminComment}>
                                                        Note: {order.adminComment}
                                                    </div>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </div>

            {/* Reject Reason Modal */}
            {rejectId && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-card/95 backdrop-blur-xl border border-white/10 rounded-3xl w-full max-w-sm p-6 relative animate-in zoom-in-95 duration-200 shadow-2xl">
                        <div className="w-12 h-12 rounded-full bg-red-500/10 text-red-500 flex items-center justify-center mb-4 border border-red-500/20">
                            <AlertCircle size={24} />
                        </div>

                        <h3 className="text-xl font-bold text-foreground mb-2">
                            Reject Order?
                        </h3>
                        <p className="text-muted-foreground text-sm mb-6 leading-relaxed">
                            Please provide a reason. The user will be refunded
                            <span className="inline-block px-1.5 py-0.5 rounded-md bg-yellow-500/10 text-yellow-500 font-bold border border-yellow-500/20 mx-1">
                                {orders.find(o => o._id === rejectId)?.pricePaid} Coins
                            </span>
                            automatically.
                        </p>

                        <div className="space-y-4">
                            <textarea
                                className="w-full bg-black/20 border border-white/10 rounded-xl p-4 text-foreground focus:ring-2 focus:ring-red-500/50 focus:border-red-500/50 outline-none text-sm resize-none placeholder:text-muted-foreground/50 transition-all font-medium"
                                rows={3}
                                value={rejectReason}
                                onChange={(e) => setRejectReason(e.target.value)}
                                placeholder="e.g. Invalid UID, Duplicate Request..."
                                autoFocus
                            />

                            <div className="grid grid-cols-2 gap-3">
                                <button
                                    onClick={() => { setRejectId(null); setRejectReason(''); }}
                                    className="px-4 py-3 bg-white/5 hover:bg-white/10 text-foreground rounded-xl text-sm font-bold transition-all"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={() => rejectId && handleProcessOrder(rejectId, 'reject', rejectReason)}
                                    disabled={!rejectReason.trim()}
                                    className="px-4 py-3 bg-red-600 hover:bg-red-500 text-white rounded-xl text-sm font-bold transition-all shadow-lg shadow-red-600/20 hover:shadow-red-600/40 transform active:scale-95 disabled:opacity-50 disabled:scale-100"
                                >
                                    Confirm Reject
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
