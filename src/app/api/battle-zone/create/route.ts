import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import connectMongo from '@/lib/db';
import User from '@/models/User';
import BattleMatch from '@/models/BattleMatch';
import Transaction from '@/models/Transaction';
import Escrow from '@/models/Escrow';
import mongoose from 'mongoose';
import Notification from '@/models/Notification';
import { sendPushNotification } from '@/lib/webpush';

export async function POST(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user) {
            return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
        }

        const body = await req.json();
        const { format, entryFee, gameMode, mapName, advancedRules, availabilityDuration, privacy } = body;

        // Input Validation
        if (!['1v1', '2v2', '4v4'].includes(format)) {
            return NextResponse.json({ success: false, error: 'Invalid format. Must be 1v1, 2v2, or 4v4.' }, { status: 400 });
        }

        if (privacy && !['Public', 'Private'].includes(privacy)) {
            return NextResponse.json({ success: false, error: 'Invalid privacy setting. Must be Public or Private.' }, { status: 400 });
        }

        const fee = Number(entryFee);
        if (isNaN(fee) || fee < 10 || fee > 100) {
            return NextResponse.json({ 
                success: false, 
                error: 'Entry fee must be between 10 and 100 coins.' 
            }, { status: 400 });
        }

        await connectMongo();

        const userId = (session.user as any).id;
        const user = await User.findById(userId);
        if (!user) {
            return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 });
        }

        // Trust Score Check
        if ((user.trustScore ?? 100) < 80) {
            return NextResponse.json({ 
                success: false, 
                error: `Trust Score too low (${user.trustScore ?? 100}%). You need at least 80% to host matches.` 
            }, { status: 403 });
        }

        // Check wallet balance
        if (user.walletBalance < fee) {
            return NextResponse.json({ success: false, error: 'Insufficient wallet balance' }, { status: 400 });
        }

        // Captain Model: Every match has strictly 2 Captains regardless of format (1v1, 2v2, 4v4)
        const totalPlayers = 2;

        // Auto-calculate Prize Pool
        const totalPot = fee * totalPlayers;
        const platformFeePercentage = 0.10; // 10%
        const prizePool = Math.floor(totalPot - (totalPot * platformFeePercentage));

        // Auto-generate Title
        const hostName = user.inGameName || user.name || 'Anonymous';
        const title = `${hostName}'s ${format} ${gameMode || 'Clash'}`;

        // Calculate expiresAt based on availabilityDuration (default to 60 mins if not provided or invalid)
        const durationMinutes = Number(availabilityDuration) || 60;
        const expiresAt = new Date(Date.now() + durationMinutes * 60 * 1000);

        // Start a session for atomic operations
        const dbSession = await mongoose.startSession();
        dbSession.startTransaction();

        try {
            // 1. Deduct entry fee
            if (fee > 0) {
                user.walletBalance -= fee;
                await user.save({ session: dbSession });

                // Create a transaction record
                await Transaction.create([{
                    user: user._id,
                    amount: -fee,
                    type: 'entry_fee',
                    description: `Host created Battle Match: ${title}`,
                    status: 'completed',
                }], { session: dbSession });
            }

            // 2. Create Escrow record immediately to track host's payment
            const escrowRecord = {
                matchId: new mongoose.Types.ObjectId(), // Temporary, will update
                totalAmount: totalPot,
                platformFee: Math.floor(totalPot * platformFeePercentage),
                netPrize: prizePool,
                status: 'held'
            };

            const escrow = await Escrow.create([escrowRecord], { session: dbSession });

            // 3. Create BattleMatch (STRICTLY separate from Tournaments)
            const newMatch = await BattleMatch.create([{
                title,
                format,
                gameMode: gameMode || 'Clash Squad',
                mapName: mapName || 'Bermuda',
                entryFee: fee,
                prizePool,
                status: 'open',
                privacy: privacy || 'Public',
                createdBy: user._id,
                isOfficial: false, 
                maxSlots: 2, 
                joinedCount: 1,
                escrowId: escrow[0]._id,
                participants: [{
                    userId: user._id,
                    inGameName: user.inGameName,
                    uid: user.freeFireUid
                }],
                advancedRules: advancedRules || {
                    rounds: 7,
                    limitedAmmo: true,
                    headshotOnly: false
                },
                expiresAt: expiresAt
            }], { session: dbSession });

            // 4. Update Escrow with correct matchId
            escrow[0].matchId = newMatch[0]._id;
            await escrow[0].save({ session: dbSession });

            await dbSession.commitTransaction();

            // ── TRIGGER NOTIFICATION (Host) ──
            try {
                await Notification.create({
                    userId: user._id,
                    title: '✅ Battle Created!',
                    message: `Your match is now live in the lobby. Waiting for an opponent.`,
                    type: 'success',
                    link: `/battle-zone/${newMatch[0]._id}`
                });

                sendPushNotification(user._id.toString(), {
                    title: '✅ Battle Created!',
                    body: `Your match "${title}" is live. Waiting for an opponent.`,
                    url: `/battle-zone/${newMatch[0]._id}`
                }).catch(console.error);
            } catch (notifyErr) {
                console.error('[CreateBattleNotify] Failed:', notifyErr);
            }

            return NextResponse.json({
                success: true,
                message: 'Battle match created successfully',
                data: newMatch[0]
            });
        } catch (error) {
            await dbSession.abortTransaction();
            throw error;
        } finally {
            dbSession.endSession();
        }

    } catch (error: any) {
        console.error('Error creating battle match:', error);
        return NextResponse.json({ success: false, error: error.message || 'Internal Server Error' }, { status: 500 });
    }
}

