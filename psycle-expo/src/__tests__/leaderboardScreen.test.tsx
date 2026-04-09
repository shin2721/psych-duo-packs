import React from 'react';
import { fireEvent, render } from '@testing-library/react-native';

const mockUseLeaderboardScreen = jest.fn();
const mockSendFriendRequest = jest.fn();

jest.mock('@react-navigation/bottom-tabs', () => ({
  useBottomTabBarHeight: () => 0,
}));

jest.mock('react-native-safe-area-context', () => ({
  SafeAreaView: ({ children }: { children: React.ReactNode }) => children,
}));

jest.mock('@expo/vector-icons', () => ({
  Ionicons: () => null,
}));

jest.mock('../../components/CustomIcons', () => ({
  TrophyIcon: () => null,
  StreakIcon: () => null,
}));

jest.mock('../../lib/i18n', () => ({
  __esModule: true,
  default: {
    t: (key: string) => key,
  },
}));

jest.mock('../../lib/leaderboard/useLeaderboardScreen', () => ({
  useLeaderboardScreen: (...args: unknown[]) => mockUseLeaderboardScreen(...args),
}));

const LeaderboardScreen = require('../../app/(tabs)/leaderboard').default;

function makeHookState(view: 'league' | 'global' | 'friends', overrides: Record<string, unknown> = {}) {
  const base = {
    leaderboard: [],
    leagueInfo: null,
    friendIds: new Set<string>(),
    pendingRequestIds: new Set<string>(),
    isGuestUser: false,
    currentUserId: 'user_1',
    currentLoading: false,
    currentError: null,
    refreshCurrentView: jest.fn(),
    sendFriendRequest: mockSendFriendRequest,
  };

  if (view === 'league') {
    return {
      ...base,
      leagueInfo: {
        tier: 1,
        tier_icon: '🥈',
        tier_color: '#999',
        tier_name: 'Silver',
        week_id: '2026-W15',
        promotion_zone: 3,
        demotion_zone: 8,
        members: [
          { user_id: 'user_1', username: 'You', weekly_xp: 50, rank: 1, is_self: true },
        ],
      },
      ...overrides,
    };
  }

  return {
    ...base,
    leaderboard: [
      {
        id: `${view}-1`,
        user_id: 'user_2',
        username: 'Mika',
        total_xp: 120,
        current_streak: 4,
        updated_at: '2026-04-07T00:00:00.000Z',
      },
    ],
    ...overrides,
  };
}

describe('LeaderboardScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseLeaderboardScreen.mockImplementation((view: 'league' | 'global' | 'friends') => makeHookState(view));
  });

  test('switches league, global, and friends views while keeping list testIDs', () => {
    const screen = render(<LeaderboardScreen />);

    expect(screen.getByTestId('leaderboard-league-list')).toBeTruthy();

    fireEvent.press(screen.getByText('leaderboard.tabs.global'));
    expect(screen.getByTestId('leaderboard-list-global')).toBeTruthy();

    fireEvent.press(screen.getByText('leaderboard.tabs.friends'));
    expect(screen.getByTestId('leaderboard-list-friends')).toBeTruthy();
  });

  test('delegates global add-friend action to the leaderboard hook', () => {
    const screen = render(<LeaderboardScreen />);

    fireEvent.press(screen.getByText('leaderboard.tabs.global'));
    fireEvent.press(screen.getByTestId('leaderboard-add-friend-user_2'));

    expect(mockSendFriendRequest).toHaveBeenCalledWith('user_2');
  });

  test('guest global rows keep add-friend disabled and league view stays safely empty', () => {
    mockUseLeaderboardScreen.mockImplementation((view: 'league' | 'global' | 'friends') =>
      makeHookState(view, {
        isGuestUser: true,
        leagueInfo: view === 'league' ? null : undefined,
      })
    );

    const screen = render(<LeaderboardScreen />);

    expect(screen.getByTestId('leaderboard-league-empty')).toBeTruthy();

    fireEvent.press(screen.getByText('leaderboard.tabs.global'));
    const addButton = screen.getByTestId('leaderboard-add-friend-user_2');
    expect(addButton.props.accessibilityState.disabled).toBe(true);
  });
});
