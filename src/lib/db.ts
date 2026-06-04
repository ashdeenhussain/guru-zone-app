import mongoose from 'mongoose';

// ─── Register all models here so they are always available for .populate() ───
// This prevents "Schema hasn't been registered for model X" errors in Next.js
// where each API route is an isolated module and may not import every ref model.
import '@/models/User';
import '@/models/StoreProduct';
import '@/models/Order';
import '@/models/Transaction';
import '@/models/Notification';
import '@/models/AdminNotification';
import '@/models/AdminActivity';
import '@/models/Tournament';
import '@/models/SpinItem';
import '@/models/DailyRewardSpinItem';
import '@/models/SupportTicket';
import '@/models/PaymentMethod';
import '@/models/SystemSetting';
import '@/models/LandingPageContent';
import '@/models/Media';
import '@/models/Message';
import '@/models/ChatReport';
import '@/models/FinancialLog';
// ─────────────────────────────────────────────────────────────────────────────

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
    throw new Error('Please define the MONGODB_URI environment variable inside .env.local');
}

interface MongooseCache {
    conn: typeof mongoose | null;
    promise: Promise<typeof mongoose> | null;
}

// Global declaration for the cached connection to persist across HMR in development
declare global {
    // eslint-disable-next-line no-var
    var mongoose: MongooseCache | undefined;
}

let cached: MongooseCache = global.mongoose || { conn: null, promise: null };

if (!cached) {
    cached = global.mongoose = { conn: null, promise: null };
}

async function connectToDatabase() {
    if (cached.conn) {
        return cached.conn;
    }

    if (!cached.promise) {
        const opts = {
            bufferCommands: false,
            family: 4, // Force IPv4 to fix some Windows DNS issues
            serverSelectionTimeoutMS: 5000, // Timeout after 5 seconds instead of 30
        };

        cached.promise = mongoose.connect(MONGODB_URI!, opts).then((mongoose) => {
            return mongoose;
        });
    }

    try {
        cached.conn = await cached.promise;
    } catch (e) {
        cached.promise = null;
        throw e;
    }

    return cached.conn;
}

export default connectToDatabase;
