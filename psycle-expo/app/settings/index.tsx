import React, { useState } from "react";
import { View, Text, StyleSheet, Pressable, ScrollView, Switch, Alert } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { theme } from "../../lib/theme";
import { useAuth } from "../../lib/AuthContext";

export default function SettingsScreen() {
    const router = useRouter();
    const { user, signOut } = useAuth();
    const [notificationsEnabled, setNotificationsEnabled] = useState(true);
    const [soundEnabled, setSoundEnabled] = useState(true);
    const [hapticsEnabled, setHapticsEnabled] = useState(true);

    const handleSignOut = async () => {
        Alert.alert(
            "ログアウト",
            "本当にログアウトしますか？",
            [
                { text: "キャンセル", style: "cancel" },
                {
                    text: "ログアウト",
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
        Alert.alert("リセット完了", "アプリを再起動すると、オンボーディングが表示されます。");
    };

    const handleClearData = async () => {
        Alert.alert(
            "データ削除",
            "ローカルデータを削除しますか？この操作は取り消せません。",
            [
                { text: "キャンセル", style: "cancel" },
                {
                    text: "削除",
                    style: "destructive",
                    onPress: async () => {
                        await AsyncStorage.clear();
                        Alert.alert("完了", "ローカルデータを削除しました。");
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
                    <Text style={styles.headerTitle}>設定</Text>
                    <View style={{ width: 40 }} />
                </View>

                {/* Account Section */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>アカウント</Text>
                    <SettingRow
                        icon="mail"
                        label="メールアドレス"
                        value={user?.email || ""}
                        onPress={() => { }}
                    />
                    <SettingRow
                        icon="log-out"
                        label="ログアウト"
                        onPress={handleSignOut}
                        isDestructive
                    />
                </View>

                {/* Preferences Section */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>設定</Text>
                    <SettingToggle
                        icon="notifications"
                        label="通知"
                        value={notificationsEnabled}
                        onValueChange={setNotificationsEnabled}
                    />
                    <SettingToggle
                        icon="volume-high"
                        label="サウンド"
                        value={soundEnabled}
                        onValueChange={setSoundEnabled}
                    />
                    <SettingToggle
                        icon="phone-portrait"
                        label="ハプティクス"
                        value={hapticsEnabled}
                        onValueChange={setHapticsEnabled}
                    />
                </View>

                {/* Support Section */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>サポート</Text>
                    <SettingRow
                        icon="help-circle"
                        label="ヘルプ・FAQ"
                        onPress={() => { }}
                    />
                    <SettingRow
                        icon="shield-checkmark"
                        label="プライバシーポリシー"
                        onPress={() => { }}
                    />
                    <SettingRow
                        icon="document-text"
                        label="利用規約"
                        onPress={() => { }}
                    />
                </View>

                {/* Debug Section (Dev only) */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>デバッグ</Text>
                    <SettingRow
                        icon="refresh"
                        label="オンボーディングをリセット"
                        onPress={handleResetOnboarding}
                    />
                    <SettingRow
                        icon="trash"
                        label="ローカルデータを削除"
                        onPress={handleClearData}
                        isDestructive
                    />
                </View>

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
}: {
    icon: any;
    label: string;
    value?: string;
    onPress: () => void;
    isDestructive?: boolean;
}) {
    return (
        <Pressable style={styles.settingRow} onPress={onPress}>
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
