
import mongoose from 'mongoose';
import User from './src/models/User';
import connectToDatabase from './src/lib/db';
import bcrypt from 'bcryptjs';

const MONGODB_URI = 'mongodb://guru-mdb:QxJXLjXJBkVl7u1h@ac-b7suvb1-shard-00-00.5c5hedd.mongodb.net:27017,ac-b7suvb1-shard-00-01.5c5hedd.mongodb.net:27017,ac-b7suvb1-shard-00-02.5c5hedd.mongodb.net:27017/guru-zone?ssl=true&authSource=admin&retryWrites=true&w=majority';

async function setup() {
  process.env.MONGODB_URI = MONGODB_URI;
  await connectToDatabase();
  console.log('Connected to DB');

  const users = [
    {
      username: 'tester1',
      email: 'tester1@example.com',
      password: 'password123',
      walletBalance: 1000,
      trustScore: 100,
      role: 'user',
      isVerified: true
    },
    {
      username: 'tester2',
      email: 'tester2@example.com',
      password: 'password123',
      walletBalance: 1000,
      trustScore: 100,
      role: 'user',
      isVerified: true
    }
  ];

  for (const userData of users) {
    const existingUser = await User.findOne({ email: userData.email });
    if (existingUser) {
      existingUser.walletBalance = 1000;
      existingUser.trustScore = 100;
      await existingUser.save();
      console.log(`Updated user: ${userData.username}`);
    } else {
      const hashedPassword = await bcrypt.hash(userData.password, 12);
      await User.create({
        ...userData,
        password: hashedPassword
      });
      console.log(`Created user: ${userData.username}`);
    }
  }

  process.exit(0);
}

setup().catch(err => {
  console.error(err);
  process.exit(1);
});
