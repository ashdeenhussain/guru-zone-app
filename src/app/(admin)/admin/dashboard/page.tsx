
import React from 'react';
import connectToDatabase from '@/lib/db';
import User from '@/models/User';
import Tournament from '@/models/Tournament';
import Transaction from '@/models/Transaction';
import SupportTicket from '@/models/SupportTicket';
import Order from '@/models/Order';
import {
    Users,
    Trophy,
    AlertCircle,
    Wallet,
    ArrowUpRight,
    ArrowDownLeft,
    Clock,
    CheckCircle,
    Activity,
    CreditCard,
    TrendingUp,
    ShoppingBag
} from 'lucide-react';

// Force dynamic rendering to ensure real-time data
export const dynamic = 'force-dynamic';

async function getAdminStats() {
    await connectToDatabase();

    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    const [
        totalUsers,
        activeTournaments,
        pendingWithdrawals,
        openTickets,
        pendingShopOrders,
        financials,
        todaysActivity,
        recentTransactions,
        pendingDeposits // Add this to the destructuring list
    ] = await Promise.all([
        // 1. Total Users
        User.countDocuments(),

        // 2. Active Tournaments
        Tournament.countDocuments({ status: { $in: ['Open', 'Live'] } }),

        // 3. Pending Withdrawal Requests (Critical)
        Transaction.countDocuments({
            type: 'withdrawal',
            status: { $in: ['pending', 'Pending'] }
        }),

        // 4. Open Support Tickets
        SupportTicket.countDocuments({
            status: { $in: ['Open', 'In Progress'] }
        }),

        // 5. Pending Shop Orders
        Order.countDocuments({ status: 'Pending' }),

        // 6. Total Net Revenue (Deposits - Withdrawals)
        Transaction.aggregate([
            {
                $match: {
                    status: { $in: ['approved', 'Approved'] },
                    type: { $in: ['deposit', 'withdrawal'] }
                }
            },
            {
                $group: {
                    _id: '$type',
                    total: { $sum: '$amount' }
                }
            }
        ]),

        // 7. Today's Activity (Signups & Financials)
        Promise.all([
            User.countDocuments({ createdAt: { $gte: startOfToday } }),
            Transaction.aggregate([
                {
                    $match: {
                        createdAt: { $gte: startOfToday },
                        status: { $in: ['approved', 'Approved'] },
                        type: { $in: ['deposit', 'withdrawal'] }
                    }
                },
                {
                    $group: {
                        _id: '$type',
                        total: { $sum: '$amount' }
                    }
                }
            ])
        ]),

        // 8. Recent Activity Feed (Last 5 Transactions)
        Transaction.find()
            .sort({ createdAt: -1 })
            .limit(5)
            .populate('user', 'name email image')
            .lean(),

        // 9. Pending Deposits (New)
        Transaction.countDocuments({
            type: 'deposit',
            status: { $in: ['pending', 'Pending'] }
        })
    ]);

    // Process Financials
    const totalDeposits = financials.find(f => f._id === 'deposit')?.total || 0;
    const totalWithdrawals = financials.find(f => f._id === 'withdrawal')?.total || 0;
    const netRevenue = totalDeposits - totalWithdrawals;

    // Process Today's Stats
    const newSignupsToday = todaysActivity[0];
    const todaysFinancials = todaysActivity[1];
    const depositsToday = todaysFinancials.find(f => f._id === 'deposit')?.total || 0;
    const withdrawalsToday = todaysFinancials.find(f => f._id === 'withdrawal')?.total || 0;

    return {
        totalUsers,
        activeTournaments,
        pendingWithdrawals,
        openTickets,
        pendingShopOrders,
        netRevenue,
        newSignupsToday,
        depositsToday,
        withdrawalsToday,
        recentTransactions,
        pendingDeposits
    };
}
// I will rewrite the getAdminStats in full to fix the destructuring error properly in the next step or this one if allowed.
// For now, let me fix the specific block I messed up in thought.
// I will assume I need to fix the entire Promise.all block to include pendingDeposits in the destructuring.


