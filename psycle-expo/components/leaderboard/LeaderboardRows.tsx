import React from "react";
import { ActivityIndicator, FlatList, Pressable, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { TrophyIcon, StreakIcon } from "../CustomIcons";
import { theme } from "../../lib/theme";
import type { LeaderboardEntry } from "../../lib/social";
import type { LeagueInfo } from "../../lib/league";
import type { LeaderboardView } from "../../lib/leaderboard/useLeaderboardScreen";
import i18n from "../../lib/i18n";
import { styles } from "./LeaderboardStyles";

export function LeaderboardSegmentControl({
  value,
  onChange,
  themeColor,
}: {
  value: LeaderboardView;
  onChange: (view: LeaderboardView) => void;
  themeColor?: string;
}) {
  const activeColor = themeColor ?? theme.colors.primary;
  return (
    <View style={styles.segmentedControl}>
      {(["league", "global", "friends"] as const).map((item) => (
        <Pressable
          key={item}
          style={[styles.segment, value === item && { backgroundColor: activeColor }]}
          onPress={() => onChange(item)}
        >
          <Text style={[styles.segmentText, value === item && styles.activeSegmentText]}>
            {i18n.t(`leaderboard.tabs.${item}`)}
          </Text>
        </Pressable>
      ))}
    </View>
  );
}

export function LeaderboardHeader({
  view,
  onChange,
  themeColor,
}: {
  view: LeaderboardView;
  onChange: (view: LeaderboardView) => void;
  themeColor?: string;
}) {
  return (
    <View style={styles.header}>
      <View style={styles.titleRow}>
        <TrophyIcon size={32} />
        <Text style={styles.title}>{i18n.t("tabs.ranking")}</Text>
      </View>
      <LeaderboardSegmentControl value={view} onChange={onChange} themeColor={themeColor} />
    </View>
  );
}

export function LeaderboardStateView({
  loading,
  error,
  emptyMessage,
  loadingTestID,
  errorTestID,
  retryTestID,
  onRetry,
  themeColor,
}: {
  loading: boolean;
  error: string | null;
  emptyMessage?: string;
  loadingTestID: string;
  errorTestID: string;
  retryTestID: string;
  onRetry: () => void;
  themeColor?: string;
}) {
  const activeColor = themeColor ?? theme.colors.primary;
  if (loading) {
    return (
      <View style={styles.loadingContainer} testID={loadingTestID}>
        <ActivityIndicator size="large" color={activeColor} />
        <Text style={styles.loadingText}>{emptyMessage ?? String(i18n.t("common.loading"))}</Text>
      </View>
    );
  }

  if (!error) return null;

  return (
    <View style={styles.emptyContainer} testID={errorTestID}>
      <Text style={styles.errorTitle}>{i18n.t("common.error")}</Text>
      <Text style={styles.emptyText}>{error}</Text>
      <Pressable style={[styles.retryButton, { backgroundColor: activeColor }]} onPress={onRetry} testID={retryTestID}>
        <Text style={styles.retryButtonText}>{i18n.t("common.retry")}</Text>
      </Pressable>
    </View>
  );
}

export function LeaderboardRow({
  item,
  index,
  currentUserId,
  friendIds,
  pendingRequestIds,
  isGuestUser,
  showAddFriendAction,
  onSendFriendRequest,
}: {
  item: LeaderboardEntry;
  index: number;
  currentUserId: string | null;
  friendIds: Set<string>;
  pendingRequestIds: Set<string>;
  isGuestUser: boolean;
  showAddFriendAction: boolean;
  onSendFriendRequest: (userId: string) => void;
}) {
  const rank = index + 1;
  const isCurrentUser = item.user_id === currentUserId;
  const medal = rank === 1 ? "🥇" : rank === 2 ? "🥈" : rank === 3 ? "🥉" : "";
  const isFriend = friendIds.has(item.user_id);
  const hasPendingRequest = pendingRequestIds.has(item.user_id);

  return (
    <View style={[styles.row, isCurrentUser && styles.currentUserRow]} testID={`leaderboard-row-${index}`}>
      <View style={styles.rankContainer}>
        <Text style={styles.rankText}>{medal || `#${rank}`}</Text>
      </View>
      <View style={styles.userInfo}>
        <Text style={[styles.username, isCurrentUser && styles.currentUsername]} numberOfLines={1} ellipsizeMode="tail">
          {item.username}
          {isCurrentUser && ` ${i18n.t("leaderboard.youSuffix")}`}
        </Text>
        <View style={styles.stats}>
          <View style={styles.statRow}>
            <StreakIcon size={14} />
            <Text style={styles.statText}>
              {i18n.t("profile.stats.streakValue", { count: item.current_streak })}
            </Text>
          </View>
          <Text style={styles.statText}>⭐ {item.total_xp} XP</Text>
        </View>
      </View>
      {showAddFriendAction ? (
        <Pressable
          testID={`leaderboard-add-friend-${item.user_id}`}
          style={[
            styles.addFriendButton,
            (isFriend || hasPendingRequest || isGuestUser) && styles.addFriendButtonDisabled,
          ]}
          onPress={() => onSendFriendRequest(item.user_id)}
          disabled={isFriend || hasPendingRequest || isGuestUser}
          accessibilityRole="button"
          accessibilityLabel={`${String(
            i18n.t(
              isFriend
                ? "friends.tabs.friends"
                : hasPendingRequest
                  ? "friendSearch.cta.sent"
                  : "friendSearch.cta.add"
            )
          )}: ${item.username}`}
          accessibilityState={{ disabled: isFriend || hasPendingRequest || isGuestUser }}
        >
          <Ionicons
            name={isFriend ? "checkmark-circle" : hasPendingRequest ? "time" : "person-add"}
            size={20}
            color={
              isFriend ? theme.colors.success : hasPendingRequest ? theme.colors.sub : theme.colors.primary
            }
          />
        </Pressable>
      ) : null}
    </View>
  );
}

export function LeagueLeaderboardSection({
  leagueInfo,
  listBottomInset,
  tierNames,
}: {
  leagueInfo: LeagueInfo;
  listBottomInset: number;
  tierNames: Record<number, string>;
}) {
  return (
    <View style={{ flex: 1 }}>
      <View style={styles.leagueHeader}>
        <Text style={styles.tierIcon}>{leagueInfo.tier_icon}</Text>
        <Text style={[styles.tierName, { color: leagueInfo.tier_color }]}>
          {tierNames[leagueInfo.tier] || leagueInfo.tier_name} {i18n.t("leaderboard.leagueSuffix")}
        </Text>
        <Text style={styles.weekId}>{leagueInfo.week_id}</Text>
      </View>
      <View style={styles.zoneLegend}>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: "#4CAF50" }]} />
          <Text style={styles.legendText}>{i18n.t("leaderboard.promotionZone")}</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: "#F44336" }]} />
          <Text style={styles.legendText}>{i18n.t("leaderboard.demotionZone")}</Text>
        </View>
      </View>
      <FlatList
        data={leagueInfo.members}
        testID="leaderboard-league-list"
        renderItem={({ item, index }) => {
          const isPromotion = item.rank <= leagueInfo.promotion_zone;
          const isDemotion = item.rank >= leagueInfo.demotion_zone;
          const medal = item.rank === 1 ? "🥇" : item.rank === 2 ? "🥈" : item.rank === 3 ? "🥉" : "";

          return (
            <View
              style={[
                styles.row,
                item.is_self && styles.currentUserRow,
                isPromotion && styles.promotionRow,
                isDemotion && styles.demotionRow,
              ]}
              testID={`leaderboard-league-row-${item.rank ?? index + 1}`}
            >
              <View style={styles.rankContainer}>
                <Text style={styles.rankText}>{medal || `#${item.rank}`}</Text>
              </View>
              <View style={styles.userInfo}>
                <Text
                  style={[styles.username, item.is_self && styles.currentUsername]}
                  numberOfLines={1}
                  ellipsizeMode="tail"
                >
                  {item.username}
                  {item.is_self && ` ${i18n.t("leaderboard.youSuffix")}`}
                </Text>
                <Text style={styles.statText}>⭐ {item.weekly_xp} XP</Text>
              </View>
              {isPromotion ? <Ionicons name="arrow-up" size={20} color="#4CAF50" /> : null}
              {isDemotion ? <Ionicons name="arrow-down" size={20} color="#F44336" /> : null}
            </View>
          );
        }}
        keyExtractor={(item) => item.user_id}
        contentContainerStyle={[styles.list, { paddingBottom: listBottomInset }]}
      />
    </View>
  );
}
