import React, { createContext, useContext, useEffect, useState } from 'react';
import { Session, User } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from './supabase';
import { GUEST_USER_ID_PREFIX } from './authUtils';
import { logDev, warnDev } from './devLog';

type AuthContextType = {
    session: Session | null;
    user: User | null;
    isLoading: boolean;
    signIn: () => void;
    signInAsGuest: () => void;
    signOut: () => void;
};

const AuthContext = createContext<AuthContextType>({
    session: null,
    user: null,
    isLoading: true,
    signIn: () => { },
    signInAsGuest: () => { },
    signOut: () => { },
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
    const [session, setSession] = useState<Session | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const canUseGuestSession = __DEV__ || process.env.EXPO_PUBLIC_E2E_ANALYTICS_DEBUG === '1';

    useEffect(() => {
        const initSession = async () => {
            if (!canUseGuestSession) {
                // Cleanup legacy guest session key once in normal mode.
                await AsyncStorage.removeItem('guestSession').catch(() => { });
            } else {
                // In E2E analytics mode, allow local guest session bootstrap.
                try {
                    const guestSessionStr = await AsyncStorage.getItem('guestSession');
                    if (guestSessionStr) {
                        setSession(JSON.parse(guestSessionStr));
                        setIsLoading(false);
                    }
                } catch (error) {
                    warnDev('Failed to load guest session for E2E mode', error);
                }
            }

            try {
                const { data: { session: supabaseSession } } = await supabase.auth.getSession();
                setSession(supabaseSession ?? null);
                if (supabaseSession) {
                    await AsyncStorage.removeItem('guestSession').catch(() => { });
                }
            } catch (error) {
                logDev('Supabase auth check failed', error);
            } finally {
                setIsLoading(false);
            }
        };

        initSession();

        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            setSession(session);
        });

        return () => subscription.unsubscribe();
    }, []);

    const signOut = async () => {
        await supabase.auth.signOut();
        await AsyncStorage.removeItem('guestSession').catch(() => { });
        setSession(null);
    };

    const signIn = async () => {
        // This is a placeholder as the actual sign in is handled in the AuthScreen
        // But we can expose a method if needed for global access
    };

    const signInAsGuest = async () => {
        if (!canUseGuestSession) return;

        const guestUser: User = {
            id: `${GUEST_USER_ID_PREFIX}${Date.now()}`,
            app_metadata: {},
            user_metadata: {},
            aud: 'authenticated',
            created_at: new Date().toISOString(),
        };

        const guestSession: Session = {
            access_token: 'guest_token',
            refresh_token: 'guest_refresh',
            expires_in: 3600,
            token_type: 'bearer',
            user: guestUser,
        };

        try {
            await AsyncStorage.setItem('guestSession', JSON.stringify(guestSession));
            setSession(guestSession);
        } catch (error) {
            console.error('Error saving guest session:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const value = {
        session,
        user: session?.user ?? null,
        isLoading,
        signIn,
        signInAsGuest,
        signOut,
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
