jest.mock('../../lib/supabase', () => ({
  supabase: {
    from: jest.fn(),
  },
}));

import {
  insertUserBadge,
  loadLessonsCompleted7d,
  loadRemoteBadgeIds,
  loadRemoteProgressionSnapshot,
  syncProfileStreak,
  syncProfileXp,
  syncStreakAndLeaderboard,
} from '../../lib/app-state/progressionRemote';
import { supabase } from '../../lib/supabase';

const mockSupabase = supabase as unknown as {
  from: jest.Mock;
};

describe('progressionRemote guest guards', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('guest user remote helpers short-circuit without querying Supabase', async () => {
    await expect(loadRemoteProgressionSnapshot('guest_user_1', 10)).resolves.toEqual({
      xp: null,
      streak: null,
      friendCount: 0,
      leaderboardRank: 0,
    });
    await expect(loadRemoteBadgeIds('guest_user_1')).resolves.toEqual([]);
    await expect(loadLessonsCompleted7d('guest_user_1', '2026-04-01')).resolves.toBe(0);
    await expect(insertUserBadge('guest_user_1', 'badge-1')).resolves.toBe('skipped');
    await expect(syncProfileXp('guest_user_1', 100)).resolves.toBeUndefined();
    await expect(syncProfileStreak('guest_user_1', 7)).resolves.toBeUndefined();
    await expect(
      syncStreakAndLeaderboard('guest_user_1', {
        date: '2026-04-06',
        lessonsCompleted: 1,
        xpEarned: 15,
        username: 'guest',
        totalXp: 100,
        currentStreak: 7,
      })
    ).resolves.toBeUndefined();

    expect(mockSupabase.from).not.toHaveBeenCalled();
  });
});

