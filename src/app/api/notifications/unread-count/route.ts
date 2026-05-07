import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import connectToDatabase from '@/lib/db';
import User from '@/models/User';
import BattleMatch from '@/models/BattleMatch';
import Message from '@/models/Message';
import AdminNotification from '@/models/AdminNotification';

export async function GET() {
    try {
        const session = await getServerSession(authOptions);
        if (!session || !session.user) {
            return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
        }

        await connectToDatabase();
        const userId = (session.user as any).id;
        const user = await User.findById(userId).lean();

        if (!user) {
            return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 });
        }

        // 1. Admin Notifications (if admin)
        let adminUnreadCount = 0;
        if (user.role === 'admin' || (user.permissions && user.permissions.length > 0)) {
            adminUnreadCount = await AdminNotification.countDocuments({
                isRead: { $ne: userId }
            });
        }

        // 2. Chat & Battle Match Unread Count
        const userTournaments = user.tournamentsPlayed || [];
        
        // Fetch Battle Matches where user is involved
        const userBattleMatches = await BattleMatch.find({
            $or: [
                { createdBy: userId },
                { 'participants.userId': userId }
            ]
        }).select('_id').lean();
        
        const battleMatchIds = userBattleMatches.map(m => m._id);
        const tournamentsJoined = [...userTournaments, ...battleMatchIds];
        
        let chatUnreadCount = 0;
        const chatBreakdown: Record<string, { chat: number, system: number }> = {};

        if (tournamentsJoined.length > 0) {
            const lastReadMap = user.lastChatReadAt || new Map();
            
            const unreadMessages = await Message.find({
                tournamentId: { $in: tournamentsJoined },
                sender: { $ne: userId }
            }).lean();

            unreadMessages.forEach((msg: any) => {
                const tId = msg.tournamentId.toString();
                const lastRead = lastReadMap.get ? lastReadMap.get(tId) : lastReadMap[tId];
                const isUnread = !lastRead || new Date(msg.createdAt) > new Date(lastRead);
                
                if (isUnread) {
                    chatUnreadCount++;
                    if (!chatBreakdown[tId]) chatBreakdown[tId] = { chat: 0, system: 0 };
                    
                    if (msg.isSystem) {
                        chatBreakdown[tId].system++;
                    } else {
                        chatBreakdown[tId].chat++;
                    }
                }
            });
        }

        return NextResponse.json({
            success: true,
            counts: {
                admin: adminUnreadCount,
                chat: chatUnreadCount,
                total: adminUnreadCount + chatUnreadCount,
                breakdown: chatBreakdown
            }
        });

    } catch (error) {
        console.error('Error fetching unread counts:', error);
        return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
    }
}
