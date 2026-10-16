/*
# Fix migrate_picks_to_results: cast cote text to numeric

## Problem
The `picks.cote` column is `text` but `results.cote` is `numeric`.
The INSERT failed with a type mismatch error.

## Fix
Cast `p.cote::numeric` in the INSERT SELECT.
*/

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
    p.cote::numeric,
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
