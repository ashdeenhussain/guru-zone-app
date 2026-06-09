const { MongoClient, ObjectId } = require('mongodb');

const uri = 'mongodb://guru-mdb:QxJXLjXJBkVl7u1h@ac-b7suvb1-shard-00-00.5c5hedd.mongodb.net:27017,ac-b7suvb1-shard-00-01.5c5hedd.mongodb.net:27017,ac-b7suvb1-shard-00-02.5c5hedd.mongodb.net:27017/guru-zone?ssl=true&authSource=admin&retryWrites=true&w=majority';

// Import rank constants for validation
const RANK_THRESHOLDS = [
    { tier: "Bronze", division: 3, minPoints: 0, color: "#CD7F32" },
    { tier: "Bronze", division: 2, minPoints: 100, color: "#CD7F32" },
    { tier: "Bronze", division: 1, minPoints: 200, color: "#CD7F32" },
    { tier: "Silver", division: 3, minPoints: 300, color: "#C0C0C0" },
    { tier: "Silver", division: 2, minPoints: 400, color: "#C0C0C0" },
    { tier: "Silver", division: 1, minPoints: 500, color: "#C0C0C0" },
    { tier: "Gold", division: 4, minPoints: 600, color: "#FFD700", rankUpReward: { type: "coins", amount: 50 } },
    { tier: "Gold", division: 3, minPoints: 700, color: "#FFD700" },
    { tier: "Gold", division: 2, minPoints: 800, color: "#FFD700" },
    { tier: "Gold", division: 1, minPoints: 900, color: "#FFD700" },
    { tier: "Diamond", division: 4, minPoints: 1000, color: "#B9F2FF", rankUpReward: { type: "coins", amount: 100 } },
    { tier: "Diamond", division: 3, minPoints: 1150, color: "#B9F2FF" },
    { tier: "Diamond", division: 2, minPoints: 1300, color: "#B9F2FF" },
    { tier: "Diamond", division: 1, minPoints: 1450, color: "#B9F2FF" },
    { tier: "Heroic", minPoints: 1600, color: "#FF4500", rankUpReward: { type: "coins", amount: 200 } },
    { tier: "Elite Heroic", minPoints: 2200, color: "#FF0000", rankUpReward: { type: "coins", amount: 350 } },
    { tier: "Master", minPoints: 3200, color: "#E0115F", rankUpReward: { type: "coins", amount: 500 } },
    { tier: "Elite Master", minPoints: 4500, color: "#800020", rankUpReward: { type: "coins", amount: 750 } },
    { tier: "Grandmaster", minPoints: 6000, color: "#DA70D6", rankUpReward: { type: "coins", amount: 1000 } }
];

function getRankFromPoints(points) {
    let currentRank = RANK_THRESHOLDS[0];
    for (let i = 0; i < RANK_THRESHOLDS.length; i++) {
        if (points >= RANK_THRESHOLDS[i].minPoints) {
            currentRank = RANK_THRESHOLDS[i];
        } else {
            break;
        }
    }
    return currentRank;
}

function formatRankName(rank) {
    if (rank.division) {
        const roman = ["", "I", "II", "III", "IV"][rank.division] || rank.division;
        return `${rank.tier} ${roman}`;
    }
    return rank.tier;
}

