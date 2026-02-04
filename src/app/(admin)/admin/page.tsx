import { getServerSession } from "next-auth";
import { authOptions } from '@/lib/auth';

export default async function AdminDashboard() {
    const session = await getServerSession(authOptions);

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-3xl font-bold text-foreground">Admin Dashboard</h1>
                <div className="flex items-center gap-2">
                    <span className="bg-green-500/10 text-green-500 px-3 py-1 rounded-full text-sm font-medium border border-green-500/20">
                        System Operational
                    </span>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                    { label: 'Total Users', value: '1,234', color: 'from-blue-500 to-indigo-600' },
                    { label: 'Active Tournaments', value: '12', color: 'from-red-500 to-orange-600' },
                    { label: 'Pending Withdrawals', value: '5', color: 'from-amber-500 to-yellow-600' },
                    { label: 'Total Revenue', value: '$45,200', color: 'from-green-500 to-emerald-600' },
                ].map((stat, i) => (
                    <div key={i} className="bg-card p-6 rounded-xl border border-border text-card-foreground">
                        <p className="text-muted-foreground text-sm font-medium">{stat.label}</p>
                        <p className="text-3xl font-bold text-foreground mt-2">{stat.value}</p>
                        <div className={`h-1 w-full mt-4 rounded-full bg-gradient-to-r ${stat.color} opacity-80`} />
                    </div>
                ))}
            </div>

            <div className="bg-card rounded-xl border border-border p-6 text-card-foreground">
                <h2 className="text-xl font-bold text-foreground mb-4">Recent Activity</h2>
                <div className="text-muted-foreground text-sm">
                    No recent activity to display.
                </div>
            </div>
        </div>
    );
}
