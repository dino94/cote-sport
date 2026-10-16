/*
# Fix RLS policies for picks/analyses SELECT + auto-subscriber trigger

## Problems fixed
1. **picks/analyses SELECT policy**: `auth.role() = 'authenticated'` doesn't reliably
   distinguish anon vs authenticated in all client contexts. Replaced with
   `auth.uid() IS NOT NULL` which is the canonical Supabase way to check if a user
   is signed in.

2. **Auto-subscriber on signup**: The frontend was trying to insert into `subscribers`
   right after `signUp()`, but the new user's JWT at that point may not have the
   right claims, and RLS could block the insert. Replaced with a database trigger
   on `auth.users` that automatically inserts a row into `subscribers` whenever a
   new user is created. This is more reliable and works even if the frontend call
   fails.

## Changes
- Drop and recreate `select_picks` and `select_analyses` policies
- Create `handle_new_user()` trigger function
- Create trigger `on_auth_user_created` on `auth.users`
*/

-- ============================================================
-- 1. Fix picks SELECT policy
-- ============================================================
DROP POLICY IF EXISTS "select_picks" ON picks;

CREATE POLICY "select_picks" ON picks FOR SELECT
  TO anon, authenticated
  USING (
    auth.uid() IS NOT NULL
    OR id = public.get_latest_pick_id()
  );

-- ============================================================
-- 2. Fix analyses SELECT policy
-- ============================================================
DROP POLICY IF EXISTS "select_analyses" ON analyses;

CREATE POLICY "select_analyses" ON analyses FOR SELECT
  TO anon, authenticated
  USING (
    auth.uid() IS NOT NULL
    OR id = public.get_latest_analysis_id()
  );

-- ============================================================
-- 3. Auto-create subscriber on user signup
-- ============================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.subscribers (email, user_id, notify_picks)
  VALUES (NEW.email, NEW.id, true)
  ON CONFLICT (email) DO UPDATE
  SET user_id = EXCLUDED.user_id, notify_picks = true;
  RETURN NEW;
END;
$$;

-- Drop existing trigger if any, then create
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
