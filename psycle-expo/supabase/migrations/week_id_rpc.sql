-- Week ID RPC: サーバーが唯一の真実（JST基準）
-- クライアント/Edge Function両方がこれを参照する

-- 現在の週IDを取得（JST基準）
CREATE OR REPLACE FUNCTION get_current_week_id()
RETURNS TEXT
LANGUAGE sql
STABLE
AS $$
  SELECT to_char(NOW() AT TIME ZONE 'Asia/Tokyo', 'IYYY-"W"IW');
$$;

-- 先週の週IDを取得（週末締め用, JST基準）
CREATE OR REPLACE FUNCTION get_last_week_id()
RETURNS TEXT
LANGUAGE sql
STABLE
AS $$
  SELECT to_char((NOW() AT TIME ZONE 'Asia/Tokyo') - INTERVAL '7 days', 'IYYY-"W"IW');
$$;

-- add_weekly_xpを更新（get_current_week_idを使う）
CREATE OR REPLACE FUNCTION add_weekly_xp(p_user_id UUID, p_xp INTEGER)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_week_id TEXT := get_current_week_id();
BEGIN
  UPDATE league_members
  SET weekly_xp = weekly_xp + p_xp
  WHERE user_id = p_user_id
    AND league_id IN (
      SELECT id FROM leagues WHERE week_id = v_week_id
    );
END;
$$;
