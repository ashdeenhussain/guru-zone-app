import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/db';
import BattleMatch from '@/models/BattleMatch';
import User from '@/models/User';
import Transaction from '@/models/Transaction';
import Notification from '@/models/Notification';
import Escrow from '@/models/Escrow';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { sendPushNotification } from '@/lib/webpush';
import SystemSetting from '@/models/SystemSetting';

async function getBattleZonePointsEarnedToday(userId: string, rules?: any) {
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    const matches = await BattleMatch.find({
        status: 'completed',
        entryFee: { $gt: 0 },
        updatedAt: { $gte: startOfToday },
        $or: [
            { createdBy: userId },
            { 'participants.userId': userId }
        ]
    }).sort({ updatedAt: 1 }).lean();

    let totalPoints = 0;
    const opponentMatchCounts: Record<string, number> = {};

    const oppLimit = rules?.bzOpponentLimitPerDay ?? 2;

    for (const m of matches) {
        const hId = m.createdBy.toString();
        const wId = m.winners?.rank1?.toString();
        const isHost = hId === userId;
        const isWinner = wId === userId;

        let oppId = "";
        if (isHost) {
            oppId = m.participants[0]?.userId?.toString() || "";
        } else {
            oppId = hId;
        }

        if (oppId) {
            opponentMatchCounts[oppId] = (opponentMatchCounts[oppId] || 0) + 1;
            if (opponentMatchCounts[oppId] > oppLimit) {
                continue;
            }
        }

        let pts = 0;
        if (isHost && isWinner) {
            pts = rules?.bzHostWinnerPoints ?? 10;
        } else if (isHost) {
            pts = rules?.bzHostPoints ?? 5;
        } else if (isWinner) {
            pts = rules?.bzWinnerPoints ?? 5;
        }

        totalPoints += pts;
    }

    return totalPoints;
}

// POST: Host Declares Winner
export async function POST(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || !session.user) {
            return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
        }

        await connectToDatabase();
        const { id } = await params;
        const body = await req.json();
        const { winnerId, winnerScreenshot } = body;

        if (!winnerId) {
            return NextResponse.json({ success: false, error: 'Winner ID required' }, { status: 400 });
        }

        if (!winnerScreenshot) {
            return NextResponse.json({ success: false, error: 'Victory screenshot is required to declare a winner' }, { status: 400 });
        }

        const match = await BattleMatch.findById(id);
        if (!match) return NextResponse.json({ success: false, error: 'Match not found' }, { status: 404 });

        const userId = (session.user as any).id;
        const isHost = match.createdBy?.toString() === userId;
        const isAdmin = (session.user as any).role === 'admin';

        if (!isHost && !isAdmin) {
            return NextResponse.json({ success: false, error: 'Only Host can declare results' }, { status: 403 });
        }

        if (match.status === 'completed' || match.status === 'cancelled') {
            return NextResponse.json({ success: false, error: 'Match already finished' }, { status: 400 });
        }

        // Validate winnerId is a participant or the host
        const allIds = [
            match.createdBy?.toString(),
            ...match.participants.map((p: any) => (p.userId._id || p.userId).toString())
        ].filter(Boolean);

        if (!allIds.includes(winnerId.toString())) {
            return NextResponse.json({ success: false, error: 'Winner must be a match participant' }, { status: 400 });
        }

        match.winners = { rank1: winnerId };
        match.winnerScreenshot = winnerScreenshot;
        match.status = 'pending_verification';
        match.verificationStatus = 'Pending';
        match.verificationStartedAt = new Date();

        await match.save();

        // ── TRIGGER NOTIFICATION (Joiner) ──
        try {
            const opponentIds = match.participants
                .map((p: any) => p.userId?._id?.toString() || p.userId?.toString())
                .filter((pId: string) => pId && pId !== winnerId.toString());

            await Promise.all(opponentIds.map(async (pId: string) => {
                await Notification.create({
                    userId: pId,
                    title: '🏆 Result Declared!',
                    message: `The Host has announced the winner in "${match.title}". You have 30 minutes to Accept or Dispute.`,
                    type: 'warning',
                    link: `/battle-zone/${match._id}`
                });

                sendPushNotification(pId, {
                    title: '🏆 Result Declared!',
                    body: `Host claims victory in "${match.title}". Verify now or it auto-resolves in 30 mins.`,
                    url: `/battle-zone/${match._id}`
                }).catch(console.error);
            }));
        } catch (notifyErr) {
            console.error('[ResultDeclareNotify] Failed:', notifyErr);
        }

        return NextResponse.json({ success: true, message: 'Winner declared. Pending verification.' });
    } catch (error: any) {
        console.error("Error in battle winner declaration (POST):", error.message);
        return NextResponse.json({ success: false, error: "Declaration failed" }, { status: 500 });
    }
}

