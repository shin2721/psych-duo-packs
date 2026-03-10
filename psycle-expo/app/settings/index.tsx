import React, { useEffect, useRef, useState } from "react";
import { View, Text, StyleSheet, Pressable, ScrollView, Switch, Alert, Linking, Share, Modal, type AccessibilityState } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { theme } from "../../lib/theme";
import { useAuth } from "../../lib/AuthContext";
import { useToast } from "../../components/ToastProvider";
import { openBillingPortal, restorePurchases } from "../../lib/billing";
import { hapticFeedback } from "../../lib/haptics";
import { useBillingState, useProgressionState } from "../../lib/state";
import { getExportableJSON } from "../../lib/dogfood";
import i18n from "../../lib/i18n";
import { useLocale } from "../../lib/LocaleContext";
import { Analytics } from "../../lib/analytics";
import {
    getPlanChangeDirection,
    getPlanChangeSnapshotKey,
} from "../../lib/planChangeTracking";
import {
    cancelPsycleReminders,
    ensureNotificationPermission,
    getNotificationPreference,
    setNotificationPreference,
    syncDailyReminders,
} from "../../lib/notifications";

export default function SettingsScreen() {
    const router = useRouter();
    const currentYear = new Date().getFullYear();
    const { user, signOut } = useAuth();
    const { planId, setPlanId, setActiveUntil } = useBillingState();
    const { hasPendingDailyQuests } = useProgressionState();
    const { locale, options: localeOptions, setLocale } = useLocale();
    const [notificationsEnabled, setNotificationsEnabled] = useState(false);
    const [soundEnabled, setSoundEnabled] = useState(true);
    const [hapticsEnabled, setHapticsEnabled] = useState(true);
    const [isOpeningPortal, setIsOpeningPortal] = useState(false);
    const [isRestoring, setIsRestoring] = useState(false);
    const [isLanguageModalVisible, setIsLanguageModalVisible] = useState(false);
    const [portalStatus, setPortalStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
    const [restoreStatus, setRestoreStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
    const [portalStatusMessage, setPortalStatusMessage] = useState("");
    const [restoreStatusMessage, setRestoreStatusMessage] = useState("");
    const { showToast } = useToast();
    const portalStatusTimer = useRef<NodeJS.Timeout | null>(null);
    const restoreStatusTimer = useRef<NodeJS.Timeout | null>(null);
    const isAnalyticsDebugEnabled = __DEV__ || process.env.EXPO_PUBLIC_E2E_ANALYTICS_DEBUG === "1";

    // Secret 5-tap entry for Analytics Debug (DEV + E2E release)
    const titleTapCount = useRef(0);
    const titleTapTimeout = useRef<NodeJS.Timeout | null>(null);

    useEffect(() => {
        let mounted = true;

        const loadNotificationPreference = async () => {
            const enabled = await getNotificationPreference();
            if (mounted) setNotificationsEnabled(enabled);
        };

        loadNotificationPreference().catch((error) => {
            console.error("Failed to load notification preference:", error);
        });

        return () => {
            mounted = false;
            if (portalStatusTimer.current) {
                clearTimeout(portalStatusTimer.current);
            }
            if (restoreStatusTimer.current) {
                clearTimeout(restoreStatusTimer.current);
            }
        };
    }, []);

    const scheduleStatusReset = (
        timerRef: React.MutableRefObject<NodeJS.Timeout | null>,
        setStatus: React.Dispatch<React.SetStateAction<"idle" | "loading" | "success" | "error">>,
        setMessage: React.Dispatch<React.SetStateAction<string>>
    ) => {
        if (timerRef.current) {
            clearTimeout(timerRef.current);
        }
        timerRef.current = setTimeout(() => {
            setStatus("idle");
            setMessage("");
        }, 5000);
    };

    const updateRestoreStatus = (status: "idle" | "loading" | "success" | "error", message = "") => {
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
    };

    const updatePortalStatus = (status: "idle" | "loading" | "success" | "error", message = "") => {
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
    };

    const handleNotificationToggle = async (enabled: boolean) => {
        setNotificationsEnabled(enabled);
        await setNotificationPreference(enabled);

        if (!enabled) {
            await cancelPsycleReminders();
            return;
        }

        const permission = await ensureNotificationPermission("settings_toggle");
        if (permission !== "granted") {
            setNotificationsEnabled(false);
            await setNotificationPreference(false);
            await cancelPsycleReminders();
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
            return;
        }

        if (user?.id) {
            await syncDailyReminders({
                userId: user.id,
                hasPendingDailyQuests,
            });
        }
    };

    const handleTitleTap = () => {
        if (!isAnalyticsDebugEnabled) return;

        titleTapCount.current += 1;

        // Reset timeout
        if (titleTapTimeout.current) {
            clearTimeout(titleTapTimeout.current);
        }

        if (titleTapCount.current >= 5) {
            // Success! Navigate to debug screen
            titleTapCount.current = 0;
            void hapticFeedback.success();
            router.push('/debug/analytics');
        } else {
            // Reset after 2 seconds of no taps
            titleTapTimeout.current = setTimeout(() => {
                titleTapCount.current = 0;
            }, 2000);
        }
    };

    const handleRestorePurchases = async () => {
        if (!user?.id) {
            updateRestoreStatus("error", String(i18n.t("settings.loginRequiredForRestore")));
            showToast(String(i18n.t("settings.loginRequiredForRestore")), "error");
            return;
        }
        setIsRestoring(true);
        updateRestoreStatus("loading", String(i18n.t("settings.restoreStatusLoading")));
        try {
            const result = await restorePurchases();
            if (result && result.restored && result.planId) {
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
                await AsyncStorage.setItem(
                    getPlanChangeSnapshotKey(user.id),
                    JSON.stringify({
                        planId: restoredPlan,
                        activeUntil: restoredActiveUntil,
                    })
                );
                updateRestoreStatus("success", String(i18n.t("settings.restoreStatusSuccess")));
                showToast(String(i18n.t("settings.restoreStatusSuccess")), "success");
                return;
            }
            updateRestoreStatus("error", String(i18n.t("settings.restoreStatusError")));
            showToast(String(i18n.t("settings.restoreStatusError")), "error");
        } catch (error) {
            console.error("Restore purchases error:", error);
            updateRestoreStatus("error", String(i18n.t("settings.restoreStatusError")));
            showToast(String(i18n.t("settings.restoreStatusError")), "error");
        } finally {
            setIsRestoring(false);
        }
    };

    const handleOpenBillingPortal = async () => {
        if (!user?.id) {
            updatePortalStatus("error", String(i18n.t("settings.loginRequiredForBillingPortal")));
            showToast(String(i18n.t("settings.loginRequiredForBillingPortal")), "error");
            return;
        }

        setIsOpeningPortal(true);
        updatePortalStatus("loading", String(i18n.t("settings.billingStatusLoading")));
        try {
            const ok = await openBillingPortal();
            if (!ok) {
                updatePortalStatus("error", String(i18n.t("settings.billingStatusError")));
                showToast(String(i18n.t("settings.billingPortalUnavailable")), "error");
                return;
            }
            updatePortalStatus("success", String(i18n.t("settings.billingStatusSuccess")));
            showToast(String(i18n.t("settings.billingStatusSuccess")), "success");
        } catch (error) {
            console.error("Open billing portal error:", error);
            updatePortalStatus("error", String(i18n.t("settings.billingStatusError")));
            showToast(String(i18n.t("settings.billingStatusError")), "error");
        } finally {
            setIsOpeningPortal(false);
        }
    };

    const handleSignOut = async () => {
        Alert.alert(
            i18n.t("settings.signOutTitle"),
            i18n.t("settings.signOutConfirm"),
            [
                { text: i18n.t("common.cancel"), style: "cancel" },
                {
                    text: i18n.t("settings.logout"),
                    style: "destructive",
                    onPress: async () => {
                        await signOut();
                        router.replace("/auth");
                    },
                },
            ]
        );
    };

    const handleResetOnboarding = async () => {
        await AsyncStorage.removeItem("hasSeenOnboarding");
        showToast(String(i18n.t("settings.resetDoneMessage")), "success");
    };

    const handleClearData = async () => {
        Alert.alert(
            i18n.t("settings.clearDataTitle"),
            i18n.t("settings.clearDataConfirm"),
            [
                { text: i18n.t("common.cancel"), style: "cancel" },
                {
                    text: i18n.t("settings.delete"),
                    style: "destructive",
                    onPress: async () => {
                        await AsyncStorage.clear();
                        showToast(String(i18n.t("settings.localDataDeleted")), "success");
                    },
                },
            ]
        );
    };

    const selectedLanguage = localeOptions.find((item) => item.code === locale)?.label ?? locale;

    const handleSelectLanguage = async (next: typeof locale) => {
        await setLocale(next);
        setIsLanguageModalVisible(false);
    };

    return (
        <SafeAreaView style={styles.container}>
            <ScrollView testID="settings-scroll">
                {/* Header */}
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
                    <View style={{ width: 40 }} />
                </View>

                {/* Account Section */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>{i18n.t("settings.account")}</Text>
                    <View style={styles.sectionCard}>
                        <SettingRow
                            icon="mail"
                            label={i18n.t("settings.emailAddress")}
                            value={user?.email || ""}
                            onPress={() => { }}
                        />
                        <SettingRow
                            icon="log-out"
                            label={i18n.t("settings.logout")}
                            onPress={handleSignOut}
                            isDestructive
                            accessibilityLabel={String(i18n.t("settings.logout"))}
                            showDivider={false}
                        />
                    </View>
                </View>

                {/* Preferences Section */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>{i18n.t("settings.preferences")}</Text>
                    <View style={styles.sectionCard}>
                        <SettingToggle
                            icon="notifications"
                            label={i18n.t("settings.notifications")}
                            value={notificationsEnabled}
                            onValueChange={(value) => {
                                handleNotificationToggle(value).catch((error) => {
                                    console.error("Failed to update notification preference:", error);
                                });
                            }}
                        />
                        <SettingToggle
                            icon="volume-high"
                            label={i18n.t("settings.sound")}
                            value={soundEnabled}
                            onValueChange={setSoundEnabled}
                        />
                        <SettingToggle
                            icon="phone-portrait"
                            label={i18n.t("settings.haptics")}
                            value={hapticsEnabled}
                            onValueChange={setHapticsEnabled}
                        />
                        <SettingRow
                            icon="language"
                            label={i18n.t("settings.language")}
                            value={selectedLanguage}
                            onPress={() => setIsLanguageModalVisible(true)}
                            accessibilityLabel={`${i18n.t("settings.language")}, ${selectedLanguage}`}
                            showDivider={false}
                        />
                    </View>
                </View>

                {/* Support Section */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>{i18n.t("settings.support")}</Text>
                    <View style={styles.sectionCard}>
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
                    </View>
                    <View style={styles.sectionCard}>
                        <SettingRow
                            icon="refresh-circle"
                            label={isRestoring ? i18n.t("settings.restoring") : i18n.t("settings.restorePurchases")}
                            onPress={handleRestorePurchases}
                            accessibilityLabel={String(i18n.t("settings.restorePurchases"))}
                            accessibilityState={{ busy: isRestoring }}
                            showDivider={restoreStatus === "idle"}
                        />
                        {restoreStatus !== "idle" && (
                            <SettingStatusRow
                                status={restoreStatus}
                                message={restoreStatusMessage}
                                testID="settings-restore-status"
                            />
                        )}
                    </View>
                    <View style={styles.sectionCard}>
                        <SettingRow
                            icon="card"
                            label={isOpeningPortal ? i18n.t("settings.openingPortal") : i18n.t("settings.manageBilling")}
                            onPress={handleOpenBillingPortal}
                            accessibilityLabel={String(i18n.t("settings.manageBilling"))}
                            accessibilityState={{ busy: isOpeningPortal }}
                            showDivider={portalStatus === "idle"}
                        />
                        {portalStatus !== "idle" && (
                            <SettingStatusRow
                                status={portalStatus}
                                message={portalStatusMessage}
                                testID="settings-billing-status"
                            />
                        )}
                    </View>
                </View>

                {/* Debug Section (Dev + E2E release) */}
                {isAnalyticsDebugEnabled && (
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>{i18n.t("settings.debug")}</Text>
                        <View style={styles.sectionCard}>
                            <SettingRow
                                icon="analytics"
                                label="Analytics Debug"
                                onPress={() => router.push('/debug/analytics')}
                                accessibilityLabel="Analytics Debug"
                                testID="open-analytics-debug"
                            />
                            <SettingRow
                                icon="analytics"
                                label={i18n.t("settings.exportDogfoodData")}
                                onPress={async () => {
                                    try {
                                        const json = await getExportableJSON();
                                        await Share.share({
                                            message: json,
                                            title: i18n.t("settings.dogfoodDataTitle")
                                        });
                                    } catch (e) {
                                        showToast(String(i18n.t("settings.exportFailed")), "error");
                                    }
                                }}
                                accessibilityLabel={String(i18n.t("settings.exportDogfoodData"))}
                            />
                            <SettingRow
                                icon="refresh"
                                label={i18n.t("settings.resetOnboarding")}
                                onPress={handleResetOnboarding}
                                accessibilityLabel={String(i18n.t("settings.resetOnboarding"))}
                            />
                            <SettingRow
                                icon="trash"
                                label={i18n.t("settings.clearLocalData")}
                                onPress={handleClearData}
                                isDestructive
                                accessibilityLabel={String(i18n.t("settings.clearLocalData"))}
                                showDivider={false}
                            />
                        </View>
                    </View>
                )}

                {/* App Info */}
                <View style={styles.appInfo}>
                    <Text style={styles.appInfoText}>Psycle v1.0.0</Text>
                    <Text style={styles.appInfoText}>© {currentYear} Psycle</Text>
                </View>
            </ScrollView>

            <Modal
                visible={isLanguageModalVisible}
                transparent
                animationType="fade"
                onRequestClose={() => setIsLanguageModalVisible(false)}
            >
                <Pressable style={styles.modalBackdrop} onPress={() => setIsLanguageModalVisible(false)}>
                    <Pressable style={styles.modalCard} onPress={() => { }}>
                        <Text style={styles.modalTitle}>{i18n.t("settings.languagePickerTitle")}</Text>
                        {localeOptions.map((item) => (
                            <Pressable
                                key={item.code}
                                style={styles.languageOption}
                                onPress={() => handleSelectLanguage(item.code)}
                                accessibilityRole="button"
                                accessibilityLabel={item.label}
                                accessibilityState={{ selected: locale === item.code }}
                            >
                                <Text style={styles.languageLabel}>{item.label}</Text>
                                {locale === item.code && (
                                    <Ionicons name="checkmark" size={18} color={theme.colors.primary} />
                                )}
                            </Pressable>
                        ))}
                        <Pressable
                            style={styles.modalCloseButton}
                            onPress={() => setIsLanguageModalVisible(false)}
                            accessibilityRole="button"
                            accessibilityLabel={String(i18n.t("common.close"))}
                        >
                            <Text style={styles.modalCloseText}>{i18n.t("common.close")}</Text>
                        </Pressable>
                    </Pressable>
                </Pressable>
            </Modal>
        </SafeAreaView>
    );
}

function SettingStatusRow({
    status,
    message,
    testID,
}: {
    status: "loading" | "success" | "error";
    message: string;
    testID: string;
}) {
    return (
        <View style={styles.statusRow} testID={testID}>
            <Text
                style={[
                    styles.statusText,
                    status === "success" && styles.statusTextSuccess,
                    status === "error" && styles.statusTextError,
                ]}
            >
                {message}
            </Text>
        </View>
    );
}

function SettingRow({
    icon,
    label,
    value,
    onPress,
    isDestructive = false,
    testID,
    showDivider = true,
    accessibilityLabel,
    accessibilityHint,
    accessibilityState,
}: {
    icon: any;
    label: string;
    value?: string;
    onPress: () => void;
    isDestructive?: boolean;
    testID?: string;
    showDivider?: boolean;
    accessibilityLabel?: string;
    accessibilityHint?: string;
    accessibilityState?: AccessibilityState;
}) {
    return (
        <Pressable
            style={[styles.settingRow, !showDivider && styles.settingRowNoDivider]}
            onPress={onPress}
            testID={testID}
            accessibilityRole="button"
            accessibilityLabel={accessibilityLabel ?? (value ? `${label}, ${value}` : label)}
            accessibilityHint={accessibilityHint}
            accessibilityState={accessibilityState}
        >
            <View style={styles.settingLeft}>
                <Ionicons
                    name={icon}
                    size={24}
                    color={isDestructive ? "#FF6B6B" : theme.colors.text}
                />
                <Text style={[styles.settingLabel, isDestructive && styles.destructiveText]}>
                    {label}
                </Text>
            </View>
            {value ? (
                <Text style={styles.settingValue}>{value}</Text>
            ) : (
                <Ionicons name="chevron-forward" size={20} color={theme.colors.sub} />
            )}
        </Pressable>
    );
}

function SettingToggle({
    icon,
    label,
    value,
    onValueChange,
    showDivider = true,
}: {
    icon: any;
    label: string;
    value: boolean;
    onValueChange: (value: boolean) => void;
    showDivider?: boolean;
}) {
    return (
        <View style={[styles.settingRow, !showDivider && styles.settingRowNoDivider]}>
            <View style={styles.settingLeft}>
                <Ionicons name={icon} size={24} color={theme.colors.text} />
                <Text style={styles.settingLabel}>{label}</Text>
            </View>
            <Switch
                value={value}
                onValueChange={onValueChange}
                trackColor={{ false: theme.colors.surface, true: theme.colors.primary }}
                thumbColor="#fff"
                accessibilityRole="switch"
                accessibilityLabel={label}
                accessibilityState={{ checked: value }}
            />
        </View>
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
    section: {
        marginTop: theme.spacing.lg,
    },
    sectionCard: {
        marginHorizontal: theme.spacing.lg,
        borderRadius: theme.radius.lg,
        borderWidth: 1,
        borderColor: theme.colors.line,
        backgroundColor: theme.colors.surface,
        overflow: "hidden",
    },
    sectionTitle: {
        fontSize: 14,
        fontWeight: "600",
        color: theme.colors.sub,
        paddingHorizontal: theme.spacing.lg,
        marginBottom: theme.spacing.sm,
        textTransform: "uppercase",
    },
    settingRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        paddingVertical: theme.spacing.md,
        paddingHorizontal: theme.spacing.lg,
        borderBottomWidth: 1,
        borderBottomColor: theme.colors.line,
    },
    settingRowNoDivider: {
        borderBottomWidth: 0,
    },
    settingLeft: {
        flexDirection: "row",
        alignItems: "center",
        gap: theme.spacing.md,
    },
    settingLabel: {
        fontSize: 16,
        color: theme.colors.text,
    },
    settingValue: {
        fontSize: 14,
        color: theme.colors.sub,
    },
    statusRow: {
        paddingHorizontal: theme.spacing.lg,
        paddingTop: 0,
        paddingBottom: theme.spacing.md,
    },
    statusText: {
        fontSize: 12,
        color: theme.colors.sub,
    },
    statusTextSuccess: {
        color: theme.colors.success,
    },
    statusTextError: {
        color: theme.colors.error,
    },
    destructiveText: {
        color: "#FF6B6B",
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
    modalBackdrop: {
        flex: 1,
        backgroundColor: "rgba(0,0,0,0.5)",
        justifyContent: "center",
        padding: theme.spacing.lg,
    },
    modalCard: {
        backgroundColor: theme.colors.surface,
        borderRadius: 14,
        padding: theme.spacing.lg,
        borderWidth: 1,
        borderColor: theme.colors.line,
    },
    modalTitle: {
        fontSize: 16,
        fontWeight: "700",
        color: theme.colors.text,
        marginBottom: theme.spacing.md,
    },
    languageOption: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        paddingVertical: theme.spacing.sm,
        borderBottomWidth: 1,
        borderBottomColor: theme.colors.line,
    },
    languageLabel: {
        fontSize: 15,
        color: theme.colors.text,
    },
    modalCloseButton: {
        marginTop: theme.spacing.md,
        alignItems: "center",
    },
    modalCloseText: {
        fontSize: 14,
        color: theme.colors.primary,
        fontWeight: "600",
    },
});
