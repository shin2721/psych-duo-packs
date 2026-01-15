-- Pending Rewards Table
-- リーグ報酬をユーザーがclaimするまで保持

CREATE TABLE IF NOT EXISTS pending_rewards (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  week_id TEXT NOT NULL,
  league_id UUID REFERENCES leagues(id) ON DELETE SET NULL,
  gems INTEGER DEFAULT 0,
  badges JSONB DEFAULT '[]',  -- バッジIDの配列
  claimed BOOLEAN DEFAULT FALSE,
  claimed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE (user_id, week_id)  -- 冪等性確保（二重付与防止）
);

CREATE INDEX IF NOT EXISTS idx_pending_rewards_user ON pending_rewards(user_id, claimed);
CREATE INDEX IF NOT EXISTS idx_pending_rewards_week ON pending_rewards(week_id);

-- Row Level Security
ALTER TABLE pending_rewards ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own pending rewards"
  ON pending_rewards FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can claim own rewards"
  ON pending_rewards FOR UPDATE
  USING (auth.uid() = user_id);

-- Service role can insert (Edge Function用)
CREATE POLICY "Service role can insert rewards"
  ON pending_rewards FOR INSERT
  WITH CHECK (true);

-- 報酬claim関数（サーバー完結型）
-- Gems加算 + バッジ付与を全てサーバーで行う
CREATE OR REPLACE FUNCTION claim_league_reward(p_reward_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_reward pending_rewards%ROWTYPE;
  v_badge TEXT;
  v_new_gems INTEGER;
BEGIN
  -- 報酬を取得
  SELECT * INTO v_reward
  FROM pending_rewards
  WHERE id = p_reward_id
    AND user_id = auth.uid()
    AND claimed = FALSE;
  
  IF v_reward IS NULL THEN
    RETURN '{"success": false, "error": "Reward not found or already claimed"}'::JSONB;
  END IF;
  
  -- 1) 報酬をclaimedに更新
  UPDATE pending_rewards
  SET claimed = TRUE, claimed_at = NOW()
  WHERE id = p_reward_id;
  
  -- 2) profilesのgemsを加算
  UPDATE profiles
  SET gems = gems + v_reward.gems
  WHERE id = v_reward.user_id
  RETURNING gems INTO v_new_gems;
  
  -- 3) バッジをuser_badgesへupsert（badges_awarded収集）
  DECLARE
    v_awarded TEXT[] := ARRAY[]::TEXT[];
  BEGIN
    FOR v_badge IN SELECT jsonb_array_elements_text(v_reward.badges)
    LOOP
      INSERT INTO user_badges (user_id, badge_id, earned_at)
      VALUES (v_reward.user_id, v_badge, NOW())
      ON CONFLICT (user_id, badge_id) DO NOTHING;
      
      v_awarded := array_append(v_awarded, v_badge);
    END LOOP;

    RETURN jsonb_build_object(
      'success', true,
      'gems_added', v_reward.gems,
      'new_gems_balance', COALESCE(v_new_gems, 0),
      'badges_awarded', v_awarded
    );
  END;
END;
$$;
