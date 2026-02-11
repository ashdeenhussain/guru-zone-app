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
            if (t.status === 'approved' || t.status === 'Completed') {
                if (t.type === 'deposit') {
                    financials.totalDeposited += t.amount;
                } else if (t.type === 'withdrawal') {
                    // Withdrawals are usually negative in amount or positive?
                    // Usually they reduce balance, so if stored as negative, take abs.
                    // If stored as positive but type is withdrawal, add it.
                    // Looking at models, amount is just Number. 
                    // Let's assume standard logic: deposits +ve, withdrawals -ve in balance calculation,
                    // but usually stored as absolute value for "Amount Requested".
                    // Wait, in `shop_purchase` we saw `amount: -price`.
                    // So negative amounts reduce balance.
                    // So for "Total Withdrawn", we want the magnitude of withdrawals.
                    if (t.type === 'withdrawal') {
                        financials.totalWithdrawn += Math.abs(t.amount);
                    }
                }
            }

            // For others, status 'approved' or created successfully.
            // Shop purchases are 'shop_purchase', usually auto-approved or pending?
            // In the previous file `api/shop/purchase`, status was 'approved'.
            if (t.type === 'shop_purchase') {
                financials.totalSpentShop += Math.abs(t.amount);
            }
            if (t.type === 'entry_fee') {
                financials.totalSpentTournaments += Math.abs(t.amount);
            }
            if (t.type === 'prize_winnings') {
                financials.totalWinnings += t.amount;
            }
            if (t.type === 'spin_win' && t.amount > 0) {
                financials.totalWinnings += t.amount;
            }
            // Spin cost? usually 'spin_cost' or similar?
            // Not seen in enum but might exist. 'spin_win' implies winning.
            // If there is a cost, it would be a negative transaction.
            // Let's assume 'spin_cost' if it exists, or maybe it's under 'shop_purchase'?
            // For now, ignore spin cost unless we see it.
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
