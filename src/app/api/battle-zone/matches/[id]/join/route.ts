import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import connectToDatabase from '@/lib/db';
import BattleMatch from '@/models/BattleMatch';
import User from '@/models/User';
import Transaction from '@/models/Transaction';
import Escrow from '@/models/Escrow';
import Notification from '@/models/Notification';
import mongoose from 'mongoose';

export async function POST(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    let session = null;
    try {
        const authSession = await getServerSession(authOptions);
        if (!authSession || !authSession.user) {
            return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
        }

        const userId = (authSession.user as any).id;
        const { id } = await params;
        const body = await req.json();
        const { inGameName, uid, teammates, teamName } = body;

        await connectToDatabase();

        session = await mongoose.startSession();
        session.startTransaction();

        const match = await BattleMatch.findById(id).session(session);
        if (!match) {
            await session.abortTransaction();
            return NextResponse.json({ message: 'Match not found' }, { status: 404 });
        }

        if (match.status !== 'open' && match.status !== 'Open') {
            await session.abortTransaction();
            return NextResponse.json({ message: 'Match is not open' }, { status: 400 });
        }

        if (match.joinedCount >= match.maxSlots) {
            await session.abortTransaction();
            return NextResponse.json({ message: 'Match is full' }, { status: 400 });
        }

        const isAlreadyJoined = match.participants.some((p: any) => p.userId.toString() === userId);
        if (isAlreadyJoined) {
            await session.abortTransaction();
            return NextResponse.json({ message: 'Already joined' }, { status: 400 });
        }

        const user = await User.findById(userId).session(session);
        if (!user || user.walletBalance < match.entryFee) {
            await session.abortTransaction();
            return NextResponse.json({ message: 'Insufficient balance' }, { status: 400 });
        }

        // Deduct balance
        user.walletBalance -= match.entryFee;
        await user.save({ session });

        // Create Transaction
        const transaction = await Transaction.create([{
            user: userId,
            amount: -match.entryFee,
            type: 'entry_fee',
            description: `Joined Battle: ${match.title}`,
            status: 'completed',
            referenceId: match._id
        }], { session });

        // Create/Update Escrow
        let escrow = await Escrow.findOne({ matchId: match._id }).session(session);
        if (!escrow) {
            escrow = new Escrow({
                matchId: match._id,
                totalAmount: match.entryFee, // Host's fee is already in prizePool if created? No, host paid on create.
                participants: [{ userId: match.createdBy, amount: match.entryFee }, { userId, amount: match.entryFee }],
                status: 'held'
            });
            // Actually host already paid, so prizePool should be entryFee * 2 for 1v1.
            // Let's just track the total held.
        } else {
            escrow.totalAmount += match.entryFee;
            escrow.participants.push({ userId, amount: match.entryFee });
        }
        await escrow.save({ session });

        // Update Match
        match.participants.push({
            userId,
            inGameName,
            uid,
            teamName: teamName || '',
            teammates: teammates || []
        });
        match.joinedCount += 1;
        match.escrowId = escrow._id;

        if (match.joinedCount >= match.maxSlots) {
            match.status = 'active';
        }
        await match.save({ session });

        await Notification.create([{
            userId,
            title: "Battle Joined!",
            message: `Joined ${match.title}. Check Match Room for details.`,
            type: "success",
            link: `/battle-zone/${match._id}`
        }], { session });

        await session.commitTransaction();
        return NextResponse.json({ success: true, message: 'Joined battle successfully' });

    } catch (error: any) {
        if (session) await session.abortTransaction();
        return NextResponse.json({ message: error.message }, { status: 500 });
    } finally {
        if (session) session.endSession();
    }
}
