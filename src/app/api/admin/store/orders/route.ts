import { NextResponse } from 'next/server';
export const dynamic = 'force-dynamic';

import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import Order from '@/models/Order';
import connectToDB from '@/lib/db';
import User from '@/models/User';
import StoreProduct from '@/models/StoreProduct'; // Ensure model is registered

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
            .populate('productId', 'title priceCoins category imageType imageUrl emoji') 
            .sort({ createdAt: -1 });

        return NextResponse.json({ success: true, orders, filter });

    } catch (error: any) {
        console.error('Error fetching orders:', error);
        return NextResponse.json({ success: false, message: error.message }, { status: 500 });
    }
}
