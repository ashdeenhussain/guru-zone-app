
import { getServerSession } from "next-auth";
import { authOptions } from '@/lib/auth';
import connectToDatabase from "@/lib/db";
import User from "@/models/User";
import { redirect } from "next/navigation";
import {
    Wallet,
    Trophy,
    Activity,
    DollarSign,
    Bell,
    Settings,
    LayoutGrid,
    Headphones,
    User as UserIcon,
    ChevronRight,
    ArrowUpRight
} from "lucide-react";
import Link from "next/link";
import SystemSetting from "@/models/SystemSetting";
import SystemWidgets from "@/components/SystemWidgets";
import Tournament from "@/models/Tournament";
import ActiveTournamentsCard from "@/components/dashboard/ActiveTournamentsCard";
import RankDisplay from "@/components/RankDisplay";
import NotificationBanner from "@/components/dashboard/NotificationBanner";
import PageHeader from "@/components/PageHeader";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
        redirect("/login");
    }

    await connectToDatabase();

    // Fetch user data with all new stats
    const user = await User.findOne({ email: session.user.email }).lean();
    const settings = await SystemSetting.findOne().lean();

    if (!user) {
        redirect("/login");
    }

    // Filter banners for Dashboard (Home)
    const allBanners = settings?.bannerImages || [];
    // Handle both old string[] structure and new object structure safely
    const dashboardBanners = allBanners
        .filter((banner: any) => {
            if (typeof banner === 'string') return true; // Legacy: show everywhere
            return banner.location === 'home' || banner.location === 'both';
        })
        .map((banner: any) => typeof banner === 'string' ? banner : banner.url);

    const walletBalance = user.walletBalance || 0;
    const totalWins = user.totalWins || 0;
    const netEarnings = user.netEarnings || 0;
    const tournamentsPlayed = (user.tournamentsPlayed || []).map((t: any) => ({
        ...t,
        _id: t._id?.toString(),
    }));

    // Fetch active tournaments (Real data)
    const activeTournamentsList = await Tournament.find({
        "participants.userId": user._id,
        status: { $in: ["Open", "Live"] }
    }).sort({ startTime: 1 }).lean();

    const activeTournamentsCount = activeTournamentsList.length;
    const nextMatch = activeTournamentsList.find((t: any) => new Date(t.startTime) > new Date());

    // Calculate win rate (mock calculation for now, avoid division by zero)
    const totalPlayed = tournamentsPlayed.length;
    const winRate = totalPlayed > 0 ? ((totalWins / totalPlayed) * 100).toFixed(1) : "0.0";

    return (
        <div className="space-y-6 pb-24 lg:pb-8 max-w-4xl mx-auto animate-in fade-in-50 duration-500">
            {/* Page Title Header */}
            <PageHeader
                title="Dashboard"
                description="Welcome to your command center"
                icon={LayoutGrid}
            />

            <div className="px-4 md:px-0 space-y-6">
                {/* System Banners & Announcements */}
                <SystemWidgets
                    announcement={settings?.announcement}
                    banners={dashboardBanners}
                />

                {/* Notification Banner */}
                <NotificationBanner />

                {/* Player Rank Progress */}
                <RankDisplay points={user.rankPoints || 0} />

                {/* Stats Grid (2x2) */}
                <div className="grid grid-cols-2 gap-4">
                    {/* Wallet Balance - Gold Theme */}
                    <div className="relative overflow-hidden glass-card p-4 rounded-2xl group transition-all duration-300 hover:border-yellow-500/50 shadow-sm">
                        <div className="absolute right-0 bottom-0 w-24 h-24 bg-yellow-500/20 blur-[60px] rounded-full pointer-events-none" />
                        <div className="flex justify-between items-start mb-4 relative z-10">
                            <div className="p-2 bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 rounded-xl border border-yellow-500/20 shadow-[0_0_15px_rgba(234,179,8,0.2)]">
                                <Wallet size={20} />
                            </div>
                            <ArrowUpRight size={16} className="text-yellow-600 dark:text-yellow-400" />
                        </div>
                        <p className="text-muted-foreground text-sm mb-1 relative z-10">Wallet Balance</p>
                        <h3 className="text-2xl font-bold text-foreground relative z-10 drop-shadow-sm truncate">
                            {walletBalance}
                            <span className="text-sm font-normal text-muted-foreground ml-1">coins</span>
                        </h3>
                    </div>

                    {/* Total Wins - Silver Theme */}
                    <div className="relative overflow-hidden glass-card p-4 rounded-2xl group transition-all duration-300 hover:border-emerald-500/50 shadow-sm">
                        <div className="absolute right-0 bottom-0 w-24 h-24 bg-emerald-500/20 blur-[60px] rounded-full pointer-events-none" />
                        <div className="flex justify-between items-start mb-4 relative z-10">
                            <div className="p-2 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-xl border border-emerald-500/20 shadow-[0_0_15px_rgba(52,211,153,0.2)]">
                                <Trophy size={20} />
                            </div>
                            <div className="p-1">
                                <Trophy size={16} className="text-emerald-500/50" />
                            </div>
                        </div>
                        <p className="text-muted-foreground text-sm mb-1 relative z-10">Total Wins</p>
                        <h3 className="text-2xl font-bold text-foreground relative z-10 drop-shadow-sm truncate">
                            {totalWins}
                        </h3>
                        <p className="text-xs text-emerald-600/80 dark:text-emerald-400/60 mt-1 relative z-10">{winRate}% win rate</p>
                    </div>

                    {/* Active Tournaments - Blue Neon (Smart Widget) */}
                    <ActiveTournamentsCard
                        count={activeTournamentsCount}
                        nextMatchTime={nextMatch?.startTime ? new Date(nextMatch.startTime).toISOString() : undefined}
                    />

                    {/* Net Earnings - Purple Neon */}
                    <div className="relative overflow-hidden glass-card p-4 rounded-2xl group transition-all duration-300 hover:border-purple-500/50 shadow-sm">
                        <div className="absolute right-0 bottom-0 w-24 h-24 bg-purple-500/20 blur-[60px] rounded-full pointer-events-none" />
                        <div className="flex justify-between items-start mb-4 relative z-10">
                            <div className="p-2 bg-purple-500/10 text-purple-600 dark:text-purple-400 rounded-xl border border-purple-500/20 shadow-[0_0_15px_rgba(192,132,252,0.2)]">
                                <DollarSign size={20} />
                            </div>
                            <ArrowUpRight size={16} className="text-purple-600 dark:text-purple-400" />
                        </div>
                        <p className="text-muted-foreground text-sm mb-1 relative z-10">Net Earnings</p>
                        <h3 className="text-2xl font-bold text-foreground relative z-10 drop-shadow-sm truncate">
                            +{netEarnings}
                        </h3>
                        <p className="text-xs text-purple-600/80 dark:text-purple-400/60 mt-1 relative z-10">coins</p>
                    </div>
                </div>

                {/* Quick Actions Grid (2x2) */}
                <div className="grid grid-cols-2 gap-4">
                    <Link href="/dashboard/tournaments" className="glass-card p-6 rounded-2xl flex flex-col items-center justify-center text-center space-y-3 group shadow-sm hover:bg-white/5 hover:border-yellow-500/50 transition-all duration-300">
                        <div className="p-3 bg-yellow-500/10 text-yellow-600 dark:text-yellow-500 rounded-full border border-yellow-500/20 group-hover:shadow-[0_0_15px_rgba(234,179,8,0.3)] transition-shadow">
                            <Trophy size={24} />
                        </div>
                        <span className="font-bold text-muted-foreground group-hover:text-foreground text-sm transition-colors">Browse<br />Tournaments</span>
                    </Link>

                    <Link href="/dashboard/wallet" className="glass-card p-6 rounded-2xl flex flex-col items-center justify-center text-center space-y-3 group shadow-sm hover:bg-white/5 hover:border-green-500/50 transition-all duration-300">
                        <div className="p-3 bg-green-500/10 text-green-600 dark:text-green-500 rounded-full border border-green-500/20 group-hover:shadow-[0_0_15px_rgba(34,197,94,0.3)] transition-shadow">
                            <Wallet size={24} />
                        </div>
                        <span className="font-bold text-muted-foreground group-hover:text-foreground text-sm transition-colors">My Wallet</span>
                    </Link>

                    <Link href="/dashboard/support" className="glass-card p-6 rounded-2xl flex flex-col items-center justify-center text-center space-y-3 group shadow-sm hover:bg-white/5 hover:border-blue-500/50 transition-all duration-300">
                        <div className="p-3 bg-blue-500/10 text-blue-600 dark:text-blue-500 rounded-full border border-blue-500/20 group-hover:shadow-[0_0_15px_rgba(59,130,246,0.3)] transition-shadow">
                            <Headphones size={24} />
                        </div>
                        <span className="font-bold text-muted-foreground group-hover:text-foreground text-sm transition-colors">Support</span>
                    </Link>

                    <Link href="/dashboard/shop" className="glass-card p-6 rounded-2xl flex flex-col items-center justify-center text-center space-y-3 group shadow-sm hover:bg-white/5 hover:border-pink-500/50 transition-all duration-300">
                        <div className="p-3 bg-pink-500/10 text-pink-600 dark:text-pink-500 rounded-full border border-pink-500/20 group-hover:shadow-[0_0_15px_rgba(236,72,153,0.3)] transition-shadow">
                            <DollarSign size={24} />
                        </div>
                        <span className="font-bold text-muted-foreground group-hover:text-foreground text-sm transition-colors">Diamond<br />Shop</span>
                    </Link>
                </div>

                {/* My Tournaments Wrapper */}
                <div className="bg-card backdrop-blur-md border border-border rounded-3xl p-6 relative overflow-hidden shadow-sm">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 blur-[100px] rounded-full pointer-events-none" />

                    <div className="flex items-center justify-between mb-6 relative z-10">
                        <div className="flex items-center space-x-3">
                            <div className="p-2 bg-primary/10 rounded-xl border border-primary/20 shadow-[0_0_10px_rgba(234,179,8,0.2)]">
                                <Trophy className="text-primary" size={24} />
                            </div>
                            <div>
                                <h2 className="text-xl font-bold text-foreground leading-none drop-shadow-sm">Joined</h2>
                                <h2 className="text-xl font-bold text-foreground leading-none drop-shadow-sm">Tournaments</h2>
                            </div>
                        </div>
                        {tournamentsPlayed.length > 0 && (
                            <Link href="/dashboard/tournaments?tab=my" className="flex items-center text-primary text-sm font-bold hover:text-primary/80 transition-colors">
                                View All <ChevronRight size={16} />
                            </Link>
                        )}
                    </div>

                    {tournamentsPlayed.length === 0 ? (
                        <div className="border border-border bg-muted/20 backdrop-blur-sm rounded-2xl p-8 text-center relative z-10">
                            <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4 text-muted-foreground">
                                <Trophy size={32} />
                            </div>
                            <h3 className="font-bold text-foreground mb-1">No Active Battles</h3>
                            <p className="text-muted-foreground text-sm mb-4">You haven't joined any tournaments yet.</p>
                            <Link href="/dashboard/tournaments" className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-6 py-3 rounded-xl text-sm font-bold hover:brightness-110 shadow-lg shadow-primary/25 transition-all">
                                Join a Tournament <ChevronRight size={16} />
                            </Link>
                        </div>
                    ) : (
                        <div className="space-y-4 relative z-10">
                            {tournamentsPlayed.slice(0, 3).map((t: any, i: number) => (
                                <div key={i} className="bg-muted/10 backdrop-blur-sm border border-border rounded-2xl p-4 relative overflow-hidden hover:bg-muted/20 transition-colors group">
                                    <div className="flex justify-between items-start mb-2">
                                        <div>
                                            <h3 className="font-bold text-foreground group-hover:text-primary transition-colors text-lg">{t.title || `Tournament #${i + 1}`}</h3>
                                            <span className="text-xs text-muted-foreground font-mono">{t._id}</span>
                                        </div>
                                        <span className="bg-primary/10 text-primary border border-primary/20 px-2 py-1 rounded-lg text-xs font-bold shadow-[0_0_8px_rgba(234,179,8,0.3)]">
                                            PKR {t.prizePool || 0} Pool
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-3 text-sm text-muted-foreground mt-2">
                                        <span className="flex items-center gap-1"><UserIcon size={14} /> {t.type || 'Solo'}</span>
                                        <span className="w-1 h-1 bg-border rounded-full"></span>
                                        <span>{t.map || 'Bermuda'}</span>
                                        <span className="w-1 h-1 bg-border rounded-full"></span>
                                        <span className={t.status === 'Open' ? 'text-green-500' : 'text-yellow-500'}>{t.status || 'Upcoming'}</span>
                                    </div>
                                </div>
                            ))}
                            <div className="mt-4 text-center">
                                <Link href="/dashboard/tournaments?tab=my" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                                    View all joined tournaments
                                </Link>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
