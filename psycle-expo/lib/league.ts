/**
 * Weekly League System (Duolingo-style)
 *
 * 週次・30人前後・昇格/降格
 * North Star: 「勝てる確率」を配る
 */

import Analytics from './analytics';
import { getLeagueMatchmakingConfig, type LeagueMatchmakingConfig } from './gamificationConfig';
import { supabase } from './supabase';

// リーグティア定義
export const LEAGUE_TIERS = {
  BRONZE: { id: 0, name: 'ブロンズ', color: '#CD7F32', icon: '🥉' },
  SILVER: { id: 1, name: 'シルバー', color: '#C0C0C0', icon: '🥈' },
  GOLD: { id: 2, name: 'ゴールド', color: '#FFD700', icon: '🥇' },
  PLATINUM: { id: 3, name: 'プラチナ', color: '#E5E4E2', icon: '💎' },
  DIAMOND: { id: 4, name: 'ダイヤモンド', color: '#B9F2FF', icon: '💠' },
  MASTER: { id: 5, name: 'マスター', color: '#9B59B6', icon: '👑' },
} as const;

export type LeagueTierId = keyof typeof LEAGUE_TIERS;

export interface LeagueMember {
  user_id: string;
  username: string;
  weekly_xp: number;
  rank: number;
  is_self: boolean;
}

export interface LeagueInfo {
  league_id: string;
  week_id: string;
  tier: number;
  tier_name: string;
  tier_color: string;
  tier_icon: string;
  members: LeagueMember[];
  my_rank: number;
  promotion_zone: number; // 上位N人が昇格
  demotion_zone: number; // 下位N人が降格
}

export interface EnsureJoinedLeagueResult {
  leagueId: string | null;
  tier: number;
  joinedNow: boolean;
}

export interface LeagueCandidateScore {
  leagueId: string;
  memberCount: number;
  avgTotalXp: number;
  stddevTotalXp: number;
  relativeGap: number;
  relativeStddev: number;
  matchScore: number;
  createdAt: string;
}

interface LeagueCandidateEvaluation {
  selected: LeagueCandidateScore | null;
  candidateCount: number;
  userTotalXp: number;
}

interface LeagueMembershipSummary {
  leagueId: string;
  tier: number;
}

// 定数
const LEAGUE_SIZE = 30; // リーグあたりの人数
const PROMOTION_PERCENT = 0.2; // 上位20%昇格
const DEMOTION_PERCENT = 0.2; // 下位20%降格
const MIN_TIER = 0;
const MAX_TIER = 5;

// 週次XP加算時の過剰クエリ回避キャッシュ
const joinedLeagueCache = new Map<string, LeagueMembershipSummary>();
let joinedLeagueCacheWeekId: string | null = null;

function clampTier(tier: number): number {
  return Math.max(MIN_TIER, Math.min(MAX_TIER, Math.floor(tier)));
}

function clearJoinCacheIfWeekChanged(weekId: string) {
  if (joinedLeagueCacheWeekId !== weekId) {
    joinedLeagueCache.clear();
    joinedLeagueCacheWeekId = weekId;
  }
}

function getJoinCacheKey(userId: string, weekId: string): string {
  return `${userId}:${weekId}`;
}

function computeStddev(values: number[]): number {
  if (values.length === 0) return 0;
  const mean = values.reduce((sum, value) => sum + value, 0) / values.length;
  const variance = values.reduce((sum, value) => {
    const diff = value - mean;
    return sum + diff * diff;
  }, 0) / values.length;
  return Math.sqrt(Math.max(0, variance));
}

