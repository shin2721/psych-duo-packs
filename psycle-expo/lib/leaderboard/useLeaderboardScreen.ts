import { useCallback, useEffect, useRef, useState } from 'react';
import { useAuth } from '../AuthContext';
import { isGuestUserId } from '../authUtils';
import { ensureJoinedLeagueForCurrentWeek, getMyLeague, type LeagueInfo } from '../league';
import {
  fetchFriendStatus as fetchSocialFriendStatus,
  fetchFriendsLeaderboard,
  sendFriendRequest as sendSocialFriendRequest,
  type LeaderboardEntry,
} from '../social';
import { fetchGlobalLeaderboard } from '../leaderboardData';
import i18n from '../i18n';
import { useToast } from '../../components/ToastProvider';
import { warnDev } from '../devLog';

export type LeaderboardView = 'league' | 'global' | 'friends';

const FETCH_TIMEOUT_MS = 10_000;

function logLeaderboardWarning(message: string, error: unknown) {
  warnDev(message, error);
}

function withTimeout<T>(promise: PromiseLike<T>, label: string): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => {
      reject(new Error(`[leaderboard] ${label} timed out after ${FETCH_TIMEOUT_MS}ms`));
    }, FETCH_TIMEOUT_MS);

    Promise.resolve(promise)
      .then((value) => resolve(value))
      .catch((error) => reject(error))
      .finally(() => clearTimeout(timer));
  });
}

export function useLeaderboardScreen(view: LeaderboardView) {
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [leagueInfo, setLeagueInfo] = useState<LeagueInfo | null>(null);
  const [leagueLoading, setLeagueLoading] = useState(true);
  const [leagueError, setLeagueError] = useState<string | null>(null);
  const [boardLoading, setBoardLoading] = useState(false);
  const [boardError, setBoardError] = useState<string | null>(null);
  const [friendIds, setFriendIds] = useState<Set<string>>(new Set());
  const [pendingRequestIds, setPendingRequestIds] = useState<Set<string>>(new Set());
  const { user } = useAuth();
  const userId = user?.id ?? null;
  const isGuestUser = isGuestUserId(userId);
  const { showToast } = useToast();
  const leagueRequestIdRef = useRef(0);
  const boardRequestIdRef = useRef(0);
  const friendStatusRequestIdRef = useRef(0);

  const refreshFriendStatus = useCallback(async () => {
    const requestId = ++friendStatusRequestIdRef.current;

    if (!userId || isGuestUserId(userId)) {
      if (requestId !== friendStatusRequestIdRef.current) return;
      setFriendIds(new Set());
      setPendingRequestIds(new Set());
      return;
    }

    try {
      const status = await withTimeout(fetchSocialFriendStatus(userId), 'friend status fetch');
      if (requestId !== friendStatusRequestIdRef.current) return;
      setFriendIds(status.friendIds);
      setPendingRequestIds(status.pendingRequestIds);
    } catch (error) {
      if (requestId !== friendStatusRequestIdRef.current) return;
      logLeaderboardWarning('[leaderboard] failed to fetch friend status', error);
    }
  }, [userId]);

  const refreshLeague = useCallback(async () => {
    const requestId = ++leagueRequestIdRef.current;

    if (!userId || isGuestUserId(userId)) {
      if (requestId !== leagueRequestIdRef.current) return;
      setLeagueError(null);
      setLeagueLoading(false);
      setLeagueInfo(null);
      return;
    }

    setLeagueLoading(true);
    setLeagueError(null);
    try {
      let info = await withTimeout(getMyLeague(userId), 'getMyLeague');
      if (!info) {
        await withTimeout(ensureJoinedLeagueForCurrentWeek(userId), 'ensureJoinedLeagueForCurrentWeek');
        info = await withTimeout(getMyLeague(userId), 'getMyLeague after join');
      }
      if (!info || !info.members || info.members.length === 0) {
        throw new Error('[leaderboard] league data missing');
      }
      if (requestId !== leagueRequestIdRef.current) return;
      setLeagueInfo(info);
    } catch (error) {
      if (requestId !== leagueRequestIdRef.current) return;
      logLeaderboardWarning('[leaderboard] failed to fetch league', error);
      setLeagueError(String(i18n.t('leaderboard.emptyData')));
      setLeagueInfo(null);
    } finally {
      if (requestId === leagueRequestIdRef.current) {
        setLeagueLoading(false);
      }
    }
  }, [userId]);

  const refreshBoard = useCallback(async (targetView: 'global' | 'friends') => {
    const requestId = ++boardRequestIdRef.current;

    setBoardLoading(true);
    setBoardError(null);
    try {
      if (targetView === 'global') {
        const data = await withTimeout(fetchGlobalLeaderboard(100), 'global leaderboard fetch');
        if (requestId !== boardRequestIdRef.current) return;
        setLeaderboard(data);
      } else {
        if (!userId || isGuestUserId(userId)) {
          if (requestId !== boardRequestIdRef.current) return;
          setLeaderboard([]);
          return;
        }
        const data = await withTimeout(fetchFriendsLeaderboard(userId), 'friends leaderboard fetch');
        if (requestId !== boardRequestIdRef.current) return;
        setLeaderboard(data);
      }
    } catch (error) {
      if (requestId !== boardRequestIdRef.current) return;
      logLeaderboardWarning('[leaderboard] failed to fetch leaderboard', error);
      setBoardError(String(i18n.t('leaderboard.emptyData')));
    } finally {
      if (requestId === boardRequestIdRef.current) {
        setBoardLoading(false);
      }
    }
  }, [userId]);

  useEffect(() => {
    void refreshFriendStatus();
    if (view === 'league') {
      boardRequestIdRef.current += 1;
      void refreshLeague();
    } else {
      leagueRequestIdRef.current += 1;
      void refreshBoard(view);
    }
  }, [view, userId, refreshBoard, refreshFriendStatus, refreshLeague]);

  const sendFriendRequest = useCallback(async (toUserId: string) => {
    if (!userId || isGuestUser) return;

    try {
      const result = await sendSocialFriendRequest(userId, toUserId);
      if (result === 'already_sent') {
        showToast(String(i18n.t('leaderboard.alerts.alreadySentMessage')));
      } else {
        setPendingRequestIds((prev) => new Set(prev).add(toUserId));
        showToast(String(i18n.t('leaderboard.alerts.successMessage')), 'success');
      }
    } catch (error) {
      logLeaderboardWarning('[leaderboard] failed to send friend request', error);
      showToast(String(i18n.t('leaderboard.alerts.failedToSend')), 'error');
    }
  }, [isGuestUser, showToast, userId]);

  const refreshCurrentView = useCallback(() => {
    if (view === 'league') {
      void refreshLeague();
      return;
    }
    void refreshBoard(view);
  }, [refreshBoard, refreshLeague, view]);

  return {
    leaderboard,
    leagueInfo,
    friendIds,
    pendingRequestIds,
    isGuestUser,
    currentUserId: userId,
    currentLoading: view === 'league' ? leagueLoading : boardLoading,
    currentError: view === 'league' ? leagueError : boardError,
    refreshCurrentView,
    sendFriendRequest,
  };
}
