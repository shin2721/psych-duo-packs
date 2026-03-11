import React from "react";
import { View, Text, StyleSheet, Pressable, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useFocusEffect } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import { theme } from "../../lib/theme";
import { useAuth } from "../../lib/AuthContext";
import { useProgressionState } from "../../lib/state";
import { supabase } from "../../lib/supabase";
import { BADGES } from "../../lib/badges";
import { BadgeIcon } from "../../components/BadgeIcon";
import { MistakesHubButton } from "../../components/MistakesHubButton";
import { StreakIcon, TrophyIcon } from "../../components/CustomIcons";
import { getMyLeague } from "../../lib/league";
import { formatProfileLeagueLabel } from "../../lib/profileLeagueLabel";
import { isProfileAvatarIcon, type ProfileAvatarIcon } from "../../lib/avatarIcons";
import i18n from "../../lib/i18n";

export default function ProfileScreen() {
    const router = useRouter();
    const { user } = useAuth();
    const { xp, streak, completedLessons, unlockedBadges } = useProgressionState();
    const [leagueLabel, setLeagueLabel] = React.useState<string>("...");
    const [leagueLoading, setLeagueLoading] = React.useState(true);
    const [profileUsername, setProfileUsername] = React.useState<string | null>(null);
    const [avatarIcon, setAvatarIcon] = React.useState<ProfileAvatarIcon>("person");

    const username = profileUsername || user?.email?.split("@")[0] || String(i18n.t("profile.userFallback"));

    const refreshProfile = React.useCallback(async () => {
        if (!user?.id) {
            setProfileUsername(null);
            setAvatarIcon("person");
            return;
        }

        try {
            const { data, error } = await supabase
                .from("profiles")
                .select("username, avatar_icon")
                .eq("id", user.id)
                .single();
            if (error) throw error;

            setProfileUsername(
                typeof data?.username === "string" && data.username.length > 0
                    ? data.username
                    : null
            );
            setAvatarIcon(isProfileAvatarIcon(data?.avatar_icon) ? data.avatar_icon : "person");
        } catch (error) {
            console.error("Failed to load profile data:", error);
            setProfileUsername(null);
            setAvatarIcon("person");
        }
    }, [user?.id]);

    const refreshLeague = React.useCallback(async () => {
        if (!user?.id) {
            setLeagueLabel(String(i18n.t("profile.stats.leagueUnjoined")));
            setLeagueLoading(false);
            return;
        }

        setLeagueLoading(true);
        try {
            const league = await getMyLeague(user.id);
            setLeagueLabel(
                formatProfileLeagueLabel(league, String(i18n.t("profile.stats.leagueUnjoined")))
            );
        } catch (error) {
            console.error("Failed to load profile league:", error);
            setLeagueLabel(String(i18n.t("profile.stats.leagueUnjoined")));
        } finally {
            setLeagueLoading(false);
        }
    }, [user?.id]);

    React.useEffect(() => {
        refreshProfile();
        refreshLeague();
    }, [refreshLeague, refreshProfile]);

    useFocusEffect(
        React.useCallback(() => {
            refreshProfile();
            refreshLeague();
        }, [refreshLeague, refreshProfile])
    );

    return (
        <SafeAreaView style={styles.container}>
            <ScrollView>
                {/* Header */}
                <View style={styles.header}>
                    <Text style={styles.headerTitle}>{i18n.t("profile.title")}</Text>
                    <Pressable
                        style={styles.settingsButton}
                        onPress={() => router.push("/settings")}
                        testID="profile-open-settings"
                        accessibilityRole="button"
                        accessibilityLabel={String(i18n.t("settings.title"))}
                    >
                        <Ionicons name="settings-outline" size={24} color={theme.colors.text} />
                    </Pressable>
                </View>

                {/* Profile Card */}
                <View style={styles.profileCard}>
                    {/* Avatar */}
                    <View style={styles.avatarContainer}>
                        <View style={styles.avatar}>
                            <Ionicons name={avatarIcon as any} size={48} color={theme.colors.primary} />
                        </View>
                    </View>

                    {/* Username */}
                    <Text style={styles.username}>{username}</Text>
                    <Text style={styles.email}>{user?.email}</Text>

                    {/* Edit Button */}
                    <Pressable
                        style={styles.editButton}
                        onPress={() => router.push("/settings/edit-profile")}
                        testID="profile-edit-profile"
                        accessibilityRole="button"
                        accessibilityLabel={String(i18n.t("profile.editButton"))}
                    >
                        <Text style={styles.editButtonText}>{i18n.t("profile.editButton")}</Text>
                    </Pressable>
                </View>

                {/* Stats Grid */}
                <View style={styles.statsGrid}>
                    <StatCard
                        icon="star"
                        label={String(i18n.t("profile.stats.totalXp"))}
                        value={xp.toString()}
                        color="#F59E0B"
                    />
                    <StatCard
                        customIcon={<StreakIcon size={32} />}
                        label={String(i18n.t("profile.stats.streakDays"))}
                        value={String(i18n.t("profile.stats.streakValue", { count: streak }))}
                        color="#FF6B6B"
                    />
                    <StatCard
                        icon="checkmark-circle"
                        label={String(i18n.t("profile.stats.completedLessons"))}
                        value={completedLessons.size.toString()}
                        color="#4ECDC4"
                    />
                    <StatCard
                        customIcon={<TrophyIcon size={32} />}
                        label={String(i18n.t("profile.stats.league"))}
                        value={leagueLoading ? "..." : leagueLabel}
                        color="#FFD93D"
                    />
                </View>

                {/* Badges Section */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>{i18n.t("profile.sections.badges")}</Text>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.badgeScroll}>
                        {BADGES.map(badge => (
                            <BadgeIcon
                                key={badge.id}
                                badge={badge}
                                isUnlocked={unlockedBadges.has(badge.id)}
                            />
                        ))}
                    </ScrollView>
                </View>

                {/* Quick Actions */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>{i18n.t("profile.sections.quickActions")}</Text>
                    <View testID="profile-mistakes-hub-action">
                        <MistakesHubButton />
                    </View>
                    <ActionRow
                        icon="calendar"
                        label={String(i18n.t("profile.actions.learningHistory"))}
                        detail={String(i18n.t("profile.actions.comingSoon"))}
                        disabled
                    />
                    <ActionRow
                        icon="stats-chart"
                        label={String(i18n.t("profile.actions.detailedStats"))}
                        detail={String(i18n.t("profile.actions.comingSoon"))}
                        disabled
                    />
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}

function StatCard({ icon, label, value, color, customIcon }: { icon?: any; label: string; value: string; color: string; customIcon?: React.ReactNode }) {
    return (
        <View
            style={styles.statCard}
            accessible
            accessibilityLabel={`${label}, ${value}`}
        >
            {customIcon ? customIcon : <Ionicons name={icon} size={32} color={color} />}
            <Text style={styles.statValue}>{value}</Text>
            <Text style={styles.statLabel}>{label}</Text>
        </View>
    );
}

function ActionRow({
    icon,
    label,
    onPress,
    detail,
    disabled = false,
}: {
    icon: any;
    label: string;
    onPress?: () => void;
    detail?: string;
    disabled?: boolean;
}) {
    return (
        <Pressable
            style={[styles.actionRow, disabled && styles.actionRowDisabled]}
            onPress={disabled ? undefined : onPress}
            disabled={disabled}
            accessibilityRole="button"
            accessibilityState={disabled ? { disabled: true } : undefined}
        >
            <View style={styles.actionLeft}>
                <Ionicons name={icon} size={24} color={disabled ? theme.colors.sub : theme.colors.text} />
                <View style={styles.actionTextBlock}>
                    <Text style={[styles.actionLabel, disabled && styles.actionLabelDisabled]}>{label}</Text>
                    {detail ? <Text style={styles.actionDetail}>{detail}</Text> : null}
                </View>
            </View>
            {!disabled ? <Ionicons name="chevron-forward" size={20} color={theme.colors.sub} /> : null}
        </Pressable>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "transparent",
    },
    header: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        padding: theme.spacing.lg,
    },
    headerTitle: {
        fontSize: 28,
        fontWeight: "bold",
        color: theme.colors.text,
    },
    settingsButton: {
        padding: theme.spacing.xs,
        minWidth: 44,
        minHeight: 44,
        alignItems: "center",
        justifyContent: "center",
    },
    profileCard: {
        backgroundColor: theme.colors.surface,
        margin: theme.spacing.lg,
        padding: theme.spacing.xl,
        borderRadius: theme.radius.lg,
        alignItems: "center",
    },
    avatarContainer: {
        marginBottom: theme.spacing.md,
    },
    avatar: {
        width: 100,
        height: 100,
        borderRadius: 50,
        backgroundColor: "transparent",
        justifyContent: "center",
        alignItems: "center",
        borderWidth: 3,
        borderColor: theme.colors.primary,
    },
    username: {
        fontSize: 24,
        fontWeight: "bold",
        color: theme.colors.text,
        marginBottom: theme.spacing.xs,
    },
    email: {
        fontSize: 14,
        color: theme.colors.sub,
        marginBottom: theme.spacing.lg,
    },
    editButton: {
        paddingVertical: theme.spacing.sm,
        paddingHorizontal: theme.spacing.lg,
        borderRadius: theme.radius.md,
        borderWidth: 1,
        borderColor: theme.colors.primary,
    },
    editButtonText: {
        fontSize: 14,
        fontWeight: "600",
        color: theme.colors.primary,
    },
    statsGrid: {
        flexDirection: "row",
        flexWrap: "wrap",
        padding: theme.spacing.md,
        gap: theme.spacing.md,
    },
    statCard: {
        width: "47%",
        backgroundColor: theme.colors.surface,
        padding: theme.spacing.lg,
        borderRadius: theme.radius.lg,
        alignItems: "center",
    },
    statValue: {
        fontSize: 24,
        fontWeight: "bold",
        color: theme.colors.text,
        marginTop: theme.spacing.sm,
    },
    statLabel: {
        fontSize: 12,
        color: theme.colors.sub,
        marginTop: theme.spacing.xs,
    },
    section: {
        padding: theme.spacing.lg,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: "bold",
        color: theme.colors.text,
        marginBottom: theme.spacing.md,
    },
    actionRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        paddingVertical: theme.spacing.md,
        borderBottomWidth: 1,
        borderBottomColor: theme.colors.line,
    },
    actionRowDisabled: {
        opacity: 0.72,
    },
    actionLeft: {
        flexDirection: "row",
        alignItems: "center",
        gap: theme.spacing.md,
        flex: 1,
    },
    actionTextBlock: {
        flex: 1,
    },
    actionLabel: {
        fontSize: 16,
        color: theme.colors.text,
    },
    actionLabelDisabled: {
        color: theme.colors.sub,
    },
    actionDetail: {
        marginTop: 2,
        fontSize: 12,
        color: theme.colors.sub,
    },
    badgeScroll: {
        paddingHorizontal: theme.spacing.md,
    },
});
