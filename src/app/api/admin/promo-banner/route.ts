import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import AdminActivity from '@/models/AdminActivity';
import connectDB from '@/lib/db';
import PromoBanner from '@/models/PromoBanner';

export async function GET() {
    try {
        const session = await getServerSession(authOptions);
        if (!session || !session.user || (session.user as any).role !== 'admin') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        await connectDB();
        const promos = await PromoBanner.find().sort({ createdAt: -1 });

        return NextResponse.json(promos);
    } catch (error) {
        console.error("Error fetching promo banners:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

export async function POST(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || !session.user || (session.user as any).role !== 'admin') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        await connectDB();
        const body = await req.json();
        
        // Strip protected fields
        const { _id, createdAt, updatedAt, __v, ...sanitizedData } = body;

        const promo = await PromoBanner.create({
            ...sanitizedData,
            updatedAt: new Date()
        });

        await AdminActivity.create({
            adminId: (session.user as any).id,
            adminName: session.user.name,
            actionType: 'UPDATE_PROMO_BANNER',
            targetId: promo._id.toString(),
            details: `Created new Promo Banner: ${promo.imageUrl}`
        });

        return NextResponse.json(promo);
    } catch (error: any) {
        console.error("Error creating promo banner:", error);
        return NextResponse.json({ 
            error: "Failed to create banner", 
            details: error.message 
        }, { status: 500 });
    }
}

export async function PUT(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || !session.user || (session.user as any).role !== 'admin') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        await connectDB();
        const body = await req.json();
        const { _id, createdAt, updatedAt, __v, ...sanitizedData } = body;

        if (!_id) {
            return NextResponse.json({ error: 'Banner ID is required for update' }, { status: 400 });
        }

        const promo = await PromoBanner.findByIdAndUpdate(
            _id,
            { $set: { ...sanitizedData, updatedAt: new Date() } },
            { new: true, runValidators: true }
        );

        if (!promo) {
            return NextResponse.json({ error: 'Banner not found' }, { status: 404 });
        }

        try {
            await AdminActivity.create({
                adminId: (session.user as any).id,
                adminName: session.user.name,
                actionType: 'UPDATE_PROMO_BANNER',
                targetId: _id,
                details: `Updated Promo Banner. Status: ${promo.isActive ? 'Active' : 'Inactive'}`
            });
        } catch (activityError) {
            console.error("Non-blocking Activity Log Error:", activityError);
            // Don't fail the request if just logging fails
        }

        return NextResponse.json(promo);
    } catch (error: any) {
        console.error("Error updating promo banner:", error);
        return NextResponse.json({ 
            error: "Failed to update banner", 
            details: error.message 
        }, { status: 500 });
    }
}

export async function DELETE(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || !session.user || (session.user as any).role !== 'admin') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { searchParams } = new URL(req.url);
        const id = searchParams.get('id');

        if (!id) {
            return NextResponse.json({ error: 'Banner ID is required' }, { status: 400 });
        }

        await connectDB();
        await PromoBanner.findByIdAndDelete(id);

        await AdminActivity.create({
            adminId: (session.user as any).id,
            adminName: session.user.name,
            actionType: 'UPDATE_PROMO_BANNER',
            targetId: id,
            details: `Deleted Promo Banner`
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Error deleting promo banner:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
