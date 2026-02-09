const { MongoClient } = require('mongodb');
const mongoose = require('mongoose');
require('dotenv').config({ path: '.env.local' });

const uri = process.env.MONGODB_URI;

async function testNativeDriver() {
    console.log('Testing Native MongoDB Driver...');
    if (!uri) {
        console.error('MONGODB_URI not found in .env.local');
        return;
    }
    const client = new MongoClient(uri);
    try {
        await client.connect();
        console.log('Successfully connected with Native Driver!');
        await client.db().command({ ping: 1 });
        console.log('Ping successful!');
    } catch (error) {
        console.error('Native Driver Connection Failed:', error);
    } finally {
        await client.close();
    }
}

async function testMongoose() {
    console.log('\nTesting Mongoose...');
    try {
        await mongoose.connect(uri);
        console.log('Successfully connected with Mongoose!');
    } catch (error) {
        console.error('Mongoose Connection Failed:', error);
    } finally {
        await mongoose.disconnect();
    }
}

async function run() {
    await testNativeDriver();
    await testMongoose();
}

run();
