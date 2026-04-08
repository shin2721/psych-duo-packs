import React from "react";
import { Pressable, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { theme } from "../../lib/theme";
import i18n from "../../lib/i18n";
import type { FriendChallengeProgress, WeeklyFriendChallenge } from "../../lib/friendChallenges";
import type { FriendProfile, FriendRequestProfile } from "../../lib/social";
import { styles } from "./FriendsStyles";

const FRIEND_CHALLENGE_REWARD_GEMS = 25;

export function FriendRow({
  item,
  onRemove,
}: {
  item: FriendProfile;
  onRemove: (friendId: string) => void;
}) {
  return (
    <View style={styles.card} testID={`friend-row-${item.friend_id}`}>
      <View style={styles.userInfo}>
        <Text style={styles.username} numberOfLines={1} ellipsizeMode="tail">
          {item.username}
        </Text>
        <View style={styles.stats}>
          <Text style={styles.statText}>
            {String(i18n.t("friends.stats.xpValue", { xp: item.total_xp }))}
          </Text>
          <Text style={styles.statText}>
            {String(i18n.t("friends.stats.streakValue", { count: item.current_streak }))}
          </Text>
        </View>
      </View>
      <Pressable
        style={styles.removeButton}
        onPress={() => onRemove(item.friend_id)}
        testID={`friend-remove-${item.friend_id}`}
        accessibilityRole="button"
        accessibilityLabel={`${String(i18n.t("friends.alerts.removeTitle"))}: ${item.username}`}
      >
        <Ionicons name="person-remove" size={20} color={theme.colors.error} />
      </Pressable>
    </View>
  );
}

export function FriendRequestRow({
  item,
  onAccept,
  onReject,
}: {
  item: FriendRequestProfile;
  onAccept: (requestId: string, fromUserId: string) => void;
  onReject: (requestId: string) => void;
}) {
  return (
    <View style={styles.card} testID={`request-row-${item.id}`}>
      <View style={styles.userInfo}>
        <Text style={styles.username} numberOfLines={1} ellipsizeMode="tail">
          {item.username}
        </Text>
        <Text style={styles.statText}>
          {String(i18n.t("friends.stats.xpValue", { xp: item.total_xp }))}
        </Text>
      </View>
      <View style={styles.requestActions}>
        <Pressable
          style={[styles.actionButton, styles.acceptButton]}
          onPress={() => onAccept(item.id, item.from_user_id)}
          testID={`request-accept-${item.id}`}
          accessibilityRole="button"
          accessibilityLabel={`${String(i18n.t("friends.alerts.requestAcceptedMessage"))}: ${item.username}`}
        >
          <Ionicons name="checkmark" size={20} color="#fff" />
        </Pressable>
        <Pressable
          style={[styles.actionButton, styles.rejectButton]}
          onPress={() => onReject(item.id)}
          testID={`request-reject-${item.id}`}
          accessibilityRole="button"
          accessibilityLabel={`${String(i18n.t("friends.tabs.requests"))}: ${item.username}`}
        >
          <Ionicons name="close" size={20} color="#fff" />
        </Pressable>
      </View>
    </View>
  );
}

export function FriendChallengeCard({
  challenge,
  claimed,
  progress,
  onClaim,
}: {
  challenge: WeeklyFriendChallenge;
  claimed: boolean;
  progress: FriendChallengeProgress;
  onClaim: () => void;
}) {
  return (
    <View style={styles.challengeCard} testID="friends-challenge-card">
      <View style={styles.challengeHeaderRow}>
        <Ionicons name="trophy" size={18} color={theme.colors.warn} />
        <Text style={styles.challengeTitle}>{String(i18n.t("friends.challenge.title"))}</Text>
      </View>
      <Text style={styles.challengeSubtitle}>
        {String(i18n.t("friends.challenge.subtitle", { name: challenge.opponentName }))}
      </Text>
      <Text style={styles.challengeProgress}>
        {String(
          i18n.t("friends.challenge.progress", {
            mine: progress.myWeeklyXp,
            theirs: progress.opponentWeeklyXp,
          })
        )}
      </Text>
      <Text
        style={[
          styles.challengeStatus,
          progress.completed ? styles.challengeStatusReady : styles.challengeStatusPending,
        ]}
      >
        {progress.completed
          ? String(i18n.t("friends.challenge.readyToClaim"))
          : String(i18n.t("friends.challenge.keepGoing"))}
      </Text>
      <Pressable
        style={[
          styles.challengeButton,
          (claimed || !progress.completed) && styles.challengeButtonDisabled,
        ]}
        disabled={claimed || !progress.completed}
        onPress={onClaim}
        accessibilityRole="button"
        accessibilityLabel={
          claimed
            ? String(i18n.t("friends.challenge.claimed"))
            : String(i18n.t("friends.challenge.claim", { gems: FRIEND_CHALLENGE_REWARD_GEMS }))
        }
        accessibilityState={{ disabled: claimed || !progress.completed }}
      >
        <Text style={styles.challengeButtonText}>
          {claimed
            ? String(i18n.t("friends.challenge.claimed"))
            : String(i18n.t("friends.challenge.claim", { gems: FRIEND_CHALLENGE_REWARD_GEMS }))}
        </Text>
      </Pressable>
    </View>
  );
}

export function FriendsEmptyState({
  icon,
  title,
  subtitle,
  testID,
}: {
  icon: React.ComponentProps<typeof Ionicons>["name"];
  title: string;
  subtitle?: string;
  testID: string;
}) {
  return (
    <View style={styles.emptyContainer} testID={testID}>
      <Ionicons name={icon} size={64} color={theme.colors.sub} />
      <Text style={styles.emptyText}>{title}</Text>
      {subtitle ? <Text style={styles.emptySubtext}>{subtitle}</Text> : null}
    </View>
  );
}

export function FriendsLoadErrorState({
  message,
  onRetry,
  retryTestID,
}: {
  message: string;
  onRetry: () => void;
  retryTestID: string;
}) {
  return (
    <View style={styles.emptyContainer} testID="friends-load-error">
      <Text style={styles.errorTitle}>{String(i18n.t("common.error"))}</Text>
      <Text style={styles.emptyText}>{message}</Text>
      <Pressable style={styles.retryButton} onPress={onRetry} testID={retryTestID}>
        <Text style={styles.retryButtonText}>{String(i18n.t("common.retry"))}</Text>
      </Pressable>
    </View>
  );
}
