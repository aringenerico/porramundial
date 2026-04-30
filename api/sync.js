export default async function handler(req, res) {
  try {
    const r = await fetch(
      'https://api.football-data.org/v4/competitions/WC/matches?season=2026',
      { headers: { 'X-Auth-Token': process.env.FD_KEY } }
    );
    if (!r.ok) return res.status(r.status).json({ error: `API error: ${r.status}` });
    const data = await r.json();
    res.status(200).json(data);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}
