import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import AdminActivity from '@/models/AdminActivity';
import connectDB from '@/lib/db';
import LandingPageContent from '@/models/LandingPageContent';

export async function GET() {
    try {
        const session = await getServerSession(authOptions);
        if (!session || !session.user || (session.user as any).role !== 'admin') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        await connectDB();

        let content = await LandingPageContent.findOne();

        if (!content) {
            content = await LandingPageContent.create({});
        }

        return NextResponse.json(content);
    } catch (error) {
        console.error("Error fetching admin landing page content:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
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

        const content = await LandingPageContent.findOneAndUpdate(
            {},
            { $set: body },
            { new: true, upsert: true, setDefaultsOnInsert: true }
        );

        // Log Activity
        await AdminActivity.create({
            adminId: (session.user as any).id,
            adminName: session.user.name,
            actionType: 'UPDATE_LANDING_PAGE',
            targetId: content._id,
            details: `Updated Landing Page Content. Sections: ${Object.keys(body).join(', ')}`
        });

        return NextResponse.json(content);
    } catch (error) {
        console.error("Error updating landing page content:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
