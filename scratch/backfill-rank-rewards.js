const { MongoClient, ObjectId } = require('mongodb');

const uri = 'mongodb://guru-mdb:QxJXLjXJBkVl7u1h@ac-b7suvb1-shard-00-00.5c5hedd.mongodb.net:27017,ac-b7suvb1-shard-00-01.5c5hedd.mongodb.net:27017,ac-b7suvb1-shard-00-02.5c5hedd.mongodb.net:27017/guru-zone?ssl=true&authSource=admin&retryWrites=true&w=majority';

const REWARDS_MAP = {
  'Silver-1': 100,
  'Gold-1': 200,
  'Platinum-1': 300,
  'Diamond-1': 400,
  'Heroic-0': 500,
  'Master-0': 600,
  'Elite Master-0': 700,
  'Grandmaster-0': 800
};

async function main() {
  const client = new MongoClient(uri);
  try {
    await client.connect();
    const db = client.db('guru-zone');
    
    const usersCol = db.collection('users');
    const txCol = db.collection('transactions');
    const logsCol = db.collection('financiallogs');

    console.log("Fetching users with claimed rank rewards...");
    const users = await usersCol.find({
      claimedRankRewards: { $exists: true, $not: { $size: 0 } }
    }).toArray();

    console.log(`Found ${users.length} users to process.`);

    let txCreatedCount = 0;
    let logsCreatedCount = 0;

    for (const user of users) {
      const claimed = user.claimedRankRewards || [];
      const userId = user._id;

      for (const rewardId of claimed) {
        const coins = REWARDS_MAP[rewardId];
        if (!coins) {
          console.log(`No coins configured for rewardId: ${rewardId}. Skipping.`);
          continue;
        }

        const description = `Rank Up Reward - claimed ${rewardId}`;

        // 1. Check if Transaction of type rank_reward already exists for this rewardId and user
        let tx = await txCol.findOne({
          user: userId,
          type: 'rank_reward',
          description: description
        });

        // Fallback check to avoid duplicate if we previously wrote generic description
        if (!tx) {
          tx = await txCol.findOne({
            user: userId,
            type: 'rank_reward',
            amount: coins
          });
        }

        if (!tx) {
          // Create Transaction
          const insertTxResult = await txCol.insertOne({
            user: userId,
            amount: coins,
            type: 'rank_reward',
            description: description,
            status: 'approved',
            createdAt: user.updatedAt || new Date(),
            updatedAt: user.updatedAt || new Date()
          });
          tx = { _id: insertTxResult.insertedId };
          txCreatedCount++;
          console.log(`Created Transaction for ${user.name} (${user.email}) - ${rewardId} (+${coins} coins)`);
        }

        // 2. Check if FinancialLog of type rank_reward already exists
        const log = await logsCol.findOne({
          userId: userId,
          type: 'rank_reward',
          referenceId: tx._id
        });

        if (!log) {
          // Create FinancialLog
          await logsCol.insertOne({
            type: 'rank_reward',
            amount: coins,
            currency: 'Coins',
            userId: userId,
            referenceId: tx._id,
            description: description,
            timestamp: user.updatedAt || new Date(),
            createdAt: user.updatedAt || new Date(),
            updatedAt: user.updatedAt || new Date()
          });
          logsCreatedCount++;
          console.log(`Created FinancialLog for ${user.name} (${user.email}) - ${rewardId}`);
        }
      }
    }

    console.log(`\n=== BACKFILL COMPLETE ===`);
    console.log(`Created Transactions: ${txCreatedCount}`);
    console.log(`Created Financial Logs: ${logsCreatedCount}`);

  } finally {
    await client.close();
  }
}

main().catch(console.error);