function computeCandidateMatchingMetrics(
  candidate: Pick<LeagueCandidateScore, 'avgTotalXp' | 'stddevTotalXp' | 'memberCount'>,
  userTotalXp: number,
  config: LeagueMatchmakingConfig
): Pick<LeagueCandidateScore, 'relativeGap' | 'relativeStddev' | 'matchScore'> {
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

/**
 * 現在の週IDを取得（サーバーが唯一の真実）
 */
export async function getCurrentWeekId(): Promise<string> {
  try {
    const { data, error } = await supabase.rpc('get_current_week_id');
    if (error) throw error;
    return data as string;
  } catch (e) {
    console.error('[League] Failed to get week ID from server, using fallback:', e);
    // フォールバック（オフライン時）
    const now = new Date();
    const year = now.getFullYear();
    const jan4 = new Date(year, 0, 4);
    const dayOfYear = Math.ceil((now.getTime() - new Date(year, 0, 1).getTime()) / (24 * 60 * 60 * 1000));
    const weekNum = Math.ceil((dayOfYear + jan4.getDay()) / 7);
    return `${year}-W${String(weekNum).padStart(2, '0')}`;
  }
}

/**
 * 先週の週IDを取得（サーバーが唯一の真実）
 */
export async function getLastWeekId(): Promise<string> {
  try {
    const { data, error } = await supabase.rpc('get_last_week_id');
    if (error) throw error;
    return data as string;
  } catch (e) {
    console.error('[League] Failed to get last week ID from server, using fallback:', e);
    const now = new Date();
    const fallback = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const year = fallback.getFullYear();
    const jan4 = new Date(year, 0, 4);
    const dayOfYear = Math.ceil((fallback.getTime() - new Date(year, 0, 1).getTime()) / (24 * 60 * 60 * 1000));
    const weekNum = Math.ceil((dayOfYear + jan4.getDay()) / 7);
    return `${year}-W${String(weekNum).padStart(2, '0')}`;
  }
}

async function getUserTotalXp(userId: string): Promise<number> {
  try {
    const { data, error } = await supabase
      .from('leaderboard')
      .select('total_xp')
      .eq('user_id', userId)
      .maybeSingle();

    if (error) {
      console.warn('[League] Failed to fetch total_xp:', error);
      return 0;
    }

    const value = (data as any)?.total_xp;
    return Number.isFinite(value) ? Number(value) : 0;
  } catch (e) {
    console.warn('[League] Error while fetching total_xp:', e);
    return 0;
  }
}

async function getCurrentWeekMembership(userId: string, weekId: string): Promise<LeagueMembershipSummary | null> {
  const { data, error } = await supabase
    .from('league_members')
    .select(`
      league_id,
      leagues!inner(week_id, tier)
    `)
    .eq('user_id', userId)
    .eq('leagues.week_id', weekId)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    console.warn('[League] Failed to fetch current membership:', error);
    return null;
  }

  if (!data) return null;

  return {
    leagueId: (data as any).league_id,
    tier: clampTier((data as any)?.leagues?.tier ?? 0),
  };
}

/**
 * 前週の結果（promoted/demoted）から次週tierを決める
 */
export async function resolveNextTierFromLastWeek(userId: string): Promise<number> {
  const lastWeekId = await getLastWeekId();

  try {
    const { data, error } = await supabase
      .from('league_members')
      .select(`
        promoted,
        demoted,
        leagues!inner(week_id, tier)
      `)
      .eq('user_id', userId)
      .eq('leagues.week_id', lastWeekId)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) {
      console.warn('[League] Failed to resolve next tier, fallback Bronze:', error);
      return 0;
    }

    if (!data) return 0;

    const lastTier = clampTier((data as any)?.leagues?.tier ?? 0);
    const promoted = Boolean((data as any)?.promoted);
    const demoted = Boolean((data as any)?.demoted);

    if (promoted) return clampTier(lastTier + 1);
    if (demoted) return clampTier(lastTier - 1);
    return lastTier;
  } catch (e) {
    console.warn('[League] Error resolving next tier, fallback Bronze:', e);
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
      // 空洞化回避のため、人数が多いリーグを優先
      return b.memberCount - a.memberCount;
    }

    // できるだけ古いリーグ（安定運用）を優先
    return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
  });

  return sorted[0] ?? null;
}

