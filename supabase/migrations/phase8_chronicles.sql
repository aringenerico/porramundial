-- phase8_chronicles.sql
-- "La Crónica": post-round recap with reactions and comments,
-- adapted for porramundial (team-pick scoring model).
-- Idempotent — safe to re-run.

-- ─── 1. Tables ───────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS chronicles (
  id           BIGSERIAL PRIMARY KEY,
  round_col    TEXT NOT NULL UNIQUE,        -- 'j1','j2','j3','r32','r16','qf','sf','final','3rd'
  title        TEXT NOT NULL,               -- 'La Crónica · Jornada 1'
  headlines    JSONB NOT NULL,              -- [{ type, emoji, text }, ...]
  generated_at TIMESTAMPTZ DEFAULT NOW(),
  generated_by UUID REFERENCES auth.users(id) ON DELETE SET NULL
);
ALTER TABLE chronicles ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS chronicle_reactions (
  chronicle_id BIGINT REFERENCES chronicles(id) ON DELETE CASCADE,
  user_id      UUID   REFERENCES auth.users(id) ON DELETE CASCADE,
  emoji        TEXT NOT NULL CHECK (emoji IN ('👏','😂','🔥','💀')),
  PRIMARY KEY (chronicle_id, user_id, emoji)
);
ALTER TABLE chronicle_reactions ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS chronicle_comments (
  id           BIGSERIAL PRIMARY KEY,
  chronicle_id BIGINT REFERENCES chronicles(id) ON DELETE CASCADE,
  user_id      UUID   REFERENCES auth.users(id) ON DELETE CASCADE,
  text         TEXT NOT NULL CHECK (length(text) BETWEEN 1 AND 280),
  created_at   TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE chronicle_comments ENABLE ROW LEVEL SECURITY;

-- ─── 2. RLS: chronicles ──────────────────────────────────────────────────────
DROP POLICY IF EXISTS "chr_select_all"    ON chronicles;
DROP POLICY IF EXISTS "chr_insert_admin"  ON chronicles;
DROP POLICY IF EXISTS "chr_update_admin"  ON chronicles;
DROP POLICY IF EXISTS "chr_delete_admin"  ON chronicles;

CREATE POLICY "chr_select_all"   ON chronicles FOR SELECT USING (true);
CREATE POLICY "chr_insert_admin" ON chronicles FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM admins WHERE user_id = auth.uid()));
CREATE POLICY "chr_update_admin" ON chronicles FOR UPDATE
  USING (EXISTS (SELECT 1 FROM admins WHERE user_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM admins WHERE user_id = auth.uid()));
CREATE POLICY "chr_delete_admin" ON chronicles FOR DELETE
  USING (EXISTS (SELECT 1 FROM admins WHERE user_id = auth.uid()));

-- ─── 3. RLS: reactions ───────────────────────────────────────────────────────
DROP POLICY IF EXISTS "cr_select_all"  ON chronicle_reactions;
DROP POLICY IF EXISTS "cr_insert_own"  ON chronicle_reactions;
DROP POLICY IF EXISTS "cr_delete_own"  ON chronicle_reactions;

CREATE POLICY "cr_select_all"  ON chronicle_reactions FOR SELECT USING (true);
CREATE POLICY "cr_insert_own"  ON chronicle_reactions FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);
CREATE POLICY "cr_delete_own"  ON chronicle_reactions FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

-- ─── 4. RLS: comments ────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "cc_select_all"  ON chronicle_comments;
DROP POLICY IF EXISTS "cc_insert_own"  ON chronicle_comments;
DROP POLICY IF EXISTS "cc_delete_own"  ON chronicle_comments;

CREATE POLICY "cc_select_all"  ON chronicle_comments FOR SELECT USING (true);
CREATE POLICY "cc_insert_own"  ON chronicle_comments FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);
CREATE POLICY "cc_delete_own"  ON chronicle_comments FOR DELETE TO authenticated
  USING (auth.uid() = user_id);
