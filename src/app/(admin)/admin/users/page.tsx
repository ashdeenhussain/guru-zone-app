"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Search,
    MoreVertical,
    Shield,
    Ban,
    CheckCircle,
    Edit,
    X,
    Loader2,
    User as UserIcon,
    Users,
    Mail,
    CreditCard,
    Gamepad2,
    ChevronLeft,
    ChevronRight,
    Lock,
    Trophy,
    RefreshCcw
} from 'lucide-react';
import Link from 'next/link';
import TransactionHistoryModal from '@/components/admin/TransactionHistoryModal';

interface User {
    _id: string;
    name: string;
    email: string;
    status: 'active' | 'banned';
    role: 'user' | 'admin';
    walletBalance: number;
    inGameName?: string;
    freeFireUid?: string;
    banReason?: string;
    image?: string;
    lastLogin?: string;
    permissions?: string[];
    provider?: string;
    createdAt: string;
}

interface UserStats {
    totalUsers: number;
    activeUsers: number;
    bannedUsers: number;
    inactiveUsers: number;
    usersWithCoins: number;
    totalSystemBalance: number;
}

export default function UserManagementPage() {
    const [users, setUsers] = useState<User[]>([]);
    const [stats, setStats] = useState<UserStats>({
        totalUsers: 0,
        activeUsers: 0,
        bannedUsers: 0,
        inactiveUsers: 0,
        usersWithCoins: 0,
        totalSystemBalance: 0
    });
    const [isLoading, setIsLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [debouncedSearch, setDebouncedSearch] = useState('');
    const [filter, setFilter] = useState('all'); // 'all', 'active', 'inactive', 'banned', 'has_coins'
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);

    // Modals
    const [selectedUser, setSelectedUser] = useState<User | null>(null);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isBanModalOpen, setIsBanModalOpen] = useState(false);
    const [isPermissionsModalOpen, setIsPermissionsModalOpen] = useState(false); // Fix: Moved up
    const [historyModalState, setHistoryModalState] = useState<{ isOpen: boolean; userId: string; userName: string }>({
        isOpen: false,
        userId: '',
        userName: ''
    });

    // Debounce Search
    useEffect(() => {
        const timer = setTimeout(() => {
            // Only update if search actually changed to avoid unnecessary resets
            if (search !== debouncedSearch) {
                setDebouncedSearch(search);
                setPage(1);
            }
        }, 500);
        return () => clearTimeout(timer);
    }, [search, debouncedSearch]);

    // Fetch Data
    const fetchUsers = useCallback(async () => {
        setIsLoading(true);
        try {
            const query = new URLSearchParams({
                page: page.toString(),
                limit: '10',
                search: debouncedSearch,
                filter
            });
            const res = await fetch(`/api/admin/users?${query}`);
            const data = await res.json();

            if (res.ok) {
                setUsers(data.users);
                setStats(data.stats);
                setTotalPages(data.pagination.pages || 1);
            } else {
                console.error("Failed to fetch users:", data.error);
            }
        } catch (error) {
            console.error("Error fetching users:", error);
        } finally {
            setIsLoading(false);
        }
    }, [page, debouncedSearch, filter]);

    // Fetch on dependency change
    useEffect(() => {
        fetchUsers();
    }, [fetchUsers]);

    const handleFilterChange = (newFilter: string) => {
        if (newFilter === filter) return;
        setFilter(newFilter);
        setPage(1);
    };

    // Actions
    const handleEditUser = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedUser) return;

        // Collect form data
        const form = e.target as HTMLFormElement;
        const formData = {
            name: (form.elements.namedItem('name') as HTMLInputElement).value,
            inGameName: (form.elements.namedItem('inGameName') as HTMLInputElement).value,

            freeFireUid: (form.elements.namedItem('freeFireUid') as HTMLInputElement).value,
            // walletBalance is now managed separately via /admin/users/[id]
        };

        try {
            const res = await fetch(`/api/admin/users/${selectedUser._id}/update`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });

            if (res.ok) {
                setIsEditModalOpen(false);
                fetchUsers();
            }
        } catch (error) {
            console.error("Error updating user:", error);
        }
    };

    const handleBanUser = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedUser) return;

        const isBanning = selectedUser.status === 'active';
        const form = e.target as HTMLFormElement;
        const banReason = isBanning ? (form.elements.namedItem('banReason') as HTMLTextAreaElement).value : undefined;

        try {
            const res = await fetch(`/api/admin/users/${selectedUser._id}/status`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    status: isBanning ? 'banned' : 'active',
                    banReason
                })
            });

            if (res.ok) {
                setIsBanModalOpen(false);
                fetchUsers();
            }
        } catch (error) {
            console.error("Error changing user status:", error);
        }
    };

    const handleUpdatePermissions = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedUser) return;

        const form = e.target as HTMLFormElement;
        const role = (form.elements.namedItem('role') as HTMLSelectElement).value;

        // Collect checked permissions
        const permissions: string[] = [];
        ['manage_finance', 'manage_tournaments', 'manage_store', 'manage_support', 'manage_system'].forEach(p => {
            if ((form.elements.namedItem(p) as HTMLInputElement)?.checked) {
                permissions.push(p);
            }
        });

        try {
            const res = await fetch(`/api/admin/users/${selectedUser._id}/permissions`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ role, permissions })
            });

            if (res.ok) {
                setIsPermissionsModalOpen(false);
                fetchUsers();
            }
        } catch (error) {
            console.error("Error updating permissions:", error);
        }
    };

    const handleOpenHistory = (userId: string, userName: string) => {
        setHistoryModalState({ isOpen: true, userId, userName });
    };

    return (
        <div className="space-y-8 pt-24 pb-20 lg:pt-0 lg:pb-0">
            {/* Header & Title */}
            <div className="flex items-center justify-between gap-4 px-1">
                <div className="flex items-center gap-4">
                    <div className="p-3 bg-gradient-to-br from-blue-500/20 to-purple-500/20 rounded-2xl shrink-0 border border-white/5 shadow-inner">
                        <Users className="w-6 h-6 text-blue-400" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-foreground tracking-tight">
                            User Management
                        </h1>
                        <p className="text-xs text-muted-foreground font-medium mt-1">
                            View, manage, and monitor your user base
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <div className="flex items-center gap-2">
                        <button
                            onClick={fetchUsers}
                            className="p-3 bg-yellow-500/10 hover:bg-yellow-500/20 text-yellow-600 dark:text-yellow-500 rounded-2xl transition-all border border-yellow-500/20 hover:border-yellow-500/40 active:scale-95"
                            title="Refresh Users"
                        >
                            <div className={isLoading ? "animate-spin" : ""}>
                                <RefreshCcw size={20} />
                            </div>
                        </button>
                    </div>
                </div>
            </div>

            {/* Separator Line */}
            <div className="h-px w-full bg-border/50" />

            {/* Stats Cards */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                <StatsCard
                    title="Total Users"
                    value={stats.totalUsers}
                    icon={<Users className="w-5 h-5 text-blue-400" />}
                    color="from-blue-500/20 to-blue-600/5"
                    borderColor="border-blue-500/20"
                    onClick={() => handleFilterChange('all')}
                    isActive={filter === 'all'}
                />
                <StatsCard
                    title="Active (7d)"
                    value={stats.activeUsers}
                    icon={<CheckCircle className="w-5 h-5 text-green-400" />}
                    color="from-green-500/20 to-green-600/5"
                    borderColor="border-green-500/20"
                    onClick={() => handleFilterChange('active')}
                    isActive={filter === 'active'}
                />
                <StatsCard
                    title="Inactive"
                    value={stats.inactiveUsers}
                    icon={<UserIcon className="w-5 h-5 text-gray-400" />}
                    color="from-gray-500/20 to-gray-600/5"
                    borderColor="border-gray-500/20"
                    onClick={() => handleFilterChange('inactive')}
                    isActive={filter === 'inactive'}
                />
                <StatsCard
                    title="Banned"
                    value={stats.bannedUsers}
                    icon={<Ban className="w-5 h-5 text-red-400" />}
                    color="from-red-500/20 to-red-600/5"
                    borderColor="border-red-500/20"
                    onClick={() => handleFilterChange('banned')}
                    isActive={filter === 'banned'}
                />
                <StatsCard
                    title="With Coins"
                    value={stats.usersWithCoins}
                    icon={<CreditCard className="w-5 h-5 text-yellow-500" />}
                    color="from-yellow-500/20 to-orange-600/5"
                    borderColor="border-yellow-500/20"
                    onClick={() => handleFilterChange('has_coins')}
                    isActive={filter === 'has_coins'}
                />
            </div>

            {/* Total System Balance - Separate or smaller display if needed, keeping it as a banner or extra card? 
                User focused on counts. I will keep it as a full width banner below stats or just above list.
                Actually, the user request "add coin wala also" implies counting users with coins. 
                Existing "Coins in Circulation" is useful. I'll add it as a separate full-width card or just keep it?
                The design might get cluttered. I will make a separate row for financial summary if needed, but for now
                I'll add it as a standalone card below the grid or integrated. 
                Let's put it as a wide card below the user counts or just remove it if it conflicts? 
                No, removing is bad. I'll add "Coins in Circulation" as a separate info block.
            */}
            <div className="grid grid-cols-1 md:grid-cols-1 gap-4">
                <div className="relative overflow-hidden p-6 rounded-2xl border border-yellow-500/20 bg-gradient-to-br from-yellow-500/10 to-orange-600/5 backdrop-blur-sm shadow-sm flex items-center justify-between">
                    <div>
                        <h3 className="text-muted-foreground font-medium mb-1">Total Coins in Circulation</h3>
                        <div className="text-3xl font-bold tracking-tight text-yellow-500">PKR {stats.totalSystemBalance.toLocaleString()}</div>
                    </div>
                    <div className="p-3 bg-yellow-500/10 rounded-xl border border-yellow-500/20">
                        <CreditCard className="w-8 h-8 text-yellow-500" />
                    </div>
                </div>
            </div>

            {/* Controls */}
            <div className="flex flex-col gap-4 bg-card p-5 rounded-[2rem] border border-border/40 sticky top-20 z-20 shadow-sm">
                <div className="relative w-full group">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/70 group-focus-within:text-yellow-600 transition-colors" />
                    <input
                        type="text"
                        placeholder="Search by name, email, UID..."
                        className="w-full bg-muted/40 border-none rounded-2xl pl-11 pr-4 py-3 text-sm text-foreground focus:outline-none focus:border-primary transition-all placeholder:text-muted-foreground/50 font-medium"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>

                {/* Filters */}
                <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1 px-1">
                    {[
                        { id: 'all', label: 'All Users' },
                        { id: 'active', label: 'Active' },
                        { id: 'inactive', label: 'Inactive (>7d)' },
                        { id: 'banned', label: 'Banned' },
                        { id: 'has_coins', label: 'Has Coins' }
                    ].map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => handleFilterChange(tab.id)}
                            className={`
                                flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap
                                ${filter === tab.id
                                    ? 'bg-yellow-600 text-white shadow-lg shadow-yellow-600/20'
                                    : 'bg-transparent text-muted-foreground hover:text-foreground hover:bg-muted/50'
                                }
                            `}
                        >
                            {tab.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Users List (Mobile Cards + Desktop Table) */}
            <div className="bg-card/40 backdrop-blur-md border border-white/5 rounded-3xl overflow-hidden shadow-xl shadow-black/5">

                {/* Mobile Cards */}
                <div className="md:hidden divide-y divide-white/5">
                    {isLoading ? (
                        <div className="p-8 text-center text-muted-foreground">
                            <div className="flex justify-center items-center gap-2">
                                <Loader2 className="w-5 h-5 animate-spin" /> Loading...
                            </div>
                        </div>
                    ) : users.length === 0 ? (
                        <div className="p-8 text-center text-muted-foreground">No users found.</div>
                    ) : users.map(user => (
                        <div key={user._id} className="p-4 space-y-3 bg-card/50">
                            <div className="flex items-center gap-3">
                                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-500/20 to-blue-500/20 flex items-center justify-center text-sm font-bold uppercase text-foreground shadow-inner border border-white/10">
                                    {user.name.charAt(0)}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2">
                                        <span className="font-bold text-foreground truncate">{user.name}</span>
                                        {user.role === 'admin' && <span className="bg-purple-500/10 text-purple-500 text-[10px] px-1.5 py-0.5 rounded border border-purple-500/20 font-bold">ADMIN</span>}
                                        {user.role !== 'admin' && user.permissions && user.permissions.length > 0 && <span className="bg-blue-500/10 text-blue-500 text-[10px] px-1.5 py-0.5 rounded border border-blue-500/20 font-bold">STAFF</span>}
                                    </div>
                                    <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                                </div>
                                <span className={`shrink-0 px-2 py-1 rounded-full text-[10px] font-bold border ${user.status === 'banned'
                                    ? 'bg-red-500/10 text-red-500 border-red-500/20'
                                    : 'bg-green-500/10 text-green-500 border-green-500/20'
                                    }`}>
                                    {user.status === 'banned' ? 'Banned' : 'Active'}
                                </span>
                            </div>

                            <div className="grid grid-cols-2 gap-2 text-xs">
                                <div className="bg-muted/30 p-2 rounded-xl border border-white/5">
                                    <span className="text-[9px] uppercase tracking-wider text-muted-foreground font-bold block mb-1">In-Game</span>
                                    <div className="font-medium text-foreground truncate">{user.inGameName || '-'}</div>
                                    <div className="text-[10px] text-muted-foreground font-mono truncate">{user.freeFireUid || 'No ID'}</div>
                                </div>
                                <div className="bg-gradient-to-r from-green-500/5 to-emerald-500/5 p-2 rounded-xl border border-green-500/10">
                                    <span className="text-[9px] uppercase tracking-wider text-muted-foreground font-bold block mb-1">Wallet</span>
                                    <div className="font-mono text-green-500 font-bold">PKR {user.walletBalance}</div>
                                </div>
                            </div>

                            <div className="flex gap-2 pt-1 border-t border-white/5">
                                <div className="flex-1 flex items-center justify-center py-2.5 bg-white/5 rounded-xl border border-white/5">
                                    {user.provider === 'google' ? (
                                        <div className="flex items-center gap-1.5 opacity-70" title="Registered via Google">
                                            <div className="w-4 h-4 rounded-full bg-white flex items-center justify-center">
                                                <img src="https://www.google.com/favicon.ico" className="w-2.5 h-2.5" alt="G" />
                                            </div>
                                            <span className="text-[10px] font-bold">Google</span>
                                        </div>
                                    ) : (
                                        <div className="flex items-center gap-1.5 opacity-70" title="Registered via Email">
                                            <Mail className="w-3.5 h-3.5" />
                                            <span className="text-[10px] font-bold">Email</span>
                                        </div>
                                    )}
                                </div>
                                <button
                                    onClick={() => { setSelectedUser(user); setIsEditModalOpen(true); }}
                                    className="flex-1 py-2.5 bg-blue-500/10 hover:bg-blue-500/20 text-blue-500 rounded-xl text-xs font-bold transition-all border border-blue-500/20"
                                >
                                    Edit
                                </button>
                                <button
                                    onClick={() => { setSelectedUser(user); setIsBanModalOpen(true); }}
                                    className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all border ${user.status === 'banned'
                                        ? 'bg-green-500/10 hover:bg-green-500/20 text-green-500 border-green-500/20'
                                        : 'bg-red-500/10 hover:bg-red-500/20 text-red-500 border-red-500/20'
                                        }`}
                                >
                                    {user.status === 'banned' ? 'Unban' : 'Ban'}
                                </button>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Desktop Table */}
                <div className="hidden md:block overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead className="bg-muted/50 text-muted-foreground uppercase text-[10px] tracking-widest font-bold">
                            <tr>
                                <th className="p-5 font-bold">User</th>
                                <th className="p-5 font-bold">IGN / UID</th>
                                <th className="p-5 font-bold">Wallet</th>
                                <th className="p-5 font-bold">Status</th>
                                <th className="p-5 font-bold">Joined</th>
                                <th className="p-5 font-bold text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {isLoading ? (
                                <tr>
                                    <td colSpan={5} className="p-8 text-center text-muted-foreground">
                                        <div className="flex justify-center items-center gap-2">
                                            <Loader2 className="w-5 h-5 animate-spin" /> Loading users...
                                        </div>
                                    </td>
                                </tr>
                            ) : users.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="p-8 text-center text-muted-foreground">No users found.</td>
                                </tr>
                            ) : users.map(user => (
                                <tr key={user._id} className="hover:bg-white/5 transition-colors group">
                                    <td className="p-5">
                                        <Link href={`/admin/users/${user._id}`} className="flex items-center gap-3 group/link">
                                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500/20 to-blue-500/20 flex items-center justify-center text-xs font-bold uppercase text-foreground shadow-inner border border-white/10 group-hover/link:scale-110 transition-transform">
                                                {user.name.charAt(0)}
                                            </div>
                                            <div>
                                                <div className="font-bold flex items-center gap-2 text-foreground text-sm group-hover/link:text-primary transition-colors">
                                                    {user.name}
                                                    {user.role === 'admin' && <span className="bg-purple-500/10 text-purple-500 text-[10px] px-2 py-0.5 rounded border border-purple-500/20 font-bold">ADMIN</span>}
                                                    {user.role !== 'admin' && user.permissions && user.permissions.length > 0 && <span className="bg-blue-500/10 text-blue-500 text-[10px] px-2 py-0.5 rounded border border-blue-500/20 font-bold">STAFF</span>}
                                                </div>
                                                <div className="text-xs text-muted-foreground opacity-70">{user.email}</div>
                                            </div>
                                        </Link>
                                    </td>
                                    <td className="p-5">
                                        <div className="text-sm">
                                            <div className="font-bold text-foreground">{user.inGameName || '-'}</div>
                                            <div className="text-xs text-muted-foreground font-mono">ID: {user.freeFireUid || '-'}</div>
                                        </div>
                                    </td>
                                    <td className="p-5 font-mono text-green-500 font-bold text-sm">PKR {user.walletBalance}</td>
                                    <td className="p-5">
                                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase border shadow-sm ${user.status === 'banned'
                                            ? 'bg-red-500/10 text-red-500 border-red-500/20'
                                            : 'bg-green-500/10 text-green-500 border-green-500/20'
                                            }`}>
                                            <span className={`w-1.5 h-1.5 rounded-full ${user.status === 'banned' ? 'bg-red-500' : 'bg-green-500'}`}></span>
                                            {user.status === 'banned' ? 'Banned' : 'Active'}
                                        </span>
                                    </td>
                                    <td className="p-5 text-right">
                                        <div className="flex justify-end gap-2 opacity-100">
                                            <div className="p-2 flex items-center justify-center opacity-50" title={user.provider === 'google' ? 'Google Account' : 'Email Account'}>
                                                {user.provider === 'google' ? (
                                                    <div className="w-4 h-4 rounded-full bg-white flex items-center justify-center">
                                                        <img src="https://www.google.com/favicon.ico" className="w-2.5 h-2.5" alt="G" />
                                                    </div>
                                                ) : (
                                                    <Mail className="w-4 h-4" />
                                                )}
                                            </div>
                                            <div className="flex flex-col justify-center mr-4">
                                                <span className="text-[10px] text-muted-foreground font-mono">
                                                    {new Date(user.createdAt).toLocaleDateString()}
                                                </span>
                                            </div>
                                            <button
                                                onClick={() => handleOpenHistory(user._id, user.name)}
                                                className="p-2 hover:bg-yellow-500/10 text-muted-foreground hover:text-yellow-500 rounded-xl transition-colors"
                                                title="Inspect Wallet"
                                            >
                                                <CreditCard className="w-4 h-4" />
                                            </button>
                                            <button
                                                onClick={() => { setSelectedUser(user); setIsEditModalOpen(true); }}
                                                className="p-2 hover:bg-blue-500/10 text-muted-foreground hover:text-blue-500 rounded-xl transition-colors"
                                                title="Edit User"
                                            >
                                                <Edit className="w-4 h-4" />
                                            </button>
                                            <button
                                                onClick={() => { setSelectedUser(user); setIsBanModalOpen(true); }}
                                                className={`p-2 rounded-xl transition-colors ${user.status === 'banned'
                                                    ? 'hover:bg-green-500/10 text-muted-foreground hover:text-green-500'
                                                    : 'hover:bg-red-500/10 text-muted-foreground hover:text-red-500'
                                                    }`}
                                                title={user.status === 'banned' ? 'Unban User' : 'Ban User'}
                                            >
                                                {user.status === 'banned' ? <Shield className="w-4 h-4" /> : <Ban className="w-4 h-4" />}
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>


                {/* Pagination */}
                <div className="p-4 border-t border-border flex items-center justify-between text-sm text-muted-foreground">
                    <div>Page {page} of {Math.max(1, totalPages)}</div>
                    <div className="flex gap-2">
                        <button
                            disabled={page <= 1}
                            onClick={() => setPage(p => p - 1)}
                            className="p-2 hover:bg-muted rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-foreground"
                        >
                            <ChevronLeft className="w-4 h-4" />
                        </button>
                        <button
                            disabled={page >= totalPages}
                            onClick={() => setPage(p => p + 1)}
                            className="p-2 hover:bg-muted rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-foreground"
                        >
                            <ChevronRight className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            </div>

            {/* Edit Modal */}
            <Modal isOpen={isEditModalOpen} onClose={() => setIsEditModalOpen(false)} title="Edit User Profile">
                {selectedUser && (
                    <form onSubmit={handleEditUser} className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="col-span-2">
                                <label className="block text-xs font-medium text-muted-foreground mb-1">Email (Read-only)</label>
                                <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-muted border border-border text-muted-foreground cursor-not-allowed">
                                    <Mail className="w-4 h-4" />
                                    {selectedUser.email}
                                </div>
                            </div>

                            <div className="col-span-2">
                                <label className="block text-xs font-medium text-muted-foreground mb-1">Full Name</label>
                                <input name="name" defaultValue={selectedUser.name} required className="w-full bg-background border border-input rounded-lg px-3 py-2 text-foreground focus:outline-none focus:border-primary" />
                            </div>

                            <div>
                                <label className="block text-xs font-medium text-muted-foreground mb-1">In-Game Name</label>
                                <input name="inGameName" defaultValue={selectedUser.inGameName} className="w-full bg-background border border-input rounded-lg px-3 py-2 text-foreground focus:outline-none focus:border-primary" />
                            </div>

                            <div>
                                <label className="block text-xs font-medium text-muted-foreground mb-1">FreeFire UID</label>
                                <input name="freeFireUid" defaultValue={selectedUser.freeFireUid} className="w-full bg-background border border-input rounded-lg px-3 py-2 text-foreground focus:outline-none focus:border-primary" />
                            </div>

                            <div className="col-span-2">
                                <label className="block text-xs font-medium text-muted-foreground mb-1">Wallet Balance (PKR)</label>
                                <div className="flex gap-2">
                                    <input
                                        type="number"
                                        defaultValue={selectedUser.walletBalance}
                                        readOnly
                                        disabled
                                        className="w-full bg-muted border border-input rounded-lg px-3 py-2 text-muted-foreground focus:outline-none cursor-not-allowed"
                                    />
                                    <Link
                                        href={`/admin/users/${selectedUser._id}`}
                                        className="px-3 py-2 bg-yellow-500/10 hover:bg-yellow-500/20 text-yellow-600 rounded-lg text-xs font-bold transition-all border border-yellow-500/20 whitespace-nowrap flex items-center"
                                    >
                                        Manage
                                    </Link>
                                </div>
                                <p className="text-[10px] text-muted-foreground mt-1">
                                    To adjust balance safely, please use the <span className="text-yellow-600 font-bold">Manage</span> button.
                                </p>
                            </div>
                        </div>

                        <div className="flex justify-between items-center gap-3 mt-6">
                            <button
                                type="button"
                                onClick={() => { setIsEditModalOpen(false); setIsPermissionsModalOpen(true); }}
                                className="px-4 py-2 rounded-lg bg-purple-500/10 hover:bg-purple-500/20 text-purple-500 font-bold text-xs flex items-center gap-2 border border-purple-500/20 transition-all"
                            >
                                <Lock className="w-3.5 h-3.5" /> Manage Permissions
                            </button>
                            <div className="flex gap-2">
                                <button type="button" onClick={() => setIsEditModalOpen(false)} className="px-4 py-2 rounded-lg hover:bg-muted transition-colors text-muted-foreground border border-transparent">Cancel</button>
                                <button type="submit" className="px-4 py-2 rounded-lg bg-primary hover:bg-primary/90 transition-colors text-primary-foreground font-medium">Save Changes</button>
                            </div>
                        </div>
                    </form>
                )}
            </Modal>

            {/* Permissions Modal */}
            <Modal isOpen={isPermissionsModalOpen} onClose={() => setIsPermissionsModalOpen(false)} title="Manage Permissions">
                {selectedUser && (
                    <form onSubmit={handleUpdatePermissions} className="space-y-6">

                        {/* Role Selector */}
                        <div>
                            <label className="block text-xs font-medium text-muted-foreground mb-2">User Role</label>
                            <select
                                name="role"
                                defaultValue={selectedUser.role}
                                className="w-full bg-background border border-input rounded-lg px-3 py-2 text-foreground focus:outline-none focus:border-primary"
                                onChange={(e) => {
                                    // Logic handled by submission
                                }}
                            >
                                <option value="user">User / Staff</option>
                                <option value="admin">Super Admin (Full Access)</option>
                            </select>
                            <p className="text-xs text-muted-foreground mt-1">Super Admins have full access to all modules automatically.</p>
                        </div>

                        <div className="border-t border-border pt-4">
                            <h3 className="text-sm font-semibold text-foreground mb-3">Permissions (Staff Access)</h3>
                            <p className="text-xs text-muted-foreground mb-4">Select the modules this user can access if their role is set to User.</p>

                            <div className="space-y-3">
                                {[
                                    { id: 'manage_tournaments', label: 'Manage Tournaments', description: 'Create, edit, and result matches.', icon: Trophy },
                                    { id: 'manage_finance', label: 'Manage Finance', description: 'Approve deposits, withdrawals, and view earnings.', icon: CreditCard },
                                    { id: 'manage_store', label: 'Manage Store', description: 'Add products, spin items, and fulfill orders.', icon: Gamepad2 },
                                    { id: 'manage_support', label: 'Manage Support', description: 'Reply to tickets and manage help desk.', icon: Mail },
                                    { id: 'manage_system', label: 'Manage System', description: 'Global settings, notifications, and admins.', icon: MoreVertical }
                                ].map((perm) => (
                                    <label key={perm.id} className="flex items-start gap-3 p-3 rounded-lg bg-card border border-border hover:bg-muted transition-colors cursor-pointer group">
                                        <input
                                            type="checkbox"
                                            name={perm.id}
                                            defaultChecked={selectedUser.permissions?.includes(perm.id)}
                                            className="mt-1 w-4 h-4 rounded border-input text-primary focus:ring-primary bg-background shadow-sm"
                                        />
                                        <div className="flex items-start gap-3 flex-1">
                                            <div className="p-1.5 bg-muted group-hover:bg-background rounded-md text-foreground transition-colors">
                                                <perm.icon className="w-4 h-4" />
                                            </div>
                                            <div>
                                                <span className="block text-sm font-medium text-foreground">{perm.label}</span>
                                                <span className="block text-xs text-muted-foreground leading-snug">{perm.description}</span>
                                            </div>
                                        </div>
                                    </label>
                                ))}
                            </div>
                        </div>

                        <div className="flex justify-end gap-3 mt-6">
                            <button type="button" onClick={() => setIsPermissionsModalOpen(false)} className="px-4 py-2 rounded-lg hover:bg-muted transition-colors text-muted-foreground">Cancel</button>
                            <button type="submit" className="px-4 py-2 rounded-lg bg-primary hover:bg-primary/90 transition-colors text-primary-foreground font-medium">Update Permissions</button>
                        </div>
                    </form>
                )}
            </Modal>


            {/* Ban Modal */}
            <Modal isOpen={isBanModalOpen} onClose={() => setIsBanModalOpen(false)} title={selectedUser?.status === 'banned' ? 'Unban User' : 'Ban User'}>
                {selectedUser && (
                    <form onSubmit={handleBanUser} className="space-y-4">
                        {selectedUser.status === 'active' ? (
                            <>
                                <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-lg text-red-500 text-sm flex gap-3">
                                    <Shield className="w-5 h-5 shrink-0" />
                                    <div>
                                        <p className="font-bold">Warning</p>
                                        <p>You are about to ban <span className="font-mono bg-background/50 px-1 rounded text-foreground">{selectedUser.name}</span>. They will no longer be able to log in.</p>
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-muted-foreground mb-1">Reason for Ban (Required)</label>
                                    <textarea name="banReason" required rows={3} className="w-full bg-background border border-input rounded-lg px-3 py-2 text-foreground focus:outline-none focus:border-red-500" placeholder="e.g., Violation of fair play policy..."></textarea>
                                </div>
                            </>
                        ) : (
                            <div className="p-4 bg-green-500/10 border border-green-500/20 rounded-lg text-green-500 text-sm flex gap-3">
                                <CheckCircle className="w-5 h-5 shrink-0" />
                                <div>
                                    <p className="font-bold">Restore Access</p>
                                    <p>Are you sure you want to unban <span className="font-mono bg-background/50 px-1 rounded text-foreground">{selectedUser.name}</span>? They will regain access immediately.</p>
                                </div>
                            </div>
                        )}

                        <div className="flex justify-end gap-3 mt-6">
                            <button type="button" onClick={() => setIsBanModalOpen(false)} className="px-4 py-2 rounded-lg hover:bg-muted transition-colors text-muted-foreground">Cancel</button>
                            <button
                                type="submit"
                                className={`px-4 py-2 rounded-lg text-white font-medium transition-colors ${selectedUser.status === 'active' ? 'bg-red-600 hover:bg-red-500' : 'bg-green-600 hover:bg-green-500'
                                    }`}
                            >
                                {selectedUser.status === 'active' ? 'Ban User' : 'Unban User'}
                            </button>
                        </div>
                    </form>
                )}
            </Modal>
            {/* Transaction History Modal */}
            <TransactionHistoryModal
                isOpen={historyModalState.isOpen}
                onClose={() => setHistoryModalState({ ...historyModalState, isOpen: false })}
                userId={historyModalState.userId}
                userName={historyModalState.userName}
            />
        </div >
    );
}

// Sub-components

function StatsCard({
    title,
    value,
    icon,
    color,
    borderColor,
    onClick,
    isActive
}: {
    title: string,
    value: number,
    icon: React.ReactNode,
    color: string,
    borderColor: string,
    onClick?: () => void,
    isActive?: boolean
}) {
    return (
        <button
            onClick={onClick}
            className={`
                relative overflow-hidden p-4 rounded-2xl border transition-all duration-200 text-left w-full
                ${isActive
                    ? `ring-2 ring-primary ring-offset-2 ring-offset-background ${borderColor} bg-gradient-to-br ${color}`
                    : `${borderColor} bg-gradient-to-br ${color} hover:scale-[1.02] hover:shadow-md cursor-pointer`
                }
                backdrop-blur-sm shadow-sm
            `}
        >
            <div className="flex justify-between items-start">
                <div>
                    <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1 opacity-80">{title}</h3>
                    <div className="text-2xl font-black tracking-tight text-foreground">{value.toLocaleString()}</div>
                </div>
                <div className={`p-2.5 rounded-xl border backdrop-blur-md ${isActive ? 'bg-background/40 border-background/30' : 'bg-background/20 border-background/10'}`}>
                    {icon}
                </div>
            </div>
        </button>
    );
}

function Modal({ isOpen, onClose, title, children }: { isOpen: boolean, onClose: () => void, title: string, children: React.ReactNode }) {
    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
                    />
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 20 }}
                        className="fixed inset-0 m-auto max-w-lg h-fit max-h-[90vh] overflow-y-auto bg-card border border-border rounded-2xl z-50 p-0 shadow-2xl"
                    >
                        <div className="p-5 border-b border-border flex justify-between items-center bg-card sticky top-0 z-10">
                            <h2 className="text-lg font-semibold text-foreground">{title}</h2>
                            <button onClick={onClose} className="text-muted-foreground hover:text-foreground transition-colors">
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <div className="p-6">
                            {children}
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}
