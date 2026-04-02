import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import connectMongo from '@/lib/db';
import Tournament from '@/models/Tournament';
import User from '@/models/User';
import Transaction from '@/models/Transaction'; // Assuming a Transaction model
import mongoose from 'mongoose';

export async function POST(req: Request, { params }: { params: Promise<{ matchId: string }> }) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.email) {
            return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
        }

        await connectMongo();

        const adminUser = await User.findOne({ email: session.user.email });
        if (!adminUser || adminUser.role !== 'admin') {
            return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
        }

        const { matchId } = await params;

        // Start session for atomic cancellation and refunds
        const sessionDB = await mongoose.startSession();
        sessionDB.startTransaction();

        try {
            const match = await Tournament.findById(matchId).session(sessionDB);
            if (!match) {
                return NextResponse.json({ success: false, error: 'Match not found' }, { status: 404 });
            }

            if (['completed', 'cancelled', 'Completed', 'Cancelled'].includes(match.status)) {
                return NextResponse.json({ success: false, error: `Match is already ${match.status}. Cannot cancel.` }, { status: 400 });
            }

            // Update status
            match.status = 'cancelled';
            match.cancellationReason = 'Admin Force Cancelled';
            await match.save({ session: sessionDB });

            // Process Refunds
            const refundAmount = match.entryFee;
            if (refundAmount > 0) {
                // Get all participant user IDs
                const participantIds = match.participants.map((p: any) => p.userId);

                for (const userId of participantIds) {
                    const userToRefund = await User.findById(userId).session(sessionDB);
                    if (userToRefund) {
                        userToRefund.walletBalance += refundAmount;
                        await userToRefund.save({ session: sessionDB });

                        if (mongoose.models.Transaction) {
                            await mongoose.models.Transaction.create([{
                                userId: userToRefund._id,
                                amount: refundAmount,
                                type: 'Refund',
                                description: `Refund for cancelled match: ${match.title}`,
                                status: 'completed',
                                balanceAfter: userToRefund.walletBalance,
                                // Provide an admin ref if model supports
                                adminId: adminUser._id
                            }], { session: sessionDB });
                        }
                    }
                }
            }

            await sessionDB.commitTransaction();

            return NextResponse.json({ success: true, message: 'Match cancelled and refunds issued.' });

        } catch (error) {
            await sessionDB.abortTransaction();
            throw error;
        } finally {
            sessionDB.endSession();
        }

    } catch (error: any) {
        console.error('Error cancelling battle zone match:', error);
        return NextResponse.json({ success: false, error: error.message || 'Server Error' }, { status: 500 });
    }
}
