-- ============================================================
-- Phase 5 — Tiebreaker predictions
-- Run once in Supabase SQL editor (project kvdtuogpkpklnqmbcjvo)
-- ============================================================

CREATE TABLE IF NOT EXISTS tiebreaker_predictions (
  id          BIGSERIAL PRIMARY KEY,
  user_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  match_id    INT  NOT NULL REFERENCES matches(id)   ON DELETE CASCADE,
  home_goals  INT  NOT NULL CHECK (home_goals >= 0),
  away_goals  INT  NOT NULL CHECK (away_goals >= 0),
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (user_id, match_id)
);

ALTER TABLE tiebreaker_predictions ENABLE ROW LEVEL SECURITY;

-- Anyone can read (leaderboard tiebreaker computation)
CREATE POLICY "tb_select_public" ON tiebreaker_predictions
  FOR SELECT USING (true);

-- Users can only insert their own rows
CREATE POLICY "tb_insert_own" ON tiebreaker_predictions
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Users can only update their own rows
CREATE POLICY "tb_update_own" ON tiebreaker_predictions
  FOR UPDATE TO authenticated
  USING  (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
