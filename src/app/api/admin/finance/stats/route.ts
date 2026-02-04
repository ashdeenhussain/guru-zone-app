
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import connectDB from '@/lib/db';
import Transaction from '@/models/Transaction';
import Tournament from '@/models/Tournament';
import User from '@/models/User';

export async function GET(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || session.user.role !== 'admin') {
            return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
        }

        await connectDB();

        // 1. Calculate Cash Flow
        const depositStats = await Transaction.aggregate([
            { $match: { type: 'deposit', status: 'approved' } },
            { $group: { _id: null, total: { $sum: '$amount' } } }
        ]);

        const withdrawalStats = await Transaction.aggregate([
            { $match: { type: 'withdrawal', status: 'approved' } },
            { $group: { _id: null, total: { $sum: '$amount' } } }
        ]);

        const totalDeposits = depositStats[0]?.total || 0;
        const totalWithdrawals = withdrawalStats[0]?.total || 0;
        const cashInHand = totalDeposits - totalWithdrawals;

        // 2. Calculate Platform Revenue from Tournaments
        // Revenue = (Entry Fees Collected) - (Prize Pool Paid Out)
        // Only for 'Completed' tournaments to be accurate, or maybe all Non-Cancelled?
        // Prompt says "completed tournaments".

        const tournaments = await Tournament.find({ status: 'Completed' });

        let totalRevenue = 0;
        const profitTable = tournaments.map(t => {
            const fees = t.entryFee * t.joinedCount;
            const expenses = t.prizePool;
            const net = fees - expenses;
            totalRevenue += net;
            return {
                id: t._id,
                name: t.title,
                revenue: fees,
                expenses: expenses,
                netProfit: net
            };
        });

        const pendingDepositsCount = await Transaction.countDocuments({ type: 'deposit', status: 'pending' });
        const pendingWithdrawalsCount = await Transaction.countDocuments({ type: 'withdrawal', status: 'pending' });

        // Count pending by method
        const pendingByMethod = await Transaction.aggregate([
            { $match: { status: 'pending' } },
            { $group: { _id: '$method', count: { $sum: 1 } } }
        ]);

        // Convert to easy dictionary: { 'Easypaisa': 5, 'JazzCash': 2 }
        const methodCounts = pendingByMethod.reduce((acc, curr) => {
            acc[curr._id] = curr.count;
            return acc;
        }, {});

        return NextResponse.json({
            summary: {
                cashInHand,
                totalRevenue,
                totalDeposits,
                totalWithdrawals,
                pendingDepositsCount,
                pendingWithdrawalsCount,
                methodCounts
            },
            profitTable
        });

    } catch (error) {
        console.error('Error fetching finance stats:', error);
        return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
    }
}
