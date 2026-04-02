
const { MongoClient } = require('mongodb');

const uri = 'mongodb://guru-mdb:QxJXLjXJBkVl7u1h@ac-b7suvb1-shard-00-00.5c5hedd.mongodb.net:27017,ac-b7suvb1-shard-00-01.5c5hedd.mongodb.net:27017,ac-b7suvb1-shard-00-02.5c5hedd.mongodb.net:27017/guru-zone?ssl=true&authSource=admin&retryWrites=true&w=majority';

async function main() {
  const client = new MongoClient(uri);
  try {
    await client.connect();
    const db = client.db('guru-zone');
    const users = await db.collection('users').find({}, { projection: { username: 1, email: 1 } }).limit(5).toArray();
    console.log(JSON.stringify(users, null, 2));
  } finally {
    await client.close();
  }
}

main().catch(console.error);
