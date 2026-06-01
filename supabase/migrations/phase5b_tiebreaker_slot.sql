-- ============================================================
-- Phase 5b — Tiebreaker predictions (slot-based, no match_id FK)
-- Replaces phase5_tiebreaker.sql
-- Run in Supabase SQL editor (project kvdtuogpkpklnqmbcjvo)
-- ============================================================

-- Drop old table if it exists (safe: no data yet)
DROP TABLE IF EXISTS tiebreaker_predictions;

CREATE TABLE tiebreaker_predictions (
  id          BIGSERIAL PRIMARY KEY,
  user_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  slot        TEXT NOT NULL CHECK (slot IN ('sf_1','sf_2','final')),
  home_goals  INT  NOT NULL CHECK (home_goals >= 0),
  away_goals  INT  NOT NULL CHECK (away_goals >= 0),
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (user_id, slot)
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
