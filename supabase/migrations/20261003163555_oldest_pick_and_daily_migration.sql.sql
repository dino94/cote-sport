/*
# Oldest pick for visitors + daily picks-to-results migration

## Changes
1. Create `get_oldest_pick_id()` — non-registered visitors see the oldest pick.
2. Update `select_picks` policy to use oldest instead of latest.
3. Create `migrate_picks_to_results()` function — picks older than 24h without a
   matching result row get an "En cours" result entry.
4. Schedule a daily cron job at 02:00 UTC.
*/

-- ============================================================
-- 1. get_oldest_pick_id()
-- ============================================================
CREATE OR REPLACE FUNCTION public.get_oldest_pick_id()
RETURNS uuid
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT id FROM public.picks ORDER BY created_at ASC LIMIT 1;
$$;

DROP POLICY IF EXISTS "select_picks" ON picks;
CREATE POLICY "select_picks" ON picks FOR SELECT
  TO anon, authenticated
  USING (
    auth.uid() IS NOT NULL
    OR id = public.get_oldest_pick_id()
  );

-- ============================================================
-- 2. migrate_picks_to_results()
-- ============================================================
CREATE OR REPLACE FUNCTION public.migrate_picks_to_results()
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  migrated_count integer;
BEGIN
  INSERT INTO public.results (match_name, league, bet, cote, result, profit, date, created_at)
  SELECT
    p.match_name,
    p.league,
    p.bet_type || ' — ' || p.bet,
    p.cote,
    'En cours',
    0,
    p.created_at::date,
    now()
  FROM public.picks p
  WHERE p.created_at < now() - interval '24 hours'
    AND NOT EXISTS (
      SELECT 1 FROM public.results r
      WHERE r.match_name = p.match_name
        AND r.league = p.league
        AND r.date = p.created_at::date
    );

  GET DIAGNOSTICS migrated_count = ROW_COUNT;

  RETURN json_build_object(
    'migrated', migrated_count,
    'timestamp', now()
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_oldest_pick_id() TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.migrate_picks_to_results() TO anon, authenticated;

-- ============================================================
-- 3. Schedule daily migration at 02:00 UTC
-- ============================================================
SELECT cron.schedule(
  'migrate-old-picks-to-results',
  '0 2 * * *',
  $$SELECT public.migrate_picks_to_results();$$
);
