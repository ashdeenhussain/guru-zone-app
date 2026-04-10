import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/db';
import Tournament from '@/models/Tournament';
import User from '@/models/User';
import Transaction from '@/models/Transaction';
import { getServerSession } from 'next-auth';
import { authOptions, hasPermission } from '@/lib/auth';
import bcrypt from 'bcryptjs';

// ─────────────────────────────────────────────────────────────────────────────
// Constants (must mirror production values)
// ─────────────────────────────────────────────────────────────────────────────
const PLATFORM_FEE_PCT = 0.10;       // 10% rake on prize pool
const TRUST_SCORE_MIN_TO_HOST = 80;  // Users below 80 cannot create matches
const TRUST_HAPPY_PATH_BONUS = 2;    // +2 for clean match (both players)
const TRUST_DISPUTE_WIN_BONUS = 5;   // +5 for winning an admin-resolved dispute
const TRUST_DISPUTE_LOSE_PENALTY = -10; // −10 for losing / ghosting

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────
interface TestResult {
    test: string;
    passed: boolean;
    details: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// Helpers — mirror real DB layer (no HTTP calls)
// ─────────────────────────────────────────────────────────────────────────────

/** Update a user's trust score, clamped to [0, 100]. Returns the new score. */
async function updateTrustScore(userId: string, delta: number): Promise<number> {
    const user = await User.findById(userId);
    if (!user) throw new Error(`User ${userId} not found`);
    const newScore = Math.max(0, Math.min(100, (user.trustScore ?? 100) + delta));
    user.trustScore = newScore;
    await user.save();
    return newScore;
}

/**
 * Simulate createMatch — checks trust gate, deducts fee from host, creates tournament.
 * Throws a { status, message } object on business-rule violations so callers can
 * catch it and assert the expected error.
 */
async function createMatch(
    hostUser: any,
    entryCoinAmount: number,
    title: string
): Promise<any> {
    // Trust Score gate (mirrors 80% restriction logic)
    if ((hostUser.trustScore ?? 100) < TRUST_SCORE_MIN_TO_HOST) {
        const err: any = new Error('Trust Score too low to host a match');
        err.status = 403;
        throw err;
    }

    if (hostUser.walletBalance < entryCoinAmount) {
        const err: any = new Error('Insufficient balance');
        err.status = 400;
        throw err;
    }

    const grossPrize = entryCoinAmount * 2; // 2-player pool
    const platformFee = Math.floor(grossPrize * PLATFORM_FEE_PCT);
    const netPrize = grossPrize - platformFee;

    // Deduct entry fee from host
    hostUser.walletBalance -= entryCoinAmount;
    await hostUser.save();

    await Transaction.create({
        user: hostUser._id,
        amount: -entryCoinAmount,
        type: 'entry_fee',
        description: `[SIM] Entry fee for match: ${title}`,
        status: 'completed',
    });

    const startTime = new Date(Date.now() + 60 * 60 * 1000); // 1h from now

    const match = await Tournament.create({
        title,
        format: '1v1',
        gameType: 'CS',
        entryFee: entryCoinAmount,
        prizePool: grossPrize,
        prizeDistribution: { first: grossPrize, second: 0, third: 0 },
        maxSlots: 2,
        joinedCount: 1,
        startTime,
        status: 'Open',
        isVisible: false, // Hidden from real users
        createdBy: hostUser._id,
        participants: [{
            userId: hostUser._id,
            inGameName: hostUser.name,
            uid: '000000001',
        }],
    });

    return { match, netPrize, platformFee };
}

/**
 * Simulate joiner entering the match.
 * Deducts entry fee, adds participant, sets status to Live.
 */
async function joinMatch(match: any, joinerUser: any): Promise<void> {
    if (joinerUser.walletBalance < match.entryFee) {
        const err: any = new Error('Insufficient balance to join');
        err.status = 400;
        throw err;
    }

    joinerUser.walletBalance -= match.entryFee;
    await joinerUser.save();

    await Transaction.create({
        user: joinerUser._id,
        amount: -match.entryFee,
        type: 'entry_fee',
        description: `[SIM] Entry fee for joining: ${match.title}`,
        status: 'completed',
    });

    match.participants.push({
        userId: joinerUser._id,
        inGameName: joinerUser.name,
        uid: '000000002',
    });
    match.joinedCount = 2;
    match.status = 'Live';
    await match.save();
}

/**
 * Host declares they won. Moves match to Verifying and marks declared winner.
 */
async function declareWin(match: any, declaringUserId: string): Promise<void> {
    match.status = 'Verifying';
    match.verificationStatus = 'Pending';
    match.verificationStartedAt = new Date();
    // We store who declared as winners.rank1 (joiner can then agree or dispute)
    match.winners = { rank1: declaringUserId };
    await match.save();
}

/**
 * Joiner agrees with the result.
 * Pays 90% net prize to winner, gives +2 trust to BOTH (capped), marks Completed.
 */
async function agreeResult(match: any, winnerUser: any, loserUser: any): Promise<void> {
    const grossPrize = match.prizeDistribution?.first ?? match.prizePool;
    const platformFee = Math.floor(grossPrize * PLATFORM_FEE_PCT);
    const netPrize = grossPrize - platformFee;

    winnerUser.walletBalance += netPrize;
    winnerUser.totalWins = (winnerUser.totalWins ?? 0) + 1;
    winnerUser.netEarnings = (winnerUser.netEarnings ?? 0) + netPrize;
    await winnerUser.save();

    await Transaction.create({
        user: winnerUser._id,
        amount: netPrize,
        type: 'prize_winnings',
        description: `[SIM] Happy Path prize: ${match.title}`,
        status: 'completed',
        referenceId: match._id,
    });

    match.status = 'Completed';
    match.verificationStatus = 'Confirmed';
    match.resolvedAt = new Date();
    await match.save();

    // +2 trust both, capped at 100
    await updateTrustScore(winnerUser._id.toString(), TRUST_HAPPY_PATH_BONUS);
    await updateTrustScore(loserUser._id.toString(), TRUST_HAPPY_PATH_BONUS);
}

/**
 * Joiner disputes the declared result. Moves match to Disputed.
 */
async function disputeResult(match: any): Promise<void> {
    match.status = 'Disputed';
    match.disputeReason = '[SIM] Joiner disputes the result (simulation)';
    await match.save();
}

/**
 * Admin force-wins for a specified player.
 * Mirrors `resolve/route.ts` exactly: pays netPrize, +5 winner, −10 loser.
 */
async function adminForceWin(
    match: any,
    winnerUser: any,
    loserUser: any
): Promise<void> {
    const grossPrize = match.prizeDistribution?.first ?? match.prizePool;
    const platformFee = Math.floor(grossPrize * PLATFORM_FEE_PCT);
    const netPrize = grossPrize - platformFee;

    match.status = 'Completed';
    match.verificationStatus = 'Confirmed';
    match.adminNote = '[SIM] Admin force resolved';
    match.resolvedAt = new Date();
    match.winners = { rank1: winnerUser._id };
    await match.save();

    winnerUser.walletBalance += netPrize;
    winnerUser.totalWins = (winnerUser.totalWins ?? 0) + 1;
    winnerUser.netEarnings = (winnerUser.netEarnings ?? 0) + netPrize;
    await winnerUser.save();

    await Transaction.create({
        user: winnerUser._id,
        amount: netPrize,
        type: 'prize_winnings',
        description: `[SIM] Admin Force Win prize: ${match.title}`,
        status: 'completed',
        referenceId: match._id,
    });

    await updateTrustScore(winnerUser._id.toString(), TRUST_DISPUTE_WIN_BONUS);
    await updateTrustScore(loserUser._id.toString(), TRUST_DISPUTE_LOSE_PENALTY);
}

/**
 * Admin cancels match and refunds BOTH players 100% of entry fee.
 * Mirrors `resolve/route.ts` cancel_refund_both logic.
 */
async function adminCancelRefund(match: any, hostUser: any, joinerUser: any): Promise<void> {
    const entryFee = match.entryFee ?? 0;

    match.status = 'Cancelled';
    match.verificationStatus = 'Rejected';
    match.adminNote = '[SIM] Admin cancelled — full refund both';
    match.resolvedAt = new Date();
    await match.save();

    for (const user of [hostUser, joinerUser]) {
        if (entryFee > 0) {
            user.walletBalance += entryFee;
            await user.save();

            await Transaction.create({
                user: user._id,
                amount: entryFee,
                type: 'refund',
                description: `[SIM] Full refund cancel: ${match.title}`,
                status: 'completed',
                referenceId: match._id,
            });
        }
    }
}

/**
 * Force `updatedAt` and `verificationStartedAt` backward in time.
 * Uses findByIdAndUpdate with { timestamps: false } so Mongoose does NOT
 * auto-overwrite the timestamps we're deliberately setting.
 */
async function forceUpdatedAtInPast(matchId: string, hoursAgo: number): Promise<void> {
    const pastTime = new Date(Date.now() - hoursAgo * 60 * 60 * 1000);
    await Tournament.findByIdAndUpdate(
        matchId,
        { $set: { updatedAt: pastTime, verificationStartedAt: pastTime } },
        { timestamps: false } as any   // bypass auto-timestamp on this update
    );
}

/**
 * Manual inline simulation of the cron timeout check for a specific match.
 * If the match is in `Verifying` and verificationStartedAt > 2 hours ago →
 * declared winner receives the prize, the non-declaring player gets −10 trust.
 */
async function runTimeoutCronForMatch(
    match: any,
    winnerUser: any,
    loserUser: any
): Promise<void> {
    // Re-fetch fresh state (we updated it via raw collection above)
    const freshMatch = await Tournament.findById(match._id);
    if (!freshMatch) throw new Error('Match not found for cron simulation');

    if (freshMatch.status !== 'Verifying') {
        throw new Error(`Cron check: match is "${freshMatch.status}", expected "Verifying"`);
    }

    const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000);
    if (!freshMatch.verificationStartedAt || freshMatch.verificationStartedAt > twoHoursAgo) {
        throw new Error('Cron check: verificationStartedAt is not far enough in the past');
    }

