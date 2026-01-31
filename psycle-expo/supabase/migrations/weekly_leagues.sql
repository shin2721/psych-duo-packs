-- Weekly League System (Duolingo-style)
-- 週次・30人前後・昇格/降格

-- リーグティア定義（Bronze=0, Silver=1, Gold=2, ... ）
-- テーブル不要：アプリ側のenum

-- Leagueグループ（30人前後のグループ）
CREATE TABLE IF NOT EXISTS leagues (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  week_id TEXT NOT NULL,        -- 週ID (例: '2026-W02')
  tier INTEGER DEFAULT 0,       -- 0=Bronze, 1=Silver, 2=Gold, ...
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_leagues_week ON leagues(week_id);
CREATE INDEX IF NOT EXISTS idx_leagues_week_tier ON leagues(week_id, tier);

-- リーグメンバーシップ（ユーザーが週ごとにどのリーグに所属するか）
CREATE TABLE IF NOT EXISTS league_members (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  league_id UUID REFERENCES leagues(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  weekly_xp INTEGER DEFAULT 0,      -- その週のXP
  final_rank INTEGER DEFAULT NULL,  -- 週終了時の最終順位
  promoted BOOLEAN DEFAULT FALSE,   -- 昇格したか
  demoted BOOLEAN DEFAULT FALSE,    -- 降格したか
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(league_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_league_members_league ON league_members(league_id);
CREATE INDEX IF NOT EXISTS idx_league_members_user ON league_members(user_id);
CREATE INDEX IF NOT EXISTS idx_league_members_xp ON league_members(league_id, weekly_xp DESC);

-- Row Level Security
ALTER TABLE leagues ENABLE ROW LEVEL SECURITY;
ALTER TABLE league_members ENABLE ROW LEVEL SECURITY;

-- Leaguesは読み取り可能
CREATE POLICY "Leagues are publicly readable"
  ON leagues FOR SELECT
  USING (true);

-- League membersは読み取り可能、自分のXPのみ更新可能
CREATE POLICY "League members are publicly readable"
  ON league_members FOR SELECT
  USING (true);

CREATE POLICY "Users can update own league member XP"
  ON league_members FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own league membership"
  ON league_members FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- 週次XP加算関数（アプリからXP加算時に呼ぶ）
CREATE OR REPLACE FUNCTION add_weekly_xp(p_user_id UUID, p_xp INTEGER)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE league_members
  SET weekly_xp = weekly_xp + p_xp
  WHERE user_id = p_user_id
  AND league_id IN (
    SELECT id FROM leagues
    WHERE week_id = to_char(NOW(), 'IYYY-"W"IW')
  );
END;
$$;
