import { NextResponse } from 'next/server';
import connectToDB from '@/lib/db';
import Tournament from '@/models/Tournament';
import User from '@/models/User';
import Transaction from '@/models/Transaction';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import AdminActivity from '@/models/AdminActivity';
import { processRankRewards } from '@/lib/reward-processor';
import mongoose from 'mongoose';

export async function POST(req: Request, context: { params: Promise<{ id: string }> }) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || !session.user || (session.user as any).role !== 'admin') {
            return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
        }

        await connectToDB();
        const params = await context.params;
        const { id } = params;
        const { winners } = await req.json();

        const adminId = (session.user as any).id;
        const adminName = session.user.name;

        // Start MongoDB Session for Transaction
        const dbSession = await mongoose.startSession();
        let result: any = null;

        try {
            await dbSession.withTransaction(async () => {
                const tournament = await Tournament.findById(id).session(dbSession);
                if (!tournament) {
                    throw new Error('Tournament not found');
                }



                if (tournament.status === 'Completed') {
                    throw new Error('Tournament is ALREADY COMPLETED. Prizes have been distributed.');
                }

                if (tournament.status !== 'Live' && tournament.status !== 'Open') {
                    throw new Error(`Status Error: Tournament is '${tournament.status}'. Must be Open or Live.`);
                }

                const prizes = tournament.prizeDistribution;

                // Function to distribute prize (Wrapped in session)
                const distributePrize = async (userId: string, amount: number, rank: string) => {
                    if (!userId) return;
                    if (amount <= 0) return;

                    // 0. IDEMPOTENCY CHECK
                    // Check if a prize transaction already exists for this user and tournament
                    const existingTx = await Transaction.findOne({
                        user: userId,
                        referenceId: id,
                        type: 'prize_winnings'
                    }).session(dbSession);

                    if (existingTx) {
                        console.warn(`[Finalize] IDEMPOTENCY CHECK: Prize already awarded to ${userId} for tournament ${id}. Skipping.`);
                        return; // Skip payment
                    }

                    // Calculate Rank Points
                    let pointsToAdd = 0;
                    if (rank === '1st') pointsToAdd = 50;
                    else if (rank === '2nd' || rank === '3rd') pointsToAdd = 20;

                    // 1. Update User Wallet & Stats
                    await User.findByIdAndUpdate(userId, {
                        $inc: {
                            walletBalance: amount,
                            totalWins: 1,
                            netEarnings: amount,
                            rankPoints: pointsToAdd
                        }
                    }).session(dbSession);

                    // 2. Create Transaction Record
                    await Transaction.create([{
                        user: userId,
                        amount: amount,
                        type: 'prize_winnings',
                        description: `Prize for ${rank} Place in ${tournament.title}`,
                        referenceId: id,
                        status: 'approved'
                    }], { session: dbSession });
                };

                // Execute distributions
                await Promise.all([
                    distributePrize(winners.rank1, prizes.first, '1st'),
                    distributePrize(winners.rank2, prizes.second, '2nd'),
                    distributePrize(winners.rank3, prizes.third, '3rd'),
                ]);

                // Update Tournament Status
                tournament.status = 'Completed';
                tournament.winners = winners;
                await tournament.save({ session: dbSession });

                // Log Activity
                await AdminActivity.create([{
                    adminId: adminId,
                    adminName: adminName,
                    actionType: 'UPDATE_TOURNAMENT',
                    targetId: tournament._id,
                    details: `Finalized tournament ${tournament.title}. Winners: ${JSON.stringify(winners)}`
                }], { session: dbSession });

            });

            // If we are here, transaction committed.
            result = { success: true, message: 'Tournament finalized and prizes distributed' };

        } catch (error: any) {
            console.error('Finalize Transaction Aborted:', error);
            // Re-throw to be caught by outer handler
            throw error;
        } finally {
            await dbSession.endSession();
        }

        // Trigger Rank Rewards Post-Transaction (Best Effort)
        // We do this after commit to avoid locking issues or failures rolling back the prize.
        const triggerRankRewardParams = async (userId: string) => {
            if (!userId) return;
            try {
                const u = await User.findById(userId).select('rankPoints');
                if (u) await processRankRewards(userId, u.rankPoints);
            } catch (e) { console.error('Rank reward error', e); }
        };

        // Run sequentially or parallel
        await Promise.all([
            triggerRankRewardParams(winners.rank1),
            triggerRankRewardParams(winners.rank2),
            triggerRankRewardParams(winners.rank3)
        ]);

        return NextResponse.json(result);

    } catch (error: any) {
        console.error('Finalize Error:', error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
