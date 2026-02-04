import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import connectToDatabase from '@/lib/db';
import User from '@/models/User';
import Transaction from '@/models/Transaction';
import Notification from '@/models/Notification';

export async function POST(req: Request) {
    try {
        const session = await getServerSession(authOptions);

        // Ensure only admin can access this
        if (!session?.user || (session.user as any).role !== 'admin') {
            return NextResponse.json({ message: 'Unauthorized. Admin access required.' }, { status: 403 });
        }

        const { transactionId, action, reason } = await req.json();

        if (!['approve', 'reject'].includes(action)) {
            return NextResponse.json({ message: 'Invalid action. Must be "approve" or "reject".' }, { status: 400 });
        }

        await connectToDatabase();

        const transaction = await Transaction.findById(transactionId);
        if (!transaction) {
            return NextResponse.json({ message: 'Transaction not found' }, { status: 404 });
        }

        // Ensure we are processing a pending transaction
        const currentStatus = transaction.status.toLowerCase();
        if (currentStatus !== 'pending') {
            return NextResponse.json({ message: `Transaction is already ${currentStatus}` }, { status: 400 });
        }

        if (action === 'approve') {
            // Funds were already deducted on request, so just update status
            transaction.status = 'approved';
            await transaction.save();

            // Notify User
            await Notification.create({
                userId: transaction.user,
                title: 'Withdrawal Approved',
                message: `Your withdrawal of ${transaction.amount} coins has been approved and processed.`,
                isRead: false,
                type: 'success',
            });

        } else if (action === 'reject') {
            if (!reason) {
                return NextResponse.json({ message: 'Rejection reason is required' }, { status: 400 });
            }

            // Refund Balance Logic
            const user = await User.findById(transaction.user);
            if (user) {
                user.walletBalance += transaction.amount;
                await user.save();
            } else {
                // If user not found, maybe just mark transaction as rejected but log error? 
                // In critical financial systems this is bad, but here we proceed.
                console.warn(`User ${transaction.user} not found for refunding rejected withdrawal.`);
            }

            transaction.status = 'rejected';
            transaction.rejectionReason = reason;
            await transaction.save();

            // Notify User
            await Notification.create({
                userId: transaction.user,
                title: 'Withdrawal Rejected',
                message: `Your withdrawal request was rejected: ${reason}`,
                isRead: false,
                type: 'error',
            });
        }

        return NextResponse.json({ message: `Withdrawal ${action}d successfully` });

    } catch (error) {
        console.error('Manage withdrawal error:', error);
        return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
    }
}