    // --- Timeout resolution (same logic as production cron / resolve) ---
    const grossPrize = freshMatch.prizeDistribution?.first ?? freshMatch.prizePool;
    const platformFee = Math.floor(grossPrize * PLATFORM_FEE_PCT);
    const netPrize = grossPrize - platformFee;

    freshMatch.status = 'Completed';
    freshMatch.verificationStatus = 'Confirmed';
    freshMatch.adminNote = '[SIM] Auto-resolved by timeout cron simulation';
    freshMatch.resolvedAt = new Date();
    await freshMatch.save();

    winnerUser.walletBalance += netPrize;
    winnerUser.totalWins = (winnerUser.totalWins ?? 0) + 1;
    winnerUser.netEarnings = (winnerUser.netEarnings ?? 0) + netPrize;
    await winnerUser.save();

    await Transaction.create({
        user: winnerUser._id,
        amount: netPrize,
        type: 'prize_winnings',
        description: `[SIM] Timeout cron prize: ${freshMatch.title}`,
        status: 'completed',
        referenceId: freshMatch._id,
    });

    await updateTrustScore(winnerUser._id.toString(), 0); // No bonus for timeout winner
    await updateTrustScore(loserUser._id.toString(), TRUST_DISPUTE_LOSE_PENALTY); // −10 for ghosting
}