// PUT: Joiner (non-winner) Confirms or Disputes Result
export async function PUT(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || !session.user) {
            return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
        }

        await connectToDatabase();
        const { id } = await params;
        const body = await req.json();
        const { action, reason, proofUrl } = body;

        const match = await BattleMatch.findById(id);
        if (!match) return NextResponse.json({ success: false, error: 'Match not found' }, { status: 404 });

        const userId = (session.user as any).id;

        // HOST FORCE DISPUTE
        if (action === 'host_force_dispute') {
            const isHost = match.createdBy?.toString() === userId;
            const isAdmin = (session.user as any).role === 'admin';

            if (!isHost && !isAdmin) {
                return NextResponse.json({ success: false, error: 'Only Host/Admin can force dispute' }, { status: 403 });
            }

            if (match.status !== 'pending_verification') {
                return NextResponse.json({ success: false, error: 'Match is not in verification stage' }, { status: 400 });
            }

            if (!isAdmin) {
                const startTime = new Date(match.verificationStartedAt as any).getTime();
                const timeDiff = Date.now() - startTime;
                if (timeDiff < 30 * 60 * 1000) {
                    const remaining = Math.ceil((30 * 60 * 1000 - timeDiff) / 60000);
                    return NextResponse.json({
                        success: false,
                        error: `Cannot force dispute yet. ${remaining} minute(s) remaining.`
                    }, { status: 400 });
                }
            }

            if (!proofUrl) {
                return NextResponse.json({ success: false, error: 'Proof screenshot required' }, { status: 400 });
            }

            match.status = 'disputed';
            match.verificationStatus = 'Rejected';
            match.disputeReason = reason || 'Host claimed win — joiner was unresponsive after 30 minutes';
            match.disputeProof = proofUrl;

            await match.save();
            return NextResponse.json({ success: true, message: 'Match sent to Admin for review.' });
        }

        // JOINER VERIFY
        const rank1 = match.winners?.rank1;
        const declaredWinnerId = (rank1?._id || rank1)?.toString();

        if (!declaredWinnerId) {
            return NextResponse.json({ success: false, error: 'No winner declared' }, { status: 400 });
        }

        if (match.status !== 'pending_verification') {
            return NextResponse.json({ success: false, error: 'Match not in verification stage' }, { status: 400 });
        }

        const isParticipant = match.participants.some((p: any) =>
            (p.userId._id?.toString() || p.userId?.toString()) === userId
        );
        const isHost = match.createdBy?.toString() === userId;

        if (!isParticipant && !isHost) {
            return NextResponse.json({ success: false, error: 'Access denied' }, { status: 403 });
        }

        if (action === 'confirm') {
            const winner = await User.findById(declaredWinnerId);
            if (!winner) return NextResponse.json({ success: false, error: 'Winner not found' }, { status: 404 });

            // Note: match.prizePool already has the platform fee deducted in create/route.ts
            // We distribute the full prizePool to the winner.
            const netPrize = match.prizePool;

            try {
                // ── AWARD RANK POINTS FOR BATTLE ZONE ──
                let hostPointsEarned = 0;
                let winnerPointsEarned = 0;

                if (match.entryFee > 0) {
                    const hostId = match.createdBy.toString();
                    const winnerId = declaredWinnerId.toString();

                    const startOfToday = new Date();
                    startOfToday.setHours(0, 0, 0, 0);

                    // Fetch settings for dynamic limits
                    const settings = await SystemSetting.findOne().lean();
                    const rules = settings?.rankRules || {
                        bzDailyPointsCap: 50,
                        bzOpponentLimitPerDay: 2,
                        bzHostPoints: 5,
                        bzWinnerPoints: 5,
                        bzHostWinnerPoints: 10
                    };

                    const matchCountToday = await BattleMatch.countDocuments({
                        status: 'completed',
                        entryFee: { $gt: 0 },
                        updatedAt: { $gte: startOfToday },
                        $or: [
                            { createdBy: hostId, 'participants.userId': winnerId },
                            { createdBy: winnerId, 'participants.userId': hostId }
                        ]
                    });

                    if (matchCountToday < (rules.bzOpponentLimitPerDay ?? 2)) {
                        const hostPtsToday = await getBattleZonePointsEarnedToday(hostId, rules);
                        const bzCap = rules.bzDailyPointsCap ?? 50;
                        
                        if (hostId === winnerId) {
                            if (hostPtsToday < bzCap) {
                                hostPointsEarned = Math.min(rules.bzHostWinnerPoints ?? 10, bzCap - hostPtsToday);
                                winner.rankPoints = (winner.rankPoints || 0) + hostPointsEarned;
                            }
                        } else {
                            if (hostPtsToday < bzCap) {
                                hostPointsEarned = Math.min(rules.bzHostPoints ?? 5, bzCap - hostPtsToday);
                                await User.findByIdAndUpdate(hostId, {
                                    $inc: { rankPoints: hostPointsEarned }
                                });
                            }

                            const winnerPtsToday = await getBattleZonePointsEarnedToday(winnerId, rules);
                            if (winnerPtsToday < bzCap) {
                                winnerPointsEarned = Math.min(rules.bzWinnerPoints ?? 5, bzCap - winnerPtsToday);
                                winner.rankPoints = (winner.rankPoints || 0) + winnerPointsEarned;
                            }
                        }
                    }
                }

                await Transaction.create({
                    user: declaredWinnerId,
                    amount: netPrize,
                    type: 'prize_winnings',
                    description: `Won Battle Zone: ${match.title} (10% fee applied)`,
                    status: 'completed',
                    referenceId: match._id
                });

                winner.walletBalance += netPrize;
                winner.totalWins = (winner.totalWins || 0) + 1;
                winner.netEarnings = (winner.netEarnings || 0) + netPrize;
                winner.battleZoneWins = (winner.battleZoneWins || 0) + 1;
                winner.battleZoneEarnings = (winner.battleZoneEarnings || 0) + netPrize;
                await winner.save();

                match.status = 'completed';
                match.verificationStatus = 'Confirmed';
                await match.save();

                // Send notifications for rank points
                const hostIdStr = match.createdBy.toString();
                const winnerIdStr = declaredWinnerId.toString();

                if (hostIdStr === winnerIdStr && hostPointsEarned > 0) {
                    await Notification.create({
                        userId: hostIdStr,
                        title: 'Battle Zone Rank Points! 🏆',
                        message: `You earned +${hostPointsEarned} Rank Points for hosting & winning match "${match.title}".`,
                        type: 'success',
                        link: `/battle-zone/${match._id}`
                    });
                } else {
                    if (hostPointsEarned > 0) {
                        await Notification.create({
                            userId: hostIdStr,
                            title: 'Battle Zone Rank Points! 🏆',
                            message: `You earned +${hostPointsEarned} Rank Points for hosting match "${match.title}".`,
                            type: 'success',
                            link: `/battle-zone/${match._id}`
                        });
                    }
                    if (winnerPointsEarned > 0) {
                        await Notification.create({
                            userId: winnerIdStr,
                            title: 'Battle Zone Rank Points! 🏆',
                            message: `You earned +${winnerPointsEarned} Rank Points for winning match "${match.title}".`,
                            type: 'success',
                            link: `/battle-zone/${match._id}`
                        });
                    }
                }

                // Update Escrow status
                if (match.escrowId) {
                    await Escrow.findByIdAndUpdate(match.escrowId, {
                        status: 'released',
                        releasedTo: declaredWinnerId,
                        releasedAt: new Date()
                    });
                }

                // Trust Score Updates
                const playersToUpdate = [match.createdBy?.toString(), userId].filter(Boolean);
                await Promise.all(playersToUpdate.map(async (pId) => {
                    const u = await User.findById(pId);
                    if (u) {
                        u.trustScore = Math.min(100, (u.trustScore || 100) + 2);
                        await u.save();
                        await Notification.create({
                            userId: pId,
                            title: 'Trust Score Increased',
                            message: `+2 Trust Score for clean match resolution.`,
                            type: 'success'
                        });
                    }
                }));

                return NextResponse.json({ success: true, message: `Result confirmed! Prize distributed.` });

            } catch (err: any) {
                return NextResponse.json({ success: false, error: 'Payout failed' }, { status: 500 });
            }

        } else if (action === 'reject') {
            if (!reason || !proofUrl) {
                return NextResponse.json({ success: false, error: 'Reason and proof required for dispute' }, { status: 400 });
            }

            match.status = 'disputed';
            match.verificationStatus = 'Rejected';
            match.disputeReason = reason;
            match.disputeProof = proofUrl;
            await match.save();

            // ── TRIGGER NOTIFICATION (Dispute - Host) ──
            try {
                const hostId = match.createdBy.toString();
                await Notification.create({
                    userId: hostId,
                    title: '⚠️ Match Disputed!',
                    message: `The joiner has disputed the result for "${match.title}". Admin will review video proof.`,
                    type: 'error',
                    link: `/battle-zone/${match._id}`
                });

                sendPushNotification(hostId, {
                    title: '⚠️ Match Disputed!',
                    body: `Your result for "${match.title}" is being disputed. Provide video proof to Admin.`,
                    url: `/battle-zone/${match._id}`
                }).catch(console.error);
            } catch (notifyErr) {
                console.error('[DisputeInitiateNotify] Failed:', notifyErr);
            }

            return NextResponse.json({ success: true, message: 'Dispute submitted for review.' });
        }

        return NextResponse.json({ success: false, error: 'Invalid action' }, { status: 400 });

    } catch (error: any) {
        return NextResponse.json({ success: false, error: "Action failed" }, { status: 500 });
    }
}
