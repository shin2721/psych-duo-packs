import React, { createContext, useContext, useMemo } from "react";
import { BillingStateProvider, useBillingState } from "./billing";
import { EconomyStateProvider, useEconomyState } from "./economy";
import { PracticeStateProvider, usePracticeState } from "./practice";
import { ProgressionStateProvider, useProgressionState } from "./progression";
import type { AppState } from "./types";

const AppStateContext = createContext<AppState | undefined>(undefined);

function buildCompatibilityAppStateValue(
  progression: ReturnType<typeof useProgressionState>,
  economy: ReturnType<typeof useEconomyState>,
  billing: ReturnType<typeof useBillingState>,
  practice: ReturnType<typeof usePracticeState>
): AppState {
  return {
    ...progression,
    ...economy,
    ...billing,
    ...practice,
    isStateHydrated:
      billing.isHydrated &&
      economy.isHydrated &&
      progression.isStateHydrated &&
      practice.isHydrated,
  };
}

function AppStateFacadeProvider({ children }: { children: React.ReactNode }) {
  const billing = useBillingState();
  const economy = useEconomyState();
  const progression = useProgressionState();
  const practice = usePracticeState();

  const value = useMemo(
    () => buildCompatibilityAppStateValue(progression, economy, billing, practice),
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

