// Supabase Edge Function: settle-league-week
// 週末にCronで呼び出し、リーグの順位確定・昇格降格・報酬付与を行う

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const PROMOTION_PERCENT = 0.2;  // 上位20%昇格
const DEMOTION_PERCENT = 0.2;   // 下位20%降格

// リーグ報酬定義
const LEAGUE_REWARDS = {
    promotion: {
        1: { gems: 25, badge: 'league_silver' },
        2: { gems: 50, badge: 'league_gold' },
        3: { gems: 75, badge: 'league_platinum' },
        4: { gems: 100, badge: 'league_diamond' },
        5: { gems: 150, badge: 'league_master' },
    } as Record<number, { gems: number; badge: string }>,
    firstPlace: { gems: 50, badge: 'league_first_place' },
    participation: { gems: 10 },
};

interface LeagueMember {
    id: string;
    user_id: string;
    weekly_xp: number;
    league_id: string;
}

interface League {
    id: string;
    week_id: string;
    tier: number;
}

Deno.serve(async (req) => {
    try {
        const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
        const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
        const supabase = createClient(supabaseUrl, supabaseServiceKey);

        // 先週のweek_idを取得（サーバーが唯一の真実）
        const { data: lastWeekId, error: weekError } = await supabase.rpc('get_last_week_id');
        if (weekError) throw weekError;

        console.log(`[settle-league-week] Processing LAST week: ${lastWeekId}`);

        // 先週のすべてのリーグを取得
        const { data: leagues, error: leaguesError } = await supabase
            .from('leagues')
            .select('id, week_id, tier')
            .eq('week_id', lastWeekId);

        if (leaguesError) throw leaguesError;
        if (!leagues || leagues.length === 0) {
            return new Response(JSON.stringify({ message: 'No leagues to process' }), {
                headers: { 'Content-Type': 'application/json' },
            });
        }

        let totalProcessed = 0;
        let totalPromoted = 0;
        let totalDemoted = 0;

        // 各リーグを処理
        for (const league of leagues as League[]) {
            // リーグメンバーを取得（XP降順）
            const { data: members, error: membersError } = await supabase
                .from('league_members')
                .select('id, user_id, weekly_xp, league_id')
                .eq('league_id', league.id)
                .order('weekly_xp', { ascending: false });

            if (membersError) {
                console.error(`[settle-league-week] Error fetching members for league ${league.id}:`, membersError);
                continue;
            }

            if (!members || members.length === 0) continue;

            const total = members.length;
            const promotionCount = Math.ceil(total * PROMOTION_PERCENT);
            const demotionStart = total - Math.floor(total * DEMOTION_PERCENT);

            // 各メンバーの順位確定と報酬計算
            for (let i = 0; i < members.length; i++) {
                const member = members[i] as LeagueMember;
                const rank = i + 1;
                const isPromoted = rank <= promotionCount && league.tier < 5;
                const isDemoted = rank >= demotionStart && league.tier > 0;
                const isFirstPlace = rank === 1;

                // 報酬計算
                let gems = LEAGUE_REWARDS.participation.gems;
                const badges: string[] = [];

                if (isPromoted) {
                    const newTier = league.tier + 1;
                    const reward = LEAGUE_REWARDS.promotion[newTier];
                    if (reward) {
                        gems += reward.gems;
                        badges.push(reward.badge);
                    }
                    totalPromoted++;
                }

                if (isFirstPlace) {
                    gems += LEAGUE_REWARDS.firstPlace.gems;
                    badges.push(LEAGUE_REWARDS.firstPlace.badge);
                }

                if (isDemoted) {
                    totalDemoted++;
                }

                // league_membersを更新（順位・昇格・降格フラグ）
                await supabase
                    .from('league_members')
                    .update({
                        final_rank: rank,
                        promoted: isPromoted,
                        demoted: isDemoted,
                    })
                    .eq('id', member.id);

                // 報酬を付与（pending_rewardsテーブルにupsert）
                // ユーザーがclaimするまで保留（儐等性確保）
                await supabase
                    .from('pending_rewards')
                    .upsert({
                        user_id: member.user_id,
                        week_id: lastWeekId,
                        league_id: league.id,
                        gems,
                        badges,
                        claimed: false,
                    }, { onConflict: 'user_id,week_id' });

                totalProcessed++;
            }
        }

        const result = {
            message: 'League week settled',
            week_id: lastWeekId,
            leagues_processed: leagues.length,
            members_processed: totalProcessed,
            promoted: totalPromoted,
            demoted: totalDemoted,
        };

        console.log('[settle-league-week] Result:', result);

        return new Response(JSON.stringify(result), {
            headers: { 'Content-Type': 'application/json' },
        });
    } catch (error) {
        console.error('[settle-league-week] Error:', error);
        return new Response(JSON.stringify({ error: error.message }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' },
        });
    }
});
