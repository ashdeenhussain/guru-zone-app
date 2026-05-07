'use client';

import { SessionProvider } from 'next-auth/react';
import { ThemeProvider } from '@/context/ThemeContext';
import PushNotificationManager from './PushNotificationManager';

export default function Providers({ children }: { children: React.ReactNode }) {
    return (
        <SessionProvider>
            <ThemeProvider>
                <PushNotificationManager />
                {children}
            </ThemeProvider>
        </SessionProvider>
    );
}
