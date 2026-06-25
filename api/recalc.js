import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://kvdtuogpkpklnqmbcjvo.supabase.co';

// Tournament groups A-L — mirrors TOURNEY_GROUPS in App.jsx
const TOURNEY_GROUPS = {
  A:['Mexico','South Africa','South Korea','Czech Republic'],
  B:['Canada','Bosnia and Herzegovina','Qatar','Switzerland'],
  C:['Brazil','Morocco','Haiti','Scotland'],
  D:['United States','Paraguay','Australia','Turkey'],
  E:['Germany','Curacao','Ivory Coast','Ecuador'],
  F:['Netherlands','Japan','Sweden','Tunisia'],
  G:['Belgium','Egypt','Iran','New Zealand'],
  H:['Spain','Cape Verde','Saudi Arabia','Uruguay'],
  I:['France','Senegal','Iraq','Norway'],
  J:['Argentina','Algeria','Austria','Jordan'],
  K:['Portugal','DR Congo','Uzbekistan','Colombia'],
  L:['England','Croatia','Ghana','Panama'],
};

// Returns sorted standings for a group. Each entry: { team, pts, gf, ga, gd, played }
function groupStandings(teams, allMats) {
  const s = {};
  teams.forEach(t => { s[t] = { pts:0, gf:0, ga:0, gd:0, played:0 }; });
  allMats.filter(m =>
    ['j1','j2','j3'].includes(m.round_col) &&
    teams.includes(m.home_team) && teams.includes(m.away_team) &&
    m.home_goals != null && m.away_goals != null
  ).forEach(m => {
    const hg = m.home_goals, ag = m.away_goals;
    s[m.home_team].gf += hg; s[m.home_team].ga += ag; s[m.home_team].played++;
    s[m.away_team].gf += ag; s[m.away_team].ga += hg; s[m.away_team].played++;
    if (hg > ag) s[m.home_team].pts += 3;
    else if (hg < ag) s[m.away_team].pts += 3;
    else { s[m.home_team].pts++; s[m.away_team].pts++; }
  });
  teams.forEach(t => { s[t].gd = s[t].gf - s[t].ga; });
  return teams.map(t => ({ team:t, ...s[t] }))
    .sort((a,b) => b.pts-a.pts || b.gd-a.gd || b.gf-a.gf);
}

function calcMatchPts(allMats) {
  const blank = () => ({ j1:0, j2:0, j3:0, r32:0, r16:0, qf:0, sf:0, final:0 });
  const pts = {};

  // --- Per-match points ---
  for (const m of allMats) {
    const home = m.home_team, away = m.away_team;
    const hg = m.home_goals ?? 0, ag = m.away_goals ?? 0;
    const col = m.round_col;
    if (!col) continue;
    if (!pts[home]) pts[home] = blank();
    if (!pts[away]) pts[away] = blank();
    // Goals
    pts[home][col] += hg; pts[away][col] += ag;
    // Win/draw
    if (hg > ag) pts[home][col] += 3;
    else if (hg < ag) pts[away][col] += 3;
    else { pts[home][col] += 1; pts[away][col] += 1; }
    // Knockout advance bonus (+6 per round, both teams just for reaching it)
    if (!['j1','j2','j3'].includes(col)) { pts[home][col] += 6; pts[away][col] += 6; }
    // Champion bonus (+6 for winning the final)
    if (col === 'final') {
      const w = hg > ag ? home : hg < ag ? away : (m.penalty_winner || home);
      pts[w][col] += 6;
    }
  }

  // --- Group stage qualification bonus: +6 to j3 for teams advancing ---
  // Applied only once all 6 matches of a group are recorded.
  const thirds = [];
  for (const [, teams] of Object.entries(TOURNEY_GROUPS)) {
    const st = groupStandings(teams, allMats);
    if (!st.every(r => r.played === 3)) continue; // group not fully played yet
    // 1st and 2nd place qualify automatically
    for (const team of [st[0].team, st[1].team]) {
      if (!pts[team]) pts[team] = blank();
      pts[team].j3 += 6;
    }
    thirds.push(st[2]); // collect 3rd-place teams for best-8 ranking
  }
  // Best 8 of the 3rd-place teams also qualify — but ONLY once every group is
  // fully finished. Otherwise the intermediate ranking is meaningless (a third
  // could lose the bonus later when more groups finish), which produces
  // confusing points swings during the group stage.
  const allGroupsDone = Object.entries(TOURNEY_GROUPS).every(([, teams]) =>
    groupStandings(teams, allMats).every(r => r.played === 3)
  );
  if (allGroupsDone) {
    thirds
      .sort((a,b) => b.pts-a.pts || b.gd-a.gd || b.gf-a.gf)
      .slice(0, 8)
      .forEach(t => {
        if (!pts[t.team]) pts[t.team] = blank();
        pts[t.team].j3 += 6;
      });
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
