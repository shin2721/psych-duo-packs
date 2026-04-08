import React from "react";
import { Linking, Share } from "react-native";
import { useRouter } from "expo-router";
import i18n from "../../lib/i18n";
import { SETTINGS_DEBUG_ROUTES } from "../../lib/settings/settingsDebugRoutes";
import { exportDogfoodData } from "../../lib/settings/settingsDataActions";
import {
  SettingsCard,
  SettingsSection,
  SettingRow,
  SettingStatusRow,
  SettingToggle,
} from "./SettingsRows";

export function SettingsAccountSection({
  email,
  onSignOut,
}: {
  email: string;
  onSignOut: () => void;
}) {
  return (
    <SettingsSection title={i18n.t("settings.account")}>
      <SettingsCard>
        <SettingRow icon="mail" label={i18n.t("settings.emailAddress")} value={email} onPress={() => {}} />
        <SettingRow
          icon="log-out"
          label={i18n.t("settings.logout")}
          onPress={onSignOut}
          isDestructive
          accessibilityLabel={String(i18n.t("settings.logout"))}
          showDivider={false}
        />
      </SettingsCard>
    </SettingsSection>
  );
}

export function SettingsPreferenceSection({
  notificationsEnabled,
  soundEnabled,
  hapticsEnabled,
  selectedLanguage,
  onNotificationToggle,
  onSoundToggle,
  onHapticsToggle,
  onOpenLanguageModal,
}: {
  notificationsEnabled: boolean;
  soundEnabled: boolean;
  hapticsEnabled: boolean;
  selectedLanguage: string;
  onNotificationToggle: (value: boolean) => void;
  onSoundToggle: (value: boolean) => void;
  onHapticsToggle: (value: boolean) => void;
  onOpenLanguageModal: () => void;
}) {
  return (
    <SettingsSection title={i18n.t("settings.preferences")}>
      <SettingsCard>
        <SettingToggle
          icon="notifications"
          label={i18n.t("settings.notifications")}
          value={notificationsEnabled}
          onValueChange={onNotificationToggle}
        />
        <SettingToggle
          icon="volume-high"
          label={i18n.t("settings.sound")}
          value={soundEnabled}
          onValueChange={onSoundToggle}
        />
        <SettingToggle
          icon="phone-portrait"
          label={i18n.t("settings.haptics")}
          value={hapticsEnabled}
          onValueChange={onHapticsToggle}
        />
        <SettingRow
          icon="language"
          label={i18n.t("settings.language")}
          value={selectedLanguage}
          onPress={onOpenLanguageModal}
          accessibilityLabel={`${i18n.t("settings.language")}, ${selectedLanguage}`}
          showDivider={false}
        />
      </SettingsCard>
    </SettingsSection>
  );
}

export function SettingsSupportSection({
  isRestoring,
  isOpeningPortal,
  restoreStatus,
  restoreStatusMessage,
  portalStatus,
  portalStatusMessage,
  onRestorePurchases,
  onOpenBillingPortal,
}: {
  isRestoring: boolean;
  isOpeningPortal: boolean;
  restoreStatus: "idle" | "loading" | "success" | "error";
  restoreStatusMessage: string;
  portalStatus: "idle" | "loading" | "success" | "error";
  portalStatusMessage: string;
  onRestorePurchases: () => void;
  onOpenBillingPortal: () => void;
}) {
  return (
    <SettingsSection title={i18n.t("settings.support")}>
      <SettingsCard>
        <SettingRow
          icon="help-circle"
          label={i18n.t("settings.helpFaq")}
          onPress={() => Linking.openURL("https://shin2721.github.io/psych-duo-packs/help")}
        />
        <SettingRow
          icon="shield-checkmark"
          label={i18n.t("settings.privacy")}
          onPress={() => Linking.openURL("https://shin2721.github.io/psych-duo-packs/privacy")}
        />
        <SettingRow
          icon="document-text"
          label={i18n.t("settings.terms")}
          onPress={() => Linking.openURL("https://shin2721.github.io/psych-duo-packs/terms")}
          showDivider={false}
        />
      </SettingsCard>

      <SettingsCard>
        <SettingRow
          icon="refresh-circle"
          label={isRestoring ? i18n.t("settings.restoring") : i18n.t("settings.restorePurchases")}
          onPress={onRestorePurchases}
          accessibilityLabel={String(i18n.t("settings.restorePurchases"))}
          accessibilityState={{ busy: isRestoring }}
          showDivider={restoreStatus === "idle"}
        />
        {restoreStatus !== "idle" ? (
          <SettingStatusRow
            status={restoreStatus}
            message={restoreStatusMessage}
            testID="settings-restore-status"
          />
        ) : null}
      </SettingsCard>

      <SettingsCard>
        <SettingRow
          icon="card"
          label={isOpeningPortal ? i18n.t("settings.openingPortal") : i18n.t("settings.manageBilling")}
          onPress={onOpenBillingPortal}
          accessibilityLabel={String(i18n.t("settings.manageBilling"))}
          accessibilityState={{ busy: isOpeningPortal }}
          showDivider={portalStatus === "idle"}
        />
        {portalStatus !== "idle" ? (
          <SettingStatusRow
            status={portalStatus}
            message={portalStatusMessage}
            testID="settings-billing-status"
          />
        ) : null}
      </SettingsCard>
    </SettingsSection>
  );
}

export function SettingsDebugSection({
  visible,
  onResetOnboarding,
  onClearData,
  onExportDogfoodError,
}: {
  visible: boolean;
  onResetOnboarding: () => void;
  onClearData: () => void;
  onExportDogfoodError: () => void;
}) {
  const router = useRouter();
  if (!visible) return null;

  return (
    <SettingsSection title={i18n.t("settings.debug")}>
      <SettingsCard>
        {SETTINGS_DEBUG_ROUTES.map((item) => (
          <SettingRow
            key={item.route}
            icon={item.icon}
            label={item.label}
            onPress={() => router.push(item.route as never)}
            accessibilityLabel={item.accessibilityLabel}
            testID={item.testID}
          />
        ))}
        <SettingRow
          icon="analytics"
          label={i18n.t("settings.exportDogfoodData")}
          onPress={async () => {
            try {
              const json = await exportDogfoodData();
              await Share.share({
                message: json,
                title: i18n.t("settings.dogfoodDataTitle"),
              });
            } catch {
              onExportDogfoodError();
            }
          }}
          accessibilityLabel={String(i18n.t("settings.exportDogfoodData"))}
        />
        <SettingRow
          icon="refresh"
          label={i18n.t("settings.resetOnboarding")}
          onPress={onResetOnboarding}
          accessibilityLabel={String(i18n.t("settings.resetOnboarding"))}
        />
        <SettingRow
          icon="trash"
          label={i18n.t("settings.clearLocalData")}
          onPress={onClearData}
          isDestructive
          accessibilityLabel={String(i18n.t("settings.clearLocalData"))}
          showDivider={false}
        />
      </SettingsCard>
    </SettingsSection>
  );
}
