import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import connectMongo from '@/lib/db';
import User from '@/models/User';
import BattleMatch from '@/models/BattleMatch';
import Transaction from '@/models/Transaction';
import mongoose from 'mongoose';

export async function POST(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user) {
            return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
        }

        const body = await req.json();
        const { format, entryFee, gameMode, mapName, advancedRules } = body;

        // Input Validation
        if (!['1v1', '2v2', '4v4'].includes(format)) {
            return NextResponse.json({ success: false, error: 'Invalid format. Must be 1v1, 2v2, or 4v4.' }, { status: 400 });
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

            // 2. Create BattleMatch (STRICTLY separate from Tournaments)
            const newMatch = await BattleMatch.create([{
                title,
                format,
                gameMode: gameMode || 'Clash Squad',
                mapName: mapName || 'Bermuda',
                entryFee: fee,
                prizePool,
                status: 'open',
                createdBy: user._id,
                isOfficial: false, // ALWAYS false for Battle Zone, regardless of user role
                maxSlots: 2, 
                joinedCount: 1,
                participants: [{
                    userId: user._id,
                    inGameName: user.inGameName,
                    uid: user.freeFireUid
                }],
                advancedRules: advancedRules || {
                    rounds: 7,
                    limitedAmmo: true,
                    headshotOnly: false
                }
            }], { session: dbSession });

            await dbSession.commitTransaction();

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

