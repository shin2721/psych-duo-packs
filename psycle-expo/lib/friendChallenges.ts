import { getCurrentWeekId } from "./league";
import { supabase } from "./supabase";

export interface WeeklyFriendChallenge {
  weekId: string;
  userId: string;
  opponentId: string;
  opponentName: string;
  myWeeklyXp: number;
  opponentWeeklyXp: number;
  completed: boolean;
}

export interface FriendChallengeProgress {
  completed: boolean;
  myWeeklyXp: number;
  opponentWeeklyXp: number;
  xpGap: number;
}

function normalizeXp(value: unknown): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? Math.max(0, Math.floor(parsed)) : 0;
}

function pickClosestOpponent(
  myWeeklyXp: number,
  candidates: Array<{ userId: string; weeklyXp: number }>
): { userId: string; weeklyXp: number } | null {
  if (candidates.length === 0) return null;

  const sorted = [...candidates].sort((a, b) => {
    const gapA = Math.abs(a.weeklyXp - myWeeklyXp);
    const gapB = Math.abs(b.weeklyXp - myWeeklyXp);
    if (gapA !== gapB) return gapA - gapB;
    if (a.weeklyXp !== b.weeklyXp) return b.weeklyXp - a.weeklyXp;
    return a.userId.localeCompare(b.userId);
  });

  return sorted[0] ?? null;
}

export function evaluateFriendChallengeProgress(input: {
  myWeeklyXp: number;
  opponentWeeklyXp: number;
}): FriendChallengeProgress {
  const myWeeklyXp = normalizeXp(input.myWeeklyXp);
  const opponentWeeklyXp = normalizeXp(input.opponentWeeklyXp);
  const completed = myWeeklyXp >= opponentWeeklyXp;

  return {
    completed,
    myWeeklyXp,
    opponentWeeklyXp,
    xpGap: myWeeklyXp - opponentWeeklyXp,
  };
}

export async function buildWeeklyFriendChallenge(userId: string): Promise<WeeklyFriendChallenge | null> {
  if (!userId) return null;

  try {
    const weekId = await getCurrentWeekId();

    const { data: friendshipRows, error: friendshipError } = await supabase
      .from("friendships")
      .select("friend_id")
      .eq("user_id", userId);

    if (friendshipError) {
      console.warn("[FriendChallenge] Failed to fetch friendships:", friendshipError);
      return null;
    }

    const friendIds = (friendshipRows ?? [])
      .map((row) => row.friend_id)
      .filter((id): id is string => typeof id === "string" && id.length > 0);

    if (friendIds.length === 0) return null;

    const allUserIds = [userId, ...friendIds];

    const { data: memberRows, error: memberError } = await supabase
      .from("league_members")
      .select(`
        user_id,
        weekly_xp,
        leagues!inner(week_id)
      `)
      .eq("leagues.week_id", weekId)
      .in("user_id", allUserIds);

    if (memberError) {
      console.warn("[FriendChallenge] Failed to fetch league member data:", memberError);
      return null;
    }

    const weeklyXpByUser = new Map<string, number>();
    for (const row of memberRows ?? []) {
      if (typeof row.user_id === "string") {
        weeklyXpByUser.set(row.user_id, normalizeXp((row as any).weekly_xp));
      }
    }

    const myWeeklyXp = weeklyXpByUser.get(userId) ?? 0;
    const candidates = friendIds.map((friendId) => ({
      userId: friendId,
      weeklyXp: weeklyXpByUser.get(friendId) ?? 0,
    }));

    const opponent = pickClosestOpponent(myWeeklyXp, candidates);
    if (!opponent) return null;

    let opponentName = "Friend";
    const { data: profile } = await supabase
      .from("leaderboard")
      .select("username")
      .eq("user_id", opponent.userId)
      .maybeSingle();

    if (typeof (profile as any)?.username === "string" && (profile as any).username.length > 0) {
      opponentName = (profile as any).username;
    }

    const progress = evaluateFriendChallengeProgress({
      myWeeklyXp,
      opponentWeeklyXp: opponent.weeklyXp,
    });

    return {
      weekId,
      userId,
      opponentId: opponent.userId,
      opponentName,
      myWeeklyXp: progress.myWeeklyXp,
      opponentWeeklyXp: progress.opponentWeeklyXp,
      completed: progress.completed,
    };
  } catch (error) {
    console.warn("[FriendChallenge] Failed to build weekly challenge:", error);
    return null;
  }
}
