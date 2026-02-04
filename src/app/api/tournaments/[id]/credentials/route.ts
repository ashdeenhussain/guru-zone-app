import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import connectToDatabase from '@/lib/db';
import Tournament from '@/models/Tournament';

export async function GET(req: Request, props: { params: Promise<{ id: string }> }) {
    const params = await props.params;
    try {
        const session = await getServerSession(authOptions);

        if (!session || !session.user) {
            return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
        }

        const userId = (session.user as any).id;
        const tournamentId = params.id;

        await connectToDatabase();

        const tournament = await Tournament.findById(tournamentId).select('+roomID +roomPassword +participants');

        if (!tournament) {
            return NextResponse.json({ message: 'Tournament not found' }, { status: 404 });
        }

        // Check availability: autoReleaseTime takes precedence, otherwise startTime
        const releaseTime = tournament.autoReleaseTime || tournament.startTime;

        if (new Date() < new Date(releaseTime)) {
            return NextResponse.json({ message: 'Credentials not yet available' }, { status: 403 });
        }

        // Check if user is participant
        const isParticipant = tournament.participants.some((p: any) => p.userId.toString() === userId);

        if (!isParticipant) {
            return NextResponse.json({ message: 'You are not a participant' }, { status: 403 });
        }

        return NextResponse.json({
            roomID: tournament.roomID,
            roomPassword: tournament.roomPassword
        }, { status: 200 });

    } catch (error) {
        console.error('Error fetching credentials:', error);
        return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
    }
}
