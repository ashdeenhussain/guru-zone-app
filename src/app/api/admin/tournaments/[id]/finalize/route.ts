import { NextResponse } from 'next/server';
import connectToDB from '@/lib/db';
import Tournament from '@/models/Tournament';
import User from '@/models/User';
import Transaction from '@/models/Transaction';
import { getServerSession } from 'next-auth';
import { authOptions, hasPermission } from '@/lib/auth';
import AdminActivity from '@/models/AdminActivity';
import { processRankRewards } from '@/lib/reward-processor';
import mongoose from 'mongoose';

export async function POST(req: Request, context: { params: Promise<{ id: string }> }) {
    try {
        const session = await getServerSession(authOptions);
        if (!hasPermission(session, 'manage_tournaments')) {
            return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
        }

        await connectToDB();
        const params = await context.params;
        const { id } = params;
        const body = await req.json();
        
        // Sanitize winners: convert empty strings to undefined
        const winners = (body.winners ? Object.fromEntries(
            Object.entries(body.winners).map(([k, v]) => [k, v === '' ? undefined : v])
        ) : {}) as Record<string, any>;

        const adminId = session.user.id;
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

                // Ownership Check: Only creator or Super Admin can finalize
                const canManage = hasPermission(session, 'manage_system') || 
                                 (tournament.createdBy?.toString() === (session as any)?.user?.id);

                if (!canManage) {
                    throw new Error('Unauthorized: You can only finalize tournaments created by you.');
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

                    // Calculate Rank Points (Top 10 Support)
                    let pointsToAdd = 0;
                    if (rank === '1st') pointsToAdd = 50;
                    else if (rank === '2nd' || rank === '3rd') pointsToAdd = 20;
                    else pointsToAdd = 10; // For ranks 4-10

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

                // Execute distributions dynamically based on prizeType
                const distributionMapping = [
                    { key: 'rank1', prize: prizes.first, label: '1st' },
                    { key: 'rank2', prize: prizes.second, label: '2nd' },
                    { key: 'rank3', prize: prizes.third, label: '3rd' },
                    { key: 'rank4', prize: prizes.fourth, label: '4th' },
                    { key: 'rank5', prize: prizes.fifth, label: '5th' },
                    { key: 'rank6', prize: prizes.sixth, label: '6th' },
                    { key: 'rank7', prize: prizes.seventh, label: '7th' },
                    { key: 'rank8', prize: prizes.eighth, label: '8th' },
                    { key: 'rank9', prize: prizes.ninth, label: '9th' },
                    { key: 'rank10', prize: prizes.tenth, label: '10th' },
                ];

                const distributionPromises = distributionMapping
                    .filter((_, i) => {
                        if (tournament.prizeType === 'TOP 3') return i < 3;
                        if (tournament.prizeType === 'TOP 5') return i < 5;
                        return true;
                    })
                    .map(item => distributePrize(winners[item.key], item.prize, item.label));

                await Promise.all(distributionPromises);

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
        const triggerRankRewardParams = async (userId: string) => {
            if (!userId) return;
            try {
                const u = await User.findById(userId).select('rankPoints');
                if (u) await processRankRewards(userId, u.rankPoints);
            } catch (e) { console.error('Rank reward error', e); }
        };

        const activeWinners = Object.values(winners).filter(Boolean) as string[];
        await Promise.all(activeWinners.map(winnerId => triggerRankRewardParams(winnerId as string)));

        return NextResponse.json(result);

    } catch (error: any) {
        console.error('Finalize Error:', error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
