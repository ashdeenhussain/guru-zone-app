import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import connectToDatabase from '@/lib/db';
import User from '@/models/User';

export async function POST(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || !session.user) {
            return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
        }

        const data = await req.json();

        await connectToDatabase();
        const userId = (session.user as any).id;

        const user = await User.findById(userId);
        if (!user) {
            return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 });
        }

        // 1. Handle Native FCM Token
        if (data.fcmToken) {
            const fcmTokens = Array.isArray(user.fcmTokens) ? user.fcmTokens : [];
            if (!fcmTokens.includes(data.fcmToken)) {
                fcmTokens.push(data.fcmToken);
                user.fcmTokens = fcmTokens;
                await user.save();
            }
            return NextResponse.json({ success: true, message: 'Native token saved' });
        }

        // 2. Handle Standard Web Push Subscription
        const subscription = data;
        if (!subscription || !subscription.endpoint) {
            return NextResponse.json({ success: false, error: 'Invalid subscription object' }, { status: 400 });
        }

        const subscriptions = Array.isArray(user.pushSubscriptions) ? user.pushSubscriptions : [];
        const subExists = subscriptions.some(
            (sub: any) => sub.endpoint === subscription.endpoint
        );

        if (!subExists) {
            subscriptions.push(subscription);
            user.pushSubscriptions = subscriptions;
            await user.save();
        }

        return NextResponse.json({ success: true, message: 'Substituted successfully' });
    } catch (error) {
        console.error('Error saving push subscription:', error);
        return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
    }
}
