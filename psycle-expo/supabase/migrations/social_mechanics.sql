-- Leaderboard table for global and friend rankings
CREATE TABLE IF NOT EXISTS leaderboard (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  username TEXT NOT NULL,
  total_xp INTEGER DEFAULT 0,
  current_streak INTEGER DEFAULT 0,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for fast ranking queries
CREATE INDEX IF NOT EXISTS idx_leaderboard_xp ON leaderboard(total_xp DESC);
CREATE INDEX IF NOT EXISTS idx_leaderboard_streak ON leaderboard(current_streak DESC);
CREATE INDEX IF NOT EXISTS idx_leaderboard_user ON leaderboard(user_id);

-- Friendships table for friend system
CREATE TABLE IF NOT EXISTS friendships (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  friend_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, friend_id)
);

CREATE INDEX IF NOT EXISTS idx_friendships_user ON friendships(user_id);
CREATE INDEX IF NOT EXISTS idx_friendships_friend ON friendships(friend_id);

-- Streak history table for calendar visualization
CREATE TABLE IF NOT EXISTS streak_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  lessons_completed INTEGER DEFAULT 0,
  xp_earned INTEGER DEFAULT 0,
  UNIQUE(user_id, date)
);

CREATE INDEX IF NOT EXISTS idx_streak_history_user_date ON streak_history(user_id, date DESC);

-- Row Level Security (RLS) Policies

-- Leaderboard: Everyone can read, only owner can update
ALTER TABLE leaderboard ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Leaderboard is publicly readable"
  ON leaderboard FOR SELECT
  USING (true);

CREATE POLICY "Users can update own leaderboard entry"
  ON leaderboard FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own leaderboard entry"
  ON leaderboard FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Friendships: Users can manage their own friendships
ALTER TABLE friendships ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their friendships"
  ON friendships FOR SELECT
  USING (auth.uid() = user_id OR auth.uid() = friend_id);

CREATE POLICY "Users can create friendships"
  ON friendships FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their friendships"
  ON friendships FOR DELETE
  USING (auth.uid() = user_id);

-- Streak history: Users can only access their own history
ALTER TABLE streak_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own streak history"
  ON streak_history FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own streak history"
  ON streak_history FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own streak history"
  ON streak_history FOR UPDATE
  USING (auth.uid() = user_id);
