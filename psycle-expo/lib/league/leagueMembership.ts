import { Analytics } from "../analytics";
import { isGuestUserId } from "../authUtils";
import { warnDev } from "../devLog";
import { getLeagueMatchmakingConfig } from "../gamificationConfig";
import { supabase } from "../supabase";
import { evaluateLeagueCandidatesByXpProxy } from "./leagueMatchmaking";
import { getCurrentWeekId, getLastWeekId } from "./leagueWeek";
import {
  DEMOTION_PERCENT,
  LEAGUE_TIERS,
  type EnsureJoinedLeagueResult,
  type LeagueInfo,
  type LeagueMember,
  PROMOTION_PERCENT,
  clampTier,
} from "./shared";

interface LeagueMembershipSummary {
  leagueId: string;
  tier: number;
}

const joinedLeagueCache = new Map<string, LeagueMembershipSummary>();
let joinedLeagueCacheWeekId: string | null = null;

function clearJoinCacheIfWeekChanged(weekId: string): void {
  if (joinedLeagueCacheWeekId !== weekId) {
    joinedLeagueCache.clear();
    joinedLeagueCacheWeekId = weekId;
  }
}

function getJoinCacheKey(userId: string, weekId: string): string {
  return `${userId}:${weekId}`;
}

async function getCurrentWeekMembership(
  userId: string,
  weekId: string
): Promise<LeagueMembershipSummary | null> {
  const { data, error } = await supabase
    .from("league_members")
    .select(`
      league_id,
      leagues!inner(week_id, tier)
    `)
    .eq("user_id", userId)
    .eq("leagues.week_id", weekId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    warnDev("[League] Failed to fetch current membership:", error);
    return null;
  }

  if (!data) return null;

  return {
    leagueId: (data as { league_id: string }).league_id,
    tier: clampTier(
      ((data as { leagues?: { tier?: number } }).leagues?.tier ?? 0) as number
    ),
  };
}

export async function resolveNextTierFromLastWeek(userId: string): Promise<number> {
  if (!userId || isGuestUserId(userId)) return 0;
  const lastWeekId = await getLastWeekId();

  try {
    const { data, error } = await supabase
      .from("league_members")
      .select(`
        promoted,
        demoted,
        leagues!inner(week_id, tier)
      `)
      .eq("user_id", userId)
      .eq("leagues.week_id", lastWeekId)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) {
      warnDev("[League] Failed to resolve next tier, fallback Bronze:", error);
      return 0;
    }

    if (!data) return 0;

    const row = data as {
      promoted?: boolean;
      demoted?: boolean;
      leagues?: { tier?: number };
    };
    const lastTier = clampTier(row.leagues?.tier ?? 0);
    if (row.promoted) return clampTier(lastTier + 1);
    if (row.demoted) return clampTier(lastTier - 1);
    return lastTier;
  } catch (error) {
    warnDev("[League] Error resolving next tier, fallback Bronze:", error);
    return 0;
  }
}

export async function ensureJoinedLeagueForCurrentWeek(
  userId: string
): Promise<EnsureJoinedLeagueResult> {
  if (!userId || isGuestUserId(userId)) {
    return {
      leagueId: null,
      tier: 0,
      joinedNow: false,
    };
  }

  const weekId = await getCurrentWeekId();
  clearJoinCacheIfWeekChanged(weekId);

  const cacheKey = getJoinCacheKey(userId, weekId);
  const cached = joinedLeagueCache.get(cacheKey);
  if (cached) {
    return {
      leagueId: cached.leagueId,
      tier: cached.tier,
      joinedNow: false,
    };
  }

  const existing = await getCurrentWeekMembership(userId, weekId);
  if (existing) {
    joinedLeagueCache.set(cacheKey, existing);
    return {
      leagueId: existing.leagueId,
      tier: existing.tier,
      joinedNow: false,
    };
  }

  const tier = await resolveNextTierFromLastWeek(userId);
  const leagueId = await joinLeague(userId, tier);
  if (!leagueId) {
    return {
      leagueId: null,
      tier,
      joinedNow: false,
    };
  }

  joinedLeagueCache.set(cacheKey, { leagueId, tier });
  return {
    leagueId,
    tier,
    joinedNow: true,
  };
}

