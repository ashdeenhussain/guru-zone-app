const { MongoClient } = require('mongodb');

const uri = 'mongodb://guru-mdb:QxJXLjXJBkVl7u1h@ac-b7suvb1-shard-00-00.5c5hedd.mongodb.net:27017,ac-b7suvb1-shard-00-01.5c5hedd.mongodb.net:27017,ac-b7suvb1-shard-00-02.5c5hedd.mongodb.net:27017/guru-zone?ssl=true&authSource=admin&retryWrites=true&w=majority';

async function main() {
  const client = new MongoClient(uri);
  try {
    await client.connect();
    const db = client.db('guru-zone');
    
    console.log("=== CHECKING USERS WITH RANK POINTS OR CLAIMED REWARDS ===");
    const users = await db.collection('users').find({
      $or: [
        { rankPoints: { $gt: 0 } },
        { claimedRankRewards: { $exists: true, $not: { $size: 0 } } }
      ]
    }, {
      projection: { name: 1, email: 1, walletBalance: 1, rankPoints: 1, claimedRankRewards: 1 }
    }).toArray();
    
    console.log(`Found ${users.length} users with rank points or claimed rewards:`);
    users.forEach(u => {
      console.log(`- ${u.name} (${u.email}): Points = ${u.rankPoints || 0}, Balance = ${u.walletBalance || 0}, Claimed = ${JSON.stringify(u.claimedRankRewards || [])}`);
    });
    
    console.log("\n=== CHECKING TRANSACTIONS OF TYPE rank_reward ===");
    const rankTx = await db.collection('transactions').find({
      type: 'rank_reward'
    }).toArray();
    console.log(`Found ${rankTx.length} transactions of type rank_reward:`);
    rankTx.forEach(t => {
      console.log(`- TxID: ${t._id}, User: ${t.user}, Amount: ${t.amount}, Desc: ${t.description}, Status: ${t.status}`);
    });

    console.log("\n=== CHECKING FINANCIAL LOGS OF TYPE rank_reward ===");
    const rankLogs = await db.collection('financiallogs').find({
      type: 'rank_reward'
    }).toArray();
    console.log(`Found ${rankLogs.length} financial logs of type rank_reward:`);
    rankLogs.forEach(l => {
      console.log(`- LogID: ${l._id}, User: ${l.userId}, Amount: ${l.amount}, Desc: ${l.description}`);
    });

  } finally {
    await client.close();
  }
}

main().catch(console.error);
