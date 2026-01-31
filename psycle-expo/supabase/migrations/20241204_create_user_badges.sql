-- Create user_badges table
CREATE TABLE IF NOT EXISTS user_badges (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  badge_id TEXT NOT NULL,
  unlocked_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, badge_id)
);

-- Enable RLS
ALTER TABLE user_badges ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own badges"
  ON user_badges FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own badges"
  ON user_badges FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Index for faster queries
CREATE INDEX idx_user_badges_user_id ON user_badges(user_id);
