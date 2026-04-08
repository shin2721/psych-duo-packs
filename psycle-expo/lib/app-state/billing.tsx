import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import { useAuth } from "../AuthContext";
import { Analytics } from "../analytics";
import {
  getPlanChangeDirection,
  hasPlanSnapshotChanged,
  normalizePlanIdValue,
  type PlanChangeSnapshot,
} from "../planChangeTracking";
import { supabase } from "../supabase";
import { hasProItemAccess } from "../../src/featureGate";
import { logDev } from "../devLog";
import { runHydrationTask } from "./hydration";
import {
  loadBillingSnapshotContext,
  persistPlanChangeSnapshot,
} from "./billingStorage";
import type { PlanId } from "../types/plan";
import type { BillingState } from "./types";

type BillingContextValue = BillingState & { isHydrated: boolean };

const BillingStateContext = createContext<BillingContextValue | undefined>(undefined);

export function BillingStateProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [planId, setPlanIdState] = useState<PlanId>("free");
  const [activeUntil, setActiveUntilState] = useState<string | null>(null);
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    if (!user) {
      setPlanIdState("free");
      setActiveUntilState(null);
      setIsHydrated(true);
      return;
    }

    return runHydrationTask({
      setIsHydrated,
      task: async ({ isCancelled }) => {
        const { checkoutContextSnapshot, planChangeSnapshot } = await loadBillingSnapshotContext(user.id);

        const { data, error } = await supabase
          .from("profiles")
          .select("plan_id, active_until")
          .eq("id", user.id)
          .single();

        if (isCancelled()) return;
        if (error) throw error;

        const nextPlanId = normalizePlanIdValue(data?.plan_id) ?? "free";
        const nextActiveUntil = typeof data?.active_until === "string" ? data.active_until : null;
        setPlanIdState(nextPlanId);
        setActiveUntilState(nextActiveUntil);

        const nextSnapshot: PlanChangeSnapshot = {
          planId: nextPlanId,
          activeUntil: nextActiveUntil,
        };

        if (hasPlanSnapshotChanged(planChangeSnapshot, nextSnapshot)) {
          const hasPlanIdChanged = Boolean(
            planChangeSnapshot && planChangeSnapshot.planId !== nextSnapshot.planId
          );
          const contextPriceVersion =
            hasPlanIdChanged && checkoutContextSnapshot?.planId === nextSnapshot.planId
              ? checkoutContextSnapshot.priceVersion
              : null;

          if (planChangeSnapshot) {
            const { isUpgrade, isDowngrade } = getPlanChangeDirection(
              planChangeSnapshot.planId,
              nextSnapshot.planId
            );
            Analytics.track("plan_changed", {
              source: "profile_sync",
              fromPlan: planChangeSnapshot.planId,
              toPlan: nextSnapshot.planId,
              isUpgrade,
              isDowngrade,
              activeUntil: nextSnapshot.activeUntil,
              priceVersion: contextPriceVersion ?? undefined,
            });
          }

          await persistPlanChangeSnapshot(user.id, nextSnapshot);
        }
      },
      onError: (error) => {
        logDev("Billing sync failed (using local defaults):", error);
      },
    });
  }, [user]);

  const isSubscriptionActive = useMemo(() => {
    if (!activeUntil || planId === "free") return false;
    return new Date() < new Date(activeUntil);
  }, [activeUntil, planId]);

  const value = useMemo<BillingContextValue>(
    () => ({
      planId,
      setPlanId: setPlanIdState,
      hasProAccess: hasProItemAccess(planId),
      activeUntil,
      setActiveUntil: setActiveUntilState,
      isSubscriptionActive,
      isHydrated,
    }),
    [activeUntil, isHydrated, isSubscriptionActive, planId]
  );

  return <BillingStateContext.Provider value={value}>{children}</BillingStateContext.Provider>;
}

export function useBillingState() {
  const context = useContext(BillingStateContext);
  if (!context) {
    throw new Error("useBillingState must be used within BillingStateProvider");
  }
  return context;
}
