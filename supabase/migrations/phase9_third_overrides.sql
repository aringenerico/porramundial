-- phase9_third_overrides.sql
-- Admin override for "best 3rd-placed team" slot assignments in R32.
-- Greedy auto-assign is just a hint; FIFA's actual table may differ, so the
-- admin can override which 3rd-placed team plays in which 3_XXXXX slot.
-- Idempotent — safe to re-run.

CREATE TABLE IF NOT EXISTS r32_third_overrides (
  slot     TEXT PRIMARY KEY,           -- e.g. '3_ABCDF', '3_CDFGH', ...
  team     TEXT NOT NULL,              -- selected team name
  set_at   TIMESTAMPTZ DEFAULT NOW(),
  set_by   UUID REFERENCES auth.users(id) ON DELETE SET NULL
);
ALTER TABLE r32_third_overrides ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "r32o_select_all"    ON r32_third_overrides;
DROP POLICY IF EXISTS "r32o_upsert_admin"  ON r32_third_overrides;
DROP POLICY IF EXISTS "r32o_update_admin"  ON r32_third_overrides;
DROP POLICY IF EXISTS "r32o_delete_admin"  ON r32_third_overrides;

CREATE POLICY "r32o_select_all" ON r32_third_overrides FOR SELECT USING (true);
CREATE POLICY "r32o_upsert_admin" ON r32_third_overrides FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM admins WHERE user_id = auth.uid()));
CREATE POLICY "r32o_update_admin" ON r32_third_overrides FOR UPDATE
  USING (EXISTS (SELECT 1 FROM admins WHERE user_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM admins WHERE user_id = auth.uid()));
CREATE POLICY "r32o_delete_admin" ON r32_third_overrides FOR DELETE
  USING (EXISTS (SELECT 1 FROM admins WHERE user_id = auth.uid()));