// ─────────────────────────────────────────────────────────────────────────────
// Test wrapper — catches errors and returns a structured result
// ─────────────────────────────────────────────────────────────────────────────
async function runTest(
    name: string,
    fn: () => Promise<string>
): Promise<TestResult> {
    try {
        const details = await fn();
        return { test: name, passed: true, details };
    } catch (err: any) {
        return { test: name, passed: false, details: err.message ?? String(err) };
    }
}

// ─────────────────────────────────────────────────────────────────────────────
// Route Handler
// ─────────────────────────────────────────────────────────────────────────────
export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
    try {
        // ── Security: Admin-only + Explicit Toggle ──────────────────────────────
        if (process.env.ENABLE_DANGEROUS_SIMULATION !== 'true') {
            return NextResponse.json(
                { success: false, error: 'Simulation is disabled. Set ENABLE_DANGEROUS_SIMULATION=true to enable.' },
                { status: 403 }
            );
        }

        const { searchParams } = new URL(req.url);
        const secret = searchParams.get('secret') || req.headers.get('x-simulation-secret');
        const isSecretValid = secret === process.env.NEXTAUTH_SECRET;

        const session = await getServerSession(authOptions);
        if (!isSecretValid && (!hasPermission(session as any, 'manage_system'))) {
            return NextResponse.json(
                { success: false, error: 'Unauthorized. Requires manage_system permission or valid secret.' },
                { status: 403 }
            );
        }

        await connectToDatabase();

        // ── Clean Slate: Tear down previous simulation data ────────────────────
        await Tournament.deleteMany({
            $or: [
                { title: /^\[SIM\]/ },
                { title: /^\[E2E\]/ }
            ]
        });
        await User.deleteMany({
            email: {
                $in: ['sim_host@test.com', 'sim_joiner@test.com', 'sim_toxic@test.com']
            }
        });

        // ── Setup: Create 3 dummy users ────────────────────────────────────────
        const hashedPw = await bcrypt.hash('SimPassword123!', 1);

        const usersToCreate = [
            {
                name: 'SimHostUser',
                email: 'sim_host@test.com',
                password: hashedPw,
                role: 'user',
                trustScore: 100,
                walletBalance: 500,
                inGameName: 'SimHost',
                freeFireUid: '111111111',
                hasCompletedOnboarding: true,
            },
            {
                name: 'SimJoinerUser',
                email: 'sim_joiner@test.com',
                password: hashedPw,
                role: 'user',
                trustScore: 100,
                walletBalance: 500,
                inGameName: 'SimJoiner',
                freeFireUid: '222222222',
                hasCompletedOnboarding: true,
            },
            {
                name: 'SimToxicUser',
                email: 'sim_toxic@test.com',
                password: hashedPw,
                role: 'user',
                trustScore: 75,
                walletBalance: 500,
                inGameName: 'SimToxic',
                freeFireUid: '333333333',
                hasCompletedOnboarding: true,
            }
        ];

        await User.insertMany(usersToCreate);

        const hostUser = await User.findOne({ email: 'sim_host@test.com' });
        const joinerUser = await User.findOne({ email: 'sim_joiner@test.com' });
        const toxicUser = await User.findOne({ email: 'sim_toxic@test.com' });

        const adminUser = await User.findOneAndUpdate(
            { email: 'testadmin@example.com' },
            {
                $set: {
                    name: 'TestAdmin',
                    password: hashedPw,
                    role: 'admin',
                    hasCompletedOnboarding: true,
                }
            },
            { upsert: true, new: true }
        );

        const results: TestResult[] = [];

        // ═══════════════════════════════════════════════════════════════════════
        // TEST 1 — The 80% Restriction Block
        // ═══════════════════════════════════════════════════════════════════════
        results.push(await runTest('The 80% Restriction Block', async () => {
            let threwForbidden = false;
            let errorMsg = '';

            try {
                await createMatch(toxicUser, 10, '[SIM] T1: Restriction Block');
            } catch (err: any) {
                if (err.status === 403) {
                    threwForbidden = true;
                }
                errorMsg = err.message;
            }

            if (!threwForbidden) {
                throw new Error(
                    `Expected 403 Forbidden but got no error or different error: "${errorMsg}"`
                );
            }

            // Confirm no match was created
            const matchCreated = await Tournament.findOne({ title: '[SIM] T1: Restriction Block' });
            if (matchCreated) {
                throw new Error('Match was created despite the trust score restriction — FAIL');
            }

            // Reload toxic user to confirm balance did NOT change
            const freshToxic = await User.findById(toxicUser._id);
            if (freshToxic!.walletBalance !== 500) {
                throw new Error(
                    `ToxicUser balance changed (expected 500, got ${freshToxic!.walletBalance})`
                );
            }

            return `ToxicUser (score ${toxicUser.trustScore}) correctly blocked with 403. ` +
                `No match created. Balance unchanged at 500.`;
        }));

        // ═══════════════════════════════════════════════════════════════════════
        // TEST 2 — The Happy Path (Clean Match)
        // Entry: 10 coins each → Pool: 20 → 10% fee = 2 → Net Prize: 18
        // Host: 500 − 10 + 18 = 508. Joiner: 500 − 10 = 490.
        // Trust: both capped at 100.
        // ═══════════════════════════════════════════════════════════════════════
        results.push(await runTest('The Happy Path (Clean Match)', async () => {
            // Refresh users from DB (balances may have changed after previous test teardown)
            let host = await User.findById(hostUser._id);
            let joiner = await User.findById(joinerUser._id);

            const { match, netPrize } = await createMatch(host!, 10, '[SIM] T2: Happy Path');

            // Reload host after fee deduction
            host = await User.findById(hostUser._id);
            await joinMatch(match, joiner!);

            // Reload joiner after fee deduction
            joiner = await User.findById(joinerUser._id);
            host = await User.findById(hostUser._id);

            await declareWin(match, host!._id.toString());
            await agreeResult(match, host!, joiner!);

            // ── Assertions ──
            const finalHost = await User.findById(hostUser._id);
            const finalJoiner = await User.findById(joinerUser._id);

            const expectedHostBalance = 490 + netPrize; // Was 500, paid 10, got netPrize
            // netPrize = 20 - 2 = 18 → expectedHostBalance = 490 + 18 = 508
            if (finalHost!.walletBalance !== expectedHostBalance) {
                throw new Error(
                    `HostUser balance mismatch: expected ${expectedHostBalance}, ` +
                    `got ${finalHost!.walletBalance}`
                );
            }

            const expectedJoinerBalance = 490; // Paid 10, won nothing
            if (finalJoiner!.walletBalance !== expectedJoinerBalance) {
                throw new Error(
                    `JoinerUser balance mismatch: expected ${expectedJoinerBalance}, ` +
                    `got ${finalJoiner!.walletBalance}`
                );
            }

            // Both trust scores should be capped at 100 (100 + 2 → capped)
            if (finalHost!.trustScore !== 100) {
                throw new Error(`HostUser trustScore: expected 100, got ${finalHost!.trustScore}`);
            }
            if (finalJoiner!.trustScore !== 100) {
                throw new Error(`JoinerUser trustScore: expected 100, got ${finalJoiner!.trustScore}`);
            }

            return `HostUser balance: 500 → ${finalHost!.walletBalance} (net prize ${netPrize} after 10% fee). ` +
                `JoinerUser balance: 500 → ${finalJoiner!.walletBalance}. ` +
                `Both trust scores capped at 100 (+2 bonus). PASS.`;
        }));

        // ═══════════════════════════════════════════════════════════════════════
        // TEST 3 — The Fake Dispute (Admin Punishes Joiner)
        // HostUser gets prize + trustScore capped at 100 (+5 → but already 100 from T2)
        // JoinerUser: 100 − 10 = 90
        // ═══════════════════════════════════════════════════════════════════════
        results.push(await runTest('The Fake Dispute (Admin Punishes Joiner)', async () => {
            let host = await User.findById(hostUser._id);
            let joiner = await User.findById(joinerUser._id);

            const hostBalanceBefore = host!.walletBalance;
            const joinerTrustBefore = joiner!.trustScore;

            const { match, netPrize } = await createMatch(host!, 10, '[SIM] T3: Fake Dispute');

            host = await User.findById(hostUser._id); // Reload after fee deduction
            joiner = await User.findById(joinerUser._id);

            await joinMatch(match, joiner!);

            host = await User.findById(hostUser._id);
            joiner = await User.findById(joinerUser._id);

            await declareWin(match, host!._id.toString());
            await disputeResult(match);
            await adminForceWin(match, host!, joiner!);

            // ── Assertions ──
            const finalHost = await User.findById(hostUser._id);
            const finalJoiner = await User.findById(joinerUser._id);

            // Host should have received prize (net) after paying entry fee
            const expectedHostBalance = (hostBalanceBefore - 10) + netPrize;
            if (finalHost!.walletBalance !== expectedHostBalance) {
                throw new Error(
                    `HostUser balance mismatch: expected ${expectedHostBalance}, ` +
                    `got ${finalHost!.walletBalance}`
                );
            }

            // Host trust: capped at 100 (was 100, +5 → still 100)
            const expectedHostTrust = Math.min(100, host!.trustScore + TRUST_DISPUTE_WIN_BONUS);
            if (finalHost!.trustScore !== expectedHostTrust) {
                throw new Error(
                    `HostUser trustScore: expected ${expectedHostTrust}, got ${finalHost!.trustScore}`
                );
            }

            // Joiner trust: was joinerTrustBefore, now −10
            const expectedJoinerTrust = Math.max(0, joinerTrustBefore - 10);
            if (finalJoiner!.trustScore !== expectedJoinerTrust) {
                throw new Error(
                    `JoinerUser trustScore: expected ${expectedJoinerTrust}, ` +
                    `got ${finalJoiner!.trustScore}`
                );
            }

            return `HostUser received ${netPrize} coin prize. Balance: ${finalHost!.walletBalance}. ` +
                `Trust: capped at ${finalHost!.trustScore}. ` +
                `JoinerUser trustScore: ${joinerTrustBefore} → ${finalJoiner!.trustScore} (−10 penalty). PASS.`;
        }));

        // ═══════════════════════════════════════════════════════════════════════
        // TEST 4 — The Sore Loser Timeout (Cron Simulation)
        // Host declares win → force updatedAt 3h in past → run cron → Host gets prize, Joiner −10
        // ═══════════════════════════════════════════════════════════════════════
        results.push(await runTest('The Sore Loser Timeout (Cron Simulation)', async () => {
            let host = await User.findById(hostUser._id);
            let joiner = await User.findById(joinerUser._id);

            const joinerTrustBefore = joiner!.trustScore;

            const { match, netPrize } = await createMatch(host!, 10, '[SIM] T4: Timeout');

            host = await User.findById(hostUser._id);
            joiner = await User.findById(joinerUser._id);

            await joinMatch(match, joiner!);

            host = await User.findById(hostUser._id);
            joiner = await User.findById(joinerUser._id);

            await declareWin(match, host!._id.toString());

            // Force the match's timestamps 4 hours into the past (well beyond the 2h threshold)
            await forceUpdatedAtInPast(match._id.toString(), 4);

            // Reload users to get current state before cron runs
            host = await User.findById(hostUser._id);
            joiner = await User.findById(joinerUser._id);

            // Simulate cron timeout resolution
            await runTimeoutCronForMatch(match, host!, joiner!);

            // ── Assertions ──
            const finalHost = await User.findById(hostUser._id);
            const finalJoiner = await User.findById(joinerUser._id);

            // Verify match is Completed
            const finalMatch = await Tournament.findById(match._id);
            if (finalMatch!.status !== 'Completed') {
                throw new Error(
                    `Match status should be "Completed", got "${finalMatch!.status}"`
                );
            }

            // Host should have received prize
            if (finalHost!.walletBalance <= (host!.walletBalance - netPrize)) {
                throw new Error(
                    `HostUser did not receive prize. Balance: ${finalHost!.walletBalance}`
                );
            }

            // Joiner −10 trust
            const expectedJoinerTrust = Math.max(0, joinerTrustBefore - 10);
            if (finalJoiner!.trustScore !== expectedJoinerTrust) {
                throw new Error(
                    `JoinerUser trustScore: expected ${expectedJoinerTrust}, ` +
                    `got ${finalJoiner!.trustScore}`
                );
            }

            return `Timeout triggered after forcing updatedAt 3h in the past. ` +
                `HostUser received prize (${netPrize} coins). Balance: ${finalHost!.walletBalance}. ` +
                `JoinerUser trustScore: ${joinerTrustBefore} → ${finalJoiner!.trustScore} (−10 for ghosting). PASS.`;
        }));

        // ═══════════════════════════════════════════════════════════════════════
        // TEST 5 — Full Refund (Match Cancelled)
        // Both users get 100% entry fee back. Trust scores unchanged.
        // ═══════════════════════════════════════════════════════════════════════
        results.push(await runTest('Full Refund (Match Cancelled)', async () => {
            let host = await User.findById(hostUser._id);
            let joiner = await User.findById(joinerUser._id);

            const hostBalanceBefore = host!.walletBalance;
            const joinerBalanceBefore = joiner!.walletBalance;
            const hostTrustBefore = host!.trustScore;
            const joinerTrustBefore = joiner!.trustScore;

            const { match } = await createMatch(host!, 10, '[SIM] T5: Full Refund');

            host = await User.findById(hostUser._id);
            joiner = await User.findById(joinerUser._id);

            await joinMatch(match, joiner!);

            // At this point both have paid the entry fee:
            // host: hostBalanceBefore - 10
            // joiner: joinerBalanceBefore - 10

            host = await User.findById(hostUser._id);
            joiner = await User.findById(joinerUser._id);

            await adminCancelRefund(match, host!, joiner!);

            // ── Assertions ──
            const finalHost = await User.findById(hostUser._id);
            const finalJoiner = await User.findById(joinerUser._id);

            if (finalHost!.walletBalance !== hostBalanceBefore) {
                throw new Error(
                    `HostUser balance mismatch after refund: expected ${hostBalanceBefore}, ` +
                    `got ${finalHost!.walletBalance}`
                );
            }

            if (finalJoiner!.walletBalance !== joinerBalanceBefore) {
                throw new Error(
                    `JoinerUser balance mismatch after refund: expected ${joinerBalanceBefore}, ` +
                    `got ${finalJoiner!.walletBalance}`
                );
            }

            // Trust scores must be completely unchanged
            if (finalHost!.trustScore !== hostTrustBefore) {
                throw new Error(
                    `HostUser trustScore changed: expected ${hostTrustBefore}, ` +
                    `got ${finalHost!.trustScore}`
                );
            }

            if (finalJoiner!.trustScore !== joinerTrustBefore) {
                throw new Error(
                    `JoinerUser trustScore changed: expected ${joinerTrustBefore}, ` +
                    `got ${finalJoiner!.trustScore}`
                );
            }

            return `Both users fully refunded. ` +
                `HostUser: ${hostBalanceBefore - 10} → ${finalHost!.walletBalance} (restored). ` +
                `JoinerUser: ${joinerBalanceBefore - 10} → ${finalJoiner!.walletBalance} (restored). ` +
                `Trust scores unchanged (Host: ${finalHost!.trustScore}, Joiner: ${finalJoiner!.trustScore}). PASS.`;
        }));

        // ─── Final Summary ─────────────────────────────────────────────────────
        const passed = results.filter(r => r.passed).length;
        const total = results.length;
        const allPassed = passed === total;

        return NextResponse.json({
            status: allPassed ? 'success' : 'partial_failure',
            summary: `${passed}/${total} tests passed`,
            simulationUsers: {
                host: 'sim_host@test.com',
                joiner: 'sim_joiner@test.com',
                toxic: 'sim_toxic@test.com',
                note: 'These users persist in the DB after the run for manual inspection.',
            },
            results,
        });

    } catch (error: any) {
        console.error('[BattleZone Simulation] Fatal error:', error);
        return NextResponse.json(
            { status: 'error', error: error.message },
            { status: 500 }
        );
    }
}
