import React from "react";
import { View, Text, StyleSheet, Pressable, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useFocusEffect } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import { theme } from "../../lib/theme";
import { useAuth } from "../../lib/AuthContext";
import { useAppState } from "../../lib/state";
import { BADGES } from "../../lib/badges";
import { BadgeIcon } from "../../components/BadgeIcon";
import { MistakesHubButton } from "../../components/MistakesHubButton";
import { StreakIcon, TrophyIcon } from "../../components/CustomIcons";
import { getMyLeague } from "../../lib/league";
import { formatProfileLeagueLabel } from "../../lib/profileLeagueLabel";
import i18n from "../../lib/i18n";

export default function ProfileScreen() {
    const router = useRouter();
    const { user } = useAuth();
    const { xp, streak, completedLessons, unlockedBadges } = useAppState();
    const [leagueLabel, setLeagueLabel] = React.useState<string>("...");
    const [leagueLoading, setLeagueLoading] = React.useState(true);

    const username = user?.email?.split("@")[0] || String(i18n.t("profile.userFallback"));

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
        refreshLeague();
    }, [refreshLeague]);

    useFocusEffect(
        React.useCallback(() => {
            refreshLeague();
        }, [refreshLeague])
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
                    >
                        <Ionicons name="settings-outline" size={24} color={theme.colors.text} />
                    </Pressable>
                </View>

                {/* Profile Card */}
                <View style={styles.profileCard}>
                    {/* Avatar */}
                    <View style={styles.avatarContainer}>
                        <View style={styles.avatar}>
                            <Ionicons name="person" size={48} color={theme.colors.primary} />
                        </View>
                    </View>

                    {/* Username */}
                    <Text style={styles.username}>{username}</Text>
                    <Text style={styles.email}>{user?.email}</Text>

                    {/* Edit Button */}
                    <Pressable
                        style={styles.editButton}
                        onPress={() => router.push("/settings/edit-profile")}
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
                    <MistakesHubButton />
                    <ActionRow
                        icon="calendar"
                        label={String(i18n.t("profile.actions.learningHistory"))}
                        onPress={() => { }}
                    />
                    <ActionRow
                        icon="stats-chart"
                        label={String(i18n.t("profile.actions.detailedStats"))}
                        onPress={() => { }}
                    />
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}

function StatCard({ icon, label, value, color, customIcon }: { icon?: any; label: string; value: string; color: string; customIcon?: React.ReactNode }) {
    return (
        <View style={styles.statCard}>
            {customIcon ? customIcon : <Ionicons name={icon} size={32} color={color} />}
            <Text style={styles.statValue}>{value}</Text>
            <Text style={styles.statLabel}>{label}</Text>
        </View>
    );
}

function ActionRow({ icon, label, onPress }: { icon: any; label: string; onPress: () => void }) {
    return (
        <Pressable style={styles.actionRow} onPress={onPress}>
            <View style={styles.actionLeft}>
                <Ionicons name={icon} size={24} color={theme.colors.text} />
                <Text style={styles.actionLabel}>{label}</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={theme.colors.sub} />
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
    actionLeft: {
        flexDirection: "row",
        alignItems: "center",
        gap: theme.spacing.md,
    },
    actionLabel: {
        fontSize: 16,
        color: theme.colors.text,
    },
    badgeScroll: {
        paddingHorizontal: theme.spacing.md,
    },
});
