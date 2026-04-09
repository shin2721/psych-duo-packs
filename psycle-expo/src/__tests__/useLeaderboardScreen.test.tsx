import React from 'react';
import { Pressable, Text } from 'react-native';
import { act, fireEvent, render, waitFor } from '@testing-library/react-native';

const mockFetchFriendStatus = jest.fn();
const mockFetchFriendsLeaderboard = jest.fn();
const mockSendFriendRequest = jest.fn();
const mockFetchGlobalLeaderboard = jest.fn();
const mockGetMyLeague = jest.fn();
const mockEnsureJoinedLeagueForCurrentWeek = jest.fn();
const mockShowToast = jest.fn();

jest.mock('../../lib/AuthContext', () => ({
  useAuth: () => ({
    user: { id: 'user_1' },
  }),
}));

jest.mock('../../components/ToastProvider', () => ({
  useToast: () => ({
    showToast: (...args: unknown[]) => mockShowToast(...args),
  }),
}));

jest.mock('../../lib/social', () => ({
  fetchFriendStatus: (...args: unknown[]) => mockFetchFriendStatus(...args),
  fetchFriendsLeaderboard: (...args: unknown[]) => mockFetchFriendsLeaderboard(...args),
  sendFriendRequest: (...args: unknown[]) => mockSendFriendRequest(...args),
}));

jest.mock('../../lib/leaderboardData', () => ({
  fetchGlobalLeaderboard: (...args: unknown[]) => mockFetchGlobalLeaderboard(...args),
}));

jest.mock('../../lib/league', () => ({
  getMyLeague: (...args: unknown[]) => mockGetMyLeague(...args),
  ensureJoinedLeagueForCurrentWeek: (...args: unknown[]) => mockEnsureJoinedLeagueForCurrentWeek(...args),
}));

jest.mock('../../lib/i18n', () => ({
  __esModule: true,
  default: {
    t: (key: string) => key,
  },
}));

const { useLeaderboardScreen } = require('../../lib/leaderboard/useLeaderboardScreen');

function flushMicrotasks(): Promise<void> {
  return Promise.resolve();
}

async function renderWithHookEffects(element: React.ReactElement) {
  const screen = render(element);
  await act(async () => {
    await flushMicrotasks();
    await flushMicrotasks();
  });
  return screen;
}

function deferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (error?: unknown) => void;
  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
}

function Harness({ view }: { view: 'league' | 'global' | 'friends' }) {
  const state = useLeaderboardScreen(view);

  return (
    <>
      <Text testID="leaderboard-count">{state.leaderboard.length}</Text>
      <Text testID="league-present">{String(Boolean(state.leagueInfo))}</Text>
      <Text testID="friend-count">{state.friendIds.size}</Text>
      <Text testID="pending-count">{state.pendingRequestIds.size}</Text>
      <Text testID="current-loading">{String(state.currentLoading)}</Text>
      <Text testID="current-error">{state.currentError ?? 'null'}</Text>
      <Pressable testID="refresh" onPress={state.refreshCurrentView} />
      <Pressable testID="send-request" onPress={() => state.sendFriendRequest('user_2')} />
    </>
  );
}

describe('useLeaderboardScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useRealTimers();
    jest.spyOn(console, 'warn').mockImplementation(() => {});
    mockFetchFriendStatus.mockResolvedValue({
      friendIds: new Set<string>(),
      pendingRequestIds: new Set<string>(),
    });
    mockGetMyLeague.mockResolvedValue({
      tier: 1,
      tier_icon: '🥈',
      tier_color: '#999',
      tier_name: 'Silver',
      week_id: '2026-W15',
      promotion_zone: 3,
      demotion_zone: 8,
      members: [{ user_id: 'user_1', username: 'You', weekly_xp: 50, rank: 1, is_self: true }],
    });
    mockEnsureJoinedLeagueForCurrentWeek.mockResolvedValue(undefined);
    mockFetchGlobalLeaderboard.mockResolvedValue([
      {
        id: 'global-1',
        user_id: 'user_2',
        username: 'Mika',
        total_xp: 120,
        current_streak: 4,
        updated_at: '2026-04-07T00:00:00.000Z',
      },
    ]);
    mockFetchFriendsLeaderboard.mockResolvedValue([
      {
        id: 'friend-1',
        user_id: 'user_3',
        username: 'Aki',
        total_xp: 90,
        current_streak: 2,
        updated_at: '2026-04-07T00:00:00.000Z',
      },
    ]);
    mockSendFriendRequest.mockResolvedValue('sent');
  });

  afterEach(() => {
    jest.restoreAllMocks();
    jest.useRealTimers();
  });

  test('switches fetch paths across league, global, and friends views', async () => {
    const screen = await renderWithHookEffects(<Harness view="league" />);

    await waitFor(() => {
      expect(screen.getByTestId('league-present').props.children).toBe('true');
    });

    screen.rerender(<Harness view="global" />);
    await waitFor(() => {
      expect(mockFetchGlobalLeaderboard).toHaveBeenCalledWith(100);
      expect(screen.getByTestId('leaderboard-count').props.children).toBe(1);
    });

    screen.rerender(<Harness view="friends" />);
    await waitFor(() => {
      expect(mockFetchFriendsLeaderboard).toHaveBeenCalledWith('user_1');
      expect(screen.getByTestId('leaderboard-count').props.children).toBe(1);
    });
  });

  test('falls back to a screen-safe error when global leaderboard fetch times out', async () => {
    jest.useFakeTimers();
    const pending = deferred<[]>();
    mockFetchGlobalLeaderboard.mockReturnValueOnce(pending.promise);

    const screen = await renderWithHookEffects(<Harness view="global" />);

    await act(async () => {
      jest.advanceTimersByTime(10_000);
      await flushMicrotasks();
      await flushMicrotasks();
    });

    await waitFor(() => {
      expect(screen.getByTestId('current-error').props.children).toBe('leaderboard.emptyData');
    });
  }, 15000);

  test('send friend request preserves success and already_sent semantics', async () => {
    const screen = await renderWithHookEffects(<Harness view="global" />);

    fireEvent.press(screen.getByTestId('send-request'));

    await waitFor(() => {
      expect(mockSendFriendRequest).toHaveBeenCalledWith('user_1', 'user_2');
      expect(screen.getByTestId('pending-count').props.children).toBe(1);
    });

    mockSendFriendRequest.mockResolvedValueOnce('already_sent');
    fireEvent.press(screen.getByTestId('send-request'));

    await waitFor(() => {
      expect(mockShowToast).toHaveBeenCalledWith('leaderboard.alerts.alreadySentMessage');
    });
  });

  test('send friend request failure keeps screen-safe toast behavior', async () => {
    mockSendFriendRequest.mockRejectedValueOnce(new Error('boom'));
    const screen = await renderWithHookEffects(<Harness view="global" />);

    fireEvent.press(screen.getByTestId('send-request'));

    await waitFor(() => {
      expect(mockShowToast).toHaveBeenCalledWith('leaderboard.alerts.failedToSend', 'error');
    });
  });
});
