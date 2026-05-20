'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import GuestLoginPromptModal from '@/components/shared/GuestLoginPromptModal';

interface GuestContextType {
    isGuest: boolean;
    loginAsGuest: () => void;
    logoutGuest: () => void;
    /** Call this to show the "Sign Up to play" modal for guests */
    requireAuth: (action?: () => void) => void;
}

const GuestContext = createContext<GuestContextType | undefined>(undefined);

export function GuestProvider({ children }: { children: React.ReactNode }) {
    const [isGuest, setIsGuest] = useState<boolean>(false);
    const [isPromptOpen, setIsPromptOpen] = useState(false);
    const router = useRouter();

    useEffect(() => {
        // Read cookie on mount
        const cookies = document.cookie.split(';');
        const guestCookie = cookies.find(c => c.trim().startsWith('isGuest='));
        if (guestCookie && guestCookie.split('=')[1] === 'true') {
            setIsGuest(true);
        }
    }, []);

    const loginAsGuest = () => {
        document.cookie = "isGuest=true; path=/; max-age=86400; SameSite=Lax";
        setIsGuest(true);
        router.push('/dashboard');
        router.refresh();
    };

    const logoutGuest = () => {
        document.cookie = "isGuest=; path=/; max-age=0; SameSite=Lax";
        setIsGuest(false);
        router.push('/');
        router.refresh();
    };

    /**
     * requireAuth: If user is a guest, show the login prompt modal.
     * If user is authenticated, optionally run the provided action.
     */
    const requireAuth = useCallback((action?: () => void) => {
        if (isGuest) {
            setIsPromptOpen(true);
        } else if (action) {
            action();
        }
    }, [isGuest]);

    return (
        <GuestContext.Provider value={{ isGuest, loginAsGuest, logoutGuest, requireAuth }}>
            {children}
            {/* Global login prompt modal rendered at root level */}
            <GuestLoginPromptModal
                isOpen={isPromptOpen}
                onClose={() => setIsPromptOpen(false)}
            />
        </GuestContext.Provider>
    );
}

export function useGuest() {
    const context = useContext(GuestContext);
    if (context === undefined) {
        throw new Error('useGuest must be used within a GuestProvider');
    }
    return context;
}
