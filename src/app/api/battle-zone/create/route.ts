import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import connectMongo from '@/lib/db';
import User from '@/models/User';
import Tournament from '@/models/Tournament';
import Transaction from '@/models/Transaction'; // Assuming a Transaction model exists or is used for logs
import mongoose from 'mongoose';

export async function POST(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.email) {
            return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
        }

        const body = await req.json();
        const { format, entryFee } = body;

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

        const user = await User.findOne({ email: session.user.email });
        if (!user) {
            return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 });
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
        const prizePool = Math.floor(totalPot - (totalPot * platformFeePercentage)); // Keeping it integer based or 2 decimals

        // Auto-generate Title
        const hostName = user.inGameName || user.name || 'Anonymous';
        const title = `${hostName}'s ${format} Clash`;

        // Start a session for atomic operations
        const dbSession = await mongoose.startSession();
        dbSession.startTransaction();

        try {
            // Deduct entry fee
            if (fee > 0) {
                user.walletBalance -= fee;
                await user.save({ session: dbSession });

                // Create a transaction record if the model exists, otherwise this can be omitted depending on current system
                if (mongoose.models.Transaction) {
                    await mongoose.models.Transaction.create([{
                        userId: user._id,
                        amount: fee,
                        type: 'Tournament Entry',
                        description: `Host created tournament: ${title}`,
                        status: 'completed',
                        balanceAfter: user.walletBalance
                    }], { session: dbSession });
                }
            }

            // Create Tournament
            const newTournament = await Tournament.create([{
                title,
                format,
                gameType: 'CS', // Default to Clash Squad for Battle Zone, or let users choose later
                entryFee: fee,
                prizePool,
                status: 'upcoming',
                createdBy: user._id,
                isOfficial: user.role === 'admin' || user.role === 'team_member',
                maxSlots: 2, // Strictly 2 Captains
                joinedCount: 1, // Host is the first participant
                startTime: new Date(), // "Play Now"
                participants: [{
                    userId: user._id,
                    inGameName: user.inGameName,
                    uid: user.freeFireUid
                }]
            }], { session: dbSession });

            await dbSession.commitTransaction();

            return NextResponse.json({
                success: true,
                message: 'Tournament created successfully',
                data: newTournament[0]
            });
        } catch (error) {
            await dbSession.abortTransaction();
            throw error;
        } finally {
            dbSession.endSession();
        }

    } catch (error: any) {
        console.error('Error creating battle zone tournament:', error);
        return NextResponse.json({ success: false, error: error.message || 'Internal Server Error' }, { status: 500 });
    }
}
