import webpush from 'web-push';
import User from '@/models/User';
import admin from 'firebase-admin';

let isInitialized = false;

export function initNotifications() {
    if (isInitialized) return;

    // 1. Web Push Initialization
    const publicVapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
    const privateVapidKey = process.env.VAPID_PRIVATE_KEY;

    if (publicVapidKey && privateVapidKey) {
        webpush.setVapidDetails(
            'mailto:admin@guru-zone.com',
            publicVapidKey,
            privateVapidKey
        );
    }

    // 2. Firebase Admin Initialization (for Native Android)
    const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT;
    if (serviceAccount) {
        try {
            const cert = JSON.parse(serviceAccount);
            if (!admin.apps.length) {
                admin.initializeApp({
                    credential: admin.credential.cert(cert),
                });
            }
        } catch (e) {
            console.error('Failed to initialize Firebase Admin:', e);
        }
    }

    isInitialized = true;
}

/**
 * Sends a push notification to all known subscriptions for a given userId.
 * Stale/invalid subscriptions will be removed automatically from the database.
 */
export async function sendPushNotification(
    userId: string,
    payload: { title: string; body: string; url?: string },
    category: 'chat' | 'tournaments' | 'wallet' | 'system' = 'system'
) {
    try {
        initNotifications();
        const user = await User.findById(userId).select('pushSubscriptions fcmTokens notifications');

        if (!user) return;

        // Check user preferences
        if (user.notifications && user.notifications[category] === false) {
            console.log(`Notification skipped: ${category} is disabled for user ${userId}`);
            return;
        }

        // --- 1. HANDLE WEB PUSH (Standard PWA) ---
        if (user.pushSubscriptions && user.pushSubscriptions.length > 0) {
            const payloadWithCategory = {
                ...payload,
                category: category,
                tag: category,
                renotify: true
            };
            const stringPayload = JSON.stringify(payloadWithCategory);
            const subscriptionsToKeep = [];
            let webChanges = false;

            for (const sub of user.pushSubscriptions) {
                try {
                    await webpush.sendNotification(sub as any, stringPayload);
                    subscriptionsToKeep.push(sub);
                } catch (error: any) {
                    if (error.statusCode === 410 || error.statusCode === 404) {
                        webChanges = true;
                    } else {
                        subscriptionsToKeep.push(sub);
                    }
                }
            }

            if (webChanges) {
                user.pushSubscriptions = subscriptionsToKeep;
                await user.save();
            }
        }

        // --- 2. HANDLE NATIVE PUSH (Capacitor FCM) ---
        if (user.fcmTokens && user.fcmTokens.length > 0 && admin.apps.length > 0) {
            const tokensToKeep = [];
            let nativeChanges = false;

            for (const token of user.fcmTokens) {
                try {
                    await admin.messaging().send({
                        token: token,
                        notification: {
                            title: payload.title,
                            body: payload.body,
                        },
                        android: {
                            notification: {
                                channelId: category, // Matches native-notifications.ts channels
                                sound: 'default',
                                priority: (category === 'tournaments' || category === 'wallet') ? 'high' : 'default',
                            }
                        },
                        data: {
                            url: payload.url || '/',
                            category: category,
                        }
                    });
                    tokensToKeep.push(token);
                } catch (error: any) {
                    // Check if token is invalid/expired
                    if (error.code === 'messaging/registration-token-not-registered' || error.code === 'messaging/invalid-argument') {
                        nativeChanges = true;
                    } else {
                        tokensToKeep.push(token);
                    }
                }
            }

            if (nativeChanges) {
                user.fcmTokens = tokensToKeep;
                await user.save();
            }
        }

    } catch (error) {
        console.error('Failed to send push notification overall:', error);
    }
}
