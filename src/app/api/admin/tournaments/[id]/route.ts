import { NextResponse } from 'next/server';
import connectToDB from '@/lib/db';
import Tournament from '@/models/Tournament';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import AdminActivity from '@/models/AdminActivity';

export async function PATCH(req: Request, context: { params: Promise<{ id: string }> }) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || !session.user || (session.user as any).role !== 'admin') {
            return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
        }

        await connectToDB();
        const params = await context.params;
        const { id } = params;
        const body = await req.json();


        // Prevent updating sensitive fields via this generic route if needed, 
        // but for now we trust the admin to send correct data.
        // We specifically want to allow updating the 'status'.

        const tournament = await Tournament.findByIdAndUpdate(id, { $set: body }, { new: true });

        if (!tournament) {
            return NextResponse.json({ success: false, error: 'Tournament not found' }, { status: 404 });
        }

        // Log Activity
        await AdminActivity.create({
            adminId: (session.user as any).id,
            adminName: session.user.name,
            actionType: 'UPDATE_TOURNAMENT',
            targetId: tournament._id,
            details: `Updated tournament properties: ${Object.keys(body).join(', ')}`
        });

        return NextResponse.json({ success: true, tournament });

    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
