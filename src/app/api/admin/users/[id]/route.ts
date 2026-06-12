import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import User from '@/models/User';
import Transaction from '@/models/Transaction';
import connectDB from '@/lib/db';
import mongoose from 'mongoose';

export async function GET(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        await connectDB();
        const session = await getServerSession(authOptions);

        if (!session || session.user.role !== 'admin') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Await params in Next.js 15/16
        const { id } = await params;
        const userId = id;



        if (!mongoose.Types.ObjectId.isValid(userId)) {

            return NextResponse.json({ error: 'Invalid User ID' }, { status: 400 });
        }

        const user = await User.findById(userId).select('-password');


        if (!user) {
            // Fallback attempt
            if (mongoose.Types.ObjectId.isValid(userId)) {
                const userFallback = await User.findOne({ _id: new mongoose.Types.ObjectId(userId) }).select('-password');
                if (userFallback) {
                    return NextResponse.json({
                        user: userFallback,
                        transactions: await Transaction.find({ user: userFallback._id }).sort({ createdAt: -1 }).limit(50)
                    });
                }
            }
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        const transactions = await Transaction.find({ user: userId })
            .sort({ createdAt: -1 })
            .limit(50);

        // Calculate aggregators
        // We need to fetch ALL transactions to get accurate totals, not just the last 50.
        // Although this might be heavy for users with thousands of transactions, 
        // usually it's manageable. For scale, we might need a separate aggregation pipeline.

        const allTransactions = await Transaction.find({ user: userId });

        const financials = {
            totalDeposited: 0,
            totalWithdrawn: 0,
            totalSpentShop: 0,
            totalSpentTournaments: 0,
            totalWinnings: 0,
            totalSpinsCost: 0
        };

        allTransactions.forEach((t: any) => {
            const status = t.status?.toLowerCase();
            if (status !== 'approved' && status !== 'completed') {
                return; // Exclude pending, rejected, failed, or cancelled transactions
            }

            const amount = Math.abs(t.amount || 0);

            if (t.type === 'deposit') {
                financials.totalDeposited += amount;
            } else if (t.type === 'withdrawal') {
                financials.totalWithdrawn += amount;
            } else if (t.type === 'shop_purchase') {
                financials.totalSpentShop += amount;
            } else if (t.type === 'entry_fee') {
                financials.totalSpentTournaments += amount;
            } else if (
                t.type === 'prize_winnings' || 
                t.type === 'spin_win' || 
                t.type === 'daily_reward_spin' || 
                t.type === 'daily_free_coins' || 
                t.type === 'rank_reward'
            ) {
                financials.totalWinnings += amount;
            }
        });

        return NextResponse.json({
            user,
            financials,
            transactions
        });

    } catch (error: any) {
        console.error('Error fetching user details:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
