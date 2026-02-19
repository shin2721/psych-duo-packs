-- Re-apply leaderboard uniqueness fix with a unique migration version.
-- This is intentionally idempotent in case a prior migration version was skipped.

DELETE FROM leaderboard
WHERE user_id IS NULL;

WITH ranked AS (
  SELECT
    id,
    ROW_NUMBER() OVER (
      PARTITION BY user_id
      ORDER BY updated_at DESC NULLS LAST, id DESC
    ) AS rn
  FROM leaderboard
)
DELETE FROM leaderboard l
USING ranked r
WHERE l.id = r.id
  AND r.rn > 1;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'leaderboard_user_id_key'
  ) THEN
    ALTER TABLE leaderboard
      ADD CONSTRAINT leaderboard_user_id_key UNIQUE (user_id);
  END IF;
END
$$;

