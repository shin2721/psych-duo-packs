import React from 'react';
import { Pressable, Text } from 'react-native';
import { act, fireEvent, render, waitFor } from '@testing-library/react-native';

const mockBuildWeeklyFriendChallenge = jest.fn();
const mockHasFriendChallengeClaimed = jest.fn();
const mockClaimFriendChallengeReward = jest.fn();
const mockFetchFriendProfiles = jest.fn();
const mockFetchFriendRequests = jest.fn();
const mockAcceptFriendRequest = jest.fn();
const mockRejectFriendRequest = jest.fn();
const mockRemoveFriendship = jest.fn();
const mockAddGems = jest.fn();
const mockShowToast = jest.fn();
const mockTrack = jest.fn();

jest.mock('../../lib/AuthContext', () => ({
  useAuth: () => ({
    user: { id: 'user_1' },
  }),
}));

jest.mock('../../lib/state', () => ({
  useEconomyState: () => ({
    addGems: (...args: unknown[]) => mockAddGems(...args),
  }),
}));

jest.mock('../../components/ToastProvider', () => ({
  useToast: () => ({
    showToast: (...args: unknown[]) => mockShowToast(...args),
  }),
}));

jest.mock('../../lib/analytics', () => ({
  Analytics: {
    track: (...args: unknown[]) => mockTrack(...args),
  },
}));

jest.mock('../../lib/friendChallenges', () => ({
  buildWeeklyFriendChallenge: (...args: unknown[]) => mockBuildWeeklyFriendChallenge(...args),
  claimFriendChallengeReward: (...args: unknown[]) => mockClaimFriendChallengeReward(...args),
  evaluateFriendChallengeProgress: ({ myWeeklyXp, opponentWeeklyXp }: { myWeeklyXp: number; opponentWeeklyXp: number }) => ({
    completed: myWeeklyXp >= opponentWeeklyXp,
    myWeeklyXp,
    opponentWeeklyXp,
  }),
  getFriendChallengeRewardGems: () => 25,
  hasFriendChallengeClaimed: (...args: unknown[]) => mockHasFriendChallengeClaimed(...args),
}));

jest.mock('../../lib/social', () => ({
  fetchFriendProfiles: (...args: unknown[]) => mockFetchFriendProfiles(...args),
  fetchFriendRequests: (...args: unknown[]) => mockFetchFriendRequests(...args),
  acceptFriendRequest: (...args: unknown[]) => mockAcceptFriendRequest(...args),
  rejectFriendRequest: (...args: unknown[]) => mockRejectFriendRequest(...args),
  removeFriendship: (...args: unknown[]) => mockRemoveFriendship(...args),
}));

jest.mock('../../lib/i18n', () => ({
  __esModule: true,
  default: {
    t: (key: string) => key,
  },
}));

const { useFriendsScreen } = require('../../lib/friends/useFriendsScreen');

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

function Harness({ view }: { view: 'friends' | 'requests' | 'search' }) {
  const state = useFriendsScreen(view);

  return (
    <>
      <Text testID="friends-count">{state.friends.length}</Text>
      <Text testID="requests-count">{state.requests.length}</Text>
      <Text testID="challenge-claimed">{String(state.friendChallengeClaimed)}</Text>
      <Text testID="challenge-present">{String(Boolean(state.friendChallenge))}</Text>
      <Pressable testID="accept" onPress={() => state.acceptRequest('req_1', 'user_2')} />
      <Pressable testID="reject" onPress={() => state.rejectRequest('req_1')} />
      <Pressable testID="remove" onPress={() => state.confirmRemoveFriend('user_2')} />
      <Pressable testID="claim" onPress={() => state.claimFriendChallengeReward()} />
    </>
  );
}

