
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import Order from '@/models/Order';
import User from '@/models/User';
import Transaction from '@/models/Transaction';
import Notification from '@/models/Notification';
import AdminActivity from '@/models/AdminActivity';
import connectToDB from '@/lib/db';

export async function PATCH(
    request: Request,
    context: { params: Promise<{ id: string }> }
) {
    try {
        await connectToDB();
        const session = await getServerSession(authOptions);

        if (!session || !session.user || (session.user as any).role !== 'admin') {
            return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
        }

        const params = await context.params;
        const { id } = params;
        const { action, reason } = await request.json();

        if (!id || !action) {
            return NextResponse.json({ success: false, message: 'Missing order ID or action' }, { status: 400 });
        }

        const order = await Order.findById(id);
        if (!order) {
            return NextResponse.json({ success: false, message: 'Order not found' }, { status: 404 });
        }

        if (order.status !== 'Pending') {
            return NextResponse.json({ success: false, message: 'Order is already processed' }, { status: 400 });
        }

        if (action === 'approve') {
            order.status = 'Approved';

            const user = await User.findById(order.userId);
            if (user) {
                // Loyalty Logic: 1 Coin = 1 Point. 2500 Points = 1 Spin.
                user.loyaltyProgress = (user.loyaltyProgress || 0) + order.pricePaid;

                const POINTS_PER_SPIN = 2500;
                if (user.loyaltyProgress >= POINTS_PER_SPIN) {
                    const spinsEarned = Math.floor(user.loyaltyProgress / POINTS_PER_SPIN);

                    if (spinsEarned > 0) {
                        user.spinsAvailable = (user.spinsAvailable || 0) + spinsEarned;
                        user.loyaltyProgress = user.loyaltyProgress % POINTS_PER_SPIN; // Keep remainder

                        await Notification.create({
                            userId: order.userId,
                            title: '🎉 Lucky Spin Earned!',
                            message: `You earned ${spinsEarned} Lucky Spin(s) from your purchase!`,
                            type: 'success'
                        });
                    }
                }
                await user.save();
            }

            await Notification.create({
                userId: order.userId,
                title: 'Order Approved',
                message: `Your store order has been approved!`,
                type: 'success'
            });

        } else if (action === 'reject') {
            if (!reason) {
                return NextResponse.json({ success: false, message: 'Reason is required for rejection' }, { status: 400 });
            }

            order.status = 'Rejected';
            order.adminComment = reason;

            // 1. Refund Coins
            const user = await User.findById(order.userId);
            if (user) {
                user.walletBalance += order.pricePaid;
                await user.save();

                // 2. Create Refund Transaction
                await Transaction.create({
                    user: user._id,
                    amount: order.pricePaid,
                    type: 'refund',
                    description: `Refund for order #${order._id.toString().slice(-6)}: ${reason}`,
                    status: 'approved'
                });

                // 3. Notify User
                await Notification.create({
                    userId: user._id,
                    title: 'Order Rejected',
                    message: `Your store order was rejected: ${reason}. ${order.pricePaid} coins have been refunded to your wallet.`,
                    type: 'error'
                });
            }
        } else {
            return NextResponse.json({ success: false, message: 'Invalid action' }, { status: 400 });
        }

        await order.save();

        // Log Activity
        await AdminActivity.create({
            adminId: (session.user as any).id,
            adminName: session.user.name,
            actionType: action === 'approve' ? 'APPROVE_ORDER' : 'REJECT_ORDER',
            targetId: order._id,
            details: `Processed order ${order._id}. Action: ${action === 'approve' ? 'Approved' : 'Rejected'}.${action === 'reject' ? ' Reason: ' + reason : ''}`
        });

        return NextResponse.json({ success: true, order });

    } catch (error: any) {
        console.error('Error processing order:', error);
        return NextResponse.json({ success: false, message: error.message }, { status: 500 });
    }
}
