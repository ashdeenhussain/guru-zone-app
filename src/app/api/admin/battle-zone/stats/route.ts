import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import connectMongo from '@/lib/db';
import BattleMatch from '@/models/BattleMatch';
import User from '@/models/User';

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.email) {
            return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
        }

        await connectMongo();

        const user = await User.findOne({ email: session.user.email });
        if (!user || user.role !== 'admin') {
            return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
        }

        // Aggregate stats
        const [stats] = await BattleMatch.aggregate([
            {
                $facet: {
                    totalCount: [{ $count: 'count' }],
                    statusCounts: [
                        { $group: { _id: '$status', count: { $sum: 1 } } }
                    ],
                    escrowSum: [
                        { $match: { status: { $in: ['open', 'full', 'active', 'live', 'disputed'] } } },
                        { $group: { _id: null, total: { $sum: { $multiply: ['$entryFee', '$joinedCount'] } } } }
                    ]
                }
            }
        ]);

        const statusMap: Record<string, number> = {};
        stats.statusCounts.forEach((s: any) => {
            statusMap[s._id.toLowerCase()] = s.count;
        });

        const formattedStats = {
            total: stats.totalCount[0]?.count || 0,
            open: statusMap['open'] || 0,
            active: (statusMap['active'] || 0) + (statusMap['live'] || 0) + (statusMap['full'] || 0),
            disputed: statusMap['disputed'] || 0,
            completed: statusMap['completed'] || 0,
            totalEscrow: stats.escrowSum[0]?.total || 0
        };

        return NextResponse.json({
            success: true,
            data: formattedStats
        });

    } catch (error: any) {
        console.error('Error fetching admin battle zone stats:', error);
        return NextResponse.json({ success: false, error: error.message || 'Server Error' }, { status: 500 });
    }
}
