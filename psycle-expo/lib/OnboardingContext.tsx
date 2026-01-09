import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

interface OnboardingContextType {
    hasSeenOnboarding: boolean | null;
    completeOnboarding: () => Promise<void>;
    isLoading: boolean;
}

const OnboardingContext = createContext<OnboardingContextType | undefined>(undefined);

export function OnboardingProvider({ children }: { children: ReactNode }) {
    const [hasSeenOnboarding, setHasSeenOnboarding] = useState<boolean | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        checkOnboardingStatus();
    }, []);

    const checkOnboardingStatus = async () => {
        try {
            const value = await AsyncStorage.getItem("hasSeenOnboarding");
            setHasSeenOnboarding(value === "true");
        } catch (error) {
            console.error("Failed to check onboarding status:", error);
            setHasSeenOnboarding(false);
        } finally {
            setIsLoading(false);
        }
    };

    const completeOnboarding = async () => {
        try {
            await AsyncStorage.setItem("hasSeenOnboarding", "true");
            setHasSeenOnboarding(true);
        } catch (error) {
            console.error("Failed to complete onboarding:", error);
        }
    };

    return (
        <OnboardingContext.Provider value={{ hasSeenOnboarding, completeOnboarding, isLoading }}>
            {children}
        </OnboardingContext.Provider>
    );
}

export function useOnboarding() {
    const context = useContext(OnboardingContext);
    if (context === undefined) {
        throw new Error("useOnboarding must be used within an OnboardingProvider");
    }
    return context;
}
