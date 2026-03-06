import React, { createContext, useContext, useMemo } from "react";
import { BillingStateProvider, useBillingState as useBillingStateInternal } from "./app-state/billing";
import { EconomyStateProvider, useEconomyState as useEconomyStateInternal } from "./app-state/economy";
import { PracticeStateProvider, usePracticeState as usePracticeStateInternal } from "./app-state/practice";
import { ProgressionStateProvider, useProgressionState as useProgressionStateInternal } from "./app-state/progression";
import type { AppState } from "./app-state/types";

const AppStateContext = createContext<AppState | undefined>(undefined);

function AppStateFacadeProvider({ children }: { children: React.ReactNode }) {
  const billing = useBillingStateInternal();
  const economy = useEconomyStateInternal();
  const progression = useProgressionStateInternal();
  const practice = usePracticeStateInternal();

  const value = useMemo<AppState>(
    () => ({
      ...progression,
      ...economy,
      ...billing,
      ...practice,
      isStateHydrated:
        billing.isHydrated &&
        economy.isHydrated &&
        progression.isStateHydrated &&
        practice.isHydrated,
    }),
    [billing, economy, practice, progression]
  );

  return <AppStateContext.Provider value={value}>{children}</AppStateContext.Provider>;
}

export function AppStateProvider({ children }: { children: React.ReactNode }) {
  return (
    <BillingStateProvider>
      <EconomyStateProvider>
        <ProgressionStateProvider>
          <PracticeStateProvider>
            <AppStateFacadeProvider>{children}</AppStateFacadeProvider>
          </PracticeStateProvider>
        </ProgressionStateProvider>
      </EconomyStateProvider>
    </BillingStateProvider>
  );
}

export function useAppState() {
  const context = useContext(AppStateContext);
  if (!context) {
    throw new Error("useAppState must be used within AppStateProvider");
  }
  return context;
}

export function useProgressionState() {
  return useProgressionStateInternal();
}

export function useEconomyState() {
  return useEconomyStateInternal();
}

export function useBillingState() {
  return useBillingStateInternal();
}

export function usePracticeState() {
  return usePracticeStateInternal();
}
