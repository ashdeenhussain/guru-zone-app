import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/db';
import Tournament from '@/models/Tournament';
import User from '@/models/User';
import Transaction from '@/models/Transaction';
import Notification from '@/models/Notification';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { sendPushNotification } from '@/lib/webpush';

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

        const tournament = await Tournament.findById(id);
        if (!tournament) return NextResponse.json({ success: false, error: 'Tournament not found' }, { status: 404 });

        const userId = (session.user as any).id;
        const isHost = tournament.createdBy?.toString() === userId;
        const isAdmin = (session.user as any).role === 'admin';

        if (!isHost && !isAdmin) {
            return NextResponse.json({ success: false, error: 'Only Host can declare results' }, { status: 403 });
        }

        if (tournament.status === 'Completed' || tournament.status === 'Cancelled') {
            return NextResponse.json({ success: false, error: 'Match already finished' }, { status: 400 });
        }

        // Validate winnerId is a participant or the host
        const allIds = [
            tournament.createdBy?.toString(),
            ...tournament.participants.map((p: any) => (p.userId._id || p.userId).toString())
        ].filter(Boolean);

        if (!allIds.includes(winnerId.toString())) {
            return NextResponse.json({ success: false, error: 'Winner must be a match participant' }, { status: 400 });
        }

        tournament.winners = { rank1: winnerId };
        tournament.winnerScreenshot = winnerScreenshot;
        tournament.status = 'pending_verification';
        tournament.verificationStatus = 'Pending';
        tournament.verificationStartedAt = new Date();

        await tournament.save();

        // ── Push Notification (To Opponents) ──
        try {
            const opponentIds = tournament.participants
                .map((p: any) => p.userId?._id?.toString() || p.userId?.toString())
                .filter((pId: string) => pId && pId !== winnerId.toString());

            await Promise.all(opponentIds.map((pId: string) => 
                sendPushNotification(pId, {
                    title: '⏳ Result Declared!',
                    body: `The Host claims victory in "${tournament.title}". You have 30 minutes to verify or the prize will be auto-transferred.`,
                    url: tournament.isOfficial ? `/tournaments/${tournament._id}` : `/battle-zone/${tournament._id}`
                })
            ));
        } catch (pushErr) {
            console.error('[ResultAPI] Push notification failed:', pushErr);
        }

        return NextResponse.json({ success: true, message: 'Winner declared. Pending verification.' });
    } catch (error: any) {
        console.error("Error in winner declaration (POST):", error.message, error.stack);
        return NextResponse.json({ success: false, error: "Declaration failed: " + error.message }, { status: 500 });
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

        const tournament = await Tournament.findById(id);
        if (!tournament) return NextResponse.json({ success: false, error: 'Tournament not found' }, { status: 404 });

        const userId = (session.user as any).id;

        // ─── HOST FORCE DISPUTE (after 30-min timer) ───────────────────────────
        if (action === 'host_force_dispute') {
            const isHost = tournament.createdBy?.toString() === userId;
            const isAdmin = (session.user as any).role === 'admin';

            if (!isHost && !isAdmin) {
                return NextResponse.json({ success: false, error: 'Only Host/Admin can force dispute' }, { status: 403 });
            }

            if (tournament.status !== 'pending_verification') {
                return NextResponse.json({ success: false, error: 'Match is not in verification stage' }, { status: 400 });
            }

            // Check 30-min timer (bypass for admin)
            if (!isAdmin) {
                const startTime = new Date(tournament.verificationStartedAt).getTime();
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
                return NextResponse.json({ success: false, error: 'Proof screenshot required to claim prize' }, { status: 400 });
            }

            tournament.status = 'disputed';
            tournament.verificationStatus = 'Rejected';
            tournament.disputeReason = reason || 'Host claimed win — joiner was unresponsive after 30 minutes';
            tournament.disputeProof = proofUrl;

            await tournament.save();
            return NextResponse.json({ success: true, message: 'Match sent to Admin for review. An admin will distribute the prize.' });
        }

        // ─── JOINER VERIFY (confirm / reject) ──────────────────────────────────
        // Get the declared winner ID from the saved field
        const rank1 = tournament.winners?.rank1;
        const declaredWinnerId = (rank1?._id || rank1)?.toString();

        if (!declaredWinnerId) {
            return NextResponse.json({ success: false, error: 'No winner has been declared yet' }, { status: 400 });
        }

        if (tournament.status !== 'pending_verification') {
            return NextResponse.json({ success: false, error: 'Match is not in verification stage' }, { status: 400 });
        }

        // Only a participant can verify
        const isParticipant = tournament.participants.some((p: any) =>
            (p.userId._id?.toString() || p.userId?.toString()) === userId
        );
        // The host is also a valid verifier if they are NOT the declared winner
        const isHost = tournament.createdBy?.toString() === userId;

        if (!isParticipant && !isHost) {
            return NextResponse.json({ success: false, error: 'Only match participants can verify the result' }, { status: 403 });
        }

        if (action === 'confirm') {
            console.log(`[VERIFY] Confirming result for tournament ${tournament._id}. Declared Winner: ${declaredWinnerId}`);

            // 1. Pay the DECLARED WINNER
            const winner = await User.findById(declaredWinnerId);
            if (!winner) {
                console.error(`[VERIFY ERROR] Winner user not found: ${declaredWinnerId}`);
                return NextResponse.json({ success: false, error: 'Winner not found' }, { status: 404 });
            }

            console.log(`[VERIFY] Processing payout for winner: ${winner.username || winner.name} (${winner._id})`);

            const grossPrize = tournament.prizeDistribution?.first || tournament.prizePool;
            const PLATFORM_FEE_PCT = 0.10; // 10% rake
            const platformFee = Math.floor(grossPrize * PLATFORM_FEE_PCT);
            const netPrize = grossPrize - platformFee;

            try {
                // Create Transaction first
                const transaction = await Transaction.create({
                    user: declaredWinnerId,
                    amount: netPrize,
                    type: 'prize_winnings',
                    description: `${tournament.isOfficial ? 'Won Tournament' : 'Won Battle Zone'}: ${tournament.title} (10% platform fee applied — gross: ${grossPrize}, fee: ${platformFee})`,
                    status: 'completed',
                    referenceId: tournament._id
                });
                console.log(`[VERIFY] Transaction created: ${transaction._id}`);

                // Update Winner Balance
                winner.walletBalance += netPrize;
                winner.totalWins = (winner.totalWins || 0) + 1;
                winner.netEarnings = (winner.netEarnings || 0) + netPrize;
                await winner.save();
                console.log(`[VERIFY] Winner balance updated. New balance: ${winner.walletBalance}`);

                // 2. Finalize Tournament Status
                tournament.status = 'Completed';
                tournament.verificationStatus = 'Confirmed';
                await tournament.save();
                console.log(`[VERIFY] Tournament marked as Completed.`);

            } catch (payoutError: any) {
                console.error(`[VERIFY CRITICAL ERROR] Payout execution failed:`, payoutError);
                return NextResponse.json({ success: false, error: 'Failed to process payout: ' + payoutError.message }, { status: 500 });
            }

            // 3. Trust Score Updates (+2 for clean match)
            console.log(`[VERIFY] Updating trust scores...`);
            const playersToUpdate = [
                { id: tournament.createdBy?.toString(), role: "Host" },
                { id: userId, role: "Joiner" }
            ];

            await Promise.all(playersToUpdate.map(async (p) => {
                if (p.id) {
                    try {
                        const user = await User.findById(p.id);
                        if (user) {
                            const oldScore = user.trustScore || 100;
                            user.trustScore = Math.min(100, oldScore + 2);
                            await user.save();

                            await Notification.create({
                                userId: p.id,
                                title: 'Trust Score Increased',
                                message: `+2 Trust Score for a clean match resolution. Current: ${user.trustScore}%`,
                                type: 'success'
                            });
                        }
                    } catch (tsError) {
                        console.warn(`[VERIFY WARNING] Failed to update trust score for ${p.id}:`, tsError);
                    }
                }
            }));

            return NextResponse.json({ success: true, message: `Result confirmed! Prize distributed and Trust Scores updated.` });

        } else if (action === 'reject') {
            // Joiner disputes with proof
            if (!reason) {
                return NextResponse.json({ success: false, error: 'Please provide a reason for the dispute' }, { status: 400 });
            }
            if (!proofUrl) {
                return NextResponse.json({ success: false, error: 'Proof screenshot is required to dispute' }, { status: 400 });
            }

            tournament.status = 'disputed';
            tournament.verificationStatus = 'Rejected';
            tournament.disputeReason = reason;
            tournament.disputeProof = proofUrl;
            await tournament.save();

            return NextResponse.json({ success: true, message: 'Dispute submitted. An admin will review and distribute the prize.' });

        } else {
            return NextResponse.json({ success: false, error: 'Invalid action. Use "confirm" or "reject".' }, { status: 400 });
        }

    } catch (error: any) {
        console.error("Error in confirmation/dispute (PUT):", error.message, error.stack);
        return NextResponse.json({ success: false, error: "Action failed: " + error.message }, { status: 500 });
    }
}
