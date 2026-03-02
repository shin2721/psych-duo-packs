-- v1.41.x runtime compatibility hardening
-- - Restore/ensure profile columns required by app/runtime
-- - Keep plan and plan_id synchronized for backward compatibility
-- - Fix claim_league_reward dependency on profiles.gems
-- - Seed at least one current-week league row for membership runtime checks

BEGIN;

-- Ensure profiles has both legacy and current-plan columns
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS xp INTEGER DEFAULT 0;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS level INTEGER DEFAULT 1;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS streak INTEGER DEFAULT 0;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS gems INTEGER DEFAULT 50;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS plan_id TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS plan TEXT DEFAULT 'free';

-- Backfill columns safely
UPDATE public.profiles
SET
  xp = COALESCE(xp, 0),
  level = COALESCE(level, 1),
  streak = COALESCE(streak, 0),
  gems = COALESCE(gems, 50),
  plan_id = COALESCE(NULLIF(plan_id, ''), NULLIF(plan, ''), 'free'),
  plan = COALESCE(NULLIF(plan, ''), NULLIF(plan_id, ''), 'free');

ALTER TABLE public.profiles ALTER COLUMN xp SET DEFAULT 0;
ALTER TABLE public.profiles ALTER COLUMN level SET DEFAULT 1;
ALTER TABLE public.profiles ALTER COLUMN streak SET DEFAULT 0;
ALTER TABLE public.profiles ALTER COLUMN gems SET DEFAULT 50;
ALTER TABLE public.profiles ALTER COLUMN plan_id SET DEFAULT 'free';
ALTER TABLE public.profiles ALTER COLUMN plan SET DEFAULT 'free';

ALTER TABLE public.profiles ALTER COLUMN xp SET NOT NULL;
ALTER TABLE public.profiles ALTER COLUMN level SET NOT NULL;
ALTER TABLE public.profiles ALTER COLUMN streak SET NOT NULL;
ALTER TABLE public.profiles ALTER COLUMN gems SET NOT NULL;
ALTER TABLE public.profiles ALTER COLUMN plan_id SET NOT NULL;
ALTER TABLE public.profiles ALTER COLUMN plan SET NOT NULL;

-- Keep plan and plan_id consistent for mixed clients/functions.
CREATE OR REPLACE FUNCTION public.sync_profiles_plan_columns()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.plan_id := COALESCE(NULLIF(NEW.plan_id, ''), NULLIF(NEW.plan, ''), 'free');
  NEW.plan := NEW.plan_id;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_sync_profiles_plan_columns ON public.profiles;
CREATE TRIGGER trg_sync_profiles_plan_columns
BEFORE INSERT OR UPDATE ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.sync_profiles_plan_columns();

-- Ensure reward claim uses profile gems column robustly.
CREATE OR REPLACE FUNCTION public.claim_league_reward(p_reward_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_reward public.pending_rewards%ROWTYPE;
  v_badge TEXT;
  v_awarded TEXT[] := ARRAY[]::TEXT[];
  v_new_gems INTEGER := 0;
BEGIN
  SELECT * INTO v_reward
  FROM public.pending_rewards
  WHERE id = p_reward_id
    AND user_id = auth.uid()
    AND claimed = FALSE;

  IF v_reward IS NULL THEN
    RETURN '{"success": false, "error": "Reward not found or already claimed"}'::JSONB;
  END IF;

  UPDATE public.pending_rewards
  SET claimed = TRUE,
      claimed_at = NOW()
  WHERE id = p_reward_id;

  UPDATE public.profiles
  SET gems = COALESCE(gems, 0) + COALESCE(v_reward.gems, 0),
      updated_at = NOW()
  WHERE id = v_reward.user_id
  RETURNING gems INTO v_new_gems;

  FOR v_badge IN SELECT jsonb_array_elements_text(v_reward.badges)
  LOOP
    INSERT INTO public.user_badges (user_id, badge_id, unlocked_at)
    VALUES (v_reward.user_id, v_badge, NOW())
    ON CONFLICT (user_id, badge_id) DO NOTHING;

    v_awarded := array_append(v_awarded, v_badge);
  END LOOP;

  RETURN jsonb_build_object(
    'success', true,
    'gems_added', COALESCE(v_reward.gems, 0),
    'new_gems_balance', COALESCE(v_new_gems, 0),
    'badges_awarded', v_awarded
  );
END;
$$;

-- Seed at least one current-week league row so own/other membership RLS checks are executable.
INSERT INTO public.leagues (week_id, tier)
SELECT to_char(NOW(), 'IYYY-"W"IW'), 0
WHERE NOT EXISTS (
  SELECT 1 FROM public.leagues
  WHERE week_id = to_char(NOW(), 'IYYY-"W"IW')
    AND tier = 0
);

COMMIT;
