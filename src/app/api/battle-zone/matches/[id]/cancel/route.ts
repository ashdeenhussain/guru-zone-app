import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/db';
import BattleMatch from '@/models/BattleMatch';
import Transaction from '@/models/Transaction';
import User from '@/models/User';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import mongoose from 'mongoose';

export async function POST(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    let dbSession: mongoose.ClientSession | null = null;
    try {
        const session = await getServerSession(authOptions);
        if (!session || !session.user) {
            return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
        }

        await connectToDatabase();
        const { id } = await params;

        dbSession = await mongoose.startSession();
        dbSession.startTransaction();

        const match = await BattleMatch.findById(id).session(dbSession).populate('participants.userId');

        if (!match) {
            await dbSession.abortTransaction();
            dbSession.endSession();
            return NextResponse.json({ success: false, error: 'Match not found' }, { status: 404 });
        }

        const userId = (session.user as any).id;
        const isHost = match.createdBy?.toString() === userId;
        const isAdmin = (session.user as any).role === 'admin';

        if (!isHost && !isAdmin) {
            await dbSession.abortTransaction();
            dbSession.endSession();
            return NextResponse.json({ success: false, error: 'Access denied' }, { status: 403 });
        }

        if (['completed', 'cancelled', 'active'].includes(match.status)) {
            await dbSession.abortTransaction();
            dbSession.endSession();
            return NextResponse.json({ success: false, error: 'Cannot cancel match in current state' }, { status: 400 });
        }

        // Refund Logic
        if (match.entryFee > 0) {
            for (const p of match.participants) {
                const pId = p.userId && typeof p.userId === 'object' && '_id' in p.userId
                    ? (p.userId as any)._id
                    : p.userId;
                const user = await User.findById(pId).session(dbSession);
                if (user) {
                    user.walletBalance += match.entryFee;
                    await user.save({ session: dbSession });

                    await Transaction.create([{
                        user: pId,
                        amount: match.entryFee,
                        type: 'refund',
                        description: `Refund: Battle Zone Cancelled (${match.title})`,
                        status: 'completed',
                        referenceId: match._id
                    }], { session: dbSession });
                }
            }
        }

        match.status = 'cancelled';
        await match.save({ session: dbSession });

        await dbSession.commitTransaction();
        dbSession.endSession();

        return NextResponse.json({ success: true, message: 'Match cancelled and fees refunded.' });

    } catch (error: any) {
        if (dbSession) {
            await dbSession.abortTransaction();
            dbSession.endSession();
        }
        console.error("Error cancelling battle match:", error);
        return NextResponse.json({ success: false, error: "Failed to cancel match" }, { status: 500 });
    }
}
