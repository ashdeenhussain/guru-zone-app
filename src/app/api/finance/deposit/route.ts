
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import connectDB from '@/lib/db';
import Transaction from '@/models/Transaction';
import User from '@/models/User';
import Notification from '@/models/Notification';
import AdminNotification from '@/models/AdminNotification';

export async function POST(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || !session.user) {
            return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
        }

        const body = await req.json();
        const { amount, method, senderName, senderNumber, trxId, screenshot } = body;

        if (!amount || !method || !senderName || !senderNumber) {
            return NextResponse.json({ message: 'Missing required fields' }, { status: 400 });
        }

        await connectDB();

        // Check if user is banned
        const user = await User.findById(session.user.id);
        if (!user) {
            return NextResponse.json({ message: 'User not found' }, { status: 404 });
        }
        if (user.status === 'banned') {
            return NextResponse.json({ message: 'Your account has been suspended.' }, { status: 403 });
        }

        // Verify uniqueness of Transaction ID
        if (trxId) {
            const existingTrx = await Transaction.findOne({
                trxID: trxId,
                status: { $in: ['pending', 'approved', 'Pending', 'Approved'] }
            });
            if (existingTrx) {
                return NextResponse.json({ message: 'This Transaction ID has already been submitted or processed.' }, { status: 400 });
            }
        }

        // Create Transaction
        const transaction = await Transaction.create({
            user: session.user.id,
            amount: Number(amount),
            type: 'deposit',
            method,
            proofImage: screenshot, // Expecting URL from frontend upload
            trxID: trxId,
            description: `Deposit via ${method}`,
            status: 'pending',
            details: {
                senderName,
                senderNumber
            }
        });

        // Create Notification for User
        await Notification.create({
            userId: session.user.id,
            title: 'Deposit Request Submitted',
            message: `Your deposit request of Rs ${amount} has been submitted and is pending approval.`,
            type: 'info'
        });

        // Create Admin Notification
        await AdminNotification.create({
            title: 'New Deposit Request',
            message: `User ${session.user.name || session.user.email} has requested a deposit of Rs ${amount} via ${method}.`,
            type: 'deposit',
            link: '/admin/finance'
        });

        return NextResponse.json({ message: 'Deposit request submitted', transaction }, { status: 201 });

    } catch (error) {
        console.error('Error submitting deposit:', error);
        return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
    }
}
