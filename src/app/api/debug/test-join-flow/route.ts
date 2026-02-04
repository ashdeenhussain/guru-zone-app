import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/db';
import Tournament from '@/models/Tournament';
import User from '@/models/User';
import Transaction from '@/models/Transaction';

export async function GET(req: Request) {
    const logs: string[] = [];
    const log = (msg: string) => logs.push(msg);

    try {
        log('Starting debug flow...');
        await connectToDatabase();
        log('DB Connected');

        // 1. Find the target tournament
        const tournaments = await Tournament.find({ status: 'Open' }).sort({ startTime: 1 });
        log(`Found ${tournaments.length} open tournaments`);

        let targetTournament = null;
        for (const t of tournaments) {
            const date = new Date(t.startTime);
            const hours = date.getHours();
            const mins = date.getMinutes();
            log(`Tournament: ${t.title} (${t._id}), Start: ${date.toISOString()}, Hour: ${hours}, Min: ${mins}`);

            // Loose match for 9 PM
            if (hours === 21 || (hours === 20 && mins > 30)) {
                targetTournament = t;
            }
        }

        if (!targetTournament && tournaments.length > 0) {
            targetTournament = tournaments[0];
            log('No 9 PM tournament found, using first open tournament');
        }

        if (!targetTournament) {
            return NextResponse.json({ message: 'No open tournament found to test', logs });
        }

        log(`Target Tournament: ${targetTournament.title} (${targetTournament._id})`);
        log(`Entry Fee: ${targetTournament.entryFee}, Max Slots: ${targetTournament.maxSlots}, Joined: ${targetTournament.joinedCount}`);

        // 2. Create Test User
        const testEmail = `testuser_${Date.now()}@example.com`;
        const testUser = await User.create({
            name: 'Test Debug User',
            email: testEmail,
            inGameName: 'DebugPlayer',
            freeFireUid: '1234567890',
            password: 'password123',
            walletBalance: 1000,
            role: 'user' // Correct enum value
        });
        log(`Test User Created: ${testUser.email} (${testUser._id}), Balance: ${testUser.walletBalance}`);

        // 3. Simulate Join Logic
        if (targetTournament.joinedCount >= targetTournament.maxSlots) {
            log('Tournament is full!');
            return NextResponse.json({ message: 'Tournament Full', logs });
        }

        if (testUser.walletBalance < targetTournament.entryFee) {
            log('Insufficient Balance (Unexpected)');
            return NextResponse.json({ message: 'Insufficient Balance', logs });
        }

        testUser.walletBalance -= targetTournament.entryFee;
        log(`Deducted fee. New Balance: ${testUser.walletBalance}`);

        const participantData = {
            userId: testUser._id,
            inGameName: testUser.inGameName,
            uid: testUser.freeFireUid, // Correct field
            teammates: []
        };

        targetTournament.participants.push(participantData);
        targetTournament.joinedCount += 1;
        log('Participant added to list');

        const transaction = new Transaction({
            user: testUser._id,
            amount: -targetTournament.entryFee,
            type: 'entry_fee',
            description: `Joined Tournament: ${targetTournament.title} (DEBUG)`,
            status: 'approved'
        });

        testUser.transactions = testUser.transactions || [];
        testUser.transactions.push(transaction._id);

        log('Transaction created');

        await Promise.all([
            testUser.save(),
            targetTournament.save(),
            transaction.save()
        ]);

        log('Saved successfully!');

        const verifyT = await Tournament.findById(targetTournament._id);
        const joined = verifyT.participants.some((p: any) => p.userId.toString() === testUser._id.toString());
        log(`Verification: User is in participants list? ${joined}`);

        return NextResponse.json({ success: true, logs });

    } catch (error: any) {
        log(`ERROR: ${error.message}`);
        console.error(error);
        return NextResponse.json({ success: false, logs, error: error.message }, { status: 500 });
    }
}
