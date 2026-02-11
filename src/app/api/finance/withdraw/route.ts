
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import connectDB from '@/lib/db';
import Transaction from '@/models/Transaction';
import User from '@/models/User';

import { startOfDay, endOfDay } from 'date-fns';

const DAILY_LIMIT = 1000;

import mongoose from 'mongoose';

// ... 

async function getDailyUsage(userId: string) {
    const todayStart = startOfDay(new Date());
    const todayEnd = endOfDay(new Date());

    console.log(`Checking usage for user ${userId} from ${todayStart} to ${todayEnd}`);

    const result = await Transaction.aggregate([
        {
            $match: {
                user: new mongoose.Types.ObjectId(userId), // Explicitly cast to ObjectId
                type: 'withdrawal',
                status: { $in: ['pending', 'approved'] },
                createdAt: { $gte: todayStart, $lte: todayEnd }
            }
        },
        {
            $group: {
                _id: null,
                total: { $sum: '$amount' }
            }
        }
    ]);

    const total = result[0]?.total || 0;

    return total;
}

export async function GET(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || !session.user) {
            return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
        }

        await connectDB();
        const used = await getDailyUsage(session.user.id);

        return NextResponse.json({
            used,
            limit: DAILY_LIMIT,
            remaining: Math.max(0, DAILY_LIMIT - used)
        });
    } catch (error) {
        console.error('Error fetching limit:', error);
        return NextResponse.json({ message: 'Internal Error' }, { status: 500 });
    }
}

export async function POST(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || !session.user) {
            return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
        }

        const body = await req.json();
        const { amount, method, accountNumber, accountTitle } = body;

        const amountNum = Number(amount);

        // Basic validation
        if (!amountNum || amountNum < 250) {
            return NextResponse.json({ message: 'Minimum withdrawal amount is 250 coins' }, { status: 400 });
        }

        if (!method || !accountNumber || !accountTitle) {
            return NextResponse.json({ message: 'Incomplete bank details' }, { status: 400 });
        }

        await connectDB();

        // Check Daily Limit
        const usedToday = await getDailyUsage(session.user.id);
        if (usedToday + amountNum > DAILY_LIMIT) {
            return NextResponse.json({
                message: `Daily limit exceeded. You have used ${usedToday}/${DAILY_LIMIT} coins today.`
            }, { status: 400 });
        }

        // 1. Atomic Check & Deduct (Lock funds logic)
        const user = await User.findOneAndUpdate(
            { _id: session.user.id, walletBalance: { $gte: amountNum } },
            { $inc: { walletBalance: -amountNum } },
            { new: true }
        );

        if (!user) {
            return NextResponse.json({ message: 'Insufficient balance' }, { status: 400 });
        }

        // 2. Create Transaction
        try {
            const transaction = await Transaction.create({
                user: user._id,
                amount: amountNum,
                type: 'withdrawal',
                status: 'pending', // Pending admin approval
                method: method, // Also saving method at top level for consistency
                description: `Withdrawal request to ${method}`,
                details: { // Saving in 'details' to match Admin Finance Page expectations
                    bankName: method,
                    accountTitle: accountTitle,
                    accountNumber: accountNumber
                },
            });

            // Add transaction reference to user provided schema has it
            // Safe to skip if we query via Transaction.find({ user: id }) but standardizing is good
            // However, pushing to array in separate update is risky if it fails.
            // But since money is deducted, transaction record is the most important.
            // We won't re-update user array to avoid complexity, query by user id is sufficient.

            return NextResponse.json({ message: 'Withdrawal request submitted successfully', transaction }, { status: 201 });
        } catch (txError) {
            // CRITICAL: Refund if transaction creation fails
            console.error('Transaction creation failed, refunding user:', txError);
            await User.findByIdAndUpdate(session.user.id, { $inc: { walletBalance: amountNum } });
            return NextResponse.json({ message: 'Transaction creation failed, balance refunded. Please try again.' }, { status: 500 });
        }

    } catch (error) {
        console.error('Withdrawal error:', error);
        return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
    }
}
