
import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import mongoose from 'mongoose';

export async function GET() {
    try {
        await connectDB();
        if (!mongoose.connection.db) {
            throw new Error('Database connection failed');
        }
        const latestTrx = await mongoose.connection.db.collection('transactions')
            .find({})
            .sort({ createdAt: -1 })
            .limit(1)
            .toArray();

        return NextResponse.json(latestTrx);
    } catch (error) {
        return NextResponse.json({ error: String(error) });
    }
}
