import { NextResponse } from 'next/server';
export const dynamic = 'force-dynamic';

import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import Order from '@/models/Order';
import connectToDB from '@/lib/db';
import User from '@/models/User';
import StoreProduct from '@/models/StoreProduct'; // Ensure model is registered
import FinancialLog from '@/models/FinancialLog';
import AdminActivity from '@/models/AdminActivity';

export async function GET(request: Request) {
    try {
        await connectToDB();
        const session = await getServerSession(authOptions);

        if (!session || !session.user || (session.user as any).role !== 'admin') {
            return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const sourceQuery = searchParams.get('source');

        const filter: any = {};
        if (sourceQuery === 'all') {
            // No source filter
        } else if (sourceQuery) {
            filter.source = sourceQuery;
        } else {
            filter.source = 'shop';
        }

        const orders = await Order.find(filter)
            .populate('userId', 'name email image')
            .populate('productId', 'title priceCoins category imageType imageUrl emoji costPrice') 
            .sort({ createdAt: -1 });

        return NextResponse.json({ success: true, orders, filter });

    } catch (error: any) {
        console.error('Error fetching orders:', error);
        return NextResponse.json({ success: false, message: error.message }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        await connectToDB();
        const session = await getServerSession(authOptions);

        if (!session || !session.user || (session.user as any).role !== 'admin') {
            return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
        }

        const data = await request.json();
        const { userId, productId, inGameName, uid, pricePaid, purchaseCost } = data;

        if (!productId || !inGameName || !uid || pricePaid === undefined || purchaseCost === undefined) {
            return NextResponse.json({ success: false, message: 'Missing required fields' }, { status: 400 });
        }

        // Default userId to logged in admin's user ID if not provided
        const targetUserId = userId || (session.user as any).id;
        if (!targetUserId) {
            return NextResponse.json({ success: false, message: 'User ID is required' }, { status: 400 });
        }

        // Validate user exists
        const user = await User.findById(targetUserId);
        if (!user) {
            return NextResponse.json({ success: false, message: 'User not found' }, { status: 404 });
        }

        // Validate product exists
        const product = await StoreProduct.findById(productId);
        if (!product) {
            return NextResponse.json({ success: false, message: 'Product not found' }, { status: 404 });
        }

        const finalPricePaid = Number(pricePaid);
        const finalPurchaseCost = Number(purchaseCost);
        const calculatedProfit = finalPricePaid - finalPurchaseCost;

        // Create manual order in database
        const order = await Order.create({
            userId: targetUserId,
            productId,
            pricePaid: finalPricePaid,
            status: 'approved',
            source: 'manual',
            userDetails: {
                inGameName,
                uid,
            },
            purchaseCost: finalPurchaseCost,
            calculatedProfit,
        });

        // Add corresponding FinancialLog entry
        await FinancialLog.create({
            type: 'manual_order',
            amount: finalPricePaid,
            currency: 'Coins',
            userId: targetUserId,
            referenceId: order._id,
            description: `Manual order: Purchased ${product.title} (approved)`,
            purchaseCost: finalPurchaseCost,
            calculatedProfit,
            timestamp: new Date()
        });

        // Log admin activity
        await AdminActivity.create({
            adminId: (session.user as any).id,
            adminName: session.user.name,
            actionType: 'CREATE_MANUAL_ORDER',
            targetId: order._id,
            details: `Created manual order for user ${inGameName} (${uid}) - Product: ${product.title}, Sale Price: ${finalPricePaid}, Cost: ${finalPurchaseCost}, Profit: ${calculatedProfit}`
        });

        // Fetch fully populated order to return to the client
        const populatedOrder = await Order.findById(order._id)
            .populate('userId', 'name email image')
            .populate('productId', 'title priceCoins category imageType imageUrl emoji costPrice');

        return NextResponse.json({ success: true, order: populatedOrder });

    } catch (error: any) {
        console.error('Error creating manual order:', error);
        return NextResponse.json({ success: false, message: error.message }, { status: 500 });
    }
}
