import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/db';
import BattleMatch from '@/models/BattleMatch';
import Transaction from '@/models/Transaction';
import User from '@/models/User';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function POST(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || !session.user) {
            return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
        }

        await connectToDatabase();
        const { id } = await params;
        const match = await BattleMatch.findById(id).populate('participants.userId');

        if (!match) {
            return NextResponse.json({ success: false, error: 'Match not found' }, { status: 404 });
        }

        const userId = (session.user as any).id;
        const isHost = match.createdBy?.toString() === userId;
        const isAdmin = (session.user as any).role === 'admin';

        if (!isHost && !isAdmin) {
            return NextResponse.json({ success: false, error: 'Access denied' }, { status: 403 });
        }

        if (['completed', 'cancelled', 'active'].includes(match.status)) {
            return NextResponse.json({ success: false, error: 'Cannot cancel match in current state' }, { status: 400 });
        }

        // Refund Logic
        const refundPromises = match.participants.map(async (p: any) => {
            const pId = p.userId._id || p.userId;
            if (match.entryFee > 0) {
                const user = await User.findById(pId);
                if (user) {
                    user.walletBalance += match.entryFee;
                    await user.save();

                    await Transaction.create({
                        user: pId,
                        amount: match.entryFee,
                        type: 'refund',
                        description: `Refund: Battle Zone Cancelled (${match.title})`,
                        status: 'completed',
                        referenceId: match._id
                    });
                }
            }
        });

        await Promise.all(refundPromises);

        match.status = 'cancelled';
        await match.save();

        return NextResponse.json({ success: true, message: 'Match cancelled and fees refunded.' });

    } catch (error: any) {
        console.error("Error cancelling battle match:", error);
        return NextResponse.json({ success: false, error: "Failed to cancel match" }, { status: 500 });
    }
}
