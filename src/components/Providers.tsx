'use client';

import { SessionProvider } from 'next-auth/react';
import { ThemeProvider } from '@/context/ThemeContext';
import { GuestProvider } from '@/context/GuestContext';
import PushNotificationManager from './PushNotificationManager';

export default function Providers({ children }: { children: React.ReactNode }) {
    return (
        <SessionProvider>
            <GuestProvider>
                <ThemeProvider>
                    <PushNotificationManager />
                    {children}
                </ThemeProvider>
            </GuestProvider>
        </SessionProvider>
    );
}
