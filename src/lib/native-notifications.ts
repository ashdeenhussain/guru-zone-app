import { Capacitor } from '@capacitor/core';
import { PushNotifications } from '@capacitor/push-notifications';

export const setupNativeChannels = async () => {
    if (Capacitor.getPlatform() !== 'android') return;

    try {
        // 1. Tournament Channel (High Priority)
        await PushNotifications.createChannel({
            id: 'tournaments',
            name: 'Match Alerts',
            description: 'Room IDs, Match Start times, and Tournament updates',
            importance: 5, // Max Importance (Sound + Pop-up)
            visibility: 1,
            vibration: true,
            lights: true,
            lightColor: '#F5C518'
        });

        // 2. Wallet Channel (High Priority)
        await PushNotifications.createChannel({
            id: 'wallet',
            name: 'Wallet & Finance',
            description: 'Deposit/Withdrawal status and Prize credits',
            importance: 5,
            visibility: 1,
            vibration: true,
        });

        // 3. Chat Channel (Medium Priority)
        await PushNotifications.createChannel({
            id: 'chat',
            name: 'Lobby Messages',
            description: 'New messages from other players in match rooms',
            importance: 3, // Medium (Sound only)
            visibility: 1,
            vibration: true,
        });

        // 4. System Channel (Low Priority)
        await PushNotifications.createChannel({
            id: 'system',
            name: 'System Updates',
            description: 'General announcements and platform maintenance',
            importance: 2, // Low (Silent/Minimized)
            visibility: 1,
            vibration: false,
        });

        console.log('Native Notification Channels registered successfully');
    } catch (error) {
        console.error('Error setting up native channels:', error);
    }
};

export const registerNativePush = async (onToken: (token: string) => void) => {
    if (!Capacitor.isNativePlatform()) return;

    // Request permission
    let permStatus = await PushNotifications.checkPermissions();
    
    if (permStatus.receive === 'prompt') {
        permStatus = await PushNotifications.requestPermissions();
    }

    if (permStatus.receive !== 'granted') {
        throw new Error('User denied permissions!');
    }

    // Register with FCM
    await PushNotifications.register();

    // Listen for registration success
    PushNotifications.addListener('registration', (token) => {
        onToken(token.value);
    });

    // Listen for registration error
    PushNotifications.addListener('registrationError', (error) => {
        console.error('Push registration error:', error);
    });
};
