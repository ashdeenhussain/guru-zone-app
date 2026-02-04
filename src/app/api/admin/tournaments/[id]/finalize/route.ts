import { NextResponse } from 'next/server';
import connectToDB from '@/lib/db';
import Tournament from '@/models/Tournament';
import User from '@/models/User';
import Transaction from '@/models/Transaction';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import AdminActivity from '@/models/AdminActivity';
import { processRankRewards } from '@/lib/reward-processor';

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
        // Expected winners format: { rank1: userId, rank2: userId, rank3: userId }

        const tournament = await Tournament.findById(id);
        if (!tournament) {
            return NextResponse.json({ success: false, error: 'Tournament not found' }, { status: 404 });
        }

        console.log(`[Finalize Debug] Tournament ${id} Status: ${tournament.status}`);

        if (tournament.status === 'Completed') {
            return NextResponse.json({ success: false, error: 'Tournament is ALREADY COMPLETED. Prizes have been distributed.' }, { status: 400 });
        }

        if (tournament.status !== 'Live' && tournament.status !== 'Open') {
            return NextResponse.json({ success: false, error: `Status Error: Tournament is '${tournament.status}'. Must be Open or Live.` }, { status: 400 });
        }

        const prizes = tournament.prizeDistribution;

        // Function to distribute prize
        const distributePrize = async (userId: string, amount: number, rank: string) => {
            if (!userId) return; // No winner for this rank
            if (amount <= 0) return; // No prize for this rank

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
            });

            // 2. Create Transaction Record
            await Transaction.create({
                user: userId,
                amount: amount,
                type: 'prize_winnings',
                description: `Prize for ${rank} Place in ${tournament.title}`,
                status: 'approved'
            });

            // 3. Process Rank Rewards
            // We need to fetch the updated user to get their total points, OR we can recalculate it roughly. 
            // Better to fetch or use atomic increment result if possible. 
            // For simplicity/reliability, we'll assume the increment worked and pass the estimated new total isn't perfect, 
            // so let's just fetch the user again or rely on the processor to fetch.
            // Actually, the processor fetches the user. So we just need to pass the ID. 
            // However, the processor expects `currentPoints` as arg to avoid DB fetch if possible? 
            // No, the processor receives userId and points. If we pass points, it uses them. 
            // But we just updated the DB with $inc. We don't know the new total without fetching.
            // Let's modify the processor to fetch points if not provided, or just fetch here.

            const updatedUser = await User.findById(userId).select('rankPoints');
            if (updatedUser) {
                await processRankRewards(userId, updatedUser.rankPoints);
            }
        };

        // Execute distributions
        // We do this inside the handler. In a real production app, consider using a transaction session
        // or a job queue to ensure consistency.
        await Promise.all([
            distributePrize(winners.rank1, prizes.first, '1st'),
            distributePrize(winners.rank2, prizes.second, '2nd'),
            distributePrize(winners.rank3, prizes.third, '3rd'),
        ]);

        // Update Tournament Status
        tournament.status = 'Completed';
        tournament.winners = winners;
        await tournament.save();

        // Log Activity
        await AdminActivity.create({
            adminId: (session.user as any).id,
            adminName: session.user.name,
            actionType: 'UPDATE_TOURNAMENT',
            targetId: tournament._id,
            details: `Finalized tournament ${tournament.title}. Winners: ${JSON.stringify(winners)}`
        });

        return NextResponse.json({ success: true, message: 'Tournament finalized and prizes distributed' });

    } catch (error: any) {
        console.error('Finalize Error:', error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