describe('progressionRemote authenticated flows', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('loadRemoteProgressionSnapshot keeps profile, friend count, and rank queries together', async () => {
    const profileBuilder = {
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      single: jest.fn().mockResolvedValue({
        data: { xp: 123, streak: 8 },
        error: null,
      }),
    };
    const friendCountBuilder = {
      select: jest.fn().mockReturnThis(),
      or: jest.fn().mockResolvedValue({ count: 4, error: null }),
    };
    const leaderboardRankBuilder = {
      select: jest.fn().mockReturnThis(),
      gt: jest.fn().mockResolvedValue({ count: 2, error: null }),
    };

    mockSupabase.from
      .mockReturnValueOnce(profileBuilder)
      .mockReturnValueOnce(friendCountBuilder)
      .mockReturnValueOnce(leaderboardRankBuilder);

    await expect(loadRemoteProgressionSnapshot('user-1', 90)).resolves.toEqual({
      xp: 123,
      streak: 8,
      friendCount: 4,
      leaderboardRank: 3,
    });

    expect(mockSupabase.from).toHaveBeenNthCalledWith(1, 'profiles');
    expect(profileBuilder.select).toHaveBeenCalledWith('xp, streak');
    expect(profileBuilder.eq).toHaveBeenCalledWith('id', 'user-1');
    expect(profileBuilder.single).toHaveBeenCalled();

    expect(mockSupabase.from).toHaveBeenNthCalledWith(2, 'friendships');
    expect(friendCountBuilder.select).toHaveBeenCalledWith('*', { count: 'exact', head: true });
    expect(friendCountBuilder.or).toHaveBeenCalledWith('user_id.eq.user-1,friend_id.eq.user-1');

    expect(mockSupabase.from).toHaveBeenNthCalledWith(3, 'profiles');
    expect(leaderboardRankBuilder.select).toHaveBeenCalledWith('*', { count: 'exact', head: true });
    expect(leaderboardRankBuilder.gt).toHaveBeenCalledWith('xp', 123);
  });

  test('loadRemoteBadgeIds returns badge ids for authenticated users', async () => {
    const badgeLoadBuilder = {
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockResolvedValue({
        data: [{ badge_id: 'badge-1' }, { badge_id: 'badge-2' }],
        error: null,
      }),
    };

    mockSupabase.from.mockReturnValueOnce(badgeLoadBuilder);

    await expect(loadRemoteBadgeIds('user-1')).resolves.toEqual(['badge-1', 'badge-2']);

    expect(mockSupabase.from).toHaveBeenCalledWith('user_badges');
    expect(badgeLoadBuilder.select).toHaveBeenCalledWith('badge_id');
    expect(badgeLoadBuilder.eq).toHaveBeenCalledWith('user_id', 'user-1');
  });

  test('profile sync helpers preserve update call shape', async () => {
    const syncXpBuilder = {
      update: jest.fn().mockReturnThis(),
      eq: jest.fn().mockResolvedValue({ error: null }),
    };
    const syncStreakBuilder = {
      update: jest.fn().mockReturnThis(),
      eq: jest.fn().mockResolvedValue({ error: null }),
    };

    mockSupabase.from
      .mockReturnValueOnce(syncXpBuilder)
      .mockReturnValueOnce(syncStreakBuilder);

    await expect(syncProfileXp('user-1', 250)).resolves.toBeUndefined();
    await expect(syncProfileStreak('user-1', 9)).resolves.toBeUndefined();

    expect(mockSupabase.from).toHaveBeenNthCalledWith(1, 'profiles');
    expect(syncXpBuilder.update).toHaveBeenCalledWith({ xp: 250 });
    expect(syncXpBuilder.eq).toHaveBeenCalledWith('id', 'user-1');

    expect(mockSupabase.from).toHaveBeenNthCalledWith(2, 'profiles');
    expect(syncStreakBuilder.update).toHaveBeenCalledWith({ streak: 9 });
    expect(syncStreakBuilder.eq).toHaveBeenCalledWith('id', 'user-1');
  });

  test('syncStreakAndLeaderboard keeps both upserts intact', async () => {
    const streakHistoryBuilder = {
      upsert: jest.fn().mockResolvedValue({ error: null }),
    };
    const leaderboardBuilder = {
      upsert: jest.fn().mockResolvedValue({ error: null }),
    };

    mockSupabase.from
      .mockReturnValueOnce(streakHistoryBuilder)
      .mockReturnValueOnce(leaderboardBuilder);

    await expect(
      syncStreakAndLeaderboard('user-1', {
        date: '2026-04-06',
        lessonsCompleted: 2,
        xpEarned: 15,
        username: 'mashi',
        totalXp: 250,
        currentStreak: 9,
      })
    ).resolves.toBeUndefined();

    expect(mockSupabase.from).toHaveBeenNthCalledWith(1, 'streak_history');
    expect(streakHistoryBuilder.upsert).toHaveBeenCalledWith({
      user_id: 'user-1',
      date: '2026-04-06',
      lessons_completed: 2,
      xp_earned: 15,
    });

    expect(mockSupabase.from).toHaveBeenNthCalledWith(2, 'leaderboard');
    expect(leaderboardBuilder.upsert).toHaveBeenCalledWith(
      {
        user_id: 'user-1',
        username: 'mashi',
        total_xp: 250,
        current_streak: 9,
      },
      { onConflict: 'user_id' }
    );
  });

  test('loadLessonsCompleted7d sums remote lesson counts', async () => {
    const historyBuilder = {
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      gte: jest.fn().mockResolvedValue({
        data: [{ lessons_completed: 2 }, { lessons_completed: null }, { lessons_completed: 3.9 }],
        error: null,
      }),
    };

    mockSupabase.from.mockReturnValueOnce(historyBuilder);

    await expect(loadLessonsCompleted7d('user-1', '2026-04-01')).resolves.toBe(5);

    expect(mockSupabase.from).toHaveBeenCalledWith('streak_history');
    expect(historyBuilder.select).toHaveBeenCalledWith('lessons_completed');
    expect(historyBuilder.eq).toHaveBeenCalledWith('user_id', 'user-1');
    expect(historyBuilder.gte).toHaveBeenCalledWith('date', '2026-04-01');
  });

  test('insertUserBadge preserves duplicate semantics', async () => {
    const duplicateBuilder = {
      insert: jest.fn().mockResolvedValue({ error: { code: '23505' } }),
    };
    const insertedBuilder = {
      insert: jest.fn().mockResolvedValue({ error: null }),
    };

    mockSupabase.from
      .mockReturnValueOnce(duplicateBuilder)
      .mockReturnValueOnce(insertedBuilder);

    await expect(insertUserBadge('user-1', 'badge-1')).resolves.toBe('duplicate');
    await expect(insertUserBadge('user-1', 'badge-2')).resolves.toBe('inserted');

    expect(mockSupabase.from).toHaveBeenNthCalledWith(1, 'user_badges');
    expect(duplicateBuilder.insert).toHaveBeenCalledWith({ user_id: 'user-1', badge_id: 'badge-1' });
    expect(mockSupabase.from).toHaveBeenNthCalledWith(2, 'user_badges');
    expect(insertedBuilder.insert).toHaveBeenCalledWith({ user_id: 'user-1', badge_id: 'badge-2' });
  });
});
