
import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/db';
import User from '@/models/User';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function GET(req: Request) {
    try {
        await connectToDatabase();

        // Get Search Params for optional simpler limit, though we default to 10
        const { searchParams } = new URL(req.url);
        const limitParam = searchParams.get('limit');
        const limit = limitParam ? parseInt(limitParam, 10) : 10;

        // 1. Fetch Top 10 Leaderboard
        const leaderboardUsers = await User.find({})
            .select('name image avatarId totalWins netEarnings tournamentsPlayed')
            .sort({ totalWins: -1, netEarnings: -1 })
            .limit(limit)
            .lean();

        // Format the data for frontend (e.g., getting counts)
        const formattedLeaderboard = leaderboardUsers.map((user) => ({
            id: user._id.toString(),
            name: user.name,
            avatar: user?.image || null, // Map image to avatar as requested
            avatarId: user.avatarId || 1, // Default to 1 if missing
            totalWins: user.totalWins || 0,
            netEarnings: user.netEarnings || 0,
            tournamentsPlayed: Array.isArray(user.tournamentsPlayed) ? user.tournamentsPlayed.length : 0,
        }));

        // 2. Handle "My Rank" if user is logged in
        let currentUserRankData = null;
        const session = await getServerSession(authOptions);

        if (session && session.user) {
            const userEmail = session.user.email;
            const currentUser = await User.findOne({ email: userEmail })
                .select('name image avatarId totalWins netEarnings tournamentsPlayed')
                .lean();

            if (currentUser) {
                // Calculate Rank
                // Check how many users have more wins OR (same wins AND more earnings)
                const rankCount = await User.countDocuments({
                    $or: [
                        { totalWins: { $gt: currentUser.totalWins || 0 } },
                        {
                            totalWins: currentUser.totalWins || 0,
                            netEarnings: { $gt: currentUser.netEarnings || 0 }
                        }
                    ]
                });

                const rank = rankCount + 1;

                currentUserRankData = {
                    rank: rank,
                    id: currentUser._id.toString(),
                    name: currentUser.name,
                    avatar: currentUser?.image || null,
                    avatarId: currentUser.avatarId || 1,
                    totalWins: currentUser.totalWins || 0,
                    netEarnings: currentUser.netEarnings || 0,
                    tournamentsPlayed: Array.isArray(currentUser.tournamentsPlayed) ? currentUser.tournamentsPlayed.length : 0,
                };
            }
        }

        return NextResponse.json({
            leaderboard: formattedLeaderboard,
            currentUser: currentUserRankData
        }, { status: 200 });

    } catch (error: any) {
        console.error('Error fetching leaderboard:', error);
        return NextResponse.json({ error: 'Failed to fetch leaderboard' }, { status: 500 });
    }
}
