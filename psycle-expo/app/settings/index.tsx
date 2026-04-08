import React, { useEffect, useRef, useState } from "react";
import { View, Text, StyleSheet, Pressable, ScrollView, Alert, Linking, Share } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { theme } from "../../lib/theme";
import { useAuth } from "../../lib/AuthContext";
import { useToast } from "../../components/ToastProvider";
import { hapticFeedback } from "../../lib/haptics";
import { useBillingState, useProgressionState } from "../../lib/state";
import i18n from "../../lib/i18n";
import { useLocale } from "../../lib/LocaleContext";
import { useSettingsNotifications } from "../../lib/settings/useSettingsNotifications";
import { useSettingsBillingActions } from "../../lib/settings/useSettingsBillingActions";
import { SETTINGS_DEBUG_ROUTES } from "../../lib/settings/settingsDebugRoutes";
import {
  clearLocalAppData,
  exportDogfoodData,
  resetOnboardingState,
} from "../../lib/settings/settingsDataActions";
import {
  SettingsAccountSection,
  SettingsDebugSection,
  SettingsPreferenceSection,
  SettingsSupportSection,
} from "../../components/settings/SettingsSections";
import { SettingsLanguageModal } from "../../components/settings/SettingsLanguageModal";

export default function SettingsScreen() {
  const router = useRouter();
  const currentYear = new Date().getFullYear();
  const { user, signOut } = useAuth();
  const { planId, setPlanId, setActiveUntil } = useBillingState();
  const { hasPendingDailyQuests } = useProgressionState();
  const { locale, options: localeOptions, setLocale } = useLocale();
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [hapticsEnabled, setHapticsEnabled] = useState(true);
  const [isLanguageModalVisible, setIsLanguageModalVisible] = useState(false);
  const { showToast } = useToast();
  const isAnalyticsDebugEnabled = __DEV__ || process.env.EXPO_PUBLIC_E2E_ANALYTICS_DEBUG === "1";
  const { notificationsEnabled, toggleNotificationsFromSettings } = useSettingsNotifications({
    userId: user?.id,
    hasPendingDailyQuests,
  });
  const {
    isOpeningPortal,
    isRestoring,
    portalStatus,
    portalStatusMessage,
    restoreStatus,
    restoreStatusMessage,
    restorePurchasesFromSettings,
    openBillingPortalFromSettings,
  } = useSettingsBillingActions({
    userId: user?.id,
    planId,
    setPlanId,
    setActiveUntil,
  });

  const titleTapCount = useRef(0);
  const titleTapTimeout = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    return () => {
      if (titleTapTimeout.current) {
        clearTimeout(titleTapTimeout.current);
      }
    };
  }, []);

  const handleNotificationToggle = async (enabled: boolean) => {
    const result = await toggleNotificationsFromSettings(enabled);
    if (result === "permission_denied") {
      Alert.alert(
        String(i18n.t("settings.notificationPermissionDeniedTitle")),
        String(i18n.t("settings.notificationPermissionDeniedMessage")),
        [
          { text: String(i18n.t("common.cancel")), style: "cancel" },
          {
            text: String(i18n.t("settings.openSystemSettings")),
            onPress: () => {
              Linking.openSettings().catch(() => undefined);
            },
          },
        ]
      );
    }
  };

  const handleTitleTap = () => {
    if (!isAnalyticsDebugEnabled) return;

    titleTapCount.current += 1;
    if (titleTapTimeout.current) {
      clearTimeout(titleTapTimeout.current);
    }

    if (titleTapCount.current >= 5) {
      titleTapCount.current = 0;
      void hapticFeedback.success();
      router.push("/debug/analytics");
      return;
    }

    titleTapTimeout.current = setTimeout(() => {
      titleTapCount.current = 0;
    }, 2000);
  };

  const handleRestorePurchases = async () => {
    const toast = await restorePurchasesFromSettings();
    if (!toast) return;
    if (toast.variant) {
      showToast(toast.message, toast.variant);
      return;
    }
    showToast(toast.message);
  };

  const handleOpenBillingPortal = async () => {
    const toast = await openBillingPortalFromSettings();
    if (!toast) return;
    if (toast.variant) {
      showToast(toast.message, toast.variant);
      return;
    }
    showToast(toast.message);
  };

  const handleSignOut = async () => {
    Alert.alert(i18n.t("settings.signOutTitle"), i18n.t("settings.signOutConfirm"), [
      { text: i18n.t("common.cancel"), style: "cancel" },
      {
        text: i18n.t("settings.logout"),
        style: "destructive",
        onPress: async () => {
          await signOut();
          router.replace("/auth");
        },
      },
    ]);
  };

  const handleResetOnboarding = async () => {
    await resetOnboardingState();
    showToast(String(i18n.t("settings.resetDoneMessage")), "success");
  };

  const handleClearData = async () => {
    Alert.alert(i18n.t("settings.clearDataTitle"), i18n.t("settings.clearDataConfirm"), [
      { text: i18n.t("common.cancel"), style: "cancel" },
      {
        text: i18n.t("settings.delete"),
        style: "destructive",
        onPress: async () => {
          await clearLocalAppData();
          showToast(String(i18n.t("settings.localDataDeleted")), "success");
        },
      },
    ]);
  };

  const selectedLanguage = localeOptions.find((item) => item.code === locale)?.label ?? locale;

  const handleSelectLanguage = async (next: typeof locale) => {
    await setLocale(next);
    setIsLanguageModalVisible(false);
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView testID="settings-scroll">
        <View style={styles.header}>
          <Pressable
            onPress={() => router.back()}
            style={styles.backButton}
            testID="settings-back"
            accessibilityRole="button"
            accessibilityLabel={`${i18n.t("common.back")}: ${i18n.t("settings.title")}`}
          >
            <Ionicons name="arrow-back" size={24} color={theme.colors.text} />
          </Pressable>
          <Pressable onPress={handleTitleTap} testID="settings-title-tap">
            <Text style={styles.headerTitle}>{i18n.t("settings.title")}</Text>
          </Pressable>
          <View style={styles.headerSpacer} />
        </View>

        <SettingsAccountSection email={user?.email || ""} onSignOut={handleSignOut} />
        <SettingsPreferenceSection
          notificationsEnabled={notificationsEnabled}
          soundEnabled={soundEnabled}
          hapticsEnabled={hapticsEnabled}
          selectedLanguage={selectedLanguage}
          onNotificationToggle={(value) => {
            void handleNotificationToggle(value);
          }}
          onSoundToggle={setSoundEnabled}
          onHapticsToggle={setHapticsEnabled}
          onOpenLanguageModal={() => setIsLanguageModalVisible(true)}
        />
        <SettingsSupportSection
          isRestoring={isRestoring}
          isOpeningPortal={isOpeningPortal}
          restoreStatus={restoreStatus}
          restoreStatusMessage={restoreStatusMessage}
          portalStatus={portalStatus}
          portalStatusMessage={portalStatusMessage}
          onRestorePurchases={() => {
            void handleRestorePurchases();
          }}
          onOpenBillingPortal={() => {
            void handleOpenBillingPortal();
          }}
        />
        <SettingsDebugSection
          visible={isAnalyticsDebugEnabled}
          onResetOnboarding={() => {
            void handleResetOnboarding();
          }}
          onClearData={handleClearData}
          onExportDogfoodError={() => showToast(String(i18n.t("settings.exportFailed")), "error")}
        />

        <View style={styles.appInfo}>
          <Text style={styles.appInfoText}>Psycle v1.0.0</Text>
          <Text style={styles.appInfoText}>© {currentYear} Psycle</Text>
        </View>
      </ScrollView>

      <SettingsLanguageModal
        locale={locale}
        localeOptions={localeOptions}
        onClose={() => setIsLanguageModalVisible(false)}
        onSelectLanguage={(next) => {
          const matched = localeOptions.find((item) => item.code === next);
          if (!matched) return;
          return handleSelectLanguage(matched.code);
        }}
        visible={isLanguageModalVisible}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.bg,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: theme.spacing.lg,
  },
  backButton: {
    padding: theme.spacing.xs,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: theme.colors.text,
  },
  headerSpacer: {
    width: 40,
  },
  appInfo: {
    alignItems: "center",
    padding: theme.spacing.xl,
    marginTop: theme.spacing.xl,
  },
  appInfoText: {
    fontSize: 12,
    color: theme.colors.sub,
    marginBottom: theme.spacing.xs,
  },
});
