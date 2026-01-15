import React, { createContext, useContext, useEffect, useState } from 'react';
import { Session, User } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from './supabase';

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

    useEffect(() => {
        const initSession = async () => {
            // STEP 1: Check local guest session FIRST (instant)
            try {
                const guestSessionStr = await AsyncStorage.getItem('guestSession');
                if (guestSessionStr) {
                    setSession(JSON.parse(guestSessionStr));
                    setIsLoading(false);
                    // Continue to check Supabase in background...
                }
            } catch (error) {
                console.error('Error loading guest session:', error);
            }

            // STEP 2: Check Supabase in background (non-blocking)
            try {
                const { data: { session: supabaseSession } } = await supabase.auth.getSession();

                if (supabaseSession) {
                    setSession(supabaseSession);
                    // Clear guest session if we have a real one
                    AsyncStorage.removeItem('guestSession');
                }
            } catch (error) {
                if (__DEV__) console.log('Supabase auth check failed (using local session)');
            } finally {
                // Always ensure loading is complete
                setIsLoading(false);
            }
        };

        initSession();

        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            // Only update if we don't have a guest session, or if this is a valid supabase session
            // Ideally, real auth should take precedence.
            if (session) {
                setSession(session);
                // Clear guest session if we logged in consistently
                AsyncStorage.removeItem('guestSession');
            } else {
                // If signed out from supabase, check if we should fall back to guest (unlikely)
                // or simply clear session.
                // However, onAuthStateChange fires with null on initial load if no session.
                // We should be careful not to overwrite our guest session logic.
                // For now, let's assume explicit signOut clears everything.
            }
        });

        return () => subscription.unsubscribe();
    }, []);

    const signOut = async () => {
        await supabase.auth.signOut();
        await AsyncStorage.removeItem('guestSession');
        setSession(null);
    };

    const signInAsGuest = async () => {
        const guestUser: User = {
            id: 'guest_user',
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

    const signIn = async () => {
        // This is a placeholder as the actual sign in is handled in the AuthScreen
        // But we can expose a method if needed for global access
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
