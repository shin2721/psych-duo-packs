import { useCallback, useEffect, useState } from "react";
import {
  cancelPsycleReminders,
  ensureNotificationPermission,
  getNotificationPreference,
  setNotificationPreference,
  syncDailyReminders,
} from "../notifications";
import { warnDev } from "../devLog";

export type SettingsNotificationToggleResult = "disabled" | "granted" | "permission_denied";

export function useSettingsNotifications(params: {
  userId: string | null | undefined;
  hasPendingDailyQuests: boolean;
}) {
  const { userId, hasPendingDailyQuests } = params;
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);

  useEffect(() => {
    let mounted = true;

    getNotificationPreference()
      .then((enabled) => {
        if (mounted) setNotificationsEnabled(enabled);
      })
      .catch((error) => {
        warnDev("Failed to load notification preference:", error);
      });

    return () => {
      mounted = false;
    };
  }, []);

  const toggleNotificationsFromSettings = useCallback(
    async (enabled: boolean): Promise<SettingsNotificationToggleResult> => {
      setNotificationsEnabled(enabled);
      await setNotificationPreference(enabled);

      if (!enabled) {
        await cancelPsycleReminders();
        return "disabled";
      }

      const permission = await ensureNotificationPermission("settings_toggle");
      if (permission !== "granted") {
        setNotificationsEnabled(false);
        await setNotificationPreference(false);
        await cancelPsycleReminders();
        return "permission_denied";
      }

      if (userId) {
        await syncDailyReminders({
          userId,
          hasPendingDailyQuests,
        });
      }

      return "granted";
    },
    [hasPendingDailyQuests, userId]
  );

  return {
    notificationsEnabled,
    toggleNotificationsFromSettings,
  };
}
