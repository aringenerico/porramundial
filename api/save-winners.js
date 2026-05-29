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

  // Find existing row (table is a single-row config)
  const { data: existing, error: selErr } = await sb
    .from('award_winners')
    .select('id')
    .limit(1)
    .maybeSingle();

  if (selErr) {
    console.error('[save-winners] select error:', selErr.message);
    return res.status(500).json({ step: 'select', error: selErr.message });
  }

  let error;
  if (existing?.id) {
    // Row exists — update it
    ({ error } = await sb.from('award_winners').update(payload).eq('id', existing.id));
    console.log('[save-winners] updated row id', existing.id);
  } else {
    // No row yet — insert
    ({ error } = await sb.from('award_winners').insert(payload));
    console.log('[save-winners] inserted new row');
  }

  if (error) {
    console.error('[save-winners] write error:', error.message);
    return res.status(500).json({ step: existing?.id ? 'update' : 'insert', error: error.message });
  }

  console.log('[save-winners] saved ok:', payload);
  res.status(200).json({ ok: true });
}
