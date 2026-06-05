
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import connectDB from '@/lib/db';
import Transaction from '@/models/Transaction';
import Tournament from '@/models/Tournament';
import User from '@/models/User';
import FinancialLog from '@/models/FinancialLog';

export async function GET(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || session.user.role !== 'admin') {
            return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
        }

        await connectDB();

        // 1. Calculate Cash Flow
        const depositStats = await Transaction.aggregate([
            { $match: { type: 'deposit', status: { $in: ['approved', 'Approved'] } } },
            { $group: { _id: null, total: { $sum: '$amount' } } }
        ]);

        const withdrawalStats = await Transaction.aggregate([
            { $match: { type: 'withdrawal', status: { $in: ['approved', 'Approved'] } } },
            { $group: { _id: null, total: { $sum: '$amount' } } }
        ]);

        const totalDeposits = depositStats[0]?.total || 0;
        const totalWithdrawals = withdrawalStats[0]?.total || 0;
        const cashInHand = totalDeposits - totalWithdrawals;

        // 2. Calculate Platform Revenue from Tournaments
        // Revenue = (Entry Fees Collected) - (Prize Pool Paid Out)
        // Only for 'Completed' tournaments to be accurate, or maybe all Non-Cancelled?
        // Prompt says "completed tournaments".

        const tournaments = await Tournament.find({ 
            status: { $in: ['completed', 'Completed'] } 
        }).sort({ createdAt: -1 });

        let totalRevenue = 0;
        const profitTable = [];

        for (const t of tournaments) {
            const fees = t.entryFee * t.joinedCount;
            let expenses = 0;

            if (t.prizeDistributed) {
                if (t.isPerKill) {
                    const logs = await FinancialLog.find({
                        type: 'prize_winnings',
                        referenceId: t._id
                    });
                    expenses = logs.reduce((sum, log) => sum + (log.amount || 0), 0);
                } else {
                    expenses = t.prizePool;
                }
            }

            const net = fees - expenses;
            totalRevenue += net;

            profitTable.push({
                id: t._id,
                name: t.title,
                type: t.isPerKill ? 'Per Kill' : 'Classic',
                revenue: fees,
                expenses: expenses,
                netProfit: net,
                status: t.status,
                createdAt: t.createdAt
            });
        }

        const pendingDepositsCount = await Transaction.countDocuments({ type: 'deposit', status: { $in: ['pending', 'Pending'] } });
        const pendingWithdrawalsCount = await Transaction.countDocuments({ type: 'withdrawal', status: { $in: ['pending', 'Pending'] } });

        // Count pending by method
        const pendingByMethod = await Transaction.aggregate([
            { $match: { status: { $in: ['pending', 'Pending'] } } },
            { $group: { _id: '$method', count: { $sum: 1 } } }
        ]);

        // Convert to easy dictionary: { 'Easypaisa': 5, 'JazzCash': 2 }
        const methodCounts = pendingByMethod.reduce((acc, curr) => {
            acc[curr._id] = curr.count;
            return acc;
        }, {});

        const totalAccountsCheckedCount = await User.countDocuments({ status: { $ne: 'banned' } });
        const mismatchedAccountsCount = await User.countDocuments({ walletStatus: 'Mismatch' });
        const mismatchedAccountsDetails = await User.find(
            { walletStatus: 'Mismatch' },
            { name: 1, email: 1, walletBalance: 1, walletLedgerSum: 1, walletFlagReason: 1, suspiciousFlag: 1 }
        ).lean();

        return NextResponse.json({
            summary: {
                cashInHand,
                totalRevenue,
                totalDeposits,
                totalWithdrawals,
                pendingDepositsCount,
                pendingWithdrawalsCount,
                methodCounts,
                mismatchedAccountsCount,
                totalAccountsCheckedCount
            },
            profitTable,
            mismatchedAccountsDetails
        });

    } catch (error) {
        console.error('Error fetching finance stats:', error);
        return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
    }
}
