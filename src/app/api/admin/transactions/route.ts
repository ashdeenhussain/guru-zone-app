
import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/db';
import Transaction from '@/models/Transaction';
import User from '@/models/User';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function PATCH(request: Request) {
    try {
        const session: any = await getServerSession(authOptions);
        if (!session || session.user.role !== 'admin') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { transactionId, action, rejectionReason } = await request.json();

        if (!transactionId || !['approve', 'reject'].includes(action)) {
            return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
        }

        await connectToDatabase();

        const transaction = await Transaction.findById(transactionId);
        if (!transaction) {
            return NextResponse.json({ error: 'Transaction not found' }, { status: 404 });
        }

        if (transaction.status !== 'pending' && transaction.status !== 'Pending') {
            return NextResponse.json({ error: 'Transaction is not pending' }, { status: 400 });
        }

        if (action === 'approve') {
            transaction.status = 'approved';
            await transaction.save();

            // Optional: Notify user (if notification system exists)

            return NextResponse.json({ success: true, message: 'Withdrawal Approved' });
        }

        if (action === 'reject') {
            transaction.status = 'rejected';
            transaction.rejectionReason = rejectionReason || 'Rejected by admin';
            await transaction.save();

            // Refund the user
            const user = await User.findById(transaction.user);
            if (user) {
                user.walletBalance += transaction.amount;
                await user.save();
            }

            return NextResponse.json({ success: true, message: 'Withdrawal Rejected & Refunded' });
        }

    } catch (error) {
        console.error('Error updating transaction:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