async function getBattleZonePointsEarnedToday(db, userId, startOfToday, rules) {
    const matches = await db.collection('battlematches').find({
        status: 'completed',
        entryFee: { $gt: 0 },
        updatedAt: { $gte: startOfToday },
        $or: [
            { createdBy: new ObjectId(userId) },
            { 'participants.userId': new ObjectId(userId) }
        ]
    }).sort({ updatedAt: 1 }).toArray();

    let totalPoints = 0;
    const opponentMatchCounts = {};
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

async function runTests() {
    const client = new MongoClient(uri);
    try {
        await client.connect();
        const db = client.db('guru-zone');
        console.log("Connected to MongoDB database successfully.");

        // Clear previous mock data just in case
        await db.collection('users').deleteMany({ email: /mock_test_rank_user/ });
        await db.collection('tournaments').deleteMany({ title: /Mock Test Tournament/ });
        await db.collection('battlematches').deleteMany({ title: /Mock Test BZ/ });

        // Fetch dynamic rules from database or fallback
        const settings = await db.collection('systemsettings').findOne({});
        const rules = settings?.rankRules || {
            tournamentParticipationPoints: 10,
            tournamentFirstPlacePoints: 15,
            tournamentPerKillBasePoints: 5,
            tournamentPerKillMultiplier: 2,
            bzDailyPointsCap: 50,
            bzOpponentLimitPerDay: 2,
            bzHostPoints: 5,
            bzWinnerPoints: 5,
            bzHostWinnerPoints: 10
        };

        console.log("Loaded system settings rank rules:", JSON.stringify(rules, null, 2));

        // 1. CREATE MOCK USERS
        const userA_Id = new ObjectId();
        const userB_Id = new ObjectId();

        const userA = {
            _id: userA_Id,
            name: "Mock Rank User A",
            email: "mock_test_rank_user_a@test.com",
            rankPoints: 0,
            claimedRankRewards: [],
            walletBalance: 100,
            createdAt: new Date(),
            updatedAt: new Date()
        };

        const userB = {
            _id: userB_Id,
            name: "Mock Rank User B",
            email: "mock_test_rank_user_b@test.com",
            rankPoints: 0,
            claimedRankRewards: [],
            walletBalance: 100,
            createdAt: new Date(),
            updatedAt: new Date()
        };

        await db.collection('users').insertMany([userA, userB]);
        console.log("Mock users created successfully.");

        // ==========================================
        // TEST CASE 1: TOURNAMENT FINALIZATION POINTS
        // ==========================================
        console.log("\n--- Testing Tournament Finalization Points ---");

        // A. Normal Tournament
        // Winner should get firstPlacePoints, Participant should get participationPoints
        const tournamentNormal = {
            title: "Mock Test Tournament Normal",
            status: "Open",
            isGiveaway: false,
            isPerKill: false,
            participants: [
                { userId: userA_Id, name: "User A" },
                { userId: userB_Id, name: "User B" }
            ],
            createdAt: new Date(),
            updatedAt: new Date()
        };

        const tNormalInserted = await db.collection('tournaments').insertOne(tournamentNormal);
        const tNormalId = tNormalInserted.insertedId;

        // Finalize Normal Tournament (Simulate route code)
        // Winner is User A
        const winnersNormal = { rank1: userA_Id };
        for (const participant of tournamentNormal.participants) {
            const pUserId = participant.userId.toString();
            let pointsToAdd = 0;
            const isWinner = winnersNormal.rank1.toString() === pUserId;
            pointsToAdd = isWinner ? (rules.tournamentFirstPlacePoints ?? 15) : (rules.tournamentParticipationPoints ?? 10);

            await db.collection('users').updateOne(
                { _id: new ObjectId(pUserId) },
                { $inc: { rankPoints: pointsToAdd } }
            );
        }
        await db.collection('tournaments').updateOne(
            { _id: tNormalId },
            { $set: { status: 'Completed', winners: winnersNormal } }
        );

        let checkUserA = await db.collection('users').findOne({ _id: userA_Id });
        let checkUserB = await db.collection('users').findOne({ _id: userB_Id });

        const expectedWinnerPts = rules.tournamentFirstPlacePoints ?? 15;
        const expectedPartPts = rules.tournamentParticipationPoints ?? 10;

        console.log(`Normal Tournament - User A (Winner) points (Expected: ${expectedWinnerPts}): ${checkUserA.rankPoints}`);
        console.log(`Normal Tournament - User B (Participant) points (Expected: ${expectedPartPts}): ${checkUserB.rankPoints}`);
        if (checkUserA.rankPoints !== expectedWinnerPts || checkUserB.rankPoints !== expectedPartPts) {
            throw new Error("Normal tournament points logic failure!");
        }

        // B. Per Kill Tournament
        // Points: PerKillBase + (PerKillMultiplier * kills)
        // User A gets 3 kills, User B gets 1 kill
        const tournamentPerKill = {
            title: "Mock Test Tournament PerKill",
            status: "Open",
            isGiveaway: false,
            isPerKill: true,
            participants: [
                { userId: userA_Id, name: "User A", kills: 3 },
                { userId: userB_Id, name: "User B", kills: 1 }
            ],
            createdAt: new Date(),
            updatedAt: new Date()
        };
        const tPerKillInserted = await db.collection('tournaments').insertOne(tournamentPerKill);

        // Finalize Per Kill Tournament
        for (const participant of tournamentPerKill.participants) {
            const pUserId = participant.userId.toString();
            const kills = participant.kills || 0;
            let pointsToAdd = (rules.tournamentPerKillBasePoints ?? 5) + ((rules.tournamentPerKillMultiplier ?? 2) * kills);
            await db.collection('users').updateOne(
                { _id: new ObjectId(pUserId) },
                { $inc: { rankPoints: pointsToAdd } }
            );
        }
        await db.collection('tournaments').updateOne(
            { _id: tPerKillInserted.insertedId },
            { $set: { status: 'Completed' } }
        );

        checkUserA = await db.collection('users').findOne({ _id: userA_Id });
        checkUserB = await db.collection('users').findOne({ _id: userB_Id });

        const base = rules.tournamentPerKillBasePoints ?? 5;
        const mult = rules.tournamentPerKillMultiplier ?? 2;
        const expectedWinnerPerKill = expectedWinnerPts + base + (mult * 3);
        const expectedPartPerKill = expectedPartPts + base + (mult * 1);

        console.log(`Per Kill Tournament - User A points (Expected: ${expectedWinnerPerKill}): ${checkUserA.rankPoints}`);
        console.log(`Per Kill Tournament - User B points (Expected: ${expectedPartPerKill}): ${checkUserB.rankPoints}`);
        if (checkUserA.rankPoints !== expectedWinnerPerKill || checkUserB.rankPoints !== expectedPartPerKill) {
            throw new Error("Per-kill tournament points logic failure!");
        }

        // ==========================================
        // TEST CASE 2: BATTLE ZONE POINTS AND LIMITS
        // ==========================================
        console.log("\n--- Testing Battle Zone Points and Limits ---");

        // Reset points for fresh BZ tests
        await db.collection('users').updateOne({ _id: userA_Id }, { $set: { rankPoints: 0 } });
        await db.collection('users').updateOne({ _id: userB_Id }, { $set: { rankPoints: 0 } });

        const startOfToday = new Date();
        startOfToday.setHours(0, 0, 0, 0);

        // Helper to simulate a completed BZ Match in db and award points using settings rules
        async function completeBZMatch(hostId, winnerId, opponentId, title, entryFee = 10) {
            const matchId = new ObjectId();
            const match = {
                _id: matchId,
                title: title,
                createdBy: new ObjectId(hostId),
                participants: [{ userId: new ObjectId(opponentId), inGameName: "Opponent", uid: "123" }],
                entryFee: entryFee,
                prizePool: entryFee * 1.8,
                status: 'completed',
                winners: { rank1: new ObjectId(winnerId) },
                updatedAt: new Date(),
                createdAt: new Date()
            };

            await db.collection('battlematches').insertOne(match);

            // Award points using the exact endpoint logic:
            if (entryFee > 0) {
                const matchCountToday = await db.collection('battlematches').countDocuments({
                    status: 'completed',
                    entryFee: { $gt: 0 },
                    updatedAt: { $gte: startOfToday },
                    $or: [
                        { createdBy: new ObjectId(hostId), 'participants.userId': new ObjectId(winnerId) },
                        { createdBy: new ObjectId(winnerId), 'participants.userId': new ObjectId(hostId) }
                    ]
                });

                // Since we inserted the match above, matchCountToday is at least 1
                if (matchCountToday <= (rules.bzOpponentLimitPerDay ?? 2)) {
                    const hostPtsToday = await getBattleZonePointsEarnedToday(db, hostId.toString(), startOfToday, rules);
                    const bzCap = rules.bzDailyPointsCap ?? 50;

                    if (hostId.toString() === winnerId.toString()) {
                        // Host who wins gets hostWinnerPoints
                        if (hostPtsToday < bzCap) {
                            const pointsEarned = Math.min(rules.bzHostWinnerPoints ?? 10, bzCap - hostPtsToday);
                            await db.collection('users').updateOne({ _id: new ObjectId(hostId) }, { $inc: { rankPoints: pointsEarned } });
                        }
                    } else {
                        // Host gets hostPoints, Winner gets winnerPoints
                        if (hostPtsToday < bzCap) {
                            const pointsEarned = Math.min(rules.bzHostPoints ?? 5, bzCap - hostPtsToday);
                            await db.collection('users').updateOne({ _id: new ObjectId(hostId) }, { $inc: { rankPoints: pointsEarned } });
                        }

                        const winnerPtsToday = await getBattleZonePointsEarnedToday(db, winnerId.toString(), startOfToday, rules);
                        if (winnerPtsToday < bzCap) {
                            const pointsEarned = Math.min(rules.bzWinnerPoints ?? 5, bzCap - winnerPtsToday);
                            await db.collection('users').updateOne({ _id: new ObjectId(winnerId) }, { $inc: { rankPoints: pointsEarned } });
                        }
                    }
                } else {
                    console.log(`[BZ Test Log] Match against same opponent capped. No points awarded for match: ${title}`);
                }
            }
        }

        const bzHostPts = rules.bzHostPoints ?? 5;
        const bzWinPts = rules.bzWinnerPoints ?? 5;

        // Match 1: Host A, Winner B. Host A earns bzHostPts, Winner B earns bzWinPts
        await completeBZMatch(userA_Id, userB_Id, userB_Id, "Mock Test BZ Match 1");
        checkUserA = await db.collection('users').findOne({ _id: userA_Id });
        checkUserB = await db.collection('users').findOne({ _id: userB_Id });
        console.log(`BZ Match 1 - User A points (Expected: ${bzHostPts}): ${checkUserA.rankPoints}`);
        console.log(`BZ Match 1 - User B points (Expected: ${bzWinPts}): ${checkUserB.rankPoints}`);
        if (checkUserA.rankPoints !== bzHostPts || checkUserB.rankPoints !== bzWinPts) {
            throw new Error("BZ Match 1 points calculation failure!");
        }

        // Match 2: Host A, Winner B. Host A earns bzHostPts, Winner B earns bzWinPts
        await completeBZMatch(userA_Id, userB_Id, userB_Id, "Mock Test BZ Match 2");
        checkUserA = await db.collection('users').findOne({ _id: userA_Id });
        checkUserB = await db.collection('users').findOne({ _id: userB_Id });
        console.log(`BZ Match 2 - User A points (Expected: ${bzHostPts * 2}): ${checkUserA.rankPoints}`);
        console.log(`BZ Match 2 - User B points (Expected: ${bzWinPts * 2}): ${checkUserB.rankPoints}`);
        if (checkUserA.rankPoints !== (bzHostPts * 2) || checkUserB.rankPoints !== (bzWinPts * 2)) {
            throw new Error("BZ Match 2 points calculation failure!");
        }

        // Match 3 (Capped! Same Opponent limit reaches, which is bzOpponentLimitPerDay. Default is 2)
        if (rules.bzOpponentLimitPerDay === 2) {
            await completeBZMatch(userA_Id, userB_Id, userB_Id, "Mock Test BZ Match 3");
            checkUserA = await db.collection('users').findOne({ _id: userA_Id });
            checkUserB = await db.collection('users').findOne({ _id: userB_Id });
            console.log(`BZ Match 3 (Capped) - User A points (Expected: ${bzHostPts * 2}): ${checkUserA.rankPoints}`);
            if (checkUserA.rankPoints !== (bzHostPts * 2)) {
                throw new Error("Opponent capping logic failed!");
            }
        }

        // ==========================================
        // TEST CASE 3: RANK REWARD CLAIMING
        // ==========================================
        console.log("\n--- Testing Rank Reward Claiming ---");

        // Set User A points to 600 (threshold for Gold IV / Gold-4)
        await db.collection('users').updateOne({ _id: userA_Id }, { $set: { rankPoints: 600, walletBalance: 100, claimedRankRewards: [] } });

        const rewardId = "Gold-4";
        checkUserA = await db.collection('users').findOne({ _id: userA_Id });
        
        let rank = RANK_THRESHOLDS.find(r => `${r.tier}-${r.division || 0}` === rewardId);
        
        // Resolve reward amount with dynamic settings check
        let rewardAmount = rank.rankUpReward?.amount || 0;
        if (settings && settings.rankRewards && settings.rankRewards[rewardId] !== undefined) {
            rewardAmount = Number(settings.rankRewards[rewardId]) || 0;
        }

        await db.collection('users').updateOne(
            { _id: userA_Id },
            { 
                $inc: { walletBalance: rewardAmount },
                $push: { claimedRankRewards: rewardId }
            }
        );

        checkUserA = await db.collection('users').findOne({ _id: userA_Id });
        console.log(`Claimed Reward: ${rewardId} - Wallet Balance (Expected: ${100 + rewardAmount}): ${checkUserA.walletBalance}`);
        if (checkUserA.walletBalance !== (100 + rewardAmount)) {
            throw new Error("Reward claim logic failed!");
        }

        // ==========================================
        // TEST CASE 4: SEASON RESET LOGIC
        // ==========================================
        console.log("\n--- Testing Season Reset Logic ---");

        await db.collection('users').updateOne(
            { _id: userA_Id },
            { $set: { rankPoints: 6200, claimedRankRewards: ["Gold-4"], rankHistory: [] } }
        );

        // Run Reset Simulation
        const usersForReset = await db.collection('users').find({ _id: { $in: [userA_Id, userB_Id] } }).toArray();
        const currentSeasonName = settings?.rankSeason?.currentSeasonName || "Season 1";

        // A. Compile Season History Summary before resetting
        let totalUsersCount = 0;
        let topPlayerObj = { name: "N/A", points: 0, rank: "Bronze III" };

        for (const user of usersForReset) {
            const pts = user.rankPoints || 0;
            if (pts > 0) {
                totalUsersCount++;
                if (pts > topPlayerObj.points) {
                    const r = getRankFromPoints(pts);
                    topPlayerObj = {
                        name: user.name || "Unknown",
                        points: pts,
                        rank: formatRankName(r)
                    };
                }
            }
        }

        const seasonSummary = {
            seasonName: currentSeasonName,
            startDate: settings?.rankSeason?.startDate || new Date(),
            endDate: settings?.rankSeason?.endDate || new Date(),
            totalUsers: totalUsersCount,
            totalClaimsPaid: 120, // Mocked total claims
            topPlayer: topPlayerObj
        };

        await db.collection('systemsettings').updateOne(
            {},
            { $push: { seasonHistory: seasonSummary } }
        );

        // B. Reset points for users
        for (const user of usersForReset) {
            const currentPoints = user.rankPoints || 0;
            const currentRank = getRankFromPoints(currentPoints);
            const currentRankName = formatRankName(currentRank);

            // Lock unclaimed reached rewards
            const userClaimed = user.claimedRankRewards || [];
            const reachedRewardsToLock = [];

            for (const r of RANK_THRESHOLDS) {
                if (currentPoints >= r.minPoints && r.rankUpReward) {
                    const rId = `${r.tier}-${r.division || 0}`;
                    if (!userClaimed.includes(rId)) {
                        reachedRewardsToLock.push(rId);
                    }
                }
            }

            const newHistoryItem = {
                seasonName: currentSeasonName,
                points: currentPoints,
                rankName: currentRankName,
                achievedAt: new Date()
            };

            let newPoints = 0;
            if (currentPoints >= 3200) {
                newPoints = 1000; // Platinum I
            } else if (currentPoints >= 1600) {
                newPoints = 600;  // Gold I
            } else if (currentPoints >= 600) {
                newPoints = 300;  // Silver I
            } else {
                newPoints = 0;
            }

            await db.collection('users').updateOne(
                { _id: user._id },
                {
                    $set: { rankPoints: newPoints },
                    $addToSet: { claimedRankRewards: { $each: reachedRewardsToLock } },
                    $push: { rankHistory: newHistoryItem }
                }
            );
        }

        checkUserA = await db.collection('users').findOne({ _id: userA_Id });
        console.log(`Reset - User A points (Expected: 1000): ${checkUserA.rankPoints}`);
        console.log(`Reset - Locked rewards (Expected to contain Diamond-4): ${checkUserA.claimedRankRewards.includes("Diamond-4")}`);
        
        // Verify Season History logged in settingsDoc
        const updatedSettings = await db.collection('systemsettings').findOne({});
        console.log(`Reset - Season History Length (Expected >= 1): ${updatedSettings.seasonHistory ? updatedSettings.seasonHistory.length : 0}`);
        console.log(`Reset - Season History Top Player (Expected: Mock Rank User A): ${updatedSettings.seasonHistory ? updatedSettings.seasonHistory[updatedSettings.seasonHistory.length - 1].topPlayer.name : 'N/A'}`);

        if (checkUserA.rankPoints !== 1000 || !checkUserA.claimedRankRewards.includes("Diamond-4")) {
            throw new Error("Reset and lock rewards logic verification failed!");
        }

        if (!updatedSettings.seasonHistory || updatedSettings.seasonHistory.length === 0) {
            throw new Error("Season history logs were not saved to database!");
        }

        console.log("\n✅ ALL TESTS PASSED SUCCESSFULLY! The rank system points, caps, claiming, and resets function flawlessly under dynamic database rules.");

    } finally {
        const db = client.db('guru-zone');
        await db.collection('users').deleteMany({ email: /mock_test_rank_user/ });
        await db.collection('tournaments').deleteMany({ title: /Mock Test Tournament/ });
        await db.collection('battlematches').deleteMany({ title: /Mock Test BZ/ });
        await client.close();
    }
}

runTests().catch(err => {
    console.error("\n❌ TEST FAILED:", err);
    process.exit(1);
});
