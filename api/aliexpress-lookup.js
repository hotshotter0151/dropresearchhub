export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { url } = req.body;
  if (!url) return res.status(400).json({ error: 'URL required' });

  const rapidApiKey = process.env.RAPIDAPI_KEY;
  if (!rapidApiKey) return res.status(500).json({ error: 'API key not configured' });

  // Extract item ID from URL
  const itemIdMatch = url.match(/\/item\/(\d+)/);
  if (!itemIdMatch) {
    return res.status(400).json({ error: 'Could not extract item ID from URL' });
  }
  const itemId = itemIdMatch[1];

  try {
    // Try search by item ID as search term
    const r = await fetch(
      `https://aliexpress-api2.p.rapidapi.com/search?SearchText=${itemId}&page=1&pageSize=1`,
      {
        method: 'GET',
        headers: {
          'x-rapidapi-host': 'aliexpress-api2.p.rapidapi.com',
          'x-rapidapi-key': rapidApiKey
        },
        signal: AbortSignal.timeout(6000)
      }
    );

    if (!r.ok) return res.status(500).json({ error: 'AliExpress API error: ' + r.status });

    const data = await r.json();
    const items = data?.result?.resultList || data?.data?.products || [];
    const first = items[0]?.item || items[0];

    if (!first) return res.status(404).json({ error: 'Product not found' });

    const title = first.title || first.name || first.productTitle || null;
    if (!title) return res.status(404).json({ error: 'No title found' });

    return res.status(200).json({ title, itemId });

  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
}
