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
        const initSession = async () => {
            // Cleanup legacy guest session key once.
            await AsyncStorage.removeItem('guestSession').catch(() => { });

            try {
                const { data: { session: supabaseSession } } = await supabase.auth.getSession();
                setSession(supabaseSession ?? null);
            } catch (error) {
                if (__DEV__) console.log('Supabase auth check failed');
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
