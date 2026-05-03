import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/db';
import BattleMatch from '@/models/BattleMatch';
import User from '@/models/User';
import Transaction from '@/models/Transaction';
import Escrow from '@/models/Escrow';
import mongoose from 'mongoose';

export async function GET() {
    const logs: string[] = [];
    const log = (msg: string) => {
        console.log(msg);
        logs.push(msg);
    };

    try {
        log('🚀 Starting Admin Resolution Integration Test (API Mode)...');
        await connectToDatabase();

        // 1. Create Test Users
        const host = await User.findOneAndUpdate(
            { email: 'test-host@example.com' },
            { name: 'Test Host', walletBalance: 1000, trustScore: 100 },
            { upsert: true, new: true }
        );
        const joiner = await User.findOneAndUpdate(
            { email: 'test-joiner@example.com' },
            { name: 'Test Joiner', walletBalance: 1000, trustScore: 100 },
            { upsert: true, new: true }
        );

        log(`✅ Users Prepared: Host(${host.walletBalance} coins, ${host.trustScore}% TS), Joiner(${joiner.walletBalance} coins, ${joiner.trustScore}% TS)`);

        // 2. Create a Match
        const match = await BattleMatch.create({
            title: 'Test Dispute Match',
            createdBy: host._id,
            entryFee: 100,
            prizePool: 180,
            status: 'disputed',
            participants: [
                { userId: host._id, inGameName: 'HostPlayer' },
                { userId: joiner._id, inGameName: 'JoinerPlayer' }
            ]
        });

        // 3. Create Escrow
        const escrow = await Escrow.create({
            matchId: match._id,
            totalAmount: 200,
            platformFee: 20,
            netPrize: 180,
            status: 'held'
        });
        match.escrowId = escrow._id;
        await match.save();

        log(`✅ Match Created & Disputed: ID ${match._id}`);

        // 4. Simulate Admin Resolution
        log('🛠️ Triggering Admin Resolution: Force Win for Joiner...');
        
        const dbSession = await mongoose.startSession();
        dbSession.startTransaction();

        try {
            const adminNote = "Verified Joiner's video proof. Joiner wins.";
            
            // PAYOUT LOGIC
            const winner = await User.findById(joiner._id).session(dbSession);
            winner.walletBalance += match.prizePool;
            await winner.save({ session: dbSession });

            await Transaction.create([{
                user: winner._id,
                amount: match.prizePool,
                type: 'prize_winnings',
                description: `Admin Resolved: ${match.title} (Joiner wins)`,
                status: 'completed',
                referenceId: match._id
            }], { session: dbSession });

            // PENALTY LOGIC
            const loser = await User.findById(host._id).session(dbSession);
            loser.trustScore = Math.max(0, loser.trustScore - 15);
            await loser.save({ session: dbSession });

            // UPDATE MATCH
            match.status = 'completed';
            match.winners = { rank1: joiner._id };
            match.resolutionComment = adminNote;
            match.resolvedAt = new Date();
            await match.save({ session: dbSession });

            // UPDATE ESCROW
            escrow.status = 'released';
            escrow.releasedTo = joiner._id;
            escrow.releasedAt = new Date();
            await escrow.save({ session: dbSession });

            await dbSession.commitTransaction();
            log('✅ Transaction Committed Successfully');
        } catch (err: any) {
            await dbSession.abortTransaction();
            log(`❌ Transaction Failed: ${err.message}`);
        } finally {
            dbSession.endSession();
        }

        // 5. Final Verification
        const finalHost = await User.findById(host._id);
        const finalJoiner = await User.findById(joiner._id);
        const finalMatch = await BattleMatch.findById(match._id);

        if (!finalHost || !finalJoiner || !finalMatch) {
            throw new Error('Final verification failed: document not found');
        }

        log('\n📊 --- FINAL RESULTS ---');
        log(`Host Wallet: ${finalHost.walletBalance} (Expected: 1000)`);
        log(`Host Trust Score: ${finalHost.trustScore}% (Expected: 85%)`);
        log(`Joiner Wallet: ${finalJoiner.walletBalance} (Expected: 1180)`);
        log(`Match Status: ${finalMatch.status} (Expected: completed)`);
        log(`Resolution Comment: "${finalMatch.resolutionComment}"`);
        
        const success = finalJoiner.walletBalance === 1180 && finalHost.trustScore === 85 && finalMatch.status === 'completed';
        log(success ? '🌟 TEST PASSED: All logic verified.' : '❌ TEST FAILED: Verification mismatch.');

        // Cleanup test data
        await BattleMatch.deleteOne({ _id: match._id });
        await Escrow.deleteOne({ _id: escrow._id });
        await Transaction.deleteMany({ referenceId: match._id });

        return NextResponse.json({ success, logs });

    } catch (error: any) {
        log(`🚨 CRITICAL ERROR: ${error.message}`);
        return NextResponse.json({ success: false, error: error.message, logs }, { status: 500 });
    }
}
