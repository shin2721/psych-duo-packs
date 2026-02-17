-- Normalize leaderboard rows to one row per user_id, then enforce uniqueness.
-- Guarded so environments that skipped legacy non-timestamp migrations do not fail.
DO $migration$
BEGIN
  IF to_regclass('public.leaderboard') IS NULL THEN
    RAISE NOTICE 'Skipping leaderboard dedupe: leaderboard table is missing.';
    RETURN;
  END IF;

  -- Remove malformed rows.
  DELETE FROM leaderboard
  WHERE user_id IS NULL;

  -- Keep the newest row per user_id.
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

  -- Replace non-unique helper index with unique index for ON CONFLICT(user_id).
  DROP INDEX IF EXISTS idx_leaderboard_user;
  CREATE UNIQUE INDEX IF NOT EXISTS idx_leaderboard_user_unique ON leaderboard(user_id);
END;
$migration$;
