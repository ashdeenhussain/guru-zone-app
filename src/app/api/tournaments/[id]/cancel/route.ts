import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/db';
import Tournament from '@/models/Tournament';
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
        const tournament = await Tournament.findById(id).populate('participants.userId');

        if (!tournament) {
            return NextResponse.json({ success: false, error: 'Tournament not found' }, { status: 404 });
        }

        // Verify Host
        const userId = (session.user as any).id;
        const isHost = tournament.createdBy?.toString() === userId;
        const isAdmin = (session.user as any).role === 'admin';

        if (!isHost && !isAdmin) {
            return NextResponse.json({ success: false, error: 'Only Host can cancel match' }, { status: 403 });
        }

        // Check Status
        if (['Completed', 'Cancelled', 'Live'].includes(tournament.status)) {
            return NextResponse.json({ success: false, error: 'Cannot cancel match in this state' }, { status: 400 });
        }

        // --- REFUND LOGIC ---
        const refundPromises = tournament.participants.map(async (p: any) => {
            // Get user ID securely
            const pId = p.userId._id || p.userId;

            // Skip if host is a participant? Host paid too if they joined. Refund everyone.
            // If entry fee > 0
            if (tournament.entryFee > 0) {
                const user = await User.findById(pId);
                if (user) {
                    user.walletBalance += tournament.entryFee;
                    await user.save();

                    await Transaction.create({
                        user: pId,
                        amount: tournament.entryFee,
                        type: 'refund',
                        description: `Refund: Tournament Cancelled by Host (${tournament.title})`,
                        status: 'completed',
                        referenceId: tournament._id
                    });
                }
            }
        });

        await Promise.all(refundPromises);

        tournament.status = 'Cancelled';
        tournament.cancellationReason = 'Cancelled by Host';
        await tournament.save();

        return NextResponse.json({ success: true, message: 'Tournament cancelled and fees refunded.' });

    } catch (error: any) {
        console.error("Error cancelling tournament:", error);
        return NextResponse.json({ success: false, error: "Failed to cancel match" }, { status: 500 });
    }
}
