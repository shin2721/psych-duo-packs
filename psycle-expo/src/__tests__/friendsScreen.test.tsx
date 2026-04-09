import React from 'react';
import { fireEvent, render } from '@testing-library/react-native';

const mockUseFriendsScreen = jest.fn();
const mockClaimFriendChallengeReward = jest.fn();
const mockConfirmRemoveFriend = jest.fn();

jest.mock('@react-navigation/bottom-tabs', () => ({
  useBottomTabBarHeight: () => 0,
}));

jest.mock('react-native-safe-area-context', () => ({
  SafeAreaView: ({ children }: { children: React.ReactNode }) => children,
}));

jest.mock('@expo/vector-icons', () => ({
  Ionicons: () => null,
}));

jest.mock('../../components/FriendSearch', () => ({
  FriendSearch: () => {
    const ReactLocal = require('react');
    const { Text } = require('react-native');
    return ReactLocal.createElement(Text, { testID: 'friend-search-view' }, 'friend-search');
  },
}));

jest.mock('../../lib/i18n', () => ({
  __esModule: true,
  default: {
    t: (key: string) => key,
  },
}));

jest.mock('../../lib/friendChallenges', () => ({
  getFriendChallengeRewardGems: () => 25,
}));

jest.mock('../../lib/friends/useFriendsScreen', () => ({
  useFriendsScreen: (...args: unknown[]) => mockUseFriendsScreen(...args),
}));

const FriendsScreen = require('../../app/(tabs)/friends').default;

function makeHookState(view: 'friends' | 'requests' | 'search') {
  if (view === 'friends') {
    return {
      friends: [{ friend_id: 'friend_1', username: 'Aki', total_xp: 100, current_streak: 3 }],
      requests: [],
      friendChallenge: {
        weekId: '2026-W15',
        opponentId: 'friend_1',
        opponentName: 'Aki',
        myWeeklyXp: 40,
        opponentWeeklyXp: 20,
      },
      friendChallengeClaimed: false,
      friendChallengeProgress: {
        completed: true,
        myWeeklyXp: 40,
        opponentWeeklyXp: 20,
      },
      friendsLoading: false,
      friendsError: null,
      requestsLoading: false,
      requestsError: null,
      acceptRequest: jest.fn(),
      rejectRequest: jest.fn(),
      confirmRemoveFriend: mockConfirmRemoveFriend,
      claimFriendChallengeReward: mockClaimFriendChallengeReward,
      refreshFriends: jest.fn(),
      refreshRequests: jest.fn(),
    };
  }

  if (view === 'requests') {
    return {
      friends: [],
      requests: [{ id: 'req_1', from_user_id: 'user_2', username: 'Mika', total_xp: 80 }],
      friendChallenge: null,
      friendChallengeClaimed: false,
      friendChallengeProgress: null,
      friendsLoading: false,
      friendsError: null,
      requestsLoading: false,
      requestsError: null,
      acceptRequest: jest.fn(),
      rejectRequest: jest.fn(),
      confirmRemoveFriend: mockConfirmRemoveFriend,
      claimFriendChallengeReward: mockClaimFriendChallengeReward,
      refreshFriends: jest.fn(),
      refreshRequests: jest.fn(),
    };
  }

  return {
    friends: [],
    requests: [],
    friendChallenge: null,
    friendChallengeClaimed: false,
    friendChallengeProgress: null,
    friendsLoading: false,
    friendsError: null,
    requestsLoading: false,
    requestsError: null,
    acceptRequest: jest.fn(),
    rejectRequest: jest.fn(),
    confirmRemoveFriend: mockConfirmRemoveFriend,
    claimFriendChallengeReward: mockClaimFriendChallengeReward,
    refreshFriends: jest.fn(),
    refreshRequests: jest.fn(),
  };
}

describe('FriendsScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseFriendsScreen.mockImplementation((view: 'friends' | 'requests' | 'search') => makeHookState(view));
  });

  test('switches between friends, requests, and search views while preserving existing testIDs', () => {
    const screen = render(<FriendsScreen />);

    expect(screen.getByTestId('friends-list')).toBeTruthy();
    expect(screen.getByTestId('friends-challenge-card')).toBeTruthy();
    expect(screen.getByTestId('friend-row-friend_1')).toBeTruthy();

    fireEvent.press(screen.getByTestId('friends-tab-requests'));
    expect(screen.getByTestId('requests-list')).toBeTruthy();
    expect(screen.getByTestId('request-row-req_1')).toBeTruthy();

    fireEvent.press(screen.getByTestId('friends-tab-search'));
    expect(screen.getByTestId('friend-search-view')).toBeTruthy();
  });

  test('claim CTA keeps the existing render contract and delegates to the screen hook', () => {
    const screen = render(<FriendsScreen />);

    fireEvent.press(screen.getByText('friends.challenge.claim'));

    expect(mockClaimFriendChallengeReward).toHaveBeenCalledTimes(1);
  });

  test('renders empty state for friends view when hook returns no friends', () => {
    mockUseFriendsScreen.mockImplementation((view: 'friends' | 'requests' | 'search') => ({
      ...makeHookState(view),
      friends: [],
      friendChallenge: null,
      friendChallengeProgress: null,
    }));

    const screen = render(<FriendsScreen />);

    expect(screen.getByTestId('friends-empty')).toBeTruthy();
  });
});