async function evaluateLeagueCandidatesByXpProxy(input: {
  weekId: string;
  tier: number;
  userId: string;
}): Promise<LeagueCandidateEvaluation> {
  const { weekId, tier, userId } = input;
  const matchmakingConfig = getLeagueMatchmakingConfig();

  const { data: leagues, error: leaguesError } = await supabase
    .from('leagues')
    .select('id, created_at')
    .eq('week_id', weekId)
    .eq('tier', tier)
    .order('created_at', { ascending: true });

  if (leaguesError || !leagues || leagues.length === 0) {
    if (leaguesError) {
      console.warn('[League] Failed to list candidate leagues:', leaguesError);
    }
    return {
      selected: null,
      candidateCount: 0,
      userTotalXp: await getUserTotalXp(userId),
    };
  }

  const leagueIds = leagues.map((league) => league.id);

  const { data: memberRows, error: membersError } = await supabase
    .from('league_members')
    .select('league_id, user_id')
    .in('league_id', leagueIds);

  if (membersError) {
    console.warn('[League] Failed to list league members for matchmaking:', membersError);
    return {
      selected: null,
      candidateCount: 0,
      userTotalXp: await getUserTotalXp(userId),
    };
  }

  const memberUserIdsByLeague = new Map<string, string[]>();
  for (const league of leagues) {
    memberUserIdsByLeague.set(league.id, []);
  }

  const allUserIds = new Set<string>([userId]);
  for (const member of memberRows || []) {
    const leagueUserIds = memberUserIdsByLeague.get(member.league_id);
    if (leagueUserIds) {
      leagueUserIds.push(member.user_id);
    }
    allUserIds.add(member.user_id);
  }

  const xpByUser = new Map<string, number>();
  const xpUserIds = [...allUserIds];
  if (xpUserIds.length > 0) {
    const { data: xpRows, error: xpError } = await supabase
      .from('leaderboard')
      .select('user_id, total_xp')
      .in('user_id', xpUserIds);

    if (xpError) {
      console.warn('[League] Failed to fetch leaderboard XP for matchmaking:', xpError);
    } else {
      for (const row of xpRows || []) {
        const value = Number((row as any).total_xp ?? 0);
        xpByUser.set((row as any).user_id, Number.isFinite(value) ? value : 0);
      }
    }
  }

  const userTotalXp = xpByUser.get(userId) ?? 0;

  const candidates: LeagueCandidateScore[] = [];
  for (const league of leagues) {
    const memberIds = memberUserIdsByLeague.get(league.id) ?? [];
    const memberCount = memberIds.length;
    if (memberCount >= LEAGUE_SIZE) continue;

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
      createdAt: (league as any).created_at || new Date(0).toISOString(),
    });
  }

  return {
    selected: selectBestLeagueCandidateByXpProxy(candidates, userTotalXp, matchmakingConfig),
    candidateCount: candidates.length,
    userTotalXp,
  };
}

/**
 * 同tier候補リーグからXP proxy近似で最適リーグを選ぶ
 */
export async function pickBestLeagueCandidateByXpProxy(input: {
  weekId: string;
  tier: number;
  userId: string;
}): Promise<string | null> {
  const evaluated = await evaluateLeagueCandidatesByXpProxy(input);
  return evaluated.selected?.leagueId ?? null;
}

/**
 * 今週のリーグ参加を保証（未参加なら自動参加）
 */
