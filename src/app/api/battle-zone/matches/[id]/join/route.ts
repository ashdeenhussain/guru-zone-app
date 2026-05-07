import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import connectToDatabase from '@/lib/db';
import BattleMatch from '@/models/BattleMatch';
import User from '@/models/User';
import Transaction from '@/models/Transaction';
import Escrow from '@/models/Escrow';
import Notification from '@/models/Notification';
import mongoose from 'mongoose';
import { sendPushNotification } from '@/lib/webpush';

export async function POST(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    let session = null;
    try {
        const authSession = await getServerSession(authOptions);
        if (!authSession || !authSession.user) {
            return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
        }

        const userId = (authSession.user as any).id;
        const { id } = await params;
        const body = await req.json();
        const { inGameName, uid, teammates, teamName } = body;

        await connectToDatabase();

        session = await mongoose.startSession();
        session.startTransaction();

        const match = await BattleMatch.findById(id).session(session);
        if (!match) {
            await session.abortTransaction();
            return NextResponse.json({ message: 'Match not found' }, { status: 404 });
        }

        if (match.status !== 'open') {
            await session.abortTransaction();
            return NextResponse.json({ message: 'Match is not open' }, { status: 400 });
        }

        if (match.joinedCount >= match.maxSlots) {
            await session.abortTransaction();
            return NextResponse.json({ message: 'Match is full' }, { status: 400 });
        }

        const isAlreadyJoined = match.participants.some((p: any) => p.userId.toString() === userId);
        if (isAlreadyJoined) {
            await session.abortTransaction();
            return NextResponse.json({ message: 'Already joined' }, { status: 400 });
        }

        const user = await User.findById(userId).session(session);
        if (!user || user.walletBalance < match.entryFee) {
            await session.abortTransaction();
            return NextResponse.json({ message: 'Insufficient balance' }, { status: 400 });
        }

        // Deduct balance
        user.walletBalance -= match.entryFee;
        await user.save({ session });

        // Create Transaction
        const transaction = await Transaction.create([{
            user: userId,
            amount: -match.entryFee,
            type: 'entry_fee',
            description: `Joined Battle: ${match.title}`,
            status: 'completed',
            referenceId: match._id
        }], { session });

        // Link to existing Escrow or create if missing (for legacy matches)
        const totalPot = match.entryFee * 2;
        const platformFeePercentage = 0.10;
        const platformFee = Math.floor(totalPot * platformFeePercentage);
        const netPrize = totalPot - platformFee;

        let escrow;
        if (match.escrowId) {
            escrow = await Escrow.findById(match.escrowId).session(session);
        }

        if (!escrow) {
            // Check if escrow already exists for this matchId
            escrow = await Escrow.findOne({ matchId: match._id }).session(session);
        }

        if (!escrow) {
            escrow = new Escrow({
                matchId: match._id,
                totalAmount: totalPot,
                platformFee,
                netPrize,
                status: 'held'
            });
        } else {
            // Ensure fields are updated/present
            escrow.totalAmount = totalPot;
            escrow.platformFee = platformFee;
            escrow.netPrize = netPrize;
        }
        await escrow.save({ session });

        // Update Match
        match.participants.push({
            userId,
            inGameName,
            uid,
            teamName: teamName || '',
            teammates: teammates || []
        });
        match.joinedCount += 1;
        match.escrowId = escrow._id;

        if (match.joinedCount >= match.maxSlots) {
            match.status = 'active';
            match.activatedAt = new Date();
        }
        await match.save({ session });

        await Notification.create([{
            userId,
            title: "🎮 Match Joined!",
            message: `Joined ${match.title}. Waiting for the Host to provide the Free Fire Room ID.`,
            type: "success",
            link: `/battle-zone/${match._id}`
        }], { session });

        // Notification for Host
        await Notification.create([{
            userId: match.createdBy,
            title: "⚔️ Opponent Found!",
            message: `${inGameName || 'Someone'} has joined your match. Provide Room ID within 15 minutes!`,
            type: "warning",
            link: `/battle-zone/${match._id}`
        }], { session });

        await session.commitTransaction();

        // Create System Message to trigger unread badge
        try {
            const Message = mongoose.models.Message || mongoose.model('Message');
            await Message.create({
                tournamentId: id,
                sender: userId,
                senderName: 'System',
                content: `⚔️ ${inGameName || 'Someone'} has joined the match. Room ID is now required!`,
                isSystem: true
            });
        } catch (msgErr) {
            console.error('[JoinAPI] System message creation failed:', msgErr);
        }

        // Push Notifications
        try {
            sendPushNotification(userId, {
                title: '🎮 Match Joined!',
                body: `You joined "${match.title}". Waiting for Host to provide Room ID.`,
                url: `/battle-zone/${match._id}`
            }, 'tournaments').catch(console.error);

            sendPushNotification(match.createdBy.toString(), {
                title: '⚔️ Opponent Found!',
                body: `${inGameName || 'Someone'} joined your match. Provide Room ID now!`,
                url: `/battle-zone/${match._id}`
            }, 'tournaments').catch(console.error);
        } catch (pushErr) {
            console.error('[JoinBattlePush] Failed:', pushErr);
        }

        return NextResponse.json({ success: true, message: 'Joined battle successfully' });

    } catch (error: any) {
        if (session) await session.abortTransaction();
        return NextResponse.json({ message: error.message }, { status: 500 });
    } finally {
        if (session) session.endSession();
    }
}
