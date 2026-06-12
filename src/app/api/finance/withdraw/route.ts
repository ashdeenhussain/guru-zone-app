import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import connectDB from '@/lib/db';
import Transaction from '@/models/Transaction';
import User from '@/models/User';
import AdminNotification from '@/models/AdminNotification';

import { startOfDay, endOfDay } from 'date-fns';
import mongoose from 'mongoose';

const DAILY_LIMIT = 1000;

async function getDailyUsage(userId: string, session?: mongoose.ClientSession) {
    const todayStart = startOfDay(new Date());
    const todayEnd = endOfDay(new Date());

    console.log(`Checking usage for user ${userId} from ${todayStart} to ${todayEnd}`);

    const matchStage = {
        user: new mongoose.Types.ObjectId(userId),
        type: 'withdrawal',
        status: { $in: ['pending', 'approved', 'Pending', 'Approved'] },
        createdAt: { $gte: todayStart, $lte: todayEnd }
    };

    const pipeline = [
        { $match: matchStage },
        {
            $group: {
                _id: null,
                total: { $sum: '$amount' }
            }
        }
    ];

    const query = session ? Transaction.aggregate(pipeline).session(session) : Transaction.aggregate(pipeline);
    const result = await query;
    return result[0]?.total || 0;
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
    let dbSession: mongoose.ClientSession | null = null;
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

        dbSession = await mongoose.startSession();
        dbSession.startTransaction();

        // 1. Fetch user inside transaction to check ban status and balance
        const user = await User.findById(session.user.id).session(dbSession);
        if (!user) {
            await dbSession.abortTransaction();
            dbSession.endSession();
            return NextResponse.json({ message: 'User not found' }, { status: 404 });
        }

        // Real-time ban check
        if (user.status === 'banned') {
            await dbSession.abortTransaction();
            dbSession.endSession();
            return NextResponse.json({ message: 'Your account has been suspended.' }, { status: 403 });
        }

        // Verify Daily Limit within session to block concurrent withdrawals
        const usedToday = await getDailyUsage(session.user.id, dbSession);
        if (usedToday + amountNum > DAILY_LIMIT) {
            await dbSession.abortTransaction();
            dbSession.endSession();
            return NextResponse.json({
                message: `Daily limit exceeded. You have used ${usedToday}/${DAILY_LIMIT} coins today.`
            }, { status: 400 });
        }

        // Verify balance
        if (user.walletBalance < amountNum) {
            await dbSession.abortTransaction();
            dbSession.endSession();
            return NextResponse.json({ message: 'Insufficient balance' }, { status: 400 });
        }

        // Deduct balance
        user.walletBalance -= amountNum;
        await user.save({ session: dbSession });

        // 2. Create Transaction
        const transaction = await Transaction.create([{
            user: user._id,
            amount: amountNum,
            type: 'withdrawal',
            status: 'pending', // Pending admin approval
            method: method,
            description: `Withdrawal request to ${method}`,
            details: {
                bankName: method,
                accountTitle: accountTitle,
                accountNumber: accountNumber
            },
        }], { session: dbSession });

        // Create Admin Notification
        await AdminNotification.create([{
            title: 'New Withdrawal Request',
            message: `User ${session.user.name || session.user.email} has requested a withdrawal of Rs ${amountNum} via ${method}.`,
            type: 'withdraw',
            link: '/admin/finance'
        }], { session: dbSession });

        await dbSession.commitTransaction();
        dbSession.endSession();

        return NextResponse.json({ message: 'Withdrawal request submitted successfully', transaction: transaction[0] }, { status: 201 });

    } catch (error: any) {
        if (dbSession) {
            await dbSession.abortTransaction();
            dbSession.endSession();
        }
        console.error('Withdrawal error:', error);
        return NextResponse.json({ message: error.message || 'Internal Server Error' }, { status: 500 });
    }
}
