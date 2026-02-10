-- Remove legacy one-off pack purchase table.
-- Psycle now uses subscription-only monetization.

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM pg_publication p
    JOIN pg_publication_rel pr ON pr.prpubid = p.oid
    JOIN pg_class c ON c.oid = pr.prrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE p.pubname = 'supabase_realtime'
      AND n.nspname = 'public'
      AND c.relname = 'purchased_packs'
  ) THEN
    EXECUTE 'ALTER PUBLICATION supabase_realtime DROP TABLE public.purchased_packs';
  END IF;
END $$;

DROP TABLE IF EXISTS public.purchased_packs;
