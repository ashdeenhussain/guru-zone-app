import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import PromoBanner from '@/models/PromoBanner';

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        await connectDB();
        const promos = await PromoBanner.find({ isActive: true }).sort({ updatedAt: -1 });
        
        return NextResponse.json(promos);
    } catch (error) {
        console.error("Error fetching promo banners:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