export default async function AdminDashboard() {
    const stats = await getAdminStats();

    return (
        <div className="space-y-8">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">
                        Command Center
                    </h1>
                    <p className="text-muted-foreground">Welcome back, Admin. System status is nominal.</p>
                </div>
                <div className="flex items-center gap-3 bg-card border border-border px-4 py-2 rounded-full w-fit shadow-sm">
                    <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                    <span className="text-sm font-medium text-green-500">Live System</span>
                </div>
            </div>

            {/* Section 1: The Pulse */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-6">
                <StatCard
                    title="Total Users"
                    value={stats.totalUsers.toLocaleString()}
                    subtext={`+${stats.newSignupsToday}`}
                    icon={Users}
                    color="blue"
                />
                <StatCard
                    title="Active Tournaments"
                    value={stats.activeTournaments}
                    subtext="Live battles"
                    icon={Trophy}
                    color="yellow"
                />
                <StatCard
                    title="Net Revenue"
                    value={`Rs. ${stats.netRevenue.toLocaleString()}`}
                    subtext="Lifetime"
                    icon={Wallet}
                    color="green"
                />
                <StatCard
                    title="Pending Withdrawals"
                    value={stats.pendingWithdrawals}
                    subtext="Needs Action"
                    icon={AlertCircle}
                    color="red"
                    alert={stats.pendingWithdrawals > 0}
                />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Section 2: Action Center */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="bg-card/50 border border-border rounded-2xl p-4 md:p-6 backdrop-blur-sm shadow-sm">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-xl font-semibold flex items-center gap-2 text-foreground">
                                <Activity className="w-5 h-5 text-primary" />
                                Action Center
                            </h2>
                        </div>

                        <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
                            <ActionItem
                                title="Deposits"
                                count={stats.pendingDeposits}
                                label="Pending"
                                href="/admin/finance"
                                urgent={stats.pendingDeposits > 0}
                                icon={ArrowUpRight}
                            />
                            <ActionItem
                                title="Withdrawals"
                                count={stats.pendingWithdrawals}
                                label="Pending"
                                href="/admin/finance?tab=withdrawals"
                                urgent={stats.pendingWithdrawals > 0}
                                icon={CreditCard}
                            />
                            <ActionItem
                                title="Tickets"
                                count={stats.openTickets}
                                label="Open"
                                href="/admin/support"
                                urgent={stats.openTickets > 0}
                                icon={AlertCircle}
                            />
                            <ActionItem
                                title="Orders"
                                count={stats.pendingShopOrders}
                                label="To Ship"
                                href="/admin/store"
                                urgent={stats.pendingShopOrders > 0}
                                icon={ShoppingBag}
                            />
                        </div>
                    </div>

                    {/* Section 3: Financial Health Today */}
                    <div className="bg-card/50 border border-border rounded-2xl p-6 backdrop-blur-sm shadow-sm">
                        <h2 className="text-xl font-semibold flex items-center gap-2 mb-6 text-foreground">
                            <TrendingUp className="w-5 h-5 text-green-500" />
                            Today's Financials
                        </h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="bg-background/50 p-4 rounded-xl border border-border flex justify-between items-center shadow-inner">
                                <div>
                                    <p className="text-muted-foreground text-sm">Deposits Today</p>
                                    <p className="text-2xl font-bold text-green-500">+ Rs. {stats.depositsToday.toLocaleString()}</p>
                                </div>
                                <div className="bg-green-500/10 p-2 rounded-lg">
                                    <ArrowUpRight className="w-6 h-6 text-green-500" />
                                </div>
                            </div>
                            <div className="bg-background/50 p-4 rounded-xl border border-border flex justify-between items-center shadow-inner">
                                <div>
                                    <p className="text-muted-foreground text-sm">Withdrawals Today</p>
                                    <p className="text-2xl font-bold text-red-500">- Rs. {stats.withdrawalsToday.toLocaleString()}</p>
                                </div>
                                <div className="bg-red-500/10 p-2 rounded-lg">
                                    <ArrowDownLeft className="w-6 h-6 text-red-500" />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Section 4: Recent Activity Feed */}
                <div className="bg-card/50 border border-border rounded-2xl p-6 backdrop-blur-sm h-full shadow-sm">
                    <h2 className="text-xl font-semibold flex items-center gap-2 mb-6 text-foreground">
                        <Clock className="w-5 h-5 text-blue-500" />
                        Recent Activity
                    </h2>
                    <div className="space-y-4">
                        {stats.recentTransactions.length === 0 ? (
                            <p className="text-muted-foreground text-sm text-center py-4">No recent activity.</p>
                        ) : (
                            stats.recentTransactions.map((trx: any) => (
                                <ActivityItem key={trx._id} transaction={trx} />
                            ))
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

// Sub-components for cleaner code

function StatCard({ title, value, subtext, icon: Icon, color, alert }: any) {
    const colorStyles: any = {
        blue: 'text-blue-500 dark:text-blue-400 bg-blue-500/10 border-blue-500/20',
        yellow: 'text-yellow-600 dark:text-yellow-400 bg-yellow-500/10 border-yellow-500/20',
        red: 'text-red-500 dark:text-red-400 bg-red-500/10 border-red-500/20',
        green: 'text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
        purple: 'text-purple-600 dark:text-purple-400 bg-purple-500/10 border-purple-500/20',
    };

    const activeStyle = colorStyles[color] || colorStyles.blue;
    const alertStyle = alert ? 'animate-pulse ring-1 ring-red-500/50' : '';

    return (
        <div className={`bg-card/80 border border-border p-5 rounded-2xl flex flex-col justify-between hover:border-primary/30 transition-colors shadow-sm ${alertStyle}`}>
            <div className="flex justify-between items-start mb-4">
                <div className={`p-3 rounded-xl ${activeStyle}`}>
                    <Icon className="w-6 h-6" />
                </div>
                {alert && <span className="text-xs font-bold bg-red-500 text-white px-2 py-0.5 rounded-full">ALERT</span>}
            </div>
            <div>
                <h3 className="text-muted-foreground text-sm font-medium">{title}</h3>
                <p className="text-2xl font-bold text-foreground mt-1">{value}</p>
                <p className="text-xs text-muted-foreground/80 mt-1">{subtext}</p>
            </div>
        </div>
    );
}

function ActionItem({ title, count, label, href, urgent, icon: Icon }: any) {
    return (
        <a href={href} className={`block p-5 rounded-xl border transition-all hover:scale-[1.02] active:scale-95 shadow-sm ${urgent
            ? 'bg-red-500/10 border-red-500/20 hover:bg-red-500/20'
            : 'bg-card border-border hover:bg-muted'
            }`}>
            <div className="flex items-center justify-between mb-3">
                <div className={`p-2 rounded-lg ${urgent ? 'bg-red-500/20 text-red-500' : 'bg-muted text-muted-foreground'}`}>
                    {Icon ? <Icon className="w-5 h-5" /> : <div className="w-5 h-5" />}
                </div>
                {urgent && <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />}
            </div>
            <p className="text-2xl font-bold text-foreground mb-1">{count}</p>
            <p className={`text-sm font-medium ${urgent ? 'text-red-500' : 'text-muted-foreground'}`}>
                {title} <span className="text-xs opacity-70">({label})</span>
            </p>
        </a>
    );
}

function ActivityItem({ transaction }: any) {
    const isCredit = ['deposit', 'prize_winnings'].includes(transaction.type);

    let icon = Wallet;
    let colorClass = "text-muted-foreground";
    let bgClass = "bg-muted";

    if (transaction.type === 'deposit') {
        icon = ArrowUpRight;
        colorClass = "text-green-500";
        bgClass = "bg-green-500/10";
    } else if (transaction.type === 'withdrawal') {
        icon = ArrowDownLeft;
        colorClass = "text-red-500";
        bgClass = "bg-red-500/10";
    } else if (transaction.type === 'entry_fee') {
        icon = Trophy;
        colorClass = "text-yellow-600 dark:text-yellow-400";
        bgClass = "bg-yellow-500/10";
    }

    const IconComp = icon;

    return (
        <div className="flex items-center gap-3 p-3 rounded-xl hover:bg-muted/50 transition-colors border border-transparent hover:border-border">
            <div className={`p-2 rounded-lg ${bgClass}`}>
                <IconComp className={`w-4 h-4 ${colorClass}`} />
            </div>
            <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground truncate">
                    <span className="font-semibold">{transaction.user?.name || "Unknown User"}</span>
                    {" "}
                    <span className="text-muted-foreground font-normal">
                        {transaction.type === 'entry_fee' ? 'joined contest' :
                            transaction.type === 'prize_winnings' ? 'won prize' :
                                transaction.type}
                    </span>
                </p>
                <p className="text-xs text-muted-foreground">
                    {new Date(transaction.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </p>
            </div>
            <div className={`text-sm font-bold ${isCredit ? 'text-green-500' : 'text-foreground'}`}>
                {isCredit ? '+' : '-'} {transaction.amount}
            </div>
        </div>
    );
}
