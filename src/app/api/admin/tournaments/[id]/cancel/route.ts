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


            // Using for...of loop to handle async operations sequentially within transaction
            for (const participant of tournament.participants) {
                if (!participant.userId) continue;

                const refundAmount = tournament.entryFee;
                const transactionId = new mongoose.Types.ObjectId();

                // 1. Create Refund Transaction Object
                const transaction = new Transaction({
                    _id: transactionId,
                    user: participant.userId,
                    amount: refundAmount,
                    type: 'refund',
                    description: `Refund: Tournament "${tournament.title}" Cancelled`,
                    status: 'approved'
                });

                // 2. Atomic Update User Wallet & Add Transaction
                const user = await User.findByIdAndUpdate(
                    participant.userId,
                    {
                        $inc: { walletBalance: refundAmount },
                        $push: { transactions: transactionId }
                    },
                    { new: true, session }
                );

                if (user) {
                    // 3. Save Transaction
                    await transaction.save({ session });

                    // 4. Create Notification
                    await Notification.create([{
                        userId: participant.userId,
                        title: 'Tournament Cancelled',
                        message: `The tournament "${tournament.title}" has been cancelled. ${refundAmount} coins have been refunded to your wallet.`,
                        type: 'info'
                    }], { session });


                }
            }
        }

        // Update Status
        tournament.status = 'Cancelled';
        await tournament.save({ session });

        // Log Activity (Non-critical, can be outside transaction or inside)
        // We'll put it inside to relate it to the event success
        await AdminActivity.create([{
            adminId: (authSession.user as any).id,
            adminName: authSession.user.name,
            actionType: 'UPDATE_TOURNAMENT',
            targetId: tournament._id,
            details: `Cancelled tournament ${tournament.title}. Refunds processed for ${tournament.participants?.length || 0} participants.`
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
