import React, { useCallback, useEffect, useRef, useState } from "react";
import { openBillingPortal, restorePurchases } from "../billing";
import { Analytics } from "../analytics";
import { getPlanChangeDirection } from "../planChangeTracking";
import { persistPlanChangeSnapshot } from "../app-state/billingStorage";
import i18n from "../i18n";
import type { PlanId } from "../types/plan";
import { warnDev } from "../devLog";

type AsyncStatus = "idle" | "loading" | "success" | "error";
type StatusSetter = React.Dispatch<React.SetStateAction<AsyncStatus>>;
type MessageSetter = React.Dispatch<React.SetStateAction<string>>;

export type SettingsActionToast = {
  message: string;
  variant?: "success" | "error";
} | null;

function scheduleStatusReset(
  timerRef: React.MutableRefObject<NodeJS.Timeout | null>,
  setStatus: StatusSetter,
  setMessage: MessageSetter
) {
  if (timerRef.current) {
    clearTimeout(timerRef.current);
  }

  timerRef.current = setTimeout(() => {
    setStatus("idle");
    setMessage("");
  }, 5000);
}

export function useSettingsBillingActions(params: {
  userId: string | null | undefined;
  planId: PlanId;
  setPlanId: (planId: PlanId) => void;
  setActiveUntil: (activeUntil: string | null) => void;
}) {
  const { userId, planId, setPlanId, setActiveUntil } = params;
  const [isOpeningPortal, setIsOpeningPortal] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);
  const [portalStatus, setPortalStatus] = useState<AsyncStatus>("idle");
  const [restoreStatus, setRestoreStatus] = useState<AsyncStatus>("idle");
  const [portalStatusMessage, setPortalStatusMessage] = useState("");
  const [restoreStatusMessage, setRestoreStatusMessage] = useState("");
  const portalStatusTimer = useRef<NodeJS.Timeout | null>(null);
  const restoreStatusTimer = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    return () => {
      if (portalStatusTimer.current) clearTimeout(portalStatusTimer.current);
      if (restoreStatusTimer.current) clearTimeout(restoreStatusTimer.current);
    };
  }, []);

  const updateRestoreStatus = useCallback((status: AsyncStatus, message = "") => {
    setRestoreStatus(status);
    setRestoreStatusMessage(message);
    if (status === "success" || status === "error") {
      scheduleStatusReset(restoreStatusTimer, setRestoreStatus, setRestoreStatusMessage);
      return;
    }
    if (restoreStatusTimer.current) {
      clearTimeout(restoreStatusTimer.current);
      restoreStatusTimer.current = null;
    }
  }, []);

  const updatePortalStatus = useCallback((status: AsyncStatus, message = "") => {
    setPortalStatus(status);
    setPortalStatusMessage(message);
    if (status === "success" || status === "error") {
      scheduleStatusReset(portalStatusTimer, setPortalStatus, setPortalStatusMessage);
      return;
    }
    if (portalStatusTimer.current) {
      clearTimeout(portalStatusTimer.current);
      portalStatusTimer.current = null;
    }
  }, []);

  const restorePurchasesFromSettings = useCallback(async (): Promise<SettingsActionToast> => {
    if (!userId) {
      const message = String(i18n.t("settings.loginRequiredForRestore"));
      updateRestoreStatus("error", message);
      return { message, variant: "error" };
    }

    setIsRestoring(true);
    updateRestoreStatus("loading", String(i18n.t("settings.restoreStatusLoading")));

    try {
      const result = await restorePurchases();
      if (result.status === "restored") {
        const previousPlan = planId;
        const restoredPlan = result.planId;
        const restoredActiveUntil = result.activeUntil ?? null;
        const { isUpgrade, isDowngrade } = getPlanChangeDirection(previousPlan, restoredPlan);
        setPlanId(restoredPlan);
        setActiveUntil(restoredActiveUntil);
        Analytics.track("plan_changed", {
          source: "restore_purchases",
          fromPlan: previousPlan,
          toPlan: restoredPlan,
          isUpgrade,
          isDowngrade,
          activeUntil: restoredActiveUntil,
        });
        await persistPlanChangeSnapshot(userId, {
          planId: restoredPlan,
          activeUntil: restoredActiveUntil,
        });
        const message = String(i18n.t("settings.restoreStatusSuccess"));
        updateRestoreStatus("success", message);
        return { message, variant: "success" };
      }

      if (result.status === "not_found") {
        const message = String(i18n.t("settings.restoreStatusNotFound"));
        updateRestoreStatus("error", message);
        return { message };
      }

      const message = String(i18n.t("settings.restoreStatusError"));
      updateRestoreStatus("error", message);
      return { message, variant: "error" };
    } catch (error) {
      warnDev("Restore purchases failed:", error);
      const message = String(i18n.t("settings.restoreStatusError"));
      updateRestoreStatus("error", message);
      return { message, variant: "error" };
    } finally {
      setIsRestoring(false);
    }
  }, [planId, setActiveUntil, setPlanId, updateRestoreStatus, userId]);

  const openBillingPortalFromSettings = useCallback(async (): Promise<SettingsActionToast> => {
    if (!userId) {
      const message = String(i18n.t("settings.loginRequiredForBillingPortal"));
      updatePortalStatus("error", message);
      return { message, variant: "error" };
    }

    setIsOpeningPortal(true);
    updatePortalStatus("loading", String(i18n.t("settings.billingStatusLoading")));
    try {
      const result = await openBillingPortal();
      if (!result.ok) {
        const message = String(i18n.t("settings.billingPortalUnavailable"));
        updatePortalStatus("error", String(i18n.t("settings.billingStatusError")));
        return { message, variant: "error" };
      }

      const message = String(i18n.t("settings.billingStatusSuccess"));
      updatePortalStatus("success", message);
      return { message, variant: "success" };
    } catch (error) {
      warnDev("Open billing portal failed:", error);
      const message = String(i18n.t("settings.billingStatusError"));
      updatePortalStatus("error", message);
      return { message, variant: "error" };
    } finally {
      setIsOpeningPortal(false);
    }
  }, [updatePortalStatus, userId]);

  return {
    isOpeningPortal,
    isRestoring,
    portalStatus,
    portalStatusMessage,
    restoreStatus,
    restoreStatusMessage,
    restorePurchasesFromSettings,
    openBillingPortalFromSettings,
  };
}
