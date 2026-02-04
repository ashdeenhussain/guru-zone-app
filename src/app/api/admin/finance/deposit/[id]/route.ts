
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import connectDB from '@/lib/db';
import Transaction from '@/models/Transaction';
import User from '@/models/User';
import Notification from '@/models/Notification';
import AdminActivity from '@/models/AdminActivity';

export async function PATCH(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || session.user.role !== 'admin') {
            return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
        }

        const { id } = await params;
        const { status, amount, rejectionReason } = await req.json();

        await connectDB();

        const transaction = await Transaction.findById(id).populate('user');
        if (!transaction) {
            return NextResponse.json({ message: 'Transaction not found' }, { status: 404 });
        }

        if (transaction.status !== 'pending') {
            return NextResponse.json({ message: 'Transaction is already processed' }, { status: 400 });
        }

        const user = await User.findById(transaction.user._id);
        if (!user) {
            return NextResponse.json({ message: 'User not found' }, { status: 404 });
        }

        if (status === 'approved') {
            // 1. Update Amount if provided (Admins can correct 5000 -> 500)
            let finalAmount = transaction.amount;
            let amountAdjustedMsg = "";

            if (amount && amount !== transaction.amount) {
                finalAmount = Number(amount);
                transaction.amount = finalAmount;
                amountAdjustedMsg = ` Amount was adjusted to Rs ${finalAmount} per verification.`;
            }

            // 2. Handle Balance & Transaction Update based on Type
            if (transaction.type === 'deposit') {
                user.walletBalance += finalAmount;
            } else if (transaction.type === 'withdrawal') {
                // For withdrawals, balance was already deducted at request time.
                // No need to change balance here.
                // OPTIONAL: If admin changed amount for withdrawal (unlikely but possible), we might need to refund diff?
                // For now assuming admin doesn't change withdrawal amount usually.
                // If they reduce withdrawal amount, we should technically refund the difference.
                if (transaction.amount > finalAmount) {
                    const diff = transaction.amount - finalAmount;
                    user.walletBalance += diff;
                    amountAdjustedMsg += ` Refunded Rs ${diff} difference.`;
                }
            }

            // 3. Update Transaction
            transaction.status = 'approved';

            await user.save();
            await transaction.save();

            // 4. Notification
            const actionVerb = transaction.type === 'deposit' ? 'Deposit' : 'Withdrawal';
            await Notification.create({
                userId: user._id,
                title: `${actionVerb} Approved`,
                message: `Your ${transaction.type} of Rs ${finalAmount} has been approved.${amountAdjustedMsg}`,
                type: 'success'
            });

            // 5. Admin Log
            await AdminActivity.create({
                adminId: session.user.id,
                adminName: session.user.name,
                actionType: `APPROVE_${transaction.type.toUpperCase()}`,
                targetId: transaction._id,
                details: `Approved ${transaction.type} of Rs ${finalAmount} for ${user.email}.${amountAdjustedMsg}`
            });

            return NextResponse.json({ message: `${actionVerb} Approved`, transaction });

        } else if (status === 'rejected') {
            // 1. Update Transaction
            transaction.status = 'rejected';
            transaction.rejectionReason = rejectionReason || 'No reason provided';
            await transaction.save();

            // 2. Handle Refunds for Withdrawals
            if (transaction.type === 'withdrawal') {
                user.walletBalance += transaction.amount;
                await user.save();
            }

            // 3. Fraud Logic (Only for Deposits usually, but kept general)
            const isFraud = rejectionReason?.toLowerCase().includes('fake') ||
                rejectionReason?.toLowerCase().includes('fraud');

            // Only strike for deposits
            if (isFraud && transaction.type === 'deposit') {
                user.fakeDepositStrikes = (user.fakeDepositStrikes || 0) + 1;

                let banMsg = "";
                if (user.fakeDepositStrikes >= 3) {
                    user.status = 'banned';
                    user.banReason = "Repeated Fraudulent Deposits (3 Strikes)";
                    banMsg = " ACCOUNT BANNED due to 3 fake deposit strikes.";
                }
                await user.save();

                await Notification.create({
                    userId: user._id,
                    title: 'Deposit Rejected & Warning',
                    message: `Your deposit was rejected as Fake/Fraud. Strike ${user.fakeDepositStrikes}/3.${banMsg}`,
                    type: 'error'
                });
            } else {
                const actionVerb = transaction.type === 'deposit' ? 'Deposit' : 'Withdrawal';
                const refundMsg = transaction.type === 'withdrawal' ? ' Amount has been refunded to your wallet.' : '';

                await Notification.create({
                    userId: user._id,
                    title: `${actionVerb} Rejected`,
                    message: `Your ${transaction.type} was rejected. Reason: ${rejectionReason}.${refundMsg}`,
                    type: 'error'
                });
            }

            // 4. Admin Log
            await AdminActivity.create({
                adminId: session.user.id,
                adminName: session.user.name,
                actionType: `REJECT_${transaction.type.toUpperCase()}`,
                targetId: transaction._id,
                details: `Rejected ${transaction.type} from ${user.email}. Reason: ${rejectionReason || 'None'}.`
            });

            return NextResponse.json({ message: `${transaction.type === 'deposit' ? 'Deposit' : 'Withdrawal'} Rejected`, transaction });
        }

        return NextResponse.json({ message: 'Invalid Status' }, { status: 400 });

    } catch (error: any) {
        console.error('Error processing transaction [PATCH]:', error);
        // Log all properties of the error object
        if (typeof error === 'object') {
            console.error('Error details:', JSON.stringify(error, Object.getOwnPropertyNames(error)));
        }
        return NextResponse.json({
            message: error?.message || 'Internal Server Error',
            details: error?.toString()
        }, { status: 500 });
    }
}
