
import { NextResponse } from 'next/server';
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

        // Fetch orders, populate product details and user name/email if needed
        // Filter by source: 'shop' to exclude spin wins by default
        // Sort by Pending first, then date
        const orders = await Order.find(filter)
            .populate('productId', 'title priceCoins category') // Populate product details
            .populate('userId', 'name email') // Populate user details if needed
            .sort({ status: 1, createdAt: -1 }); // 'Pending' starts with P. 'Approved' A, 'Rejected' R. Sory by status might be tricky alphabetically. A(pproved), P(ending), R(ejected). 

        // Custom sort might be needed client side, or we just fetch all and sort. 
        // Or we can rely on creation date for now, or just prioritize pending in frontend.
        // Actually, let's just return them sorted by createdAt desc, frontend can filter.

        return NextResponse.json({ success: true, orders });

    } catch (error: any) {
        console.error('Error fetching orders:', error);
        return NextResponse.json({ success: false, message: error.message }, { status: 500 });
    }
}
