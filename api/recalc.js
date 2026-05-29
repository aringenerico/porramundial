import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://kvdtuogpkpklnqmbcjvo.supabase.co';

function calcMatchPts(allMats) {
  const blank = () => ({ j1:0, j2:0, j3:0, r32:0, r16:0, qf:0, sf:0, final:0 });
  const pts = {};
  for (const m of allMats) {
    const home = m.home_team, away = m.away_team;
    const hg = m.home_goals ?? 0, ag = m.away_goals ?? 0;
    const col = m.round_col;
    if (!col) continue;
    if (!pts[home]) pts[home] = blank();
    if (!pts[away]) pts[away] = blank();
    pts[home][col] += hg; pts[away][col] += ag;
    if (hg > ag) pts[home][col] += 3;
    else if (hg < ag) pts[away][col] += 3;
    else { pts[home][col] += 1; pts[away][col] += 1; }
    if (!['j1','j2','j3'].includes(col)) { pts[home][col] += 6; pts[away][col] += 6; }
    if (col === 'final') { const w = hg >= ag ? home : away; pts[w][col] += 10; }
  }
  return pts;
}

export default async function handler(req, res) {
  const serviceKey = process.env.SUPABASE_SERVICE_KEY;
  if (!serviceKey) return res.status(500).json({ error: 'SUPABASE_SERVICE_KEY not set' });

  const sb = createClient(SUPABASE_URL, serviceKey, {
    auth: { persistSession: false },
  });

  const { data: allMats, error: fetchErr } = await sb.from('matches').select('*').order('id');
  if (fetchErr) return res.status(500).json({ error: 'fetch matches: ' + fetchErr.message });

  const pts = calcMatchPts(allMats || []);
  const rows = Object.entries(pts).map(([team, p]) => ({ team, ...p }));

  if (!rows.length) return res.status(200).json({ ok: true, teams: 0 });

  const { error: upsertErr } = await sb.from('results').upsert(rows, { onConflict: 'team' });
  if (upsertErr) return res.status(500).json({ error: 'upsert results: ' + upsertErr.message });

  res.status(200).json({ ok: true, teams: rows.length });
}
