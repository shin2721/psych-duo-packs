import {
  getLeagueMatchmakingConfig,
  type LeagueMatchmakingConfig,
} from "../gamificationConfig";
import { supabase } from "../supabase";
import { warnDev } from "../devLog";
import {
  LEAGUE_SIZE,
  type LeagueCandidateScore,
} from "./shared";

export interface LeagueCandidateEvaluation {
  selected: LeagueCandidateScore | null;
  candidateCount: number;
  userTotalXp: number;
}

function computeStddev(values: number[]): number {
  if (values.length === 0) return 0;
  const mean = values.reduce((sum, value) => sum + value, 0) / values.length;
  const variance =
    values.reduce((sum, value) => {
      const diff = value - mean;
      return sum + diff * diff;
    }, 0) / values.length;
  return Math.sqrt(Math.max(0, variance));
}

function computeCandidateMatchingMetrics(
  candidate: Pick<
    LeagueCandidateScore,
    "avgTotalXp" | "stddevTotalXp" | "memberCount"
  >,
  userTotalXp: number,
  config: LeagueMatchmakingConfig
): Pick<LeagueCandidateScore, "relativeGap" | "relativeStddev" | "matchScore"> {
  const denom = Math.max(candidate.avgTotalXp, userTotalXp, 1);
  const relativeGap = Math.abs(candidate.avgTotalXp - userTotalXp) / denom;
  const relativeStddev =
    candidate.memberCount >= config.min_members_for_variance
      ? candidate.stddevTotalXp / denom
      : 0;

  const matchScore =
    config.relative_gap_weight * relativeGap +
    config.variance_penalty_weight * relativeStddev;

  return {
    relativeGap,
    relativeStddev,
    matchScore,
  };
}

async function getUserTotalXp(userId: string): Promise<number> {
  try {
    const { data, error } = await supabase
      .from("leaderboard")
      .select("total_xp")
      .eq("user_id", userId)
      .maybeSingle();

    if (error) {
      warnDev("[League] Failed to fetch total_xp:", error);
      return 0;
    }

    const value = (data as { total_xp?: number } | null)?.total_xp;
    return Number.isFinite(value) ? Number(value) : 0;
  } catch (error) {
    warnDev("[League] Error while fetching total_xp:", error);
    return 0;
  }
}

export function selectBestLeagueCandidateByXpProxy(
  candidates: LeagueCandidateScore[],
  userTotalXp: number,
  config: LeagueMatchmakingConfig = getLeagueMatchmakingConfig()
): LeagueCandidateScore | null {
  if (candidates.length === 0) return null;

  const sorted = [...candidates].sort((a, b) => {
    const scoreA = Number.isFinite(a.matchScore)
      ? a.matchScore
      : computeCandidateMatchingMetrics(a, userTotalXp, config).matchScore;
    const scoreB = Number.isFinite(b.matchScore)
      ? b.matchScore
      : computeCandidateMatchingMetrics(b, userTotalXp, config).matchScore;

    if (scoreA !== scoreB) return scoreA - scoreB;
    if (a.memberCount !== b.memberCount) {
      return b.memberCount - a.memberCount;
    }

    return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
  });

  return sorted[0] ?? null;
}

export async function evaluateLeagueCandidatesByXpProxy(input: {
  weekId: string;
  tier: number;
  userId: string;
}): Promise<LeagueCandidateEvaluation> {
  const { weekId, tier, userId } = input;
  const matchmakingConfig = getLeagueMatchmakingConfig();

  const { data: leagues, error: leaguesError } = await supabase
    .from("leagues")
    .select("id, created_at")
    .eq("week_id", weekId)
    .eq("tier", tier)
    .order("created_at", { ascending: true });

  if (leaguesError || !leagues || leagues.length === 0) {
    if (leaguesError) {
      warnDev("[League] Failed to list candidate leagues:", leaguesError);
    }
    return {
      selected: null,
      candidateCount: 0,
      userTotalXp: await getUserTotalXp(userId),
    };
  }

  const leagueIds = leagues.map((league) => league.id);
  const { data: memberRows, error: membersError } = await supabase
    .from("league_members")
    .select("league_id, user_id")
    .in("league_id", leagueIds);

  if (membersError) {
    warnDev(
      "[League] Failed to list league members for matchmaking:",
      membersError
    );
    return {
      selected: null,
      candidateCount: 0,
      userTotalXp: await getUserTotalXp(userId),
    };
  }

  const memberUserIdsByLeague = new Map<string, string[]>();
  leagues.forEach((league) => {
    memberUserIdsByLeague.set(league.id, []);
  });

  const allUserIds = new Set<string>([userId]);
  (memberRows || []).forEach((member) => {
    const leagueUserIds = memberUserIdsByLeague.get(member.league_id);
    if (leagueUserIds) {
      leagueUserIds.push(member.user_id);
    }
    allUserIds.add(member.user_id);
  });

  const xpByUser = new Map<string, number>();
  const xpUserIds = [...allUserIds];
  if (xpUserIds.length > 0) {
    const { data: xpRows, error: xpError } = await supabase
      .from("leaderboard")
      .select("user_id, total_xp")
      .in("user_id", xpUserIds);

    if (xpError) {
      warnDev(
        "[League] Failed to fetch leaderboard XP for matchmaking:",
        xpError
      );
    } else {
      (xpRows || []).forEach((row) => {
        const typedRow = row as { user_id: string; total_xp?: number };
        const value = Number(typedRow.total_xp ?? 0);
        xpByUser.set(typedRow.user_id, Number.isFinite(value) ? value : 0);
      });
    }
  }

  const userTotalXp = xpByUser.get(userId) ?? 0;
  const candidates: LeagueCandidateScore[] = [];

  leagues.forEach((league) => {
    const memberIds = memberUserIdsByLeague.get(league.id) ?? [];
    const memberCount = memberIds.length;
    if (memberCount >= LEAGUE_SIZE) return;

    const memberXps = memberIds.map((memberId) => xpByUser.get(memberId) ?? 0);
    const sumXp = memberXps.reduce((total, xp) => total + xp, 0);
    const avgTotalXp = memberCount > 0 ? sumXp / memberCount : 0;
    const stddevTotalXp = memberCount > 0 ? computeStddev(memberXps) : 0;
    const metrics = computeCandidateMatchingMetrics(
      {
        avgTotalXp,
        stddevTotalXp,
        memberCount,
      },
      userTotalXp,
      matchmakingConfig
    );

    candidates.push({
      leagueId: league.id,
      memberCount,
      avgTotalXp,
      stddevTotalXp,
      relativeGap: metrics.relativeGap,
      relativeStddev: metrics.relativeStddev,
      matchScore: metrics.matchScore,
      createdAt:
        (league as { created_at?: string }).created_at ||
        new Date(0).toISOString(),
    });
  });

  return {
    selected: selectBestLeagueCandidateByXpProxy(
      candidates,
      userTotalXp,
      matchmakingConfig
    ),
    candidateCount: candidates.length,
    userTotalXp,
  };
}

export async function pickBestLeagueCandidateByXpProxy(input: {
  weekId: string;
  tier: number;
  userId: string;
}): Promise<string | null> {
  const evaluated = await evaluateLeagueCandidatesByXpProxy(input);
  return evaluated.selected?.leagueId ?? null;
}