export async function ensureJoinedLeagueForCurrentWeek(userId: string): Promise<EnsureJoinedLeagueResult> {
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

/**
 * ユーザーの現在のリーグ情報を取得
 */
export async function getMyLeague(userId: string): Promise<LeagueInfo | null> {
  const weekId = await getCurrentWeekId();

  try {
    // ユーザーのリーグメンバーシップを取得
    const { data: membership, error: memberError } = await supabase
      .from('league_members')
      .select(`
        league_id,
        weekly_xp,
        leagues!inner(week_id, tier)
      `)
      .eq('user_id', userId)
      .eq('leagues.week_id', weekId)
      .single();

    if (memberError || !membership) {
      console.log('[League] User not in any league this week');
      return null;
    }

    const leagueId = membership.league_id;
    const tier = (membership as any).leagues?.tier ?? 0;

    // リーグメンバー一覧を取得（XP降順）
    const { data: members, error: membersError } = await supabase
      .from('league_members')
      .select(`
        user_id,
        weekly_xp,
        leaderboard!inner(username)
      `)
      .eq('league_id', leagueId)
      .order('weekly_xp', { ascending: false });

    if (membersError) {
      console.error('[League] Error fetching members:', membersError);
      return null;
    }

    // ランキング付きメンバーリストを作成
    const rankedMembers: LeagueMember[] = (members || []).map((m, index) => ({
      user_id: m.user_id,
      username: (m as any).leaderboard?.username || 'Unknown',
      weekly_xp: m.weekly_xp,
      rank: index + 1,
      is_self: m.user_id === userId,
    }));

    const myRank = rankedMembers.find((m) => m.is_self)?.rank || 0;
    const memberCount = rankedMembers.length;
    const promotionZone = Math.ceil(memberCount * PROMOTION_PERCENT);
    const demotionZone = memberCount - Math.floor(memberCount * DEMOTION_PERCENT) + 1;

    // ティア情報を取得
    const tierInfo = Object.values(LEAGUE_TIERS).find((t) => t.id === tier) || LEAGUE_TIERS.BRONZE;

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
  } catch (e) {
    console.error('[League] Error:', e);
    return null;
  }
}

/**
 * 週次XPを加算（XP獲得時に呼ぶ）
 */
export async function addWeeklyXp(userId: string, xp: number): Promise<void> {
  try {
    const joined = await ensureJoinedLeagueForCurrentWeek(userId);

    if (joined.joinedNow) {
      Analytics.track('league_auto_joined_on_xp', {
        tier: joined.tier,
        joinedNow: true,
        source: 'xp_gain',
      });
    }

    if (!joined.leagueId) {
      console.warn('[League] Could not ensure league membership before adding XP');
      return;
    }

    const { error } = await supabase.rpc('add_weekly_xp', {
      p_user_id: userId,
      p_xp: xp,
    });

    if (error) {
      console.warn('[League] Failed to add weekly XP:', error);
    }
  } catch (e) {
    console.error('[League] Error adding weekly XP:', e);
  }
}

/**
 * ユーザーをリーグに参加させる（初回 or 週初め）
 * 通常はEdge Functionで自動実行するが、オンデマンドでも可
 */
export async function joinLeague(userId: string, tier?: number): Promise<string | null> {
  const weekId = await getCurrentWeekId();
  clearJoinCacheIfWeekChanged(weekId);

  try {
    const existing = await getCurrentWeekMembership(userId, weekId);
    if (existing) {
      joinedLeagueCache.set(getJoinCacheKey(userId, weekId), existing);
      return existing.leagueId;
    }

    const resolvedTier = typeof tier === 'number' ? clampTier(tier) : await resolveNextTierFromLastWeek(userId);

    const evaluated = await evaluateLeagueCandidatesByXpProxy({
      weekId,
      tier: resolvedTier,
      userId,
    });

    let targetLeagueId = evaluated.selected?.leagueId ?? null;

    if (!targetLeagueId) {
      const { data: newLeague, error: createError } = await supabase
        .from('leagues')
        .insert({ week_id: weekId, tier: resolvedTier })
        .select('id')
        .single();

      if (createError) throw createError;
      targetLeagueId = newLeague.id;
    }

    const matchmakingConfig = getLeagueMatchmakingConfig();
    Analytics.track('league_matchmaking_applied', {
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
      source: 'join_league',
    });

    const { error: joinError } = await supabase.from('league_members').insert({
      league_id: targetLeagueId,
      user_id: userId,
      weekly_xp: 0,
    });

    if (joinError) {
      // 競合時は最新のmembershipを再取得して復帰
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

    console.log(`[League] User ${userId} joined league ${targetLeagueId} (tier=${resolvedTier})`);
    return targetLeagueId;
  } catch (e) {
    console.error('[League] Error joining league:', e);
    return null;
  }
}

export function calculatePromotionDemotion(members: LeagueMember[]): {
  promoted: string[]; // user_id[]
  demoted: string[]; // user_id[]
} {
  const sorted = [...members].sort((a, b) => b.weekly_xp - a.weekly_xp);
  const total = sorted.length;
  const promotionCount = Math.ceil(total * PROMOTION_PERCENT);
  const demotionStart = total - Math.floor(total * DEMOTION_PERCENT);

  return {
    promoted: sorted.slice(0, promotionCount).map((m) => m.user_id),
    demoted: sorted.slice(demotionStart).map((m) => m.user_id),
  };
}

// リーグ報酬定義
export const LEAGUE_REWARDS = {
  // 昇格報酬（ティアごとのGems）
  promotion: {
    1: { gems: 25, badge: 'league_silver' }, // Bronze → Silver
    2: { gems: 50, badge: 'league_gold' }, // Silver → Gold
    3: { gems: 75, badge: 'league_platinum' }, // Gold → Platinum
    4: { gems: 100, badge: 'league_diamond' }, // Platinum → Diamond
    5: { gems: 150, badge: 'league_master' }, // Diamond → Master
  } as Record<number, { gems: number; badge: string }>,

  // 1位ボーナス
  firstPlace: {
    gems: 50,
    badge: 'league_first_place',
  },

  // 参加報酬（週完走）
  participation: {
    gems: 10,
  },
} as const;

/**
 * ティアIDからバッジIDを取得
 */
export function getPromotionBadgeId(newTier: number): string | null {
  return LEAGUE_REWARDS.promotion[newTier]?.badge || null;
}

/**
 * 昇格報酬のGemsを取得
 */
export function getPromotionGems(newTier: number): number {
  return LEAGUE_REWARDS.promotion[newTier]?.gems || 0;
}

/**
 * 報酬計算（週終了時にEdge Functionから呼ばれる）
 */
export interface LeagueRewardResult {
  user_id: string;
  gems: number;
  badges: string[]; // 獲得したバッジID
  promoted: boolean;
  demoted: boolean;
  first_place: boolean;
}

export function calculateRewards(members: LeagueMember[], currentTier: number): LeagueRewardResult[] {
  const { promoted, demoted } = calculatePromotionDemotion(members);
  const sorted = [...members].sort((a, b) => b.weekly_xp - a.weekly_xp);
  const firstPlaceUserId = sorted[0]?.user_id;

  return members.map((member) => {
    const isPromoted = promoted.includes(member.user_id);
    const isDemoted = demoted.includes(member.user_id);
    const isFirstPlace = member.user_id === firstPlaceUserId;

    let gems = LEAGUE_REWARDS.participation.gems; // 参加報酬
    const badges: string[] = [];

    // 昇格報酬
    if (isPromoted && currentTier < 5) {
      const newTier = currentTier + 1;
      gems += getPromotionGems(newTier);
      const badge = getPromotionBadgeId(newTier);
      if (badge) badges.push(badge);
    }

    // 1位ボーナス
    if (isFirstPlace) {
      gems += LEAGUE_REWARDS.firstPlace.gems;
      badges.push(LEAGUE_REWARDS.firstPlace.badge);
    }

    return {
      user_id: member.user_id,
      gems,
      badges,
      promoted: isPromoted,
      demoted: isDemoted,
      first_place: isFirstPlace,
    };
  });
}
