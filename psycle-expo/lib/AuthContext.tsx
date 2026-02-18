import React, { createContext, useContext, useEffect, useState } from 'react';
import { Session, User } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from './supabase';

type AuthContextType = {
    session: Session | null;
    user: User | null;
    isLoading: boolean;
    signIn: () => void;
    signOut: () => void;
};

const AuthContext = createContext<AuthContextType>({
    session: null,
    user: null,
    isLoading: true,
    signIn: () => { },
    signOut: () => { },
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
    const [session, setSession] = useState<Session | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        let active = true;

        const initSession = async () => {
            try {
                // Cleanup legacy guest session data from previous builds.
                await AsyncStorage.removeItem('guestSession');
            } catch (error) {
                if (__DEV__) console.log('Legacy guest session cleanup skipped:', error);
            }

            try {
                const { data: { session: supabaseSession } } = await supabase.auth.getSession();
                if (active) {
                    setSession(supabaseSession);
                }
            } catch (error) {
                if (__DEV__) console.log('Supabase auth check failed:', error);
            } finally {
                if (active) {
                    setIsLoading(false);
                }
            }
        };

        initSession();

        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, nextSession) => {
            if (!active) return;
            setSession(nextSession);
            if (!nextSession) {
                setIsLoading(false);
            }
        });

        return () => {
            active = false;
            subscription.unsubscribe();
        };
    }, []);

    const signOut = async () => {
        await supabase.auth.signOut();
        setSession(null);
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
        signOut,
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
