import React, { useState, useRef } from "react";
import { View, Text, StyleSheet, Pressable, ScrollView, Switch, Alert, Linking, Share } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Haptics from "expo-haptics";
import { theme } from "../../lib/theme";
import { useAuth } from "../../lib/AuthContext";
import { restorePurchases } from "../../lib/billing";
import { useAppState } from "../../lib/state";
import { getExportableJSON } from "../../lib/dogfood";
import i18n from "../../lib/i18n";

export default function SettingsScreen() {
    const router = useRouter();
    const { user, signOut } = useAuth();
    const { setPlanId, setActiveUntil } = useAppState();
    const [notificationsEnabled, setNotificationsEnabled] = useState(true);
    const [soundEnabled, setSoundEnabled] = useState(true);
    const [hapticsEnabled, setHapticsEnabled] = useState(true);
    const [isRestoring, setIsRestoring] = useState(false);

    // Secret 5-tap entry for Analytics Debug (DEV only)
    const titleTapCount = useRef(0);
    const titleTapTimeout = useRef<NodeJS.Timeout | null>(null);

    const handleTitleTap = () => {
        if (!__DEV__) return; // No-op in Release

        titleTapCount.current += 1;

        // Reset timeout
        if (titleTapTimeout.current) {
            clearTimeout(titleTapTimeout.current);
        }

        if (titleTapCount.current >= 5) {
            // Success! Navigate to debug screen
            titleTapCount.current = 0;
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
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
                setPlanId(result.planId);
                if (result.activeUntil) {
                    setActiveUntil(result.activeUntil);
                }
            }
        } finally {
            setIsRestoring(false);
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

    return (
        <SafeAreaView style={styles.container}>
            <ScrollView>
                {/* Header */}
                <View style={styles.header}>
                    <Pressable onPress={() => router.back()} style={styles.backButton}>
                        <Ionicons name="arrow-back" size={24} color={theme.colors.text} />
                    </Pressable>
                    <Pressable onPress={handleTitleTap}>
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
                        onValueChange={setNotificationsEnabled}
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
                </View>

                {/* Debug Section (Dev only) */}
                {__DEV__ && (
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
});
