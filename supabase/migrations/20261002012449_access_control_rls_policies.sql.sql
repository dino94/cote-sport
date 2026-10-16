/*
# Access Control RLS Policies — Subscriber/Admin Model

## Goal
Restrict data visibility based on user role:
- **picks**: anon sees 1 row (latest), authenticated sees all
- **analyses**: anon sees 1 row (latest), authenticated sees all
- **results**: anon sees nothing, authenticated sees all
- **notifications**: already owner-scoped (authenticated, own rows only) — unchanged
- **subscribers**: admin-only access
- **admin write operations** (insert/update/delete on picks, analyses, results): admin role only

## Approach
1. Create a SECURITY DEFINER function `is_admin()` that checks `raw_app_meta_data->>'role' = 'admin'` in the user's JWT.
2. Replace SELECT policies:
   - picks/analyses: anon gets `LIMIT 1` via a SECURITY DEFINER helper function that returns only the latest row id
   - results: anon gets nothing, authenticated gets all
3. Replace write policies on picks/analyses/results: only `is_admin()` can insert/update/delete
4. Subscribers: only `is_admin()` can SELECT/UPDATE/DELETE; anon INSERT stays (for signup)

## Tables modified
- picks, analyses, results, subscribers (policy changes)
- New functions: is_admin(), get_latest_pick_id(), get_latest_analysis_id()
*/

-- ============================================================
-- 1. Helper: is_admin() — checks JWT raw_app_meta_data for admin role
-- ============================================================
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT coalesce(
    (auth.jwt() -> 'raw_app_meta_data' ->> 'role') = 'admin',
    false
  );
$$;

-- ============================================================
-- 2. Helper: get_latest_pick_id() — returns the UUID of the most recent pick
--    Used to allow anon to see exactly 1 pick
-- ============================================================
CREATE OR REPLACE FUNCTION public.get_latest_pick_id()
RETURNS uuid
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT id FROM public.picks ORDER BY created_at DESC LIMIT 1;
$$;

-- ============================================================
-- 3. Helper: get_latest_analysis_id() — returns the UUID of the most recent analysis
--    Used to allow anon to see exactly 1 analysis
-- ============================================================
CREATE OR REPLACE FUNCTION public.get_latest_analysis_id()
RETURNS uuid
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT id FROM public.analyses ORDER BY created_at DESC LIMIT 1;
$$;

-- ============================================================
-- 4. picks — RLS policies
-- ============================================================

-- DROP old policies
DROP POLICY IF EXISTS "anon_select_picks" ON picks;
DROP POLICY IF EXISTS "authenticated_delete_picks" ON picks;
DROP POLICY IF EXISTS "authenticated_insert_picks" ON picks;
DROP POLICY IF EXISTS "authenticated_update_picks" ON picks;

-- SELECT: anon sees only the latest pick; authenticated sees all
CREATE POLICY "select_picks" ON picks FOR SELECT
  TO anon, authenticated
  USING (
    auth.role() = 'authenticated'
    OR id = public.get_latest_pick_id()
  );

-- INSERT: admin only
CREATE POLICY "insert_picks_admin" ON picks FOR INSERT
  TO authenticated
  WITH CHECK (public.is_admin());

-- UPDATE: admin only
CREATE POLICY "update_picks_admin" ON picks FOR UPDATE
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- DELETE: admin only
CREATE POLICY "delete_picks_admin" ON picks FOR DELETE
  TO authenticated
  USING (public.is_admin());

-- ============================================================
-- 5. analyses — RLS policies
-- ============================================================

-- DROP old policies
DROP POLICY IF EXISTS "anon_select_analyses" ON analyses;
DROP POLICY IF EXISTS "authenticated_delete_analyses" ON analyses;
DROP POLICY IF EXISTS "authenticated_insert_analyses" ON analyses;
DROP POLICY IF EXISTS "authenticated_update_analyses" ON analyses;

-- SELECT: anon sees only the latest analysis; authenticated sees all
CREATE POLICY "select_analyses" ON analyses FOR SELECT
  TO anon, authenticated
  USING (
    auth.role() = 'authenticated'
    OR id = public.get_latest_analysis_id()
  );

-- INSERT: admin only
CREATE POLICY "insert_analyses_admin" ON analyses FOR INSERT
  TO authenticated
  WITH CHECK (public.is_admin());

-- UPDATE: admin only
CREATE POLICY "update_analyses_admin" ON analyses FOR UPDATE
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- DELETE: admin only
CREATE POLICY "delete_analyses_admin" ON analyses FOR DELETE
  TO authenticated
  USING (public.is_admin());

-- ============================================================
-- 6. results — RLS policies
-- ============================================================

-- DROP old policies
DROP POLICY IF EXISTS "anon_select_results" ON results;
DROP POLICY IF EXISTS "authenticated_delete_results" ON results;
DROP POLICY IF EXISTS "authenticated_insert_results" ON results;
DROP POLICY IF EXISTS "authenticated_update_results" ON results;

-- SELECT: anon sees nothing; authenticated sees all
CREATE POLICY "select_results" ON results FOR SELECT
  TO authenticated
  USING (true);

-- INSERT: admin only
CREATE POLICY "insert_results_admin" ON results FOR INSERT
  TO authenticated
  WITH CHECK (public.is_admin());

-- UPDATE: admin only
CREATE POLICY "update_results_admin" ON results FOR UPDATE
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- DELETE: admin only
CREATE POLICY "delete_results_admin" ON results FOR DELETE
  TO authenticated
  USING (public.is_admin());

-- ============================================================
-- 7. subscribers — RLS policies
-- ============================================================

-- DROP old policies (keep anon INSERT for signup)
DROP POLICY IF EXISTS "anon_insert_subscribers" ON subscribers;
DROP POLICY IF EXISTS "authenticated_select_own_subscribers" ON subscribers;
DROP POLICY IF EXISTS "authenticated_update_own_subscribers" ON subscribers;
DROP POLICY IF EXISTS "authenticated_delete_own_subscribers" ON subscribers;

-- INSERT: anon can insert (for signup); admin can insert too
CREATE POLICY "insert_subscribers" ON subscribers FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- SELECT: admin only
CREATE POLICY "select_subscribers_admin" ON subscribers FOR SELECT
  TO authenticated
  USING (public.is_admin());

-- UPDATE: admin only
CREATE POLICY "update_subscribers_admin" ON subscribers FOR UPDATE
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- DELETE: admin only
CREATE POLICY "delete_subscribers_admin" ON subscribers FOR DELETE
  TO authenticated
  USING (public.is_admin());

-- ============================================================
-- 8. notifications — already owner-scoped, add admin INSERT
-- ============================================================
-- Allow admin to insert notifications (for notify-subscribers edge function)
CREATE POLICY "insert_notifications_admin" ON notifications FOR INSERT
  TO authenticated
  WITH CHECK (public.is_admin());
