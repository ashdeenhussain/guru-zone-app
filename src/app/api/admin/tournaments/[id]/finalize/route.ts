import { NextResponse } from 'next/server';
import connectToDB from '@/lib/db';
import Tournament from '@/models/Tournament';
import User from '@/models/User';
import Transaction from '@/models/Transaction';
import FinancialLog from '@/models/FinancialLog';
import { getServerSession } from 'next-auth';
import { authOptions, hasPermission } from '@/lib/auth';
import AdminActivity from '@/models/AdminActivity';
import Notification from '@/models/Notification';
import SystemSetting from '@/models/SystemSetting';
import mongoose from 'mongoose';

export async function POST(req: Request, context: { params: Promise<{ id: string }> }) {
    try {
        const session = await getServerSession(authOptions);
        if (!hasPermission(session, 'manage_tournaments')) {
            return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
        }

        await connectToDB();
        const params = await context.params;
        const { id } = params;
        const body = await req.json();
        
        // Sanitize winners: convert empty strings to undefined
        const winners = (body.winners ? Object.fromEntries(
            Object.entries(body.winners).map(([k, v]) => [k, v === '' ? undefined : v])
        ) : {}) as Record<string, any>;

        const adminId = session.user.id;
        const adminName = session.user.name;

        // Start MongoDB Session for Transaction
        const dbSession = await mongoose.startSession();
        let result: any = null;
        let finalWinners: Record<string, any> = winners;
        let totalAmountDistributed = 0;
        let paidPlayersCount = 0;

        try {
            await dbSession.withTransaction(async () => {
                const tournament = await Tournament.findById(id).session(dbSession);
                if (!tournament) {
                    throw new Error('Tournament not found');
                }

                // Ownership Check: Only creator or Super Admin can finalize
                const canManage = hasPermission(session, 'manage_system') || 
                                 (tournament.createdBy?.toString() === (session as any)?.user?.id);

                if (!canManage) {
                    throw new Error('Unauthorized: You can only finalize tournaments created by you.');
                }



                if (tournament.status === 'Completed' || tournament.prizeDistributed) {
                    throw new Error('Tournament is ALREADY COMPLETED. Prizes have been distributed.');
                }

                if (tournament.status !== 'Live' && tournament.status !== 'Open') {
                    throw new Error(`Status Error: Tournament is '${tournament.status}'. Must be Open or Live.`);
                }

                const prizes = tournament.prizeDistribution;

                totalAmountDistributed = 0;
                paidPlayersCount = 0;

                // Function to distribute prize (Wrapped in session)
                const distributePrize = async (userId: string, amount: number, rank: string) => {
                    if (!userId) return;
                    if (amount <= 0) return;

                    // 0. IDEMPOTENCY CHECK
                    // Check if a prize transaction already exists for this user and tournament
                    const existingTx = await Transaction.findOne({
                        user: userId,
                        referenceId: id,
                        type: 'prize_winnings'
                    }).session(dbSession);

                    if (existingTx) {
                        console.warn(`[Finalize] IDEMPOTENCY CHECK: Prize already awarded to ${userId} for tournament ${id}. Skipping.`);
                        return; // Skip payment
                    }

                    // 1. Update User Wallet & Stats
                    const updateFields: any = {
                        walletBalance: amount,
                        totalWins: 1,
                        netEarnings: amount
                    };
                    
                    if (tournament.isOfficial) {
                        updateFields.officialWins = 1;
                        updateFields.officialEarnings = amount;
                    } else {
                        updateFields.battleZoneWins = 1;
                        updateFields.battleZoneEarnings = amount;
                    }

                    await User.findByIdAndUpdate(userId, {
                        $inc: updateFields
                    }).session(dbSession);

                    // 2. Create Transaction Record
                    await Transaction.create([{
                        user: userId,
                        amount: amount,
                        type: 'prize_winnings',
                        description: `Prize for ${rank} Place in ${tournament.title}`,
                        referenceId: id,
                        status: 'approved'
                    }], { session: dbSession });

                    // 2.5. Record to FinancialLog
                    await FinancialLog.create([{
                        type: 'prize_winnings',
                        amount: amount,
                        currency: 'Coins',
                        userId: userId,
                        referenceId: id,
                        description: `Prize for ${rank} Place in ${tournament.title}`,
                        timestamp: new Date()
                    }], { session: dbSession });

                    totalAmountDistributed += amount;
                    paidPlayersCount++;
                };

                // Update kills for all participants if provided in request
                const kills = body.kills || {};
                console.log("[Finalize Route Debug] Incoming kills payload:", JSON.stringify(kills));
                for (const participant of tournament.participants) {
                    const pUserId = (participant.userId as any)?._id?.toString() || participant.userId?.toString();
                    const hasKey = pUserId && kills[pUserId] !== undefined;
                    console.log(`[Finalize Route Debug] Participant userId: ${participant.userId} (pUserId: ${pUserId}), hasKey in payload: ${hasKey}, payload value: ${kills[pUserId]}`);
                    if (hasKey) {
                        participant.kills = Number(kills[pUserId]) || 0;
                        console.log(`[Finalize Route Debug] Set participant.kills to: ${participant.kills}`);
                    }
                }
                tournament.markModified('participants');

                if (tournament.isPerKill) {
                    const perKillAmount = tournament.perKillAmount || 0;

                    for (const participant of tournament.participants) {
                        const pUserId = (participant.userId as any)?._id?.toString() || participant.userId?.toString();
                        if (!pUserId) continue;

                        const pKills = participant.kills || 0;
                        const rewardAmount = pKills * perKillAmount;

                        if (rewardAmount > 0) {
                            const existingTx = await Transaction.findOne({
                                user: pUserId,
                                referenceId: id,
                                type: 'prize_winnings'
                            }).session(dbSession);

                            if (existingTx) {
                                console.warn(`[Finalize] IDEMPOTENCY CHECK: Prize already awarded to ${pUserId} for tournament ${id}. Skipping.`);
                                continue;
                            }

                            const updateFields: any = {
                                walletBalance: rewardAmount,
                                netEarnings: rewardAmount,
                            };
                            
                            if (tournament.isOfficial) {
                                updateFields.officialEarnings = rewardAmount;
                            } else {
                                updateFields.battleZoneEarnings = rewardAmount;
                            }

                            await User.findByIdAndUpdate(pUserId, {
                                $inc: updateFields
                            }).session(dbSession);

                            await Transaction.create([{
                                user: pUserId,
                                amount: rewardAmount,
                                type: 'prize_winnings',
                                description: `Elimination Winnings (${pKills} kills) in ${tournament.title}`,
                                referenceId: id,
                                status: 'approved'
                            }], { session: dbSession });

                            await FinancialLog.create([{
                                type: 'prize_winnings',
                                amount: rewardAmount,
                                currency: 'Coins',
                                userId: pUserId,
                                referenceId: id,
                                description: `Elimination Winnings (${pKills} kills) in ${tournament.title}`,
                                timestamp: new Date()
                            }], { session: dbSession });

                            totalAmountDistributed += rewardAmount;
                            paidPlayersCount++;
                        }
                    }

                    const sortedParticipants = [...tournament.participants]
                        .map((p: any) => ({
                            userId: p.userId?._id?.toString() || p.userId?.toString(),
                            kills: p.kills || 0
                        }))
                        .sort((a, b) => b.kills - a.kills);

                    finalWinners = {
                        rank1: sortedParticipants[0]?.kills > 0 ? sortedParticipants[0].userId : undefined,
                        rank2: sortedParticipants[1]?.kills > 0 ? sortedParticipants[1].userId : undefined,
                        rank3: sortedParticipants[2]?.kills > 0 ? sortedParticipants[2].userId : undefined,
                        rank4: sortedParticipants[3]?.kills > 0 ? sortedParticipants[3].userId : undefined,
                        rank5: sortedParticipants[4]?.kills > 0 ? sortedParticipants[4].userId : undefined,
                        rank6: sortedParticipants[5]?.kills > 0 ? sortedParticipants[5].userId : undefined,
                        rank7: sortedParticipants[6]?.kills > 0 ? sortedParticipants[6].userId : undefined,
                        rank8: sortedParticipants[7]?.kills > 0 ? sortedParticipants[7].userId : undefined,
                        rank9: sortedParticipants[8]?.kills > 0 ? sortedParticipants[8].userId : undefined,
                        rank10: sortedParticipants[9]?.kills > 0 ? sortedParticipants[9].userId : undefined,
                    };
                } else {
                    const distributionMapping = [
                        { key: 'rank1', prize: prizes.first, label: '1st' },
                        { key: 'rank2', prize: prizes.second, label: '2nd' },
                        { key: 'rank3', prize: prizes.third, label: '3rd' },
                        { key: 'rank4', prize: prizes.fourth, label: '4th' },
                        { key: 'rank5', prize: prizes.fifth, label: '5th' },
                        { key: 'rank6', prize: prizes.sixth, label: '6th' },
                        { key: 'rank7', prize: prizes.seventh, label: '7th' },
                        { key: 'rank8', prize: prizes.eighth, label: '8th' },
                        { key: 'rank9', prize: prizes.ninth, label: '9th' },
                        { key: 'rank10', prize: prizes.tenth, label: '10th' },
                    ];

                    const distributionPromises = distributionMapping
                        .filter((_, i) => {
                            if (tournament.prizeType === 'TOP 3') return i < 3;
                            if (tournament.prizeType === 'TOP 5') return i < 5;
                            return true;
                        })
                        .map(item => distributePrize(winners[item.key], item.prize, item.label));

                    await Promise.all(distributionPromises);
                }

                const settings = await SystemSetting.findOne().session(dbSession);
                const rules = settings?.rankRules || {
                    tournamentParticipationPoints: 10,
                    tournamentFirstPlacePoints: 15,
                    tournamentPerKillBasePoints: 5,
                    tournamentPerKillMultiplier: 2
                };

                // Update Rank Points and send notifications for ALL participants
                for (const participant of tournament.participants) {
                    const pUserId = (participant.userId as any)?._id?.toString() || participant.userId?.toString();
                    if (!pUserId) continue;

                    let pointsToAdd = 0;
                    if (tournament.isGiveaway || tournament.prizeType === 'GIVEAWAY') {
                        pointsToAdd = 0;
                    } else if (tournament.isPerKill) {
                        const userKills = participant.kills || 0;
                        pointsToAdd = (rules.tournamentPerKillBasePoints ?? 5) + 
                                      ((rules.tournamentPerKillMultiplier ?? 2) * userKills);
                    } else {
                        // Normal tournament
                        const isWinner = finalWinners.rank1 && finalWinners.rank1.toString() === pUserId;
                        pointsToAdd = isWinner 
                            ? (rules.tournamentFirstPlacePoints ?? 15) 
                            : (rules.tournamentParticipationPoints ?? 10);
                    }

                    if (pointsToAdd > 0) {
                        await User.findByIdAndUpdate(pUserId, {
                            $inc: { rankPoints: pointsToAdd }
                        }).session(dbSession);

                        await Notification.create([{
                            userId: pUserId,
                            title: 'Tournament Completed! 🏆',
                            message: `Tournament "${tournament.title}" has been finalized. You earned ${pointsToAdd} Rank Points.`,
                            type: 'success',
                            link: `/dashboard/history`
                        }], { session: dbSession });
                    }
                }

                // Update Tournament Status
                tournament.status = 'Completed';
                tournament.prizeDistributed = true;
                tournament.winners = finalWinners;
                await tournament.save({ session: dbSession });

                // Log Activity
                await AdminActivity.create([{
                    adminId: adminId,
                    adminName: adminName,
                    actionType: 'UPDATE_TOURNAMENT',
                    targetId: tournament._id,
                    details: `Finalized tournament ${tournament.title}. Winners: ${JSON.stringify(finalWinners)}`
                }], { session: dbSession });

            });

            // If we are here, transaction committed.
            result = { 
                success: true, 
                message: `Distributed ${totalAmountDistributed} coins to ${paidPlayersCount} players.`,
                distributedAmount: totalAmountDistributed,
                playersCount: paidPlayersCount
            };

        } catch (error: any) {
            console.error('Finalize Transaction Aborted:', error);
            // Re-throw to be caught by outer handler
            throw error;
        } finally {
            await dbSession.endSession();
        }

        // Rank points and notifications processed within transaction. Nothing to trigger post-transaction.

        return NextResponse.json(result);

    } catch (error: any) {
        console.error('Finalize Error:', error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
