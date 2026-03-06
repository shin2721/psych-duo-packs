import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useAuth } from "../AuthContext";
import { Analytics } from "../analytics";
import {
  getCheckoutContextKey,
  getPlanChangeDirection,
  getPlanChangeSnapshotKey,
  hasPlanSnapshotChanged,
  normalizePlanIdValue,
  parseCheckoutContextSnapshot,
  parsePlanChangeSnapshot,
  type PlanChangeSnapshot,
} from "../planChangeTracking";
import { supabase } from "../supabase";
import { hasProItemAccess } from "../../src/featureGate";
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

    let cancelled = false;
    setIsHydrated(false);

    const syncProfile = async () => {
      try {
        const previousPlanSnapshot = parsePlanChangeSnapshot(
          await AsyncStorage.getItem(getPlanChangeSnapshotKey(user.id))
        );

        const { data, error } = await supabase
          .from("profiles")
          .select("plan_id, active_until")
          .eq("id", user.id)
          .single();

        if (cancelled) return;
        if (error) throw error;

        const nextPlanId = normalizePlanIdValue(data?.plan_id) ?? "free";
        const nextActiveUntil = typeof data?.active_until === "string" ? data.active_until : null;
        setPlanIdState(nextPlanId);
        setActiveUntilState(nextActiveUntil);

        const nextSnapshot: PlanChangeSnapshot = {
          planId: nextPlanId,
          activeUntil: nextActiveUntil,
        };

        if (hasPlanSnapshotChanged(previousPlanSnapshot, nextSnapshot)) {
          const checkoutContext = parseCheckoutContextSnapshot(
            await AsyncStorage.getItem(getCheckoutContextKey(user.id))
          );
          const hasPlanIdChanged = Boolean(
            previousPlanSnapshot && previousPlanSnapshot.planId !== nextSnapshot.planId
          );
          const contextPriceVersion =
            hasPlanIdChanged && checkoutContext?.planId === nextSnapshot.planId
              ? checkoutContext.priceVersion
              : null;

          if (previousPlanSnapshot) {
            const { isUpgrade, isDowngrade } = getPlanChangeDirection(
              previousPlanSnapshot.planId,
              nextSnapshot.planId
            );
            Analytics.track("plan_changed", {
              source: "profile_sync",
              fromPlan: previousPlanSnapshot.planId,
              toPlan: nextSnapshot.planId,
              isUpgrade,
              isDowngrade,
              activeUntil: nextSnapshot.activeUntil,
              priceVersion: contextPriceVersion ?? undefined,
            });
          }

          await AsyncStorage.setItem(
            getPlanChangeSnapshotKey(user.id),
            JSON.stringify(nextSnapshot)
          );
        }
      } catch (error) {
        if (__DEV__) {
          console.log("Billing sync failed (using local defaults):", error);
        }
      } finally {
        if (!cancelled) {
          setIsHydrated(true);
        }
      }
    };

    syncProfile();
    return () => {
      cancelled = true;
    };
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
