import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/db';
import BattleMatch from '@/models/BattleMatch';
import User from '@/models/User';
import Transaction from '@/models/Transaction';
import Escrow from '@/models/Escrow';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import Notification from '@/models/Notification';
import { sendPushNotification } from '@/lib/webpush';
import mongoose from 'mongoose';

export async function POST(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    let dbSession: mongoose.ClientSession | null = null;
    try {
        const session = await getServerSession(authOptions);
        if (!session || !session.user) {
            return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
        }

        await connectToDatabase();
        const { id } = await params;

        const match = await BattleMatch.findById(id);
        if (!match) {
            return NextResponse.json({ success: false, error: 'Match not found' }, { status: 404 });
        }

        const userId = (session.user as any).id;
        
        // 1. Authorization
        const isParticipant = match.participants.some((p: any) =>
            (p.userId._id?.toString() || p.userId?.toString()) === userId
        );
        const isHost = match.createdBy?.toString() === userId;

        if (!isParticipant || isHost) {
            return NextResponse.json({ success: false, error: 'Only joiners can trigger a force-dispute' }, { status: 403 });
        }

        // 2. State Validation
        if (match.status !== 'active') {
            return NextResponse.json({ success: false, error: 'Match must be Live (active) to force-dispute' }, { status: 400 });
        }

        // 3. Timing Validation: expiresAt + 30 minutes
        const baseTime = match.expiresAt ? new Date(match.expiresAt).getTime() : new Date(match.createdAt).getTime();
        const unlockTime = baseTime + (30 * 60 * 1000); // 30 mins grace period after expiry

        if (Date.now() < unlockTime) {
            const secondsLeft = Math.ceil((unlockTime - Date.now()) / 1000);
            const minutes = Math.floor(secondsLeft / 60);
            const seconds = secondsLeft % 60;
            return NextResponse.json({ 
                success: false, 
                error: `Force Dispute is locked. Unlocks in ${minutes}:${seconds.toString().padStart(2, '0')}` 
            }, { status: 400 });
        }

        // 4. Action Logic (Atomic Transaction)
        dbSession = await mongoose.startSession();
        dbSession.startTransaction();

        const hasRoomID = !!match.roomID; // Note: roomID might be hidden in .select() but it's in the document if not select: false in schema? 
        // Wait, roomID is select: false. Let's re-fetch with roomID if needed or check if it exists.
        
        // Let's re-query with select roomID
        const matchWithSecret = await BattleMatch.findById(id).select('+roomID').session(dbSession);
        const reallyHasRoomID = !!matchWithSecret?.roomID;

        if (!reallyHasRoomID) {
            // CASE A: NO ROOM ID -> AUTO-CANCEL + REFUND + -10 TS
            logAction(logs, 'Executing Case A: No Room ID Refund Flow');
            
            match.status = 'cancelled';
            match.adminNote = 'System Auto-Cancelled: Host failed to provide Room ID within grace period.';
            match.resolutionComment = 'Match cancelled due to Host inactivity (No Room ID). Full refund issued to Joiner.';
            await match.save({ session: dbSession });

            // Refund Joiner (the requester is the joiner)
            const joiner = await User.findById(userId).session(dbSession);
            if (joiner) {
                joiner.walletBalance += match.entryFee;
                await joiner.save({ session: dbSession });

                await Transaction.create([{
                    user: userId,
                    amount: match.entryFee,
                    type: 'refund',
                    description: `Force Refund: Host AFK (No Room ID) in ${match.title}`,
                    status: 'completed',
                    referenceId: match._id
                }], { session: dbSession });
            }

            // Penalty for Host
            const host = await User.findById(match.createdBy).session(dbSession);
            if (host) {
                host.trustScore = Math.max(0, (host.trustScore || 100) - 10);
                await host.save({ session: dbSession });
            }

            // Update Escrow
            const escrow = await Escrow.findOne({ matchId: match._id }).session(dbSession);
            if (escrow) {
                escrow.status = 'refunded';
                await escrow.save({ session: dbSession });
            }

            await dbSession.commitTransaction();

            // Notify parties
            notify(match.createdBy.toString(), '❌ Match Cancelled', `Your match "${match.title}" was cancelled because you failed to provide Room ID. -10 Trust Score applied.`, 'error', match._id);
            notify(userId, '✅ Refund Processed', `Host failed to provide Room ID. ${match.entryFee} coins have been refunded.`, 'success', match._id);

            return NextResponse.json({ success: true, message: 'Match cancelled. Your refund has been processed.' });

        } else {
            // CASE B: ROOM ID PROVIDED BUT NO RESULT -> DISPUTED + -15 TS
            logAction(logs, 'Executing Case B: Room ID Exists - Dispute Flow');

            match.status = 'disputed';
            match.disputeReason = 'Joiner triggered Force Dispute: Host AFK after providing Room ID.';
            match.adminNote = 'Joiner reported Host AFK after Room ID was shared. Pending video proof review.';
            await match.save({ session: dbSession });

            // Penalty for Host (Initial)
            const host = await User.findById(match.createdBy).session(dbSession);
            if (host) {
                host.trustScore = Math.max(0, (host.trustScore || 100) - 15);
                await host.save({ session: dbSession });
            }

            await dbSession.commitTransaction();

            // Notify Host
            notify(match.createdBy.toString(), '⚠️ Match Disputed!', `The joiner in "${match.title}" has reported you as AFK. Provide result proof immediately to avoid further penalties.`, 'error', match._id);

            return NextResponse.json({ 
                success: true, 
                message: 'Match moved to Disputed state. Please provide video proof via WhatsApp to confirm your win/claim.' 
            });
        }

    } catch (error: any) {
        if (dbSession) await dbSession.abortTransaction();
        console.error("Error triggering force-dispute:", error);
        return NextResponse.json({ success: false, error: "Failed to trigger force-dispute" }, { status: 500 });
    } finally {
        if (dbSession) dbSession.endSession();
    }
}

// Helpers
const logs: string[] = [];
function logAction(arr: string[], msg: string) { console.log(msg); arr.push(msg); }

async function notify(userId: string, title: string, message: string, type: 'success' | 'error' | 'warning', matchId: string) {
    try {
        await Notification.create({
            userId,
            title,
            message,
            type,
            link: `/battle-zone/${matchId}`
        });
        sendPushNotification(userId, {
            title,
            body: message,
            url: `/battle-zone/${matchId}`
        }).catch(console.error);
    } catch (e) {
        console.error('Notify Error:', e);
    }
}
