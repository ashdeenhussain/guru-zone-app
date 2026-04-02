import { NextResponse } from 'next/server';
import connectToDB from '@/lib/db';
import Tournament from '@/models/Tournament';
import User from '@/models/User';
import Transaction from '@/models/Transaction';
import mongoose from 'mongoose';

export async function POST(req: Request) {
    let session = null;
    try {
        await connectToDB();
        const { searchParams } = new URL(req.url);
        const id = searchParams.get('id');

        if (!id) {
            return NextResponse.json({ success: false, error: 'Tournament ID is required' }, { status: 400 });
        }

        session = await mongoose.startSession();
        session.startTransaction();

        const tournament = await Tournament.findById(id).session(session);
        if (!tournament) {
            await session.abortTransaction();
            return NextResponse.json({ success: false, error: 'Tournament not found' }, { status: 404 });
        }

        const RefundedUsers = [];

        // Refund Logic
        if (tournament.entryFee > 0 && tournament.participants && tournament.participants.length > 0) {
            for (const participant of tournament.participants) {
                if (!participant.userId) continue;

                const user = await User.findById(participant.userId).session(session);
                if (user) {
                    // Check if already refunded? Maybe check existing transactions?
                    // For now, assuming manual trigger implies we want to refund.
                    // But good to be safe.
                    const existingRefund = await Transaction.findOne({
                        user: user._id,
                        type: 'refund',
                        referenceId: tournament._id
                    }).session(session);

                    if (existingRefund) {
                        console.log(`User ${user.name} already refunded.`);
                        RefundedUsers.push({ name: user.name, status: 'Already Refunded' });
                        continue;
                    }

                    // Create Transaction Record
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

                    RefundedUsers.push({ name: user.name, amount: tournament.entryFee, status: 'Refunded' });
                }
            }
        }

        // We don't change status if it is already Completed, or maybe we should mark it nicely?
        // User just wants refund.
        // If we want to mark it as cancelled, we can.
        // tournament.status = 'Cancelled';
        // await tournament.save({ session });

        await session.commitTransaction();

        return NextResponse.json({ success: true, refundedVal: RefundedUsers });

    } catch (error: any) {
        console.error('Refund Error:', error);
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
