import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth'; // Adjust path if necessary
import User from '@/models/User';
import connectDB from '@/lib/db';

export async function GET(req: Request) {
    try {
        await connectDB();
        const session = await getServerSession(authOptions);

        if (!session || session.user.role !== 'admin') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { searchParams } = new URL(req.url);
        const page = parseInt(searchParams.get('page') || '1');
        const limit = parseInt(searchParams.get('limit') || '10');
        const search = searchParams.get('search') || '';
        const skip = (page - 1) * limit;

        const query: any = {};
        if (search) {
            const searchRegex = { $regex: search, $options: 'i' };
            query.$or = [
                { name: searchRegex },
                { email: searchRegex },
                { freeFireUid: searchRegex },
                { inGameName: searchRegex }
            ];
        }

        // 2. Status Filters
        const filter = searchParams.get('filter') || 'all';
        if (filter === 'active') {
            query.status = 'active';
        } else if (filter === 'banned') {
            query.status = 'banned';
        } else if (filter === 'inactive') {
            // Inactive logic: Active status BUT lastLogin is older than 7 days (or null)
            const sevenDaysAgo = new Date();
            sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

            query.status = 'active'; // Should probably only count active users as 'inactive', not banned ones.
            query.$or = [
                { lastLogin: { $lt: sevenDaysAgo } },
                { lastLogin: { $exists: false } },
                { lastLogin: null }
            ];
        }

        const usersPromise = User.find(query)
            .select('-password') // Exclude password even though select: false is set, just to be safe
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit);

        const totalUsersPromise = User.countDocuments(query);

        // Active users: Logged in within last 7 days
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
        const activeUsersPromise = User.countDocuments({
            lastLogin: { $gte: sevenDaysAgo }
        });

        // Also get total ALL users for the stats card (ignoring search filter)
        const totalAllUsersPromise = User.countDocuments({});

        const [users, totalFilteredUsers, activeUsers, totalAllUsers] = await Promise.all([
            usersPromise,
            totalUsersPromise,
            activeUsersPromise,
            totalAllUsersPromise
        ]);

        return NextResponse.json({
            users,
            pagination: {
                total: totalFilteredUsers,
                page,
                limit,
                pages: Math.ceil(totalFilteredUsers / limit)
            },
            stats: {
                totalUsers: totalAllUsers,
                activeUsers
            }
        });

    } catch (error: any) {
        console.error('Error fetching users:', error);
        return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
    }
}
