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
        .populate('participants.userId', 'username name email inGameName uid avatarId image')
        .lean();
    if (!tournament) return null;
    return JSON.parse(JSON.stringify(tournament));
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

    let user = null;
    if (session?.user?.email) {
        user = await getUser(session.user.email);
    }

    return <TournamentDetailsClient tournament={tournament} user={user} />;
}
