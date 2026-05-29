import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://kvdtuogpkpklnqmbcjvo.supabase.co';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const serviceKey = process.env.SUPABASE_SERVICE_KEY;
  if (!serviceKey) return res.status(500).json({ error: 'SUPABASE_SERVICE_KEY not set' });

  const { top_scorer, mvp, young, goalkeeper } = req.body || {};
  const payload = {
    top_scorer: top_scorer || null,
    mvp:        mvp        || null,
    young:      young      || null,
    goalkeeper: goalkeeper || null,
  };

  const sb = createClient(SUPABASE_URL, serviceKey, { auth: { persistSession: false } });

  // Delete all rows — OR condition matches every row regardless of nulls
  const { error: delErr } = await sb
    .from('award_winners')
    .delete()
    .or('top_scorer.is.null,top_scorer.not.is.null');

  if (delErr) console.warn('[save-winners] delete warning:', delErr.message);

  // Insert fresh row
  const { error } = await sb.from('award_winners').insert(payload);

  if (error) {
    console.error('[save-winners] insert error:', error.message);
    return res.status(500).json({ step: 'insert', error: error.message });
  }

  console.log('[save-winners] saved ok:', payload);
  res.status(200).json({ ok: true });
}
