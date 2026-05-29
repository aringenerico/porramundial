import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://kvdtuogpkpklnqmbcjvo.supabase.co';

// Known category keys used in this app
const CATEGORIES = ['top_scorer', 'mvp', 'young', 'goalkeeper'];

// Possible names for the "winner name" column (besides 'category')
const SKIP_COLS = new Set(['category', 'id', 'created_at', 'updated_at']);

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const serviceKey = process.env.SUPABASE_SERVICE_KEY;
  if (!serviceKey) return res.status(500).json({ error: 'SUPABASE_SERVICE_KEY not set' });

  const { top_scorer, mvp, young, goalkeeper } = req.body || {};
  const sb = createClient(SUPABASE_URL, serviceKey, { auth: { persistSession: false } });

  // 1. Discover winner column name from existing rows
  let winnerCol = null;
  const { data: existingRows } = await sb.from('award_winners').select('*').limit(4);
  if (existingRows?.length) {
    const cols = Object.keys(existingRows[0]);
    winnerCol = cols.find(c => !SKIP_COLS.has(c)) || null;
  }

  console.log('[save-winners] existing rows:', existingRows);
  console.log('[save-winners] winner column detected:', winnerCol);

  // 2. If no existing rows, try candidate column names one by one
  if (!winnerCol) {
    const candidates = ['winner', 'player', 'player_name', 'name', 'value', 'player_value'];
    for (const col of candidates) {
      const { error: testErr } = await sb.from('award_winners')
        .insert({ category: '_test_', [col]: '_test_' });
      if (!testErr) {
        // Success — col is the right name. Clean up the test row.
        winnerCol = col;
        await sb.from('award_winners').delete()
          .eq('category', '_test_');
        break;
      }
      if (!testErr?.message?.includes('column')) {
        // Non-column error (constraint etc.) — col might be right, keep trying
      }
    }
  }

  if (!winnerCol) {
    return res.status(500).json({
      error: 'Could not determine winner column name. Please check award_winners table schema.',
      existing_columns: existingRows?.length ? Object.keys(existingRows[0]) : 'table is empty',
    });
  }

  // 3. Delete all existing rows
  const { error: delErr } = await sb.from('award_winners')
    .delete()
    .or('category.is.null,category.not.is.null');
  if (delErr) console.warn('[save-winners] delete warning:', delErr.message);

  // 4. Insert one row per category (skip null/empty values)
  const values = { top_scorer, mvp, young, goalkeeper };
  const rows = CATEGORIES
    .filter(cat => values[cat])
    .map(cat => ({ category: cat, [winnerCol]: values[cat] }));

  if (rows.length) {
    const { error } = await sb.from('award_winners').insert(rows);
    if (error) {
      console.error('[save-winners] insert error:', error.message);
      return res.status(500).json({ step: 'insert', error: error.message, winner_col: winnerCol });
    }
  }

  console.log('[save-winners] saved ok, winner_col:', winnerCol, 'rows:', rows);
  res.status(200).json({ ok: true, winner_col: winnerCol, rows_saved: rows.length });
}