describe('useFriendsScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockFetchFriendProfiles.mockResolvedValue([]);
    mockFetchFriendRequests.mockResolvedValue([]);
    mockBuildWeeklyFriendChallenge.mockResolvedValue(null);
    mockHasFriendChallengeClaimed.mockResolvedValue(false);
    mockAcceptFriendRequest.mockResolvedValue(undefined);
    mockRejectFriendRequest.mockResolvedValue(undefined);
    mockRemoveFriendship.mockResolvedValue(undefined);
  });

  test('ignores stale friends responses after the view changes', async () => {
    const pendingFriends = deferred<Array<{ friend_id: string; username: string; total_xp: number; current_streak: number }>>();
    mockFetchFriendProfiles.mockReturnValueOnce(pendingFriends.promise);

    const screen = await renderWithHookEffects(<Harness view="friends" />);

    await waitFor(() => {
      expect(mockFetchFriendProfiles).toHaveBeenCalled();
    });

    screen.rerender(<Harness view="search" />);

    await act(async () => {
      pendingFriends.resolve([{ friend_id: 'friend_1', username: 'Aki', total_xp: 10, current_streak: 1 }]);
      await Promise.resolve();
    });

    expect(screen.getByTestId('friends-count').props.children).toBe(0);
  });

  test('refreshes requests after accepting and rejecting while requests view is active', async () => {
    mockFetchFriendRequests.mockResolvedValue([{ id: 'req_1', from_user_id: 'user_2', username: 'Mika', total_xp: 30 }]);

    const screen = await renderWithHookEffects(<Harness view="requests" />);

    await waitFor(() => {
      expect(mockFetchFriendRequests).toHaveBeenCalled();
    });
    const initialFetchCount = mockFetchFriendRequests.mock.calls.length;

    fireEvent.press(screen.getByTestId('accept'));
    await waitFor(() => {
      expect(mockAcceptFriendRequest).toHaveBeenCalledWith('user_1', 'req_1', 'user_2');
      expect(mockFetchFriendRequests.mock.calls.length).toBeGreaterThan(initialFetchCount);
    });

    const afterAcceptCount = mockFetchFriendRequests.mock.calls.length;
    fireEvent.press(screen.getByTestId('reject'));
    await waitFor(() => {
      expect(mockRejectFriendRequest).toHaveBeenCalledWith('req_1');
      expect(mockFetchFriendRequests.mock.calls.length).toBeGreaterThan(afterAcceptCount);
    });
  });

  test('refreshes friends after removing a friend while friends view is active', async () => {
    mockFetchFriendProfiles.mockResolvedValue([{ friend_id: 'user_2', username: 'Mika', total_xp: 30, current_streak: 4 }]);

    const screen = await renderWithHookEffects(<Harness view="friends" />);

    await waitFor(() => {
      expect(mockFetchFriendProfiles).toHaveBeenCalled();
    });
    const initialFetchCount = mockFetchFriendProfiles.mock.calls.length;

    fireEvent.press(screen.getByTestId('remove'));

    await waitFor(() => {
      expect(mockRemoveFriendship).toHaveBeenCalledWith('user_1', 'user_2');
      expect(mockFetchFriendProfiles.mock.calls.length).toBeGreaterThan(initialFetchCount);
    });
  });

  test('claims friend challenge rewards and preserves analytics/toast semantics', async () => {
    mockBuildWeeklyFriendChallenge.mockResolvedValue({
      weekId: '2026-W15',
      opponentId: 'user_2',
      opponentName: 'Mika',
      myWeeklyXp: 40,
      opponentWeeklyXp: 20,
    });
    mockHasFriendChallengeClaimed.mockResolvedValue(false);
    mockClaimFriendChallengeReward.mockResolvedValue('claimed');

    const screen = await renderWithHookEffects(<Harness view="friends" />);

    await waitFor(() => {
      expect(screen.getByTestId('challenge-present').props.children).toBe('true');
    });

    fireEvent.press(screen.getByTestId('claim'));

    await waitFor(() => {
      expect(mockAddGems).toHaveBeenCalledWith(25);
      expect(mockTrack).toHaveBeenCalledWith('friend_challenge_completed', expect.objectContaining({
        weekId: '2026-W15',
        opponentId: 'user_2',
        rewardGems: 25,
        source: 'friends_tab',
      }));
      expect(screen.getByTestId('challenge-claimed').props.children).toBe('true');
    });
  });

  test('surfaces already claimed challenge without double rewards', async () => {
    mockBuildWeeklyFriendChallenge.mockResolvedValue({
      weekId: '2026-W15',
      opponentId: 'user_2',
      opponentName: 'Mika',
      myWeeklyXp: 40,
      opponentWeeklyXp: 20,
    });
    mockHasFriendChallengeClaimed.mockResolvedValue(false);
    mockClaimFriendChallengeReward.mockResolvedValue('already_claimed');

    const screen = await renderWithHookEffects(<Harness view="friends" />);

    await waitFor(() => {
      expect(screen.getByTestId('challenge-present').props.children).toBe('true');
    });

    fireEvent.press(screen.getByTestId('claim'));

    await waitFor(() => {
      expect(screen.getByTestId('challenge-claimed').props.children).toBe('true');
    });

    expect(mockAddGems).not.toHaveBeenCalled();
  });
});
