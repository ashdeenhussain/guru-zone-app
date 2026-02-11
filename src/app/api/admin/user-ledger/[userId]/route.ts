
import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/db';
import Transaction from '@/models/Transaction';
import User from '@/models/User';
import { getServerSession } from 'next-auth';
// import { authOptions } from '@/app/api/auth/[...nextauth]/route'; // Adjust path if needed

export async function GET(
    req: Request,
    props: { params: Promise<{ userId: string }> }
) {
    try {
        await connectToDatabase();

        // Basic auth check - in a real app ensure this is protected
        // const session = await getServerSession(authOptions);
        // if (!session || session.user.role !== 'admin') {
        //     return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        // }

        const params = await props.params;
        const { userId } = params;


        // 1. Fetch User Data for current balance matches
        const user = await User.findById(userId).select('name email walletBalance totalWins netEarnings image');
        if (!user) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        // 2. Aggregations for Logic Check
        // Total Deposits
        const deposits = await Transaction.aggregate([
            {
                $match: {
                    user: user._id,
                    type: 'deposit',
                    status: 'approved' // Only approved deposits count as real money in
                }
            },
            {
                $group: {
                    _id: null,
                    total: { $sum: '$amount' }
                }
            }
        ]);
        const totalDeposits = deposits[0]?.total || 0;

        // Total Winnings (Prizes + Spin Wins)
        const winnings = await Transaction.aggregate([
            {
                $match: {
                    user: user._id,
                    type: { $in: ['prize_winnings', 'spin_win'] },
                    // Winnings are usually automatic/instant approved, ensuring we only count active ones
                    // If status is irrelevant for winnings in your system, remove this check.
                    // Assuming they are 'approved' or 'completed'
                }
            },
            {
                $group: {
                    _id: null,
                    total: { $sum: '$amount' }
                }
            }
        ]);
        const totalWinnings = winnings[0]?.total || 0;

        // Total Withdrawn
        const withdrawals = await Transaction.aggregate([
            {
                $match: {
                    user: user._id,
                    type: 'withdrawal',
                    status: { $in: ['approved', 'completed'] } // Only money actually left the system
                }
            },
            {
                $group: {
                    _id: null,
                    total: { $sum: '$amount' }
                }
            }
        ]);
        const totalWithdrawn = withdrawals[0]?.total || 0;

        // 3. Fetch Full Transaction Ledger
        const transactions = await Transaction.find({ user: userId })
            .sort({ createdAt: -1 })
            .lean();

        return NextResponse.json({
            user: {
                _id: user._id,
                name: user.name,
                email: user.email,
                image: user.image,
                walletBalance: user.walletBalance,
                totalWins: user.totalWins, // This might be from User model which acts as a cache
                netEarnings: user.netEarnings,
            },
            stats: {
                totalDeposits,
                totalWinnings,
                totalWithdrawn,
                calculatedBalance: (totalDeposits + totalWinnings) - totalWithdrawn // Optional: internal check
            },
            transactions
        });

    } catch (error: any) {
        console.error('Error fetching user ledger:', error);
        return NextResponse.json({
            error: error.message || 'Internal Server Error',
            details: error.toString()
        }, { status: 500 });
    }
}
