import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import AdminActivity from '@/models/AdminActivity';
import connectDB from '@/lib/db';
import SystemSetting from '@/models/SystemSetting';

export async function GET() {
    try {
        await connectDB();

        let settings = await SystemSetting.findOne();

        if (!settings) {
            settings = await SystemSetting.create({});
        }

        return NextResponse.json(settings);
    } catch (error) {
        console.error("Error fetching settings:", error);
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

        // Use findOneAndUpdate to maintain singleton nature
        const settings = await SystemSetting.findOneAndUpdate(
            {},
            { $set: body },
            { new: true, upsert: true, setDefaultsOnInsert: true }
        );

        // Log Activity
        await AdminActivity.create({
            adminId: (session.user as any).id,
            adminName: session.user.name,
            actionType: 'UPDATE_SETTINGS',
            targetId: settings._id,
            details: `Updated System Settings. Modified fields: ${Object.keys(body).join(', ')}`
        });

        return NextResponse.json(settings);
    } catch (error) {
        console.error("Error updating settings:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
