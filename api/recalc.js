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

  const sb = createClient(SUPABASE_URL, serviceKey, { auth: { persistSession: false } });

  // 1. Read matches
  const { data: allMats, error: fetchErr } = await sb.from('matches').select('*').order('id');
  if (fetchErr) return res.status(500).json({ step: 'fetch_matches', error: fetchErr.message });

  console.log('[recalc] matches found:', allMats?.length ?? 0);

  const pts = calcMatchPts(allMats || []);
  const rows = Object.entries(pts).map(([team, p]) => ({ team, ...p }));

  console.log('[recalc] teams calculated:', rows.length, rows.map(r => `${r.team}:${Object.values(r).slice(1).reduce((a,b)=>a+b,0)}`));

  if (!rows.length) return res.status(200).json({ ok: true, teams: 0, matches: allMats?.length ?? 0 });

  // 2. Delete existing results and insert fresh (avoids constraint issues)
  const { error: delErr } = await sb.from('results').delete().neq('team', '__never__');
  if (delErr) console.warn('[recalc] delete warning:', delErr.message);

  const { error: insertErr } = await sb.from('results').insert(rows);
  if (insertErr) {
    console.error('[recalc] insert error:', insertErr.message);
    return res.status(500).json({ step: 'insert_results', error: insertErr.message });
  }

  console.log('[recalc] results saved ok:', rows.length, 'teams');
  res.status(200).json({ ok: true, teams: rows.length, matches: allMats?.length ?? 0 });
}
