-- phase6_groups.sql
-- Subgroup leaderboards. Run in Supabase SQL editor.

-- ─── TABLES ──────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS groups (
  id          BIGSERIAL PRIMARY KEY,
  name        TEXT NOT NULL UNIQUE,
  description TEXT,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE groups ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS group_members (
  group_id BIGINT REFERENCES groups(id) ON DELETE CASCADE,
  user_id  UUID   REFERENCES auth.users(id) ON DELETE CASCADE,
  added_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (group_id, user_id)
);
ALTER TABLE group_members ENABLE ROW LEVEL SECURITY;

-- ─── RLS: groups ─────────────────────────────────────────────────────────────
CREATE POLICY "groups_select_member" ON groups FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM group_members
    WHERE group_id = groups.id AND user_id = auth.uid()
  ));

CREATE POLICY "groups_select_admin" ON groups FOR SELECT
  USING (EXISTS (SELECT 1 FROM admins WHERE user_id = auth.uid()));

CREATE POLICY "groups_insert_admin" ON groups FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM admins WHERE user_id = auth.uid()));

CREATE POLICY "groups_update_admin" ON groups FOR UPDATE
  USING       (EXISTS (SELECT 1 FROM admins WHERE user_id = auth.uid()))
  WITH CHECK  (EXISTS (SELECT 1 FROM admins WHERE user_id = auth.uid()));

CREATE POLICY "groups_delete_admin" ON groups FOR DELETE
  USING (EXISTS (SELECT 1 FROM admins WHERE user_id = auth.uid()));

-- ─── RLS: group_members ──────────────────────────────────────────────────────
CREATE POLICY "gm_select_member" ON group_members FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM group_members gm2
    WHERE gm2.group_id = group_members.group_id AND gm2.user_id = auth.uid()
  ));

CREATE POLICY "gm_select_admin" ON group_members FOR SELECT
  USING (EXISTS (SELECT 1 FROM admins WHERE user_id = auth.uid()));

CREATE POLICY "gm_insert_admin" ON group_members FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM admins WHERE user_id = auth.uid()));

CREATE POLICY "gm_delete_admin" ON group_members FOR DELETE
  USING (EXISTS (SELECT 1 FROM admins WHERE user_id = auth.uid()));

-- Note: participants table is already publicly readable (phase3_rls.sql)
-- so the admin "add member" picker can fetch names directly. No extra policy needed.
