-- phase10_went_to_et.sql
-- Extra-time flag for knockout matches.
--
-- Rule: if a match is level after 90', it counts as a draw for
-- result-points (1-1) even if one side later scores in extra time
-- and wins outright. Goals scored (including in ET) still count
-- individually; only the win/draw bonus is affected. Matches decided
-- on penalties were already handled correctly (score stays level,
-- penalty_winner picks who advances) — this flag only covers the
-- "won in extra time without a shootout" case, which previously had
-- no way to be recorded and was scored as a normal 3-0 win.
--
-- Idempotent — safe to re-run.

ALTER TABLE matches ADD COLUMN IF NOT EXISTS went_to_et boolean NOT NULL DEFAULT false;
