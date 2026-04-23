import { NextResponse } from 'next/server';
import connectToDB from '@/lib/db';
import Tournament from '@/models/Tournament';
import { getServerSession } from 'next-auth';
import { authOptions, hasPermission } from '@/lib/auth';
import AdminActivity from '@/models/AdminActivity';

export async function PATCH(req: Request, context: { params: Promise<{ id: string }> }) {
    try {
        const session = await getServerSession(authOptions);
        if (!hasPermission(session, 'manage_tournaments')) {
            return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
        }

        await connectToDB();
        const params = await context.params;
        const { id } = params;
        const body = await req.json();

        const tournament = await Tournament.findById(id);
        if (!tournament) {
            return NextResponse.json({ success: false, error: 'Tournament not found' }, { status: 404 });
        }

        // Ownership Check: Only creator, anyone with manage_tournaments (for official ones), or Super Admin can edit
        const canManage = hasPermission(session, 'manage_system') || 
                         (tournament.createdBy === null && hasPermission(session, 'manage_tournaments')) ||
                         (tournament.createdBy?.toString() === (session as any)?.user?.id);
        
        if (!canManage) {
            return NextResponse.json({ 
                success: false, 
                error: 'Unauthorized: You can only manage tournaments created by you.' 
            }, { status: 403 });
        }

        // Apply updates
        Object.assign(tournament, body);
        await tournament.save();

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
