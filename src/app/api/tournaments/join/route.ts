import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import connectToDatabase from '@/lib/db';
import Tournament from '@/models/Tournament';
import User from '@/models/User';
import Transaction from '@/models/Transaction';
import { processRankRewards } from '@/lib/reward-processor';
import Notification from '@/models/Notification';
import mongoose from 'mongoose';

export async function POST(req: Request) {
    let session = null;
    try {
        const authSession = await getServerSession(authOptions);

        if (!authSession || !authSession.user) {
            return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
        }

        const userId = (authSession.user as any).id;
        const body = await req.json();
        const { tournamentId, inGameName, uid, teammates, teamName } = body;

        if (!tournamentId || !inGameName || !uid) {
            return NextResponse.json({ message: 'Missing required fields' }, { status: 400 });
        }

        await connectToDatabase();

        // Start Mongoose Transaction
        session = await mongoose.startSession();
        session.startTransaction();

        // 1. Fetch Tournament with Session
        const tournament = await Tournament.findById(tournamentId).session(session);

        if (!tournament) {
            await session.abortTransaction();
            return NextResponse.json({ message: 'Tournament not found' }, { status: 404 });
        }

        // Validate Team Name for Duo/Squad
        if (tournament.format !== 'Solo' && !teamName) {
            await session.abortTransaction();
            return NextResponse.json({ message: 'Team Name is required for Duo/Squad' }, { status: 400 });
        }

        if (tournament.status !== 'Open') {
            await session.abortTransaction();
            return NextResponse.json({ message: `Tournament is ${tournament.status}` }, { status: 400 });
        }

        if (tournament.joinedCount >= tournament.maxSlots) {
            await session.abortTransaction();
            return NextResponse.json({ message: 'Tournament is full' }, { status: 400 });
        }

        // Check if user already joined (check participants array)
        const isAlreadyJoined = tournament.participants.some((p: any) => p.userId.toString() === userId);
        if (isAlreadyJoined) {
            await session.abortTransaction();
            return NextResponse.json({ message: 'You have already joined this tournament' }, { status: 400 });
        }

        // Optional: Check if UID is already used in this tournament to prevent multi-account spamming with same game ID
        const isUidUsed = tournament.participants.some((p: any) => p.uid === uid || (p.teammates && p.teammates.some((tm: any) => tm.uid === uid)));
        if (isUidUsed) {
            await session.abortTransaction();
            return NextResponse.json({ message: 'This Game UID is already registered in this tournament' }, { status: 400 });
        }


        // 2. Fetch User with Session
        const user = await User.findById(userId).session(session);

        if (!user) {
            await session.abortTransaction();
            return NextResponse.json({ message: 'User not found' }, { status: 404 });
        }

        if (user.walletBalance < tournament.entryFee) {
            await session.abortTransaction();
            return NextResponse.json({ message: 'Insufficient balance' }, { status: 400 });
        }

        // 3. Deduct balance
        user.walletBalance -= tournament.entryFee;

        // 4. Award Rank Points (Optimistic update, logic preserved)
        // Note: processRankRewards is likely external and might not support sessions directly unless updated.
        // We will keep the rank point update on the user document here as it is transactional.
        const newPoints = (user.rankPoints || 0) + 10;
        user.rankPoints = newPoints;

        // 5. Add to participants
        const participantData = {
            userId: user._id,
            inGameName,
            uid,
            teamName: teamName || '',
            teammates: teammates || []
        };

        tournament.participants.push(participantData);
        tournament.joinedCount += 1;

        // 6. Create Transaction Record
        const transaction = new Transaction({
            user: user._id,
            amount: -tournament.entryFee,
            type: 'entry_fee',
            description: `Joined Tournament: ${tournament.title}`,
            status: 'approved'
        });

        // 7. Link Transaction to User
        if (!user.transactions) {
            user.transactions = [];
        }
        user.transactions.push(transaction._id);

        // 8. Update User Tournaments Played
        if (!user.tournamentsPlayed) {
            user.tournamentsPlayed = [];
        }
        // Use standard array push, avoiding duplications handled by logic checks, but addToSet is safer if types allow
        if (!user.tournamentsPlayed.some((tId: any) => tId.toString() === tournament._id.toString())) {
            user.tournamentsPlayed.push(tournament._id);
        }

        // 9. Save All Changes
        await user.save({ session });
        await tournament.save({ session });
        await transaction.save({ session });

        // Commit Transaction
        await session.commitTransaction();

        // Post-transaction async operations (Non-critical for data integrity)
        // We fire and forget this or await it safely. If it fails, the user still joined successfully.
        try {
            await processRankRewards(user._id, newPoints);
        } catch (e) {
            console.error("Reward processing failed", e);
        }

        // 10. Create Notification
        const notification = new Notification({
            userId: user._id,
            title: "Tournament Joined!",
            message: `You successfully joined ${tournament.title}. Good luck!`,
            type: "success",
            link: `/dashboard/tournaments/${tournament._id}`
        });
        await notification.save({ session });

        return NextResponse.json({ message: 'Joined tournament successfully', tournament }, { status: 200 });

    } catch (error: any) {
        console.error('Error joining tournament:', error);
        if (session) {
            await session.abortTransaction();
        }
        return NextResponse.json({ message: error.message || 'Internal Server Error' }, { status: 500 });
    } finally {
        if (session) {
            session.endSession();
        }
    }
}
