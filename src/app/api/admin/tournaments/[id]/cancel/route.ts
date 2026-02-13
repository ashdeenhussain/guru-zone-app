import { NextResponse } from 'next/server';
import connectToDB from '@/lib/db';
import Tournament from '@/models/Tournament';
import User from '@/models/User';
import Transaction from '@/models/Transaction';
import Notification from '@/models/Notification';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import AdminActivity from '@/models/AdminActivity';
import mongoose from 'mongoose';

export async function POST(req: Request, context: { params: Promise<{ id: string }> }) {
    let session = null;
    try {
        const authSession = await getServerSession(authOptions);
        if (!authSession || !authSession.user || (authSession.user as any).role !== 'admin') {
            return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
        }

        await connectToDB();
        const params = await context.params;
        const { id } = params;

        // Start Mongoose Transaction
        session = await mongoose.startSession();
        session.startTransaction();

        const tournament = await Tournament.findById(id).session(session);
        if (!tournament) {
            await session.abortTransaction();
            return NextResponse.json({ success: false, error: 'Tournament not found' }, { status: 404 });
        }

        if (!['Open', 'Live'].includes(tournament.status)) {
            await session.abortTransaction();
            return NextResponse.json({ success: false, error: 'Cannot cancel a Completed or already Cancelled tournament' }, { status: 400 });
        }

        // Refund Logic
        if (tournament.entryFee > 0 && tournament.participants && tournament.participants.length > 0) {
            // ... (keep existing refund logic) ...
            // Using for...of loop to handle async operations sequentially within transaction
            for (const participant of tournament.participants) {
                const user = await User.findById(participant.userId).session(session);
                if (user) {
                    // Create Transaction Record first
                    const [transaction] = await Transaction.create([{
                        user: user._id,
                        amount: tournament.entryFee,
                        type: 'refund',
                        description: `Refund for tournament cancellation: ${tournament.title}`,
                        referenceId: tournament._id,
                        status: 'completed'
                    }], { session });

                    // Update User Balance & Link Transaction
                    user.walletBalance += tournament.entryFee;
                    user.transactions.push(transaction._id);
                    await user.save({ session });

                    // Send Notification
                    await Notification.create([{
                        userId: user._id,
                        type: 'Tournament',
                        title: 'Tournament Cancelled',
                        message: `Tournament "${tournament.title}" has been cancelled. ${tournament.entryFee} coins have been refunded to your wallet.`,
                        data: { tournamentId: tournament._id }
                    }], { session });
                }
            }
        }

        // Parse reason from body (safely)
        const body = await req.json().catch(() => ({}));
        const reason = body.reason || 'Administrative Decision';

        // Update Status
        tournament.status = 'Cancelled';
        tournament.cancellationReason = reason;
        await tournament.save({ session });

        // Log Activity
        await AdminActivity.create([{
            adminId: (authSession.user as any).id,
            adminName: authSession.user.name,
            actionType: 'CANCEL_TOURNAMENT',
            targetId: tournament._id,
            details: `Cancelled tournament ${tournament.title}. Reason: ${reason}`
        }], { session });

        await session.commitTransaction();



        return NextResponse.json({ success: true, message: 'Tournament cancelled and refunds processed' });

    } catch (error: any) {
        console.error('Cancel Error:', error);
        if (session) {
            await session.abortTransaction();
        }
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    } finally {
        if (session) {
            session.endSession();
        }
    }
}
