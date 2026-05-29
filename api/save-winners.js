import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://kvdtuogpkpklnqmbcjvo.supabase.co';

// All possible column name variants we might use
const CANDIDATE_COLS = {
  top_scorer:       ['top_scorer'],
  mvp:              ['mvp'],
  young:            ['young', 'best_young', 'young_player'],
  goalkeeper:       ['goalkeeper', 'best_goalkeeper', 'gk'],
};

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const serviceKey = process.env.SUPABASE_SERVICE_KEY;
  if (!serviceKey) return res.status(500).json({ error: 'SUPABASE_SERVICE_KEY not set' });

  const { top_scorer, mvp, young, goalkeeper } = req.body || {};
  const sb = createClient(SUPABASE_URL, serviceKey, { auth: { persistSession: false } });

  // 1. Discover actual column names by reading existing row (if any)
  const { data: existingRows } = await sb.from('award_winners').select('*').limit(1);
  const existingRow = existingRows?.[0] || null;
  const actualCols = existingRow ? Object.keys(existingRow) : null;

  console.log('[save-winners] actual columns discovered:', actualCols);

  // 2. Build payload using discovered columns (or fall back to candidates)
  const resolve = (candidates, value) => {
    if (actualCols) {
      const match = candidates.find(c => actualCols.includes(c));
      return match ? { [match]: value || null } : {};
    }
    // No existing row — try each candidate until one works
    return { [candidates[0]]: value || null };
  };

  const payload = {
    ...resolve(CANDIDATE_COLS.top_scorer, top_scorer),
    ...resolve(CANDIDATE_COLS.mvp, mvp),
    ...resolve(CANDIDATE_COLS.young, young),
    ...resolve(CANDIDATE_COLS.goalkeeper, goalkeeper),
  };

  console.log('[save-winners] payload to write:', payload);

  // 3. Delete all rows then insert fresh
  const { error: delErr } = await sb
    .from('award_winners')
    .delete()
    .or('top_scorer.is.null,top_scorer.not.is.null');

  if (delErr) console.warn('[save-winners] delete warning:', delErr.message);

  const { error } = await sb.from('award_winners').insert(payload);

  if (error) {
    console.error('[save-winners] insert error:', error.message);
    // Return actual column names to help diagnose
    return res.status(500).json({
      step: 'insert',
      error: error.message,
      actual_columns: actualCols,
      payload_keys: Object.keys(payload),
    });
  }

  console.log('[save-winners] saved ok:', payload);
  res.status(200).json({ ok: true, columns_used: Object.keys(payload) });
}
