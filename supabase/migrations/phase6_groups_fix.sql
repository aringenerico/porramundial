-- phase6_groups_fix.sql
-- Fix RLS recursion on group_members by wrapping checks in SECURITY DEFINER functions.
-- Idempotent — safe to re-run.

-- ─── DROP existing phase6 policies ───────────────────────────────────────────
DROP POLICY IF EXISTS "groups_select_member" ON groups;
DROP POLICY IF EXISTS "groups_select_admin"  ON groups;
DROP POLICY IF EXISTS "groups_insert_admin"  ON groups;
DROP POLICY IF EXISTS "groups_update_admin"  ON groups;
DROP POLICY IF EXISTS "groups_delete_admin"  ON groups;
DROP POLICY IF EXISTS "gm_select_member"     ON group_members;
DROP POLICY IF EXISTS "gm_select_admin"      ON group_members;
DROP POLICY IF EXISTS "gm_insert_admin"      ON group_members;
DROP POLICY IF EXISTS "gm_delete_admin"      ON group_members;

-- ─── HELPER FUNCTIONS (SECURITY DEFINER bypasses RLS, no recursion) ─────────
CREATE OR REPLACE FUNCTION is_app_admin() RETURNS BOOLEAN
LANGUAGE sql SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM admins WHERE user_id = auth.uid());
$$;

CREATE OR REPLACE FUNCTION is_group_member(p_group_id BIGINT) RETURNS BOOLEAN
LANGUAGE sql SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM group_members
    WHERE group_id = p_group_id AND user_id = auth.uid()
  );
$$;

-- ─── RLS: groups ─────────────────────────────────────────────────────────────
CREATE POLICY "groups_select_member" ON groups FOR SELECT
  USING (is_group_member(id));

CREATE POLICY "groups_select_admin" ON groups FOR SELECT
  USING (is_app_admin());

CREATE POLICY "groups_insert_admin" ON groups FOR INSERT
  WITH CHECK (is_app_admin());

CREATE POLICY "groups_update_admin" ON groups FOR UPDATE
  USING (is_app_admin()) WITH CHECK (is_app_admin());

CREATE POLICY "groups_delete_admin" ON groups FOR DELETE
  USING (is_app_admin());

-- ─── RLS: group_members ──────────────────────────────────────────────────────
CREATE POLICY "gm_select_member" ON group_members FOR SELECT
  USING (is_group_member(group_id));

CREATE POLICY "gm_select_admin" ON group_members FOR SELECT
  USING (is_app_admin());

CREATE POLICY "gm_insert_admin" ON group_members FOR INSERT
  WITH CHECK (is_app_admin());

CREATE POLICY "gm_delete_admin" ON group_members FOR DELETE
  USING (is_app_admin());
