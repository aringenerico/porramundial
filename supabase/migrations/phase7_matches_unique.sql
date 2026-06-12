-- phase7_matches_unique.sql
-- Fix API sync: the upsert in handleSync uses
--   ON CONFLICT (home_team, away_team, round_col)
-- but no such unique constraint exists yet. Without it, every upsert
-- errors with "no unique or exclusion constraint matching" and the
-- API match never lands in the table.
--
-- Idempotent — safe to re-run.

-- Drop any prior version of the constraint, then create it cleanly.
ALTER TABLE matches DROP CONSTRAINT IF EXISTS matches_home_away_round_key;

ALTER TABLE matches
  ADD CONSTRAINT matches_home_away_round_key
  UNIQUE (home_team, away_team, round_col);
