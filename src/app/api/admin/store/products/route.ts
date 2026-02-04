
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import StoreProduct from '@/models/StoreProduct';
import AdminActivity from '@/models/AdminActivity';
import connectToDB from '@/lib/db';
import User from '@/models/User';

export async function POST(request: Request) {
    try {
        await connectToDB();
        const session = await getServerSession(authOptions);

        if (!session || !session.user || (session.user as any).role !== 'admin') {
            return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
        }

        const data = await request.json();
        const { id, title, category, priceCoins, costPrice, imageType, imageUrl, emoji, infoDescription, isActive } = data;

        // Validation
        if (!title || !category || priceCoins === undefined || costPrice === undefined) {
            return NextResponse.json({ success: false, message: 'Missing required fields' }, { status: 400 });
        }

        let product;
        if (id) {
            // Update existing
            product = await StoreProduct.findByIdAndUpdate(
                id,
                {
                    title,
                    category,
                    priceCoins,
                    costPrice,
                    imageType,
                    imageUrl,
                    emoji,
                    infoDescription,
                    isActive // Added
                },
                { new: true, runValidators: true }
            );
            if (!product) {
                return NextResponse.json({ success: false, message: 'Product not found' }, { status: 404 });
            }
        } else {
            // Create new
            product = await StoreProduct.create({
                title,
                category,
                priceCoins,
                costPrice,
                imageType,
                imageUrl,
                emoji,
                infoDescription,
                isActive // Added
            });
        }

        // Log
        await AdminActivity.create({
            adminId: (session.user as any).id,
            adminName: session.user.name,
            actionType: id ? 'UPDATE_PRODUCT' : 'CREATE_PRODUCT',
            targetId: product._id,
            details: `${id ? 'Updated' : 'Created'} product: ${title} (${category}, ${priceCoins} coins)`
        });

        return NextResponse.json({ success: true, product });

    } catch (error: any) {
        console.error('Error saving product:', error);
        return NextResponse.json({ success: false, message: error.message }, { status: 500 });
    }
}

export async function GET(request: Request) {
    try {
        await connectToDB();
        const session = await getServerSession(authOptions);

        if (!session || !session.user || (session.user as any).role !== 'admin') {
            return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
        }

        // Simple fetch for performance (Aggregation was causing timeouts)
        const products = await StoreProduct.find().sort({ isActive: -1, createdAt: -1 });

        return NextResponse.json({ success: true, products });

    } catch (error: any) {
        console.error('Error fetching products:', error);
        return NextResponse.json({ success: false, message: error.message }, { status: 500 });
    }
}

export async function DELETE(request: Request) {
    try {
        await connectToDB();
        const session = await getServerSession(authOptions);
        if (!session || !session.user || (session.user as any).role !== 'admin') {
            return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const id = searchParams.get('id');

        if (!id) {
            return NextResponse.json({ success: false, message: 'Product ID required' }, { status: 400 });
        }

        await StoreProduct.findByIdAndDelete(id);

        // Log
        await AdminActivity.create({
            adminId: (session.user as any).id,
            adminName: session.user.name,
            actionType: 'DELETE_PRODUCT',
            targetId: id,
            details: `Deleted product with ID: ${id}`
        });

        return NextResponse.json({ success: true, message: 'Product deleted' });
    } catch (error: any) {
        return NextResponse.json({ success: false, message: error.message }, { status: 500 });
    }
}
