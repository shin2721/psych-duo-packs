-- Bootstrap previously non-timestamp social/league/reward schema so Supabase CLI can apply it.
-- This migration is idempotent and safe to rerun across environments.

-- Leaderboard table for global and friend rankings
CREATE TABLE IF NOT EXISTS public.leaderboard (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  username TEXT NOT NULL,
  total_xp INTEGER NOT NULL DEFAULT 0,
  current_streak INTEGER NOT NULL DEFAULT 0,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_leaderboard_xp ON public.leaderboard(total_xp DESC);
CREATE INDEX IF NOT EXISTS idx_leaderboard_streak ON public.leaderboard(current_streak DESC);
CREATE UNIQUE INDEX IF NOT EXISTS idx_leaderboard_user_unique ON public.leaderboard(user_id);

ALTER TABLE public.leaderboard ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Leaderboard is publicly readable" ON public.leaderboard;
DROP POLICY IF EXISTS "Users can update own leaderboard entry" ON public.leaderboard;
DROP POLICY IF EXISTS "Users can insert own leaderboard entry" ON public.leaderboard;

CREATE POLICY "Leaderboard is publicly readable"
  ON public.leaderboard FOR SELECT
  USING (true);

CREATE POLICY "Users can update own leaderboard entry"
  ON public.leaderboard FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own leaderboard entry"
  ON public.leaderboard FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Friendships table for friend system
CREATE TABLE IF NOT EXISTS public.friendships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  friend_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, friend_id)
);

CREATE INDEX IF NOT EXISTS idx_friendships_user ON public.friendships(user_id);
CREATE INDEX IF NOT EXISTS idx_friendships_friend ON public.friendships(friend_id);

ALTER TABLE public.friendships ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view their friendships" ON public.friendships;
DROP POLICY IF EXISTS "Users can create friendships" ON public.friendships;
DROP POLICY IF EXISTS "Users can delete their friendships" ON public.friendships;

CREATE POLICY "Users can view their friendships"
  ON public.friendships FOR SELECT
  USING (auth.uid() = user_id OR auth.uid() = friend_id);

CREATE POLICY "Users can create friendships"
  ON public.friendships FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their friendships"
  ON public.friendships FOR DELETE
  USING (auth.uid() = user_id);

-- Friend requests table
CREATE TABLE IF NOT EXISTS public.friend_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  from_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  to_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(from_user_id, to_user_id),
  CONSTRAINT friend_requests_status_check CHECK (status IN ('pending', 'accepted', 'rejected'))
);

CREATE INDEX IF NOT EXISTS idx_friend_requests_to_user ON public.friend_requests(to_user_id, status);
CREATE INDEX IF NOT EXISTS idx_friend_requests_from_user ON public.friend_requests(from_user_id);

ALTER TABLE public.friend_requests ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view their friend requests" ON public.friend_requests;
DROP POLICY IF EXISTS "Users can send friend requests" ON public.friend_requests;
DROP POLICY IF EXISTS "Users can update requests sent to them" ON public.friend_requests;
DROP POLICY IF EXISTS "Users can delete their own requests" ON public.friend_requests;

CREATE POLICY "Users can view their friend requests"
  ON public.friend_requests FOR SELECT
  USING (auth.uid() = to_user_id OR auth.uid() = from_user_id);

CREATE POLICY "Users can send friend requests"
  ON public.friend_requests FOR INSERT
  WITH CHECK (auth.uid() = from_user_id);

CREATE POLICY "Users can update requests sent to them"
  ON public.friend_requests FOR UPDATE
  USING (auth.uid() = to_user_id);

CREATE POLICY "Users can delete their own requests"
  ON public.friend_requests FOR DELETE
  USING (auth.uid() = from_user_id OR auth.uid() = to_user_id);

-- Streak history table for calendar visualization
CREATE TABLE IF NOT EXISTS public.streak_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  lessons_completed INTEGER NOT NULL DEFAULT 0,
  xp_earned INTEGER NOT NULL DEFAULT 0,
  UNIQUE(user_id, date)
);

CREATE INDEX IF NOT EXISTS idx_streak_history_user_date ON public.streak_history(user_id, date DESC);

ALTER TABLE public.streak_history ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view own streak history" ON public.streak_history;
DROP POLICY IF EXISTS "Users can insert own streak history" ON public.streak_history;
DROP POLICY IF EXISTS "Users can update own streak history" ON public.streak_history;

CREATE POLICY "Users can view own streak history"
  ON public.streak_history FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own streak history"
  ON public.streak_history FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own streak history"
  ON public.streak_history FOR UPDATE
  USING (auth.uid() = user_id);

