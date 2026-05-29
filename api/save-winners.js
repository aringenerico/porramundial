import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://kvdtuogpkpklnqmbcjvo.supabase.co';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const serviceKey = process.env.SUPABASE_SERVICE_KEY;
  if (!serviceKey) return res.status(500).json({ error: 'SUPABASE_SERVICE_KEY not set' });

  const { top_scorer, mvp, young, goalkeeper } = req.body || {};
  const sb = createClient(SUPABASE_URL, serviceKey, { auth: { persistSession: false } });

  // Upsert into row id=1 (single-row config table, bypasses RLS via service key)
  const { error } = await sb.from('award_winners').upsert(
    { id:1, top_scorer:top_scorer||null, mvp:mvp||null, young:young||null, goalkeeper:goalkeeper||null },
    { onConflict: 'id' }
  );

  if (error) {
    console.error('[save-winners] error:', error.message);
    return res.status(500).json({ error: error.message });
  }

  console.log('[save-winners] saved ok:', { top_scorer, mvp, young, goalkeeper });
  res.status(200).json({ ok: true });
}
