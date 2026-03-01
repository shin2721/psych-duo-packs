import React, { useEffect, useRef, useState } from "react";
import { View, Text, StyleSheet, Pressable, ScrollView, Switch, Alert, Linking, Share, Modal } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { theme } from "../../lib/theme";
import { useAuth } from "../../lib/AuthContext";
import { openBillingPortal, restorePurchases } from "../../lib/billing";
import { hapticFeedback } from "../../lib/haptics";
import { useAppState } from "../../lib/state";
import { getExportableJSON } from "../../lib/dogfood";
import i18n from "../../lib/i18n";
import { useLocale } from "../../lib/LocaleContext";
import { Analytics } from "../../lib/analytics";
import {
    cancelPsycleReminders,
    ensureNotificationPermission,
    getNotificationPreference,
    setNotificationPreference,
    syncDailyReminders,
} from "../../lib/notifications";

export default function SettingsScreen() {
    const router = useRouter();
    const { user, signOut } = useAuth();
    const { planId, setPlanId, setActiveUntil, hasPendingDailyQuests } = useAppState();
    const { locale, options: localeOptions, setLocale } = useLocale();
    const [notificationsEnabled, setNotificationsEnabled] = useState(false);
    const [soundEnabled, setSoundEnabled] = useState(true);
    const [hapticsEnabled, setHapticsEnabled] = useState(true);
    const [isOpeningPortal, setIsOpeningPortal] = useState(false);
    const [isRestoring, setIsRestoring] = useState(false);
    const [isLanguageModalVisible, setIsLanguageModalVisible] = useState(false);
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
        };
    }, []);

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
        if (!user?.id || !user?.email) {
            Alert.alert(i18n.t("settings.errorTitle"), i18n.t("settings.loginRequiredForRestore"));
            return;
        }
        setIsRestoring(true);
        try {
            const result = await restorePurchases(user.id, user.email);
            if (result && result.restored && result.planId) {
                const previousPlan = planId;
                const restoredPlan = result.planId;
                const restoredActiveUntil = result.activeUntil ?? null;
                const planRank: Record<"free" | "pro" | "max", number> = {
                    free: 0,
                    pro: 1,
                    max: 2,
                };
                setPlanId(restoredPlan);
                setActiveUntil(restoredActiveUntil);
                Analytics.track("plan_changed", {
                    source: "restore_purchases",
                    fromPlan: previousPlan,
                    toPlan: restoredPlan,
                    isUpgrade: planRank[restoredPlan] > planRank[previousPlan],
                    isDowngrade: planRank[restoredPlan] < planRank[previousPlan],
                    activeUntil: restoredActiveUntil,
                });
                await AsyncStorage.setItem(
                    `plan_change_snapshot_${user.id}`,
                    JSON.stringify({
                        planId: restoredPlan,
                        activeUntil: restoredActiveUntil,
                    })
                );
            }
        } finally {
            setIsRestoring(false);
        }
    };

    const handleOpenBillingPortal = async () => {
        if (!user?.email) {
            Alert.alert(i18n.t("settings.errorTitle"), i18n.t("settings.loginRequiredForBillingPortal"));
            return;
        }

        setIsOpeningPortal(true);
        try {
            const ok = await openBillingPortal(user.email);
            if (!ok) {
                Alert.alert(i18n.t("settings.errorTitle"), i18n.t("settings.billingPortalUnavailable"));
            }
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
        Alert.alert(i18n.t("settings.resetDoneTitle"), i18n.t("settings.resetDoneMessage"));
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
                        Alert.alert(i18n.t("settings.completed"), i18n.t("settings.localDataDeleted"));
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
                    <Pressable onPress={() => router.back()} style={styles.backButton}>
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
                    />
                </View>

                {/* Preferences Section */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>{i18n.t("settings.preferences")}</Text>
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
                    />
                </View>

                {/* Support Section */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>{i18n.t("settings.support")}</Text>
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
                    />
                    <SettingRow
                        icon="refresh-circle"
                        label={isRestoring ? i18n.t("settings.restoring") : i18n.t("settings.restorePurchases")}
                        onPress={handleRestorePurchases}
                    />
                    <SettingRow
                        icon="card"
                        label={isOpeningPortal ? i18n.t("settings.openingPortal") : i18n.t("settings.manageBilling")}
                        onPress={handleOpenBillingPortal}
                    />
                </View>

                {/* Debug Section (Dev + E2E release) */}
                {isAnalyticsDebugEnabled && (
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>{i18n.t("settings.debug")}</Text>
                        <SettingRow
                            icon="analytics"
                            label="Analytics Debug"
                            onPress={() => router.push('/debug/analytics')}
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
                                    Alert.alert(i18n.t("settings.errorTitle"), i18n.t("settings.exportFailed"));
                                }
                            }}
                        />
                        <SettingRow
                            icon="refresh"
                            label={i18n.t("settings.resetOnboarding")}
                            onPress={handleResetOnboarding}
                        />
                        <SettingRow
                            icon="trash"
                            label={i18n.t("settings.clearLocalData")}
                            onPress={handleClearData}
                            isDestructive
                        />
                    </View>
                )}

                {/* App Info */}
                <View style={styles.appInfo}>
                    <Text style={styles.appInfoText}>Psycle v1.0.0</Text>
                    <Text style={styles.appInfoText}>© 2024 Psycle</Text>
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
                            >
                                <Text style={styles.languageLabel}>{item.label}</Text>
                                {locale === item.code && (
                                    <Ionicons name="checkmark" size={18} color={theme.colors.primary} />
                                )}
                            </Pressable>
                        ))}
                        <Pressable style={styles.modalCloseButton} onPress={() => setIsLanguageModalVisible(false)}>
                            <Text style={styles.modalCloseText}>{i18n.t("common.close")}</Text>
                        </Pressable>
                    </Pressable>
                </Pressable>
            </Modal>
        </SafeAreaView>
    );
}

function SettingRow({
    icon,
    label,
    value,
    onPress,
    isDestructive = false,
    testID,
}: {
    icon: any;
    label: string;
    value?: string;
    onPress: () => void;
    isDestructive?: boolean;
    testID?: string;
}) {
    return (
        <Pressable style={styles.settingRow} onPress={onPress} testID={testID}>
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
}: {
    icon: any;
    label: string;
    value: boolean;
    onValueChange: (value: boolean) => void;
}) {
    return (
        <View style={styles.settingRow}>
            <View style={styles.settingLeft}>
                <Ionicons name={icon} size={24} color={theme.colors.text} />
                <Text style={styles.settingLabel}>{label}</Text>
            </View>
            <Switch
                value={value}
                onValueChange={onValueChange}
                trackColor={{ false: theme.colors.surface, true: theme.colors.primary }}
                thumbColor="#fff"
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
        backgroundColor: theme.colors.surface,
        borderBottomWidth: 1,
        borderBottomColor: theme.colors.line,
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
