/**
 * リーグ報酬claim関数
 * 
 * 週明けにpending_rewardsをチェックしてclaimする
 */

import { supabase } from './supabase';

export interface PendingReward {
    id: string;
    week_id: string;
    gems: number;
    badges: string[];
    claimed: boolean;
}

export interface LeagueResult {
    hasReward: boolean;
    reward: PendingReward | null;
    finalRank: number | null;
    promoted: boolean;
    demoted: boolean;
    newTier: number | null;
}

/**
 * 未claimのリーグ報酬を取得
 */
export async function getPendingReward(userId: string): Promise<PendingReward | null> {
    try {
        const { data, error } = await supabase
            .from('pending_rewards')
            .select('id, week_id, gems, badges, claimed')
            .eq('user_id', userId)
            .eq('claimed', false)
            .order('created_at', { ascending: false })
            .limit(1)
            .single();

        if (error || !data) return null;

        return {
            id: data.id,
            week_id: data.week_id,
            gems: data.gems,
            badges: data.badges || [],
            claimed: data.claimed,
        };
    } catch (e) {
        console.error('[Reward] Error fetching pending reward:', e);
        return null;
    }
}

/**
 * 報酬をclaim
 */
export async function claimReward(rewardId: string): Promise<{ gemsAdded: number; newBalance: number; badgesAwarded: string[] } | null> {
    try {
        const { data, error } = await supabase.rpc('claim_league_reward', {
            p_reward_id: rewardId,
        });

        if (error) {
            console.error('[Reward] Claim error:', error);
            return null;
        }

        if (data?.success) {
            return {
                gemsAdded: data.gems_added,
                newBalance: data.new_gems_balance,
                badgesAwarded: data.badges_awarded || [],
            };
        }

        return null;
    } catch (e) {
        console.error('[Reward] Error claiming reward:', e);
        return null;
    }
}

/**
 * 前週のリーグ結果を取得
 */
export async function getLastWeekResult(userId: string): Promise<LeagueResult> {
    try {
        // 前週のIDをサーバーから取得（唯一の真実）
        const { data: lastWeekId, error: weekError } = await supabase.rpc('get_last_week_id');
        if (weekError) throw weekError;

        // リーグ結果を取得
        const { data, error } = await supabase
            .from('league_members')
            .select(`
                final_rank,
                promoted,
                demoted,
                leagues!inner(week_id, tier)
            `)
            .eq('user_id', userId)
            .eq('leagues.week_id', lastWeekId)
            .single();

        if (error || !data) {
            return { hasReward: false, reward: null, finalRank: null, promoted: false, demoted: false, newTier: null };
        }

        const reward = await getPendingReward(userId);
        const tier = (data as any).leagues?.tier ?? 0;

        return {
            hasReward: reward !== null,
            reward,
            finalRank: data.final_rank,
            promoted: data.promoted,
            demoted: data.demoted,
            newTier: data.promoted ? tier + 1 : data.demoted ? tier - 1 : tier,
        };
    } catch (e) {
        console.error('[Reward] Error getting last week result:', e);
        return { hasReward: false, reward: null, finalRank: null, promoted: false, demoted: false, newTier: null };
    }
}
