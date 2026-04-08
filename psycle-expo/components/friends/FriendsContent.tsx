import React from "react";
import { ActivityIndicator, FlatList, View, Pressable, Text } from "react-native";
import { theme } from "../../lib/theme";
import { FriendSearch } from "../FriendSearch";
import type { FriendChallengeProgress, WeeklyFriendChallenge } from "../../lib/friendChallenges";
import type { FriendProfile, FriendRequestProfile } from "../../lib/social";
import type { FriendsView } from "../../lib/friends/useFriendsScreen";
import i18n from "../../lib/i18n";
import {
  FriendChallengeCard,
  FriendRequestRow,
  FriendRow,
  FriendsEmptyState,
  FriendsLoadErrorState,
} from "./FriendsRows";
import { styles } from "./FriendsStyles";

export function FriendsContentView({
  view,
  listBottomInset,
  friends,
  requests,
  friendChallenge,
  friendChallengeClaimed,
  friendChallengeProgress,
  friendsLoading,
  friendsError,
  requestsLoading,
  requestsError,
  onAcceptRequest,
  onRejectRequest,
  onClaimFriendChallengeReward,
  onRefreshFriends,
  onRefreshRequests,
  onRemoveFriend,
  onRequestSent,
}: {
  view: FriendsView;
  listBottomInset: number;
  friends: FriendProfile[];
  requests: FriendRequestProfile[];
  friendChallenge: WeeklyFriendChallenge | null;
  friendChallengeClaimed: boolean;
  friendChallengeProgress: FriendChallengeProgress | null;
  friendsLoading: boolean;
  friendsError: string | null;
  requestsLoading: boolean;
  requestsError: string | null;
  onAcceptRequest: (requestId: string, fromUserId: string) => void;
  onRejectRequest: (requestId: string) => void;
  onClaimFriendChallengeReward: () => void;
  onRefreshFriends: () => void;
  onRefreshRequests: () => void;
  onRemoveFriend: (friendId: string) => void;
  onRequestSent: () => void;
}) {
  if (view === "search") {
    return <FriendSearch onRequestSent={onRequestSent} />;
  }

  if (view === "friends") {
    if (friendsLoading) {
      return (
        <View style={styles.emptyContainer} testID="friends-loading">
          <ActivityIndicator size="large" color={theme.colors.primary} />
        </View>
      );
    }

    if (friendsError) {
      return (
        <FriendsLoadErrorState
          message={friendsError}
          onRetry={onRefreshFriends}
          retryTestID="friends-retry"
        />
      );
    }

    return (
      <>
        {friendChallenge && friendChallengeProgress ? (
          <FriendChallengeCard
            challenge={friendChallenge}
            claimed={friendChallengeClaimed}
            progress={friendChallengeProgress}
            onClaim={onClaimFriendChallengeReward}
          />
        ) : null}
        {friends.length === 0 ? (
          <FriendsEmptyState
            icon="people"
            title={String(i18n.t("friends.empty.friendsTitle"))}
            subtitle={String(i18n.t("friends.empty.friendsSubtitle"))}
            testID="friends-empty"
          />
        ) : (
          <FlatList
            data={friends}
            renderItem={({ item }) => <FriendRow item={item} onRemove={onRemoveFriend} />}
            keyExtractor={(item) => item.friend_id}
            testID="friends-list"
            contentContainerStyle={[styles.list, { paddingBottom: listBottomInset }]}
          />
        )}
      </>
    );
  }

  if (requestsLoading) {
    return (
      <View style={styles.emptyContainer} testID="requests-loading">
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  if (requestsError) {
    return (
      <FriendsLoadErrorState
        message={requestsError}
        onRetry={onRefreshRequests}
        retryTestID="requests-retry"
      />
    );
  }

  if (requests.length === 0) {
    return (
      <FriendsEmptyState
        icon="mail"
        title={String(i18n.t("friends.empty.requestsTitle"))}
        testID="requests-empty"
      />
    );
  }

  return (
    <FlatList
      data={requests}
      renderItem={({ item }) => (
        <FriendRequestRow item={item} onAccept={onAcceptRequest} onReject={onRejectRequest} />
      )}
      keyExtractor={(item) => item.id}
      testID="requests-list"
      contentContainerStyle={[styles.list, { paddingBottom: listBottomInset }]}
    />
  );
}
