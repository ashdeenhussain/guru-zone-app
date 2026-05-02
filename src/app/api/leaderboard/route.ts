
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

        const type = searchParams.get('type') || 'official'; // 'official' | 'battlezone'
        
        const winField = type === 'battlezone' ? 'battleZoneWins' : 'officialWins';
        const earnField = type === 'battlezone' ? 'battleZoneEarnings' : 'officialEarnings';

        // 1. Fetch Top 10 Leaderboard (Only users with > 0 earnings or wins)
        const leaderboardUsers = await User.find({
            $or: [
                { [winField]: { $gt: 0 } },
                { [earnField]: { $gt: 0 } }
            ]
        })
            .select(`name image avatarId tournamentsPlayed trustScore ${winField} ${earnField}`)
            .sort({ [winField]: -1, [earnField]: -1 })
            .limit(limit)
            .lean();

        // Format the data for frontend (e.g., getting counts)
        const formattedLeaderboard = leaderboardUsers.map((user: any) => ({
            id: user._id.toString(),
            name: user.name,
            avatar: user?.image || null, // Map image to avatar as requested
            avatarId: user.avatarId || 1, // Default to 1 if missing
            totalWins: user[winField] || 0,
            netEarnings: user[earnField] || 0,
            trustScore: user.trustScore || 100,
            tournamentsPlayed: Array.isArray(user.tournamentsPlayed) ? user.tournamentsPlayed.length : 0,
        }));

        // 2. Handle "My Rank" if user is logged in
        let currentUserRankData = null;
        const session = await getServerSession(authOptions);

        if (session && session.user) {
            const userEmail = session.user.email;
            const currentUser = await User.findOne({ email: userEmail })
                .select(`name image avatarId tournamentsPlayed trustScore ${winField} ${earnField}`)
                .lean() as any;

            if (currentUser) {
                // Calculate Rank
                // Check how many users have more wins OR (same wins AND more earnings)
                const rankCount = await User.countDocuments({
                    $or: [
                        { [winField]: { $gt: currentUser[winField] || 0 } },
                        {
                            [winField]: currentUser[winField] || 0,
                            [earnField]: { $gt: currentUser[earnField] || 0 }
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
                    totalWins: currentUser[winField] || 0,
                    netEarnings: currentUser[earnField] || 0,
                    trustScore: currentUser.trustScore || 100,
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
