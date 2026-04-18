import React from "react";
import { Ionicons } from "@expo/vector-icons";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { BADGES } from "../../lib/badges";
import i18n from "../../lib/i18n";
import type { IoniconName } from "../../lib/ioniconName";
import { theme } from "../../lib/theme";
import { BadgeIcon } from "../BadgeIcon";
import { StreakIcon, TrophyIcon } from "../CustomIcons";
import { MistakesHubButton } from "../MistakesHubButton";

export function ProfileHeader({ onOpenSettings }: { onOpenSettings: () => void }) {
  return (
    <View style={styles.header}>
      <Text style={styles.headerTitle}>{i18n.t("profile.title")}</Text>
      <Pressable
        style={styles.settingsButton}
        onPress={onOpenSettings}
        testID="profile-open-settings"
        accessibilityRole="button"
        accessibilityLabel={String(i18n.t("settings.title"))}
      >
        <Ionicons name="settings-outline" size={24} color={theme.colors.text} />
      </Pressable>
    </View>
  );
}

export function ProfileCardSection({
  avatarIcon,
  username,
  userEmail,
  onEditProfile,
  themeColor,
}: {
  avatarIcon: IoniconName;
  username: string;
  userEmail: string | null;
  onEditProfile: () => void;
  themeColor?: string;
}) {
  const activeColor = themeColor ?? theme.colors.primary;
  return (
    <View style={styles.profileCard}>
      <View style={styles.avatarContainer}>
        <View style={[styles.avatar, { borderColor: activeColor }]}>
          <Ionicons name={avatarIcon} size={48} color={activeColor} />
        </View>
      </View>

      <Text style={styles.username} numberOfLines={1} ellipsizeMode="tail">
        {username}
      </Text>
      <Text style={styles.email} numberOfLines={1} ellipsizeMode="tail">
        {userEmail}
      </Text>

      <Pressable
        style={[styles.editButton, { borderColor: activeColor }]}
        onPress={onEditProfile}
        testID="profile-edit-profile"
        accessibilityRole="button"
        accessibilityLabel={String(i18n.t("profile.editButton"))}
      >
        <Text style={[styles.editButtonText, { color: activeColor }]}>{i18n.t("profile.editButton")}</Text>
      </Pressable>
    </View>
  );
}

export function ProfileStatsGrid({
  xp,
  streak,
  completedLessonCount,
  leagueLabel,
  leagueLoading,
  onLeaguePress,
}: {
  xp: number;
  streak: number;
  completedLessonCount: number;
  leagueLabel: string;
  leagueLoading: boolean;
  onLeaguePress?: () => void;
}) {
  return (
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
        value={completedLessonCount.toString()}
        color="#4ECDC4"
      />
      <StatCard
        customIcon={<TrophyIcon size={32} />}
        label={String(i18n.t("profile.stats.league"))}
        value={leagueLoading ? "..." : leagueLabel}
        color="#FFD93D"
        onPress={onLeaguePress}
      />
    </View>
  );
}

export function ProfileBadgesSection({ unlockedBadgeIds }: { unlockedBadgeIds: Set<string> }) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{i18n.t("profile.sections.badges")}</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.badgeScroll}>
        {BADGES.map((badge) => (
          <BadgeIcon key={badge.id} badge={badge} isUnlocked={unlockedBadgeIds.has(badge.id)} />
        ))}
      </ScrollView>
    </View>
  );
}

export function ProfileQuickActionsSection() {
  return (
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
  );
}

export function StatCard({
  icon,
  label,
  value,
  color,
  customIcon,
  onPress,
}: {
  icon?: IoniconName;
  label: string;
  value: string;
  color: string;
  customIcon?: React.ReactNode;
  onPress?: () => void;
}) {
  const content = (
    <>
      {customIcon ? customIcon : <Ionicons name={icon} size={32} color={color} />}
      <Text style={styles.statValue} numberOfLines={1} ellipsizeMode="tail">
        {value}
      </Text>
      <Text style={styles.statLabel}>{label}</Text>
    </>
  );
  const cardStyle = [styles.statCard, { borderColor: `${color}30`, borderWidth: 1, backgroundColor: `${color}12` }];
  if (onPress) {
    return (
      <Pressable
        style={cardStyle}
        onPress={onPress}
        accessible
        accessibilityRole="button"
        accessibilityLabel={`${label}, ${value}`}
      >
        {content}
      </Pressable>
    );
  }
  return (
    <View style={cardStyle} accessible accessibilityLabel={`${label}, ${value}`}>
      {content}
    </View>
  );
}

export function ActionRow({
  icon,
  label,
  onPress,
  detail,
  disabled = false,
}: {
  icon: IoniconName;
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
    maxWidth: "100%",
  },
  email: {
    fontSize: 14,
    color: theme.colors.sub,
    marginBottom: theme.spacing.lg,
    maxWidth: "100%",
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
    maxWidth: "100%",
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
  badgeScroll: {
    paddingHorizontal: theme.spacing.md,
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
});