export async function getMyLeague(userId: string): Promise<LeagueInfo | null> {
  if (!userId || isGuestUserId(userId)) return null;
  const weekId = await getCurrentWeekId();

  try {
    const { data: membership, error: memberError } = await supabase
      .from("league_members")
      .select(`
        league_id,
        weekly_xp,
        leagues!inner(week_id, tier)
      `)
      .eq("user_id", userId)
      .eq("leagues.week_id", weekId)
      .single();

    if (memberError || !membership) {
      return null;
    }

    const leagueId = membership.league_id;
    const tier = (membership as { leagues?: { tier?: number } }).leagues?.tier ?? 0;

    const { data: members, error: membersError } = await supabase
      .from("league_members")
      .select(`
        user_id,
        weekly_xp,
        leaderboard!inner(username)
      `)
      .eq("league_id", leagueId)
      .order("weekly_xp", { ascending: false });

    if (membersError) {
      warnDev("[League] Error fetching members:", membersError);
      return null;
    }

    const rankedMembers: LeagueMember[] = (members || []).map((member, index) => {
      const row = member as {
        user_id: string;
        weekly_xp: number;
        leaderboard?: { username?: string };
      };
      return {
        user_id: row.user_id,
        username: row.leaderboard?.username || "Unknown",
        weekly_xp: row.weekly_xp,
        rank: index + 1,
        is_self: row.user_id === userId,
      };
    });

    const myRank = rankedMembers.find((member) => member.is_self)?.rank || 0;
    const memberCount = rankedMembers.length;
    const promotionZone = Math.ceil(memberCount * PROMOTION_PERCENT);
    const demotionZone =
      memberCount - Math.floor(memberCount * DEMOTION_PERCENT) + 1;
    const tierInfo =
      Object.values(LEAGUE_TIERS).find((candidate) => candidate.id === tier) ||
      LEAGUE_TIERS.BRONZE;

    return {
      league_id: leagueId,
      week_id: weekId,
      tier,
      tier_name: tierInfo.name,
      tier_color: tierInfo.color,
      tier_icon: tierInfo.icon,
      members: rankedMembers,
      my_rank: myRank,
      promotion_zone: promotionZone,
      demotion_zone: demotionZone,
    };
  } catch (error) {
    warnDev("[League] Error:", error);
    return null;
  }
}

export async function addWeeklyXp(userId: string, xp: number): Promise<void> {
  if (!userId || isGuestUserId(userId)) return;

  try {
    const joined = await ensureJoinedLeagueForCurrentWeek(userId);
    if (joined.joinedNow) {
      Analytics.track("league_auto_joined_on_xp", {
        tier: joined.tier,
        joinedNow: true,
        source: "xp_gain",
      });
    }

    if (!joined.leagueId) {
      warnDev("[League] Could not ensure league membership before adding XP");
      return;
    }

    const { error } = await supabase.rpc("add_weekly_xp", {
      p_user_id: userId,
      p_xp: xp,
    });

    if (error) {
      warnDev("[League] Failed to add weekly XP:", error);
    }
  } catch (error) {
    warnDev("[League] Error adding weekly XP:", error);
  }
}

export async function joinLeague(
  userId: string,
  tier?: number
): Promise<string | null> {
  if (!userId || isGuestUserId(userId)) return null;
  const weekId = await getCurrentWeekId();
  clearJoinCacheIfWeekChanged(weekId);

  try {
    const existing = await getCurrentWeekMembership(userId, weekId);
    if (existing) {
      joinedLeagueCache.set(getJoinCacheKey(userId, weekId), existing);
      return existing.leagueId;
    }

    const resolvedTier =
      typeof tier === "number"
        ? clampTier(tier)
        : await resolveNextTierFromLastWeek(userId);
    const evaluated = await evaluateLeagueCandidatesByXpProxy({
      weekId,
      tier: resolvedTier,
      userId,
    });

    let targetLeagueId = evaluated.selected?.leagueId ?? null;
    if (!targetLeagueId) {
      const { data: newLeague, error: createError } = await supabase
        .from("leagues")
        .insert({ week_id: weekId, tier: resolvedTier })
        .select("id")
        .single();

      if (createError) throw createError;
      targetLeagueId = (newLeague as { id: string }).id;
    }

    const matchmakingConfig = getLeagueMatchmakingConfig();
    Analytics.track("league_matchmaking_applied", {
      tier: resolvedTier,
      candidateCount: evaluated.candidateCount,
      selectedLeagueSize: evaluated.selected?.memberCount ?? 0,
      userTotalXp: evaluated.userTotalXp,
      avgLeagueTotalXp: evaluated.selected?.avgTotalXp ?? 0,
      xpGap: evaluated.selected
        ? Math.abs(evaluated.selected.avgTotalXp - evaluated.userTotalXp)
        : 0,
      xpGapRelative: evaluated.selected?.relativeGap ?? 0,
      xpStddev: evaluated.selected?.stddevTotalXp ?? 0,
      matchScore: evaluated.selected?.matchScore ?? 0,
      relativeGapWeight: matchmakingConfig.relative_gap_weight,
      variancePenaltyWeight: matchmakingConfig.variance_penalty_weight,
      source: "join_league",
    });

    if (!targetLeagueId) {
      throw new Error("[League] Missing target league id before join");
    }

    const { error: joinError } = await supabase.from("league_members").insert({
      league_id: targetLeagueId,
      user_id: userId,
      weekly_xp: 0,
    });

    if (joinError) {
      const raced = await getCurrentWeekMembership(userId, weekId);
      if (raced?.leagueId) {
        joinedLeagueCache.set(getJoinCacheKey(userId, weekId), raced);
        return raced.leagueId;
      }
      throw joinError;
    }

    joinedLeagueCache.set(getJoinCacheKey(userId, weekId), {
      leagueId: targetLeagueId,
      tier: resolvedTier,
    });

    return targetLeagueId;
  } catch (error) {
    warnDev("[League] Error joining league:", error);
    return null;
  }
}
