import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions, hasPermission } from '@/lib/auth';
import connectToDatabase from '@/lib/db';
import User from '@/models/User';
import Transaction from '@/models/Transaction';

// Helper to reconcile a single user
async function reconcileUser(userId: string) {
    const user = await User.findById(userId);
    if (!user) return { success: false, error: 'User not found' };

    // 1. Fetch all Transaction entries for this user
    const transactions = await Transaction.find({ user: user._id });

    let calculatedBalance = 0;
    transactions.forEach((trx: any) => {
        const status = trx.status?.toLowerCase() || 'pending';
        const type = trx.type;
        const origAmt = trx.amount || 0;
        const amount = Math.abs(origAmt);

        // Status rules:
        // - Skip if status is rejected/failed/cancelled, UNLESS it's a shop_purchase
        if (['rejected', 'failed', 'cancelled'].includes(status)) {
            if (type !== 'shop_purchase') {
                return;
            }
        }

        // - Skip pending deposits since they haven't credited yet
        if (type === 'deposit' && status === 'pending') {
            return;
        }

        let diff = 0;
        switch (type) {
            case 'deposit':
            case 'prize_winnings':
            case 'spin_win':
            case 'daily_reward_spin':
            case 'free_spin':
            case 'refund':
            case 'daily_free_coins':
            case 'daily_collect':
            case 'rank_reward':
            case 'CREDIT':
                diff = amount;
                break;
            case 'withdrawal':
            case 'entry_fee':
            case 'shop_purchase':
            case 'DEBIT':
                diff = -amount;
                break;
            case 'ADMIN_ADJUSTMENT':
                if (trx.details?.adjustmentType === 'CREDIT') {
                    diff = amount;
                } else if (trx.details?.adjustmentType === 'DEBIT') {
                    diff = -amount;
                } else {
                    diff = origAmt; 
                }
                break;
        }
        calculatedBalance += diff;
    });

    // 2. Suspicious activity check: > 5 ADMIN_ADJUSTMENT or daily_free_coins in last 24h
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const recentTxs = await Transaction.find({
        user: user._id,
        createdAt: { $gte: oneDayAgo },
        type: { $in: ['ADMIN_ADJUSTMENT', 'daily_free_coins'] }
    });

    const suspicious = recentTxs.length > 5;
    const currentBalance = user.walletBalance || 0;
    const mismatch = Math.abs(calculatedBalance - currentBalance) > 0.01;

    let walletStatus = 'Synced';
    let suspiciousFlag = false;
    const reasons: string[] = [];

    if (mismatch) {
        walletStatus = 'Mismatch';
        reasons.push(`Balance mismatch: calculated ${calculatedBalance} but wallet has ${currentBalance}`);
    }
    if (suspicious) {
        suspiciousFlag = true;
        reasons.push(`Suspicious activity: ${recentTxs.length} admin adjustments/daily free coins in 24 hours`);
        walletStatus = 'Mismatch'; // Flag user as Mismatch per requirements if suspicious activity is triggered
    }

    user.walletStatus = walletStatus;
    user.suspiciousFlag = suspiciousFlag;
    user.walletFlagReason = reasons.join('; ');
    user.walletLedgerSum = calculatedBalance;
    await user.save();

    return {
        success: true,
        userId: user._id.toString(),
        name: user.name,
        email: user.email,
        walletBalance: currentBalance,
        calculatedBalance,
        mismatch,
        suspicious,
        walletStatus,
        reasons: reasons.join('; ')
    };
}

export async function GET(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || !session.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const isAuthorized = session.user.role === 'admin' || 
            hasPermission(session, 'manage_finance') || 
            hasPermission(session, 'view_finance_visibility');
            
        if (!isAuthorized) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        await connectToDatabase();

        const { searchParams } = new URL(req.url);
        const userId = searchParams.get('userId');

        if (userId) {
            const result = await reconcileUser(userId);
            return NextResponse.json(result);
        }

        // Reconcile all non-banned users
        const users = await User.find({ status: { $ne: 'banned' } });
        const results = [];
        let mismatchCount = 0;

        for (const user of users) {
            const res = await reconcileUser(user._id.toString());
            results.push(res);
            if (res.walletStatus === 'Mismatch') {
                mismatchCount++;
            }
        }

        return NextResponse.json({
            success: true,
            totalUsersChecked: users.length,
            mismatchCount,
            results
        });

    } catch (error: any) {
        console.error('Reconciliation API error [GET]:', error);
        return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || !session.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const isAuthorized = session.user.role === 'admin' || 
            hasPermission(session, 'manage_finance') || 
            hasPermission(session, 'view_finance_visibility');
            
        if (!isAuthorized) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        await connectToDatabase();

        let userId: string | null = null;
        try {
            const body = await req.json();
            userId = body.userId;
        } catch (e) {
            // No body or invalid JSON
        }

        if (userId) {
            const result = await reconcileUser(userId);
            return NextResponse.json(result);
        }

        // Reconcile all non-banned users if no specific userId is provided
        const users = await User.find({ status: { $ne: 'banned' } });
        const results = [];
        let mismatchCount = 0;

        for (const user of users) {
            const res = await reconcileUser(user._id.toString());
            results.push(res);
            if (res.walletStatus === 'Mismatch') {
                mismatchCount++;
            }
        }

        return NextResponse.json({
            success: true,
            totalUsersChecked: users.length,
            mismatchCount,
            results
        });

    } catch (error: any) {
        console.error('Reconciliation API error [POST]:', error);
        return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
    }
}
