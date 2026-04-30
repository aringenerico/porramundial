export default async function handler(req, res) {
  try {
    const r = await fetch(
      'https://api.football-data.org/v4/competitions/WC/matches?season=2026',
      { headers: { 'X-Auth-Token': process.env.FD_KEY } }
    );
    const data = await r.json();
    if (!r.ok) return res.status(r.status).json({ error: data?.message || `API error: ${r.status}`, raw: data });
    res.status(200).json(data);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}

