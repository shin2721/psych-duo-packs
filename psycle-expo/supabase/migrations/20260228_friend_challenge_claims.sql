-- Friend challenge reward claim ledger
-- 週次チャレンジ報酬のclaimをサーバー側で冪等管理する

CREATE TABLE IF NOT EXISTS friend_challenge_claims (
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  week_id TEXT NOT NULL,
  opponent_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  reward_gems INTEGER NOT NULL,
  claimed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  PRIMARY KEY (user_id, week_id)
);

CREATE INDEX IF NOT EXISTS idx_friend_challenge_claims_week
  ON friend_challenge_claims(week_id);

ALTER TABLE friend_challenge_claims ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own friend challenge claims"
  ON friend_challenge_claims FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own friend challenge claims"
  ON friend_challenge_claims FOR INSERT
  WITH CHECK (auth.uid() = user_id);
