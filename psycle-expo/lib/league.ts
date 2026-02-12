/**
 * Weekly League System (Duolingo-style)
 * 
 * 週次・30人前後・昇格/降格
 * North Star: 「勝てる確率」を配る
 */

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
    promotion_zone: number;  // 上位N人が昇格
    demotion_zone: number;   // 下位N人が降格
}

export type LeagueBoundaryMode = "promotion_chase" | "demotion_risk";

export interface LeagueBoundaryStatus {
    mode: LeagueBoundaryMode;
    myRank: number;
    promotionZone: number;
    demotionZone: number;
    weeklyXp: number;
    xpGap: number;
    weekId: string;
    tier: number;
}

// 定数
const LEAGUE_SIZE = 30;          // リーグあたりの人数
const PROMOTION_PERCENT = 0.2;   // 上位20%昇格
const DEMOTION_PERCENT = 0.2;    // 下位20%降格

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

        const myRank = rankedMembers.find(m => m.is_self)?.rank || 0;
        const memberCount = rankedMembers.length;
        const promotionZone = Math.ceil(memberCount * PROMOTION_PERCENT);
        const demotionZone = memberCount - Math.floor(memberCount * DEMOTION_PERCENT) + 1;

        // ティア情報を取得
        const tierInfo = Object.values(LEAGUE_TIERS).find(t => t.id === tier) || LEAGUE_TIERS.BRONZE;

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
 * リーグ境界カード用の表示ステータスを算出
 */
export function computeLeagueBoundaryStatus(
    league: LeagueInfo,
    userId: string
): LeagueBoundaryStatus | null {
    if (!league || !Array.isArray(league.members) || league.members.length === 0) return null;

    const membersByRank = [...league.members].sort((a, b) => a.rank - b.rank);
    const me = membersByRank.find((m) => m.user_id === userId);
    if (!me) return null;

    const myRank = me.rank;
    const myWeeklyXp = me.weekly_xp || 0;
    const promotionZone = league.promotion_zone;
    const demotionZone = league.demotion_zone;

    // 昇格圏内ならカード非表示
    if (myRank <= promotionZone) return null;

    if (myRank >= demotionZone) {
        const safeRank = Math.max(1, demotionZone - 1);
        const safeMember = membersByRank[safeRank - 1];
        if (!safeMember) return null;

        return {
            mode: "demotion_risk",
            myRank,
            promotionZone,
            demotionZone,
            weeklyXp: myWeeklyXp,
            xpGap: Math.max(0, (safeMember.weekly_xp || 0) - myWeeklyXp + 1),
            weekId: league.week_id,
            tier: league.tier,
        };
    }

    const targetRank = Math.max(1, promotionZone);
    const targetMember = membersByRank[targetRank - 1];
    if (!targetMember) return null;

    return {
        mode: "promotion_chase",
        myRank,
        promotionZone,
        demotionZone,
        weeklyXp: myWeeklyXp,
        xpGap: Math.max(0, (targetMember.weekly_xp || 0) - myWeeklyXp + 1),
        weekId: league.week_id,
        tier: league.tier,
    };
}

export async function getLeagueBoundaryStatus(userId: string): Promise<LeagueBoundaryStatus | null> {
    const league = await getMyLeague(userId);
    if (!league) return null;
    return computeLeagueBoundaryStatus(league, userId);
}

/**
 * ユーザーをリーグに参加させる（初回 or 週初め）
 * 通常はEdge Functionで自動実行するが、オンデマンドでも可
 */
export async function joinLeague(userId: string, tier: number = 0): Promise<string | null> {
    const weekId = await getCurrentWeekId();

    try {
        // 既存のリーグ参加をチェック
        const { data: existing } = await supabase
            .from('league_members')
            .select('league_id, leagues!inner(week_id)')
            .eq('user_id', userId)
            .eq('leagues.week_id', weekId)
            .single();

        if (existing) {
            return existing.league_id;
        }

        // 空きがあるリーグを探す
        const { data: leagues } = await supabase
            .from('leagues')
            .select('id, league_members(count)')
            .eq('week_id', weekId)
            .eq('tier', tier);

        let targetLeagueId: string | null = null;

        if (leagues && leagues.length > 0) {
            // 空きがあるリーグを探す
            for (const league of leagues) {
                const memberCount = (league as any).league_members?.[0]?.count || 0;
                if (memberCount < LEAGUE_SIZE) {
                    targetLeagueId = league.id;
                    break;
                }
            }
        }

        // 空きがなければ新規リーグ作成
        if (!targetLeagueId) {
            const { data: newLeague, error: createError } = await supabase
                .from('leagues')
                .insert({ week_id: weekId, tier })
                .select('id')
                .single();

            if (createError) throw createError;
            targetLeagueId = newLeague.id;
        }

        // リーグに参加
        const { error: joinError } = await supabase
            .from('league_members')
            .insert({
                league_id: targetLeagueId,
                user_id: userId,
                weekly_xp: 0,
            });

        if (joinError) throw joinError;

        console.log(`[League] User ${userId} joined league ${targetLeagueId}`);
        return targetLeagueId;
    } catch (e) {
        console.error('[League] Error joining league:', e);
        return null;
    }
}

export function calculatePromotionDemotion(members: LeagueMember[]): {
    promoted: string[];  // user_id[]
    demoted: string[];   // user_id[]
} {
    const sorted = [...members].sort((a, b) => b.weekly_xp - a.weekly_xp);
    const total = sorted.length;
    const promotionCount = Math.ceil(total * PROMOTION_PERCENT);
    const demotionStart = total - Math.floor(total * DEMOTION_PERCENT);

    return {
        promoted: sorted.slice(0, promotionCount).map(m => m.user_id),
        demoted: sorted.slice(demotionStart).map(m => m.user_id),
    };
}

// リーグ報酬定義
export const LEAGUE_REWARDS = {
    // 昇格報酬（ティアごとのGems）
    promotion: {
        1: { gems: 25, badge: 'league_silver' },     // Bronze → Silver
        2: { gems: 50, badge: 'league_gold' },       // Silver → Gold
        3: { gems: 75, badge: 'league_platinum' },   // Gold → Platinum
        4: { gems: 100, badge: 'league_diamond' },   // Platinum → Diamond
        5: { gems: 150, badge: 'league_master' },    // Diamond → Master
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
    badges: string[];  // 獲得したバッジID
    promoted: boolean;
    demoted: boolean;
    first_place: boolean;
}

export function calculateRewards(
    members: LeagueMember[],
    currentTier: number
): LeagueRewardResult[] {
    const { promoted, demoted } = calculatePromotionDemotion(members);
    const sorted = [...members].sort((a, b) => b.weekly_xp - a.weekly_xp);
    const firstPlaceUserId = sorted[0]?.user_id;

    return members.map(member => {
        const isPromoted = promoted.includes(member.user_id);
        const isDemoted = demoted.includes(member.user_id);
        const isFirstPlace = member.user_id === firstPlaceUserId;

        let gems = LEAGUE_REWARDS.participation.gems;  // 参加報酬
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
