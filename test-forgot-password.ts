import mongoose from 'mongoose';
import dotenv from 'dotenv';
import readline from 'readline';

// Load environment variables
dotenv.config({ path: '.env.local' });

async function runTest() {
    console.log('🧪 Starting Forgot Password Token Test...\n');

    // 1. Connect to Database
    const MONGODB_URI = process.env.MONGODB_URI;
    if (!MONGODB_URI) {
        console.error('❌ Error: Please define MONGODB_URI in .env.local');
        process.exit(1);
    }
    
    try {
        await mongoose.connect(MONGODB_URI);
        console.log('✅ Connected to MongoDB');
    } catch (e) {
        console.error('❌ Failed to connect to MongoDB', e);
        process.exit(1);
    }

    // Define User Schema (minimal for test purposes)
    const UserSchema = new mongoose.Schema({
        email: String,
        resetPasswordToken: String,
        resetPasswordExpire: Date,
    }, { strict: false });
    
    const User = mongoose.models.User || mongoose.model('User', UserSchema);
    
    // 2. Find a test user
    const testUser = await User.findOne({});
    if (!testUser) {
        console.error('❌ No users found in database to test with.');
        process.exit(1);
    }
    
    const testEmail = testUser.email;
    console.log(`👤 Using test user email: ${testEmail}`);

    // Clear existing token to ensure a fresh test
    testUser.resetPasswordToken = undefined;
    testUser.resetPasswordExpire = undefined;
    await testUser.save();
    console.log('🧹 Cleared any existing reset tokens for this user.');

    console.log('\n⚠️  Make sure your Next.js server is running on http://localhost:3000 in another terminal!');
    
    // 3. Trigger forgot password API
    console.log('\n⏳ Calling /api/auth/forgot-password API...');
    try {
        const payload = { email: testEmail };
        const res = await fetch('http://localhost:3000/api/auth/forgot-password', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
        });
        
        const data = await res.json();
        console.log(`🌐 API Response Status: ${res.status}`);
        console.log('🌐 API Response Body:', data);
        
        if (!res.ok) {
            console.error('❌ API call returned an error status.');
        } else {
             console.log('✅ API call successful.');
        }
    } catch (e: any) {
        console.error('❌ Failed to call API:', e.message);
        console.log('Is your development server (npm run dev) running?');
    }

    // 4. Verify Database
    console.log('\n🔍 Checking database for newly generated token...');
    // Add a small delay to allow DB save if it was async (though it's awaited in the route, shouldn't hurt)
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const updatedUser = await User.findOne({ email: testEmail });
    if (updatedUser?.resetPasswordToken) {
        console.log('🎉 SUCCESS: Token successfully created in DB!');
        console.log(`   🏷️  Token:   ${updatedUser.resetPasswordToken}`);
        console.log(`   ⏱️  Expires: ${new Date(updatedUser.resetPasswordExpire).toLocaleString()}`);
    } else {
        console.error('❌ FAILURE: Token was NOT found in DB after API call.');
    }
    
    await mongoose.disconnect();
    console.log('\n🏁 Test finished. Disconnected from database.');
    process.exit(0);
}

runTest();
