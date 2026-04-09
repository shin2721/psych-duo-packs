import { useCallback, useEffect, useRef, useState } from 'react';
import { useAuth } from '../AuthContext';
import { isGuestUserId } from '../authUtils';
import { useEconomyState } from '../state';
import { useToast } from '../../components/ToastProvider';
import {
  buildWeeklyFriendChallenge,
  claimFriendChallengeReward as claimFriendChallengeRewardOnce,
  evaluateFriendChallengeProgress,
  getFriendChallengeRewardGems,
  hasFriendChallengeClaimed,
  type WeeklyFriendChallenge,
} from '../friendChallenges';
import {
  acceptFriendRequest,
  fetchFriendProfiles,
  fetchFriendRequests,
  rejectFriendRequest,
  removeFriendship,
  type FriendProfile,
  type FriendRequestProfile,
} from '../social';
import { Analytics } from '../analytics';
import i18n from '../i18n';
import { warnDev } from '../devLog';

export type FriendsView = 'friends' | 'requests' | 'search';

const FRIEND_CHALLENGE_REWARD_GEMS = getFriendChallengeRewardGems();

function logFriendsWarning(message: string, error: unknown) {
  warnDev(message, error);
}

export function useFriendsScreen(view: FriendsView) {
  const [friends, setFriends] = useState<FriendProfile[]>([]);
  const [requests, setRequests] = useState<FriendRequestProfile[]>([]);
  const [friendChallenge, setFriendChallenge] = useState<WeeklyFriendChallenge | null>(null);
  const [friendChallengeClaimed, setFriendChallengeClaimed] = useState(false);
  const [friendsLoading, setFriendsLoading] = useState(false);
  const [friendsError, setFriendsError] = useState<string | null>(null);
  const [requestsLoading, setRequestsLoading] = useState(false);
  const [requestsError, setRequestsError] = useState<string | null>(null);
  const { user } = useAuth();
  const userId = user?.id ?? null;
  const isGuestUser = isGuestUserId(userId);
  const { addGems } = useEconomyState();
  const { showToast } = useToast();
  const viewRef = useRef<FriendsView>(view);
  const friendsRequestIdRef = useRef(0);
  const requestsRequestIdRef = useRef(0);
  const challengeRequestIdRef = useRef(0);

  useEffect(() => {
    viewRef.current = view;
  }, [view]);

  const refreshFriendChallenge = useCallback(async () => {
    const requestId = ++challengeRequestIdRef.current;

    if (!userId || isGuestUserId(userId)) {
      if (requestId !== challengeRequestIdRef.current) return;
      setFriendChallenge(null);
      setFriendChallengeClaimed(false);
      return;
    }

    try {
      const challenge = await buildWeeklyFriendChallenge(userId);
      if (requestId !== challengeRequestIdRef.current) return;
      setFriendChallenge(challenge);
      if (!challenge) {
        setFriendChallengeClaimed(false);
        return;
      }

      const claimed = await hasFriendChallengeClaimed(userId, challenge.weekId);
      if (requestId !== challengeRequestIdRef.current) return;
      setFriendChallengeClaimed(claimed);

      Analytics.track('friend_challenge_shown', {
        weekId: challenge.weekId,
        source: 'friends_tab',
      });
    } catch (error) {
      if (requestId !== challengeRequestIdRef.current) return;
      logFriendsWarning('[friends] failed to fetch friend challenge', error);
      setFriendChallenge(null);
      setFriendChallengeClaimed(false);
    }
  }, [userId]);

  const refreshFriends = useCallback(async () => {
    const requestId = ++friendsRequestIdRef.current;

    if (!userId || isGuestUserId(userId)) {
      if (requestId !== friendsRequestIdRef.current) return;
      setFriends([]);
      setFriendsError(null);
      setFriendsLoading(false);
      return;
    }

    setFriendsLoading(true);
    setFriendsError(null);
    try {
      const formattedFriends = await fetchFriendProfiles(
        userId,
        String(i18n.t('friends.fallbackUnknownUser'))
      );
      if (requestId !== friendsRequestIdRef.current) return;
      setFriends(formattedFriends);
    } catch (error) {
      if (requestId !== friendsRequestIdRef.current) return;
      logFriendsWarning('[friends] failed to fetch friends', error);
      setFriendsError(String(i18n.t('common.unexpectedError')));
    } finally {
      if (requestId === friendsRequestIdRef.current) {
        setFriendsLoading(false);
      }
    }
  }, [userId]);

  const refreshRequests = useCallback(async () => {
    const requestId = ++requestsRequestIdRef.current;

    if (!userId || isGuestUserId(userId)) {
      if (requestId !== requestsRequestIdRef.current) return;
      setRequests([]);
      setRequestsError(null);
      setRequestsLoading(false);
      return;
    }

    setRequestsLoading(true);
    setRequestsError(null);
    try {
      const formattedRequests = await fetchFriendRequests(
        userId,
        String(i18n.t('friends.fallbackUnknownUser'))
      );
      if (requestId !== requestsRequestIdRef.current) return;
      setRequests(formattedRequests);
    } catch (error) {
      if (requestId !== requestsRequestIdRef.current) return;
      logFriendsWarning('[friends] failed to fetch requests', error);
      setRequestsError(String(i18n.t('common.unexpectedError')));
    } finally {
      if (requestId === requestsRequestIdRef.current) {
        setRequestsLoading(false);
      }
    }
  }, [userId]);

  useEffect(() => {
    if (view === 'friends') {
      requestsRequestIdRef.current += 1;
      void refreshFriends();
      void refreshFriendChallenge();
    } else if (view === 'requests') {
      friendsRequestIdRef.current += 1;
      challengeRequestIdRef.current += 1;
      void refreshRequests();
    } else {
      friendsRequestIdRef.current += 1;
      requestsRequestIdRef.current += 1;
      challengeRequestIdRef.current += 1;
    }
  }, [view, userId, refreshFriendChallenge, refreshFriends, refreshRequests]);

  const acceptRequestAction = useCallback(async (requestId: string, fromUserId: string) => {
    if (!userId || isGuestUser) return;

    try {
      await acceptFriendRequest(userId, requestId, fromUserId);
      showToast(String(i18n.t('friends.alerts.requestAcceptedMessage')), 'success');
      if (viewRef.current === 'requests') {
        void refreshRequests();
      }
    } catch (error) {
      logFriendsWarning('[friends] failed to accept request', error);
      showToast(String(i18n.t('friends.alerts.acceptFailed')), 'error');
    }
  }, [isGuestUser, refreshRequests, showToast, userId]);

  const rejectRequestAction = useCallback(async (requestId: string) => {
    try {
      await rejectFriendRequest(requestId);

      if (viewRef.current === 'requests') {
        void refreshRequests();
      }
    } catch (error) {
      logFriendsWarning('[friends] failed to reject request', error);
      showToast(String(i18n.t('friends.alerts.rejectFailed')), 'error');
    }
  }, [refreshRequests, showToast]);

  const confirmRemoveFriend = useCallback(async (friendId: string) => {
    if (!userId || isGuestUser) return;

    try {
      await removeFriendship(userId, friendId);
      if (viewRef.current === 'friends') {
        void refreshFriends();
      }
    } catch (error) {
      logFriendsWarning('[friends] failed to remove friend', error);
      showToast(String(i18n.t('friends.alerts.removeFailed')), 'error');
    }
  }, [isGuestUser, refreshFriends, showToast, userId]);

  const claimFriendChallengeReward = useCallback(async () => {
    if (!userId || isGuestUser || !friendChallenge || friendChallengeClaimed) return;

    const progress = evaluateFriendChallengeProgress({
      myWeeklyXp: friendChallenge.myWeeklyXp,
      opponentWeeklyXp: friendChallenge.opponentWeeklyXp,
    });

    if (!progress.completed) {
      showToast(String(i18n.t('friends.challenge.notCompleted')), 'error');
      return;
    }

    try {
      const claimResult = await claimFriendChallengeRewardOnce({
        userId,
        weekId: friendChallenge.weekId,
        opponentId: friendChallenge.opponentId,
        rewardGems: FRIEND_CHALLENGE_REWARD_GEMS,
      });

      if (claimResult === 'claimed') {
        addGems(FRIEND_CHALLENGE_REWARD_GEMS);
        setFriendChallengeClaimed(true);
        Analytics.track('friend_challenge_completed', {
          weekId: friendChallenge.weekId,
          opponentId: friendChallenge.opponentId,
          rewardGems: FRIEND_CHALLENGE_REWARD_GEMS,
          source: 'friends_tab',
        });
        showToast(
          String(i18n.t('friends.challenge.rewardClaimed', { gems: FRIEND_CHALLENGE_REWARD_GEMS })),
          'success'
        );
        return;
      }

      if (claimResult === 'already_claimed') {
        setFriendChallengeClaimed(true);
        showToast(String(i18n.t('friends.challenge.claimed')), 'success');
        return;
      }

      throw new Error('friend challenge claim failed');
    } catch (error) {
      logFriendsWarning('[friends] failed to claim friend challenge reward', error);
      showToast(String(i18n.t('friends.challenge.rewardFailed')), 'error');
    }
  }, [addGems, friendChallenge, friendChallengeClaimed, isGuestUser, showToast, userId]);

  const friendChallengeProgress = friendChallenge
    ? evaluateFriendChallengeProgress({
        myWeeklyXp: friendChallenge.myWeeklyXp,
        opponentWeeklyXp: friendChallenge.opponentWeeklyXp,
      })
    : null;

  return {
    friends,
    requests,
    friendChallenge,
    friendChallengeClaimed,
    friendChallengeProgress,
    friendsLoading,
    friendsError,
    requestsLoading,
    requestsError,
    isGuestUser,
    refreshFriends,
    refreshRequests,
    acceptRequest: acceptRequestAction,
    rejectRequest: rejectRequestAction,
    confirmRemoveFriend,
    claimFriendChallengeReward,
  };
}
