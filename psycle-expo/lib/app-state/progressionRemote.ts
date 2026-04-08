import { isGuestUserId } from "../authUtils";
import { supabase } from "../supabase";

export interface RemoteProgressionSnapshot {
  xp: number | null;
  streak: number | null;
  friendCount: number;
  leaderboardRank: number;
}

export interface SyncStreakAndLeaderboardPayload {
  date: string;
  lessonsCompleted: number;
  xpEarned: number;
  username: string;
  totalXp: number;
  currentStreak: number;
}

export type InsertUserBadgeResult = "inserted" | "duplicate" | "skipped";

function canUseRemoteUserId(userId: string | null | undefined): userId is string {
  return typeof userId === "string" && userId.length > 0 && !isGuestUserId(userId);
}

export async function loadRemoteProgressionSnapshot(
  userId: string | null | undefined,
  rankingXp = 0
): Promise<RemoteProgressionSnapshot> {
  if (!canUseRemoteUserId(userId)) {
    return {
      xp: null,
      streak: null,
      friendCount: 0,
      leaderboardRank: 0,
    };
  }

  const { data, error } = await supabase
    .from("profiles")
    .select("xp, streak")
    .eq("id", userId)
    .single();

  if (error) throw error;

  const remoteXp = typeof data?.xp === "number" ? data.xp : null;
  const remoteStreak = typeof data?.streak === "number" ? data.streak : null;
  const rankingSourceXp = remoteXp ?? rankingXp;
  const counts = await loadFriendCountAndLeaderboardRank(userId, rankingSourceXp);

  return {
    xp: remoteXp,
    streak: remoteStreak,
    friendCount: counts.friendCount,
    leaderboardRank: counts.leaderboardRank,
  };
}

export async function loadRemoteBadgeIds(userId: string | null | undefined): Promise<string[]> {
  if (!canUseRemoteUserId(userId)) return [];

  const { data, error } = await supabase
    .from("user_badges")
    .select("badge_id")
    .eq("user_id", userId);

  if (error) throw error;

  return (data ?? [])
    .map((row) => row.badge_id)
    .filter((badgeId): badgeId is string => typeof badgeId === "string" && badgeId.length > 0);
}

export async function syncProfileXp(userId: string | null | undefined, xp: number): Promise<void> {
  if (!canUseRemoteUserId(userId)) return;

  const { error } = await supabase
    .from("profiles")
    .update({ xp })
    .eq("id", userId);

  if (error) throw error;
}

export async function syncProfileStreak(userId: string | null | undefined, streak: number): Promise<void> {
  if (!canUseRemoteUserId(userId)) return;

  const { error } = await supabase
    .from("profiles")
    .update({ streak })
    .eq("id", userId);

  if (error) throw error;
}

export async function syncStreakAndLeaderboard(
  userId: string | null | undefined,
  payload: SyncStreakAndLeaderboardPayload
): Promise<void> {
  if (!canUseRemoteUserId(userId)) return;

  const streakHistoryResult = await supabase.from("streak_history").upsert({
    user_id: userId,
    date: payload.date,
    lessons_completed: payload.lessonsCompleted,
    xp_earned: payload.xpEarned,
  });

  if (streakHistoryResult.error) throw streakHistoryResult.error;

  const leaderboardResult = await supabase.from("leaderboard").upsert(
    {
      user_id: userId,
      username: payload.username,
      total_xp: payload.totalXp,
      current_streak: payload.currentStreak,
    },
    { onConflict: "user_id" }
  );

  if (leaderboardResult.error) throw leaderboardResult.error;
}

export async function loadFriendCountAndLeaderboardRank(
  userId: string | null | undefined,
  rankingXp: number
): Promise<{ friendCount: number; leaderboardRank: number }> {
  if (!canUseRemoteUserId(userId)) {
    return {
      friendCount: 0,
      leaderboardRank: 0,
    };
  }

  const [friendCountResult, leaderboardRankResult] = await Promise.all([
    supabase
      .from("friendships")
      .select("*", { count: "exact", head: true })
      .or(`user_id.eq.${userId},friend_id.eq.${userId}`),
    supabase
      .from("profiles")
      .select("*", { count: "exact", head: true })
      .gt("xp", rankingXp),
  ]);

  if (friendCountResult.error) throw friendCountResult.error;
  if (leaderboardRankResult.error) throw leaderboardRankResult.error;

  return {
    friendCount: friendCountResult.count ?? 0,
    leaderboardRank: leaderboardRankResult.count === null ? 0 : leaderboardRankResult.count + 1,
  };
}

export async function loadLessonsCompleted7d(
  userId: string | null | undefined,
  fromDate: string
): Promise<number> {
  if (!canUseRemoteUserId(userId)) return 0;

  const { data, error } = await supabase
    .from("streak_history")
    .select("lessons_completed")
    .eq("user_id", userId)
    .gte("date", fromDate);

  if (error) throw error;

  return (data ?? []).reduce((sum, row) => {
    const value = Number((row as { lessons_completed?: number | null }).lessons_completed ?? 0);
    return sum + (Number.isFinite(value) ? Math.max(0, Math.floor(value)) : 0);
  }, 0);
}

export async function insertUserBadge(
  userId: string | null | undefined,
  badgeId: string
): Promise<InsertUserBadgeResult> {
  if (!canUseRemoteUserId(userId)) return "skipped";

  const { error } = await supabase
    .from("user_badges")
    .insert({ user_id: userId, badge_id: badgeId });

  if (!error) return "inserted";
  if (error.code === "23505") return "duplicate";
  throw error;
}
