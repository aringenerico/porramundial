-- ============================================================
-- Phase 3 — Security: admins table + RLS
-- Run once in Supabase SQL editor (project kvdtuogpkpklnqmbcjvo)
-- ============================================================

-- 1. admins table -----------------------------------------
CREATE TABLE IF NOT EXISTS admins (
  user_id    uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE admins ENABLE ROW LEVEL SECURITY;

-- Users can only read their own row (prevents enumeration)
CREATE POLICY "admins_select_own" ON admins
  FOR SELECT USING (auth.uid() = user_id);

-- No INSERT policy: only postgres / service_role can add admins
-- (use Supabase Table Editor or run the INSERT below manually)


-- 2. matches ----------------------------------------------
ALTER TABLE matches ENABLE ROW LEVEL SECURITY;

CREATE POLICY "matches_select_public" ON matches
  FOR SELECT USING (true);

CREATE POLICY "matches_insert_admin" ON matches
  FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM admins WHERE user_id = auth.uid()));

CREATE POLICY "matches_update_admin" ON matches
  FOR UPDATE TO authenticated
  USING  (EXISTS (SELECT 1 FROM admins WHERE user_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM admins WHERE user_id = auth.uid()));

CREATE POLICY "matches_delete_admin" ON matches
  FOR DELETE TO authenticated
  USING  (EXISTS (SELECT 1 FROM admins WHERE user_id = auth.uid()));


-- 3. results ----------------------------------------------
-- Writes happen only via api/recalc.js (service_role bypasses RLS)
ALTER TABLE results ENABLE ROW LEVEL SECURITY;

CREATE POLICY "results_select_public" ON results
  FOR SELECT USING (true);


-- 4. participants -----------------------------------------
ALTER TABLE participants ENABLE ROW LEVEL SECURITY;

CREATE POLICY "participants_select_public" ON participants
  FOR SELECT USING (true);

CREATE POLICY "participants_insert_own" ON participants
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "participants_update_own" ON participants
  FOR UPDATE TO authenticated
  USING  (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);


-- 5. award_winners ----------------------------------------
-- Writes happen only via api/save-winners.js (service_role bypasses RLS)
ALTER TABLE award_winners ENABLE ROW LEVEL SECURITY;

CREATE POLICY "award_winners_select_public" ON award_winners
  FOR SELECT USING (true);


-- ============================================================
-- LAST STEP: add your admin user
-- Find your UUID in Supabase dashboard → Authentication → Users
-- Uncomment and run:
-- INSERT INTO admins (user_id) VALUES ('<YOUR-USER-UUID>');
-- ============================================================
