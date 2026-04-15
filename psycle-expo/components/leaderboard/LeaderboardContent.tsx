import React from "react";
import { FlatList, Pressable, Text, View } from "react-native";
import type { LeagueInfo } from "../../lib/league";
import type { LeaderboardView } from "../../lib/leaderboard/useLeaderboardScreen";
import type { LeaderboardEntry } from "../../lib/social";
import i18n from "../../lib/i18n";
import { styles } from "./LeaderboardStyles";
import {
  LeagueLeaderboardSection,
  LeaderboardRow,
  LeaderboardStateView,
} from "./LeaderboardRows";

export function LeaderboardContent({
  view,
  leaderboard,
  leagueInfo,
  listBottomInset,
  tierNames,
  currentUserId,
  friendIds,
  pendingRequestIds,
  isGuestUser,
  onRetry,
  onSendFriendRequest,
  loading,
  error,
  themeColor,
}: {
  view: LeaderboardView;
  leaderboard: LeaderboardEntry[];
  leagueInfo: LeagueInfo | null;
  listBottomInset: number;
  tierNames: Record<number, string>;
  currentUserId: string | null;
  friendIds: Set<string>;
  pendingRequestIds: Set<string>;
  isGuestUser: boolean;
  onRetry: () => void;
  onSendFriendRequest: (userId: string) => void;
  loading: boolean;
  error: string | null;
  themeColor?: string;
}) {
  const stateView = (
    <LeaderboardStateView
      loading={loading}
      error={error}
      emptyMessage={
        view === "league"
          ? String(i18n.t("leaderboard.joiningLeague"))
          : String(i18n.t("common.loading"))
      }
      loadingTestID={`leaderboard-${view}-loading`}
      errorTestID={`leaderboard-${view}-error`}
      retryTestID={`leaderboard-${view}-retry`}
      onRetry={onRetry}
      themeColor={themeColor}
    />
  );

  if (loading || error) return stateView;

  if (view === "league") {
    if (!leagueInfo) {
      return (
        <View style={styles.emptyContainer} testID="leaderboard-league-empty">
          <Text style={styles.emptyText}>{String(i18n.t("leaderboard.emptyData"))}</Text>
          <Pressable
            style={[styles.retryButton, themeColor ? { backgroundColor: themeColor } : undefined]}
            onPress={onRetry}
            testID="leaderboard-league-empty-retry"
          >
            <Text style={styles.retryButtonText}>{i18n.t("common.retry")}</Text>
          </Pressable>
        </View>
      );
    }
    return <LeagueLeaderboardSection leagueInfo={leagueInfo} listBottomInset={listBottomInset} tierNames={tierNames} />;
  }

  if (leaderboard.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>
          {view === "friends" ? i18n.t("leaderboard.emptyFriends") : i18n.t("leaderboard.emptyData")}
        </Text>
      </View>
    );
  }

  return (
    <FlatList
      data={leaderboard}
      renderItem={({ item, index }) => (
        <LeaderboardRow
          item={item}
          index={index}
          currentUserId={currentUserId}
          friendIds={friendIds}
          pendingRequestIds={pendingRequestIds}
          isGuestUser={isGuestUser}
          showAddFriendAction={view === "global" && item.user_id !== currentUserId}
          onSendFriendRequest={onSendFriendRequest}
        />
      )}
      keyExtractor={(item) => item.id}
      testID={`leaderboard-list-${view}`}
      contentContainerStyle={[styles.list, { paddingBottom: listBottomInset }]}
    />
  );
}
