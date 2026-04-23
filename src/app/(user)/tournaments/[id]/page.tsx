import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import connectToDatabase from '@/lib/db';
import Tournament from '@/models/Tournament';
import User from '@/models/User';
import TournamentDetailsClient from '@/components/TournamentDetailsClient';
import { notFound } from 'next/navigation';

async function getTournament(id: string) {
    await connectToDatabase();
    const tournament = await Tournament.findById(id)
        .select('+roomID') // Include to check existence
        .populate('participants.userId', 'username name email inGameName uid avatarId image')
        .populate('winners.rank1 winners.rank2 winners.rank3 winners.rank4 winners.rank5 winners.rank6 winners.rank7 winners.rank8 winners.rank9 winners.rank10', 'username name inGameName freeFireUid avatarId image')
        .lean();
    if (!tournament) return null;
    
    // Check if room is ready but don't send the sensitive ID yet
    const isRoomReady = !!tournament.roomID;
    delete tournament.roomID;
    
    return JSON.parse(JSON.stringify({ ...tournament, isRoomReady }));
}

async function getUser(email: string) {
    await connectToDatabase();
    const user = await User.findOne({ email }).lean();
    if (!user) return null;
    return JSON.parse(JSON.stringify(user));
}

export default async function TournamentDetailsPage(props: { params: Promise<{ id: string }> }) {
    const params = await props.params;
    const session = await getServerSession(authOptions);
    const tournament = await getTournament(params.id);

    if (!tournament) {
        notFound();
    }

    // Redirect to battle-zone if it's a community tournament
    if (tournament.createdBy) {
        const { redirect } = await import('next/navigation');
        redirect(`/battle-zone/${params.id}`);
    }

    let user = null;
    if (session?.user?.email) {
        user = await getUser(session.user.email);
    }

    return <TournamentDetailsClient tournament={tournament} user={user} />;
}
