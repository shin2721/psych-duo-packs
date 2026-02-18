-- Align claim_league_reward badge insert column with user_badges schema.
-- user_badges uses `unlocked_at`, not `earned_at`.

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
  SELECT * INTO v_reward
  FROM pending_rewards
  WHERE id = p_reward_id
    AND user_id = auth.uid()
    AND claimed = FALSE;

  IF v_reward IS NULL THEN
    RETURN '{"success": false, "error": "Reward not found or already claimed"}'::JSONB;
  END IF;

  UPDATE pending_rewards
  SET claimed = TRUE, claimed_at = NOW()
  WHERE id = p_reward_id;

  UPDATE profiles
  SET gems = gems + v_reward.gems
  WHERE id = v_reward.user_id
  RETURNING gems INTO v_new_gems;

  DECLARE
    v_awarded TEXT[] := ARRAY[]::TEXT[];
  BEGIN
    FOR v_badge IN SELECT jsonb_array_elements_text(v_reward.badges)
    LOOP
      INSERT INTO user_badges (user_id, badge_id, unlocked_at)
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
