import webpush from 'web-push';
import User from '@/models/User';

let isInitialized = false;

export function initWebPush() {
    if (isInitialized) return;

    const publicVapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
    const privateVapidKey = process.env.VAPID_PRIVATE_KEY;

    if (!publicVapidKey || !privateVapidKey) {
        console.warn('VAPID keys must be set for push notifications.');
        return;
    }

    // You should set these in env, but fallback to a dummy mailto
    webpush.setVapidDetails(
        'mailto:admin@guru-zone.com',
        publicVapidKey,
        privateVapidKey
    );
    isInitialized = true;
}

/**
 * Sends a push notification to all known subscriptions for a given userId.
 * Stale/invalid subscriptions will be removed automatically from the database.
 */
export async function sendPushNotification(userId: string, payload: { title: string; body: string; url?: string }) {
    try {
        initWebPush();
        const user = await User.findById(userId).select('pushSubscriptions');

        if (!user || !user.pushSubscriptions || user.pushSubscriptions.length === 0) {
            return; // No subscriptions
        }

        const stringPayload = JSON.stringify(payload);
        const subscriptionsToKeep = [];
        let hasChanges = false;

        for (const sub of user.pushSubscriptions) {
            try {
                await webpush.sendNotification(sub as any, stringPayload);
                subscriptionsToKeep.push(sub);
            } catch (error: any) {
                // If the subscription is no longer valid, we catch a 410 (Gone) or 404
                if (error.statusCode === 410 || error.statusCode === 404) {
                    console.log(`Removing expired subscription for user ${userId}`);
                    hasChanges = true;
                } else {
                    console.error('Push Notification Error:', error);
                    // Keep it just in case it was a temporary network error
                    subscriptionsToKeep.push(sub);
                }
            }
        }

        if (hasChanges) {
            user.pushSubscriptions = subscriptionsToKeep;
            await user.save();
        }

    } catch (error) {
        console.error('Failed to send push notification overall:', error);
    }
}
