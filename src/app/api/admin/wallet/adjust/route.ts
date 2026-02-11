import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import User from '@/models/User';
import Transaction from '@/models/Transaction';
import Notification from '@/models/Notification';
import connectDB from '@/lib/db';
import mongoose from 'mongoose';

export async function POST(req: Request) {
    try {
        const session = await getServerSession(authOptions);

        if (!session || session.user.role !== 'admin') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { userId, amount, type, reason } = await req.json();

        if (!userId || !amount || !type || !reason) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        if (amount <= 0) {
            return NextResponse.json({ error: 'Amount must be greater than 0' }, { status: 400 });
        }

        await connectDB();

        // Start a session for atomicity
        const sessionDb = await mongoose.startSession();
        sessionDb.startTransaction();

        try {
            const user = await User.findById(userId).session(sessionDb);
            if (!user) {
                throw new Error('User not found');
            }

            let newBalance = user.walletBalance;
            if (type === 'CREDIT') {
                newBalance += amount;
            } else if (type === 'DEBIT') {
                if (user.walletBalance < amount) {
                    throw new Error(`Insufficient funds. User has ${user.walletBalance}, you tried to deduct ${amount}`);
                }
                newBalance -= amount;
            } else {
                throw new Error('Invalid adjustment type');
            }

            // Update User Balance
            user.walletBalance = newBalance;
            await user.save({ session: sessionDb });

            // Create Transaction Record
            await Transaction.create([{
                user: userId,
                amount: amount,
                type: 'ADMIN_ADJUSTMENT',
                description: reason,
                status: 'approved', // Auto-approved since admin did it
                details: {
                    adjustedBy: session.user.email,
                    adjustmentType: type
                }
            }], { session: sessionDb });

            // Create Notification
            await Notification.create([{
                userId: userId,
                title: 'Wallet Adjustment',
                message: `Admin has ${type === 'CREDIT' ? 'credited' : 'deducted'} ${amount} Coins. Reason: ${reason}`,
                type: type === 'CREDIT' ? 'success' : 'warning',
            }], { session: sessionDb });

            await sessionDb.commitTransaction();
            sessionDb.endSession();

            return NextResponse.json({
                success: true,
                newBalance,
                message: 'Wallet adjusted successfully'
            });

        } catch (error) {
            await sessionDb.abortTransaction();
            sessionDb.endSession();
            throw error;
        }

    } catch (error: any) {
        console.error('Error adjusting wallet:', error);
        return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
    }
}