-- Weekly leagues
CREATE TABLE IF NOT EXISTS public.leagues (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  week_id TEXT NOT NULL,
  tier INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_leagues_week ON public.leagues(week_id);
CREATE INDEX IF NOT EXISTS idx_leagues_week_tier ON public.leagues(week_id, tier);

CREATE TABLE IF NOT EXISTS public.league_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  league_id UUID NOT NULL REFERENCES public.leagues(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  weekly_xp INTEGER NOT NULL DEFAULT 0,
  final_rank INTEGER DEFAULT NULL,
  promoted BOOLEAN NOT NULL DEFAULT FALSE,
  demoted BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(league_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_league_members_league ON public.league_members(league_id);
CREATE INDEX IF NOT EXISTS idx_league_members_user ON public.league_members(user_id);
CREATE INDEX IF NOT EXISTS idx_league_members_xp ON public.league_members(league_id, weekly_xp DESC);

ALTER TABLE public.leagues ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.league_members ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Leagues are publicly readable" ON public.leagues;
DROP POLICY IF EXISTS "League members are publicly readable" ON public.league_members;
DROP POLICY IF EXISTS "Users can update own league member XP" ON public.league_members;
DROP POLICY IF EXISTS "Users can insert own league membership" ON public.league_members;

CREATE POLICY "Leagues are publicly readable"
  ON public.leagues FOR SELECT
  USING (true);

CREATE POLICY "League members are publicly readable"
  ON public.league_members FOR SELECT
  USING (true);

CREATE POLICY "Users can update own league member XP"
  ON public.league_members FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own league membership"
  ON public.league_members FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Week ID RPCs (Asia/Tokyo baseline)
CREATE OR REPLACE FUNCTION public.get_current_week_id()
RETURNS TEXT
LANGUAGE sql
STABLE
AS $$
  SELECT to_char(NOW() AT TIME ZONE 'Asia/Tokyo', 'IYYY-"W"IW');
$$;

CREATE OR REPLACE FUNCTION public.get_last_week_id()
RETURNS TEXT
LANGUAGE sql
STABLE
AS $$
  SELECT to_char((NOW() AT TIME ZONE 'Asia/Tokyo') - INTERVAL '7 days', 'IYYY-"W"IW');
$$;

CREATE OR REPLACE FUNCTION public.add_weekly_xp(p_user_id UUID, p_xp INTEGER)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_week_id TEXT := public.get_current_week_id();
BEGIN
  UPDATE public.league_members
  SET weekly_xp = weekly_xp + p_xp
  WHERE user_id = p_user_id
    AND league_id IN (
      SELECT id FROM public.leagues WHERE week_id = v_week_id
    );
END;
$$;

-- Pending rewards and claim RPC
CREATE TABLE IF NOT EXISTS public.pending_rewards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  week_id TEXT NOT NULL,
  league_id UUID REFERENCES public.leagues(id) ON DELETE SET NULL,
  gems INTEGER NOT NULL DEFAULT 0,
  badges JSONB NOT NULL DEFAULT '[]',
  claimed BOOLEAN NOT NULL DEFAULT FALSE,
  claimed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, week_id)
);

CREATE INDEX IF NOT EXISTS idx_pending_rewards_user ON public.pending_rewards(user_id, claimed);
CREATE INDEX IF NOT EXISTS idx_pending_rewards_week ON public.pending_rewards(week_id);

ALTER TABLE public.pending_rewards ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view own pending rewards" ON public.pending_rewards;
DROP POLICY IF EXISTS "Users can claim own rewards" ON public.pending_rewards;
DROP POLICY IF EXISTS "Service role can insert rewards" ON public.pending_rewards;

CREATE POLICY "Users can view own pending rewards"
  ON public.pending_rewards FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can claim own rewards"
  ON public.pending_rewards FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Service role can insert rewards"
  ON public.pending_rewards FOR INSERT
  WITH CHECK (true);

CREATE OR REPLACE FUNCTION public.claim_league_reward(p_reward_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_reward public.pending_rewards%ROWTYPE;
  v_badge TEXT;
  v_new_gems INTEGER;
  v_awarded TEXT[] := ARRAY[]::TEXT[];
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
  SET claimed = TRUE, claimed_at = NOW()
  WHERE id = p_reward_id;

  UPDATE public.profiles
  SET gems = gems + v_reward.gems
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
    'gems_added', v_reward.gems,
    'new_gems_balance', COALESCE(v_new_gems, 0),
    'badges_awarded', v_awarded
  );
END;
$$;
