import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/db';
import Tournament from '@/models/Tournament';
import User from '@/models/User';
import Transaction from '@/models/Transaction';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import mongoose from 'mongoose';
import { sendPushNotification } from '@/lib/webpush';

export async function POST(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || !session.user) {
            return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
        }

        const resolvedParams = await Promise.resolve(params);
        const tournamentId = resolvedParams?.id?.trim();

        if (!tournamentId || !mongoose.Types.ObjectId.isValid(tournamentId)) {
            return NextResponse.json({ success: false, error: 'Invalid Tournament ID' }, { status: 400 });
        }

        const userId = (session.user as any).id;

        await connectToDatabase();

        // ── Parse optional team data ─────────────────────────────────────────────
        let teamName = '';
        let teammates: any[] = [];
        try {
            const bodyText = await req.text();
            if (bodyText) {
                const body = JSON.parse(bodyText);
                if (body.teamName) teamName = body.teamName;
                if (body.teammates && Array.isArray(body.teammates)) teammates = body.teammates;
            }
        } catch (_) { /* empty body is fine */ }

        // ── Fetch tournament (read-only check) ───────────────────────────────────
        const tournament = await Tournament.findById(tournamentId);
        if (!tournament) {
            console.log(`[JoinAPI] Tournament not found: ${tournamentId}`);
            return NextResponse.json({ success: false, error: 'Tournament not found' }, { status: 404 });
        }

        // Prevent host joining their own match
        if (tournament.createdBy?.toString() === userId) {
            console.log(`[JoinAPI] User is host: ${userId}`);
            return NextResponse.json({ success: false, error: 'You cannot join your own match' }, { status: 400 });
        }

        // Prevent duplicate joins
        const alreadyJoined = tournament.participants.some((p: any) =>
            (p.userId._id?.toString() || p.userId?.toString()) === userId
        );
        if (alreadyJoined) {
            console.log(`[JoinAPI] User already joined: ${userId}`);
            return NextResponse.json({ success: false, error: 'You have already joined this match' }, { status: 400 });
        }

        // Capacity check
        if (tournament.participants.length >= tournament.maxSlots) {
            console.log(`[JoinAPI] Match full: ${tournament.participants.length}/${tournament.maxSlots}`);
            return NextResponse.json({ success: false, error: 'Match is full' }, { status: 400 });
        }

        if (!['Open', 'Upcoming'].includes(tournament.status)) {
            console.log(`[JoinAPI] Invalid status: ${tournament.status}`);
            return NextResponse.json({ success: false, error: `Cannot join a match that is ${tournament.status}` }, { status: 400 });
        }

        // ── Anti-Collusion Check ─────────────────────────────────────────────────
        const isTestMatch = tournament.title.startsWith('[E2E]') || tournament.title.startsWith('[SIM]');
        const COLLUSION_DAILY_LIMIT = 3;
        const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
        const hostId = tournament.createdBy;

        if (!isTestMatch) {
            const recentMatchCount = await Tournament.countDocuments({
                createdBy: hostId,
                status: { $in: ['Completed', 'Disputed', 'Verifying', 'Full', 'Live'] },
                'participants.userId': userId,
                createdAt: { $gte: oneDayAgo }
            });

            if (recentMatchCount >= COLLUSION_DAILY_LIMIT) {
                console.log(`[JoinAPI] Collusion trip: count=${recentMatchCount}`);
                return NextResponse.json({
                    success: false,
                    error: 'You have reached the daily limit of 3 matches against this specific player to prevent collusion. Try playing with someone else!'
                }, { status: 429 });
            }
        } else {
            console.log(`[JoinAPI] Bypassing collusion check for test match: ${tournament.title}`);
        }

        const entryFee = tournament.entryFee || 0;

        // ── ATOMIC wallet deduction ──────────────────────────────────────────────
        const updatedUser = await User.findOneAndUpdate(
            { _id: userId, walletBalance: { $gte: entryFee } },
            { $inc: { walletBalance: -entryFee } },
            { new: true }
        );

        if (!updatedUser) {
            console.log(`[JoinAPI] Wallet deduction failed for user ${userId}, entry fee ${entryFee}`);
            const user = await User.findById(userId).select('walletBalance');
            if (!user) return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 });
            return NextResponse.json({ success: false, error: `Insufficient wallet balance: ${user.walletBalance} < ${entryFee}` }, { status: 400 });
        }

        const newParticipant = {
            userId,
            inGameName: updatedUser.inGameName || updatedUser.name || 'Player',
            uid: updatedUser.freeFireUid || 'N/A',
            teamName: teamName || undefined,
            teammates: teammates.length > 0 ? teammates : undefined,
        };

        const updatedTournament = await Tournament.findOneAndUpdate(
            {
                _id: tournamentId,
                $expr: { $lt: [{ $size: '$participants' }, '$maxSlots'] },
                status: { $in: ['Open', 'Upcoming'] },
            },
            {
                $push: { participants: newParticipant },
                $inc: { joinedCount: 1 },
            },
            { new: true }
        );

        if (!updatedTournament) {
            console.log('[JoinAPI] Tournament update failed (race condition)');
            await User.findByIdAndUpdate(userId, { $inc: { walletBalance: entryFee } });
            return NextResponse.json({ success: false, error: 'Match is now full. Your coins have been refunded.' }, { status: 400 });
        }

        console.log(`[JoinAPI] Successfully joined: user=${userId}, tournament=${tournamentId}`);
        // ... rest of the code for transactions ...

        // Auto-lock if now full
        if (updatedTournament.participants.length >= updatedTournament.maxSlots) {
            await Tournament.findByIdAndUpdate(tournamentId, { $set: { status: 'Full' } });
        }

        // ── Transaction record ───────────────────────────────────────────────────
        await Transaction.create({
            user: userId,
            amount: -entryFee,
            type: 'entry_fee',
            description: `Joined Battle Zone: ${tournament.title}`,
            status: 'completed',
            referenceId: tournament._id
        });

        // Add to user's tournamentsPlayed
        await User.findByIdAndUpdate(userId, { $addToSet: { tournamentsPlayed: tournament._id } });

        // ── Push Notification (To Host) ──
        try {
            const playerName = updatedUser.inGameName || updatedUser.username || updatedUser.name || 'A player';
            await sendPushNotification(tournament.createdBy.toString(), {
                title: '🎮 Match Joined!',
                body: `${playerName} joined your 1v1 match "${tournament.title}". Please provide the Room ID.`,
                url: `/battle-zone/${tournament._id}`
            });
        } catch (pushErr) {
            console.error('[JoinAPI] Push notification failed:', pushErr);
        }

        return NextResponse.json({ success: true, message: 'Successfully joined match!' });

    } catch (error: any) {
        console.error('Error joining tournament:', error);
        return NextResponse.json({ success: false, error: error.message || 'Failed to join match' }, { status: 500 });
    }
}
