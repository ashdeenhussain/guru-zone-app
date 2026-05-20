import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import StoreProduct from '@/models/StoreProduct';
import SystemSetting from '@/models/SystemSetting';

/**
 * Public GET /api/topup/catalog
 * Returns active store products (TopUp + SpecialDeal) and shop banners.
 * No authentication required — used by the public /topup page.
 */
export async function GET() {
    try {
        await connectDB();

        const [products, settings] = await Promise.all([
            StoreProduct.find({ isActive: true })
                .select('title category costPrice emoji imageType imageUrl infoDescription bonusDescription')
                .sort({ category: 1, costPrice: 1 })
                .lean(),
            SystemSetting.findOne()
                .select('bannerImages supportLink')
                .lean(),
        ]);

        // Filter banners that apply to shop or both
        const banners = ((settings as any)?.bannerImages ?? [])
            .filter((b: any) => b.activeStatus && (b.location === 'shop' || b.location === 'both'))
            .map((b: any) => ({ url: b.storageUrl || b.url }));

        return NextResponse.json({
            products,
            banners,
            supportLink: (settings as any)?.supportLink ?? '',
        });
    } catch (error) {
        console.error('[topup/catalog] Error:', error);
        return NextResponse.json({ error: 'Failed to load catalog' }, { status: 500 });
    }
}
