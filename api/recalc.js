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

async function sbFetch(path, method, body, serviceKey) {
  const r = await fetch(`${SUPABASE_URL}/rest/v1${path}`, {
    method,
    headers: {
      'apikey': serviceKey,
      'Authorization': `Bearer ${serviceKey}`,
      'Content-Type': 'application/json',
      'Prefer': method === 'POST' ? 'resolution=merge-duplicates,return=minimal' : 'return=minimal',
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!r.ok) {
    const text = await r.text();
    throw new Error(`${method} ${path} → ${r.status}: ${text}`);
  }
  return method === 'GET' ? r.json() : null;
}

export default async function handler(req, res) {
  const serviceKey = process.env.SUPABASE_SERVICE_KEY;
  if (!serviceKey) return res.status(500).json({ error: 'SUPABASE_SERVICE_KEY not set' });

  try {
    const allMats = await sbFetch('/matches?select=*&order=id', 'GET', null, serviceKey);
    const pts = calcMatchPts(allMats);
    const rows = Object.entries(pts).map(([team, p]) => ({ team, ...p }));
    if (!rows.length) return res.status(200).json({ ok: true, teams: 0 });

    // Upsert to results (service key bypasses RLS)
    await sbFetch('/results?on_conflict=team', 'POST', rows, serviceKey);
    res.status(200).json({ ok: true, teams: rows.length });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}
