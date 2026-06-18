export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();

  const supabaseUrl = 'https://qpkpvtsoxiqcrkztkagn.supabase.co';
  const supabaseKey = process.env.SUPABASE_SERVICE_KEY;
  const apiKey = process.env.ANTHROPIC_API_KEY;
  const serpApiKey = process.env.SERP_API_KEY;

  // ── GET — fetch latest pulse ──────────────────────────────────────────
  if (req.method === 'GET') {
    try {
      const r = await fetch(`${supabaseUrl}/rest/v1/market_pulse?order=created_at.desc&limit=1`, {
        headers: { 'apikey': supabaseKey, 'Authorization': `Bearer ${supabaseKey}` }
      });
      const data = await r.json();
      if (!data.length) return res.status(200).json({ pulse: null });
      return res.status(200).json({ pulse: data[0] });
    } catch(e) {
      return res.status(500).json({ error: e.message });
    }
  }

  // ── POST — generate or publish pulse ────────────────────────────────────
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  // Publish mode — save pre-generated pulse to Supabase
  if (req.body?.publish && req.body?.pulse) {
    try {
      const pulse = req.body.pulse;
      pulse.generatedAt = new Date().toISOString();
      await fetch(`${supabaseUrl}/rest/v1/market_pulse`, {
        method: 'POST',
        headers: { 'apikey': supabaseKey, 'Authorization': `Bearer ${supabaseKey}`, 'Content-Type': 'application/json', 'Prefer': 'return=minimal' },
        body: JSON.stringify({ data: pulse, created_at: new Date().toISOString() })
      });
      return res.status(200).json({ success: true });
    } catch(e) {
      return res.status(500).json({ error: e.message });
    }
  }
  if (!apiKey) return res.status(500).json({ error: 'API key not configured' });

  const today = new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
  const weekOf = new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });

  // Fetch trending signals
  const signals = [];

  try {
    const r = await fetch(`https://serpapi.com/search.json?engine=amazon&amazon_domain=amazon.co.uk&type=movers_and_shakers&api_key=${serpApiKey}`, { signal: AbortSignal.timeout(5000) });
    if (r.ok) {
      const d = await r.json();
      const items = (d?.movers_and_shakers || []).slice(0, 12).map(i => ({ title: i?.title, rank: i?.rank, pct: i?.percentage })).filter(i => i.title);
      if (items.length) signals.push({ source: 'Amazon UK Movers & Shakers', items });
    }
  } catch(e) {}

  try {
    const r = await fetch('https://trends.google.com/trends/api/dailytrends?hl=en-GB&tz=-60&geo=GB&ns=15', { headers: { 'User-Agent': 'Mozilla/5.0' }, signal: AbortSignal.timeout(5000) });
    if (r.ok) {
      const raw = await r.text();
      const json = JSON.parse(raw.replace(/^\)\]\}'/, '').trim());
      const searches = (json?.default?.trendingSearchesDays?.[0]?.trendingSearches || []).slice(0, 10).map(s => s?.title?.query).filter(Boolean);
      if (searches.length) signals.push({ source: 'UK Google Trends', items: searches });
    }
  } catch(e) {}

  try {
    const r = await fetch(`https://serpapi.com/search.json?engine=google&q=tiktok+shop+uk+trending+products+${new Date().getFullYear()}&gl=gb&hl=en&api_key=${serpApiKey}&num=5`, { signal: AbortSignal.timeout(5000) });
    if (r.ok) {
      const d = await r.json();
      const snippets = (d?.organic_results || []).slice(0, 3).map(r => r?.snippet).filter(Boolean);
      if (snippets.length) signals.push({ source: 'TikTok UK Signals', items: snippets });
    }
  } catch(e) {}

  // Generate pulse with Haiku
  const prompt = `You are Hub, a UK ecommerce researcher. Today: ${today}.

LIVE UK MARKET DATA:
${signals.map(s => s.source + ': ' + JSON.stringify(s.items)).join('\n')}

Return ONLY a valid JSON object. No markdown. No trailing commas.

{"weekOf":"w/c ${weekOf}","hubIntro":"2-3 sentences, first person, honest market read","weeklyTheme":"one sentence on the dominant trend this week","hubSignOff":"1-2 sentences on what members should do","opportunities":[{"title":"string","emoji":"string","confidence":"High","stage":"Early","window":"3-6 weeks","tiktokSignal":"string","amazonSignal":"string","googleSignal":"string","hubTake":"string","aliSearchTerm":"string","amazonSearchTerm":"string","tiktokHashtag":"string"},{"title":"string","emoji":"string","confidence":"Medium","stage":"Growing","window":"2-4 weeks","tiktokSignal":"string","amazonSignal":"string","googleSignal":"string","hubTake":"string","aliSearchTerm":"string","amazonSearchTerm":"string","tiktokHashtag":"string"},{"title":"string","emoji":"string","confidence":"High","stage":"Early","window":"4-8 weeks","tiktokSignal":"string","amazonSignal":"string","googleSignal":"string","hubTake":"string","aliSearchTerm":"string","amazonSearchTerm":"string","tiktokHashtag":"string"},{"title":"string","emoji":"string","confidence":"Low","stage":"Peaking","window":"1-2 weeks","tiktokSignal":"string","amazonSignal":"string","googleSignal":"string","hubTake":"string","aliSearchTerm":"string","amazonSearchTerm":"string","tiktokHashtag":"string"}]}

Fill in all string values based on the live data. 4 opportunities total. Focus on UK dropshipping physical products only.`;

  try {
    const aiRes = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-api-key': apiKey, 'anthropic-version': '2023-06-01' },
      body: JSON.stringify({ model: 'claude-haiku-4-5-20251001', max_tokens: 2500, messages: [{ role: 'user', content: prompt }] })
    });

    const aiData = await aiRes.json();
    const raw = (aiData.content || []).filter(b => b.type === 'text').map(b => b.text).join('');
    let cleaned = raw.replace(/```json|```/g, '').trim();
    const s = cleaned.indexOf('{');
    const e = cleaned.lastIndexOf('}');
    if (s === -1 || e === -1) return res.status(500).json({ error: 'No JSON in response' });
    cleaned = cleaned.slice(s, e + 1);
    
    // Fix common JSON issues from Haiku
    cleaned = cleaned
      .replace(/,\s*}/g, '}')      // trailing commas in objects
      .replace(/,\s*]/g, ']')      // trailing commas in arrays
      .replace(/[‘’]/g, "'")  // curly single quotes
      .replace(/[“”]/g, '"'); // curly double quotes
    
    let pulse;
    try {
      pulse = JSON.parse(cleaned);
    } catch(parseErr) {
      console.error('[PULSE] Parse error:', parseErr.message, cleaned.slice(0, 200));
      return res.status(500).json({ error: 'JSON parse error: ' + parseErr.message });
    }

    // Fetch images for each opportunity via SerpAPI
    async function getImage(aliTerm, title) {
      if (!serpApiKey) return '';
      try {
        // Use aliSearchTerm for more specific product images
        const query = aliTerm || title;
        const url = `https://serpapi.com/search.json?engine=google_images&q=${encodeURIComponent(query + ' product white background')}&api_key=${serpApiKey}&num=5&safe=off&gl=gb&hl=en&tbs=isz:m`;
        const r = await fetch(url, { signal: AbortSignal.timeout(5000) });
        if (!r.ok) return '';
        const d = await r.json();
        const results = d?.images_results || [];
        // Prefer product images, avoid stock/lifestyle photos
        const product = results.find(i => i.original && i.is_product);
        const clean = results.find(i => i.original && !i.original.includes('shutterstock') && !i.original.includes('getty'));
        return product?.original || clean?.original || results[0]?.original || results[0]?.thumbnail || '';
      } catch(e) { return ''; }
    }

    // Add images and links to opportunities
    pulse.opportunities = await Promise.all(pulse.opportunities.map(async (opp) => ({
      ...opp,
      img: await getImage(opp.aliSearchTerm, opp.title),
      amazonUrl: `https://www.amazon.co.uk/s?k=${encodeURIComponent(opp.amazonSearchTerm || opp.title)}&ref=nb_sb_noss`,
      aliUrl: `https://www.aliexpress.com/wholesale?SearchText=${encodeURIComponent(opp.aliSearchTerm || opp.title)}`,
      tiktokUrl: `https://www.tiktok.com/tag/${encodeURIComponent(opp.tiktokHashtag || opp.title.replace(/\s+/g, ''))}`
    })));

    pulse.generatedAt = new Date().toISOString();

    // Return for admin review — not saved yet
    return res.status(200).json({ pulse });

  } catch(e) {
    return res.status(500).json({ error: e.message });
  }
}
