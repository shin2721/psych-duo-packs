export const LEAGUE_TIERS = {
  BRONZE: { id: 0, name: "ブロンズ", color: "#CD7F32", icon: "🥉" },
  SILVER: { id: 1, name: "シルバー", color: "#C0C0C0", icon: "🥈" },
  GOLD: { id: 2, name: "ゴールド", color: "#FFD700", icon: "🥇" },
  PLATINUM: { id: 3, name: "プラチナ", color: "#E5E4E2", icon: "💎" },
  DIAMOND: { id: 4, name: "ダイヤモンド", color: "#B9F2FF", icon: "💠" },
  MASTER: { id: 5, name: "マスター", color: "#9B59B6", icon: "👑" },
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
  promotion_zone: number;
  demotion_zone: number;
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

export interface LeagueRewardResult {
  user_id: string;
  gems: number;
  badges: string[];
  promoted: boolean;
  demoted: boolean;
  first_place: boolean;
}

export const LEAGUE_SIZE = 30;
export const PROMOTION_PERCENT = 0.2;
export const DEMOTION_PERCENT = 0.2;

const MIN_TIER = 0;
const MAX_TIER = 5;

export function clampTier(tier: number): number {
  return Math.max(MIN_TIER, Math.min(MAX_TIER, Math.floor(tier)));
}
