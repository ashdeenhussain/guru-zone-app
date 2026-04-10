import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import User from '@/models/User';
import Transaction from '@/models/Transaction';
import connectDB from '@/lib/db';
import mongoose from 'mongoose';

export async function POST(req: Request) {
    try {
        const session = await getServerSession(authOptions);

        if (!session || session.user.role !== 'admin') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { userId, reason } = await req.json();

        if (!userId) {
            return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
        }

        await connectDB();

        // 1. Calculate Ledger Sum
        const transactions = await Transaction.find({ user: userId });
        
        let ledgerSum = 0;
        transactions.forEach((trx: any) => {
            const status = trx.status?.toLowerCase() || 'pending';
            const type = trx.type;
            const amount = Math.abs(trx.amount || 0);

            if (['rejected', 'failed', 'cancelled'].includes(status)) return;
            if (type === 'deposit' && status === 'pending') return;

            switch (type) {
                case 'deposit':
                case 'prize_winnings':
                case 'spin_win':
                case 'refund':
                case 'CREDIT':
                    ledgerSum += amount;
                    break;
                case 'withdrawal':
                case 'entry_fee':
                case 'shop_purchase':
                case 'DEBIT':
                    ledgerSum -= amount;
                    break;
                case 'ADMIN_ADJUSTMENT':
                    if (trx.details?.adjustmentType === 'CREDIT') {
                        ledgerSum += amount;
                    } else if (trx.details?.adjustmentType === 'DEBIT') {
                        ledgerSum -= amount;
                    } else {
                        // Fallback: If no type, check amount sign or default to debit for security
                        ledgerSum -= amount; 
                    }
                    break;
            }
        });

        // 2. Update User Balance to match Ledger Sum
        const user = await User.findById(userId);
        if (!user) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        const oldBalance = user.walletBalance;
        user.walletBalance = ledgerSum;
        await user.save();

        // 3. Create a record of this reconciliation if needed?
        // Actually, if we just fixed the cache, the ledger is already the history.
        // But adding a 0-coin ADMIN_ADJUSTMENT could document the fix.
        await Transaction.create({
            user: userId,
            amount: 0,
            type: 'ADMIN_ADJUSTMENT',
            description: `Balance Reconciliation: Fixed from ${oldBalance} to ${ledgerSum}. Reason: ${reason || 'Manual Audit'}`,
            status: 'completed',
            details: {
                adjustedBy: session.user.email,
                adjustmentType: 'RECONCILE',
                oldBalance,
                newBalance: ledgerSum
            }
        });

        return NextResponse.json({
            success: true,
            oldBalance,
            newBalance: ledgerSum,
            message: `User balance reconciled from ${oldBalance} to ${ledgerSum}`
        });

    } catch (error: any) {
        console.error('Error reconciling wallet:', error);
        return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
    }
}
