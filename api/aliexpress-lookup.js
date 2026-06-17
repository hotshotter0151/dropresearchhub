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

  try {
    const r = await fetch(
      `https://aliexpress-api2.p.rapidapi.com/product?url=${encodeURIComponent(url)}`,
      {
        method: 'GET',
        headers: {
          'x-rapidapi-host': 'aliexpress-api2.p.rapidapi.com',
          'x-rapidapi-key': rapidApiKey
        },
        signal: AbortSignal.timeout(8000)
      }
    );

    if (!r.ok) return res.status(500).json({ error: 'AliExpress API error: ' + r.status });

    const data = await r.json();

    // Extract product title from various possible response structures
    const title =
      data?.result?.item?.title ||
      data?.result?.title ||
      data?.data?.title ||
      data?.title ||
      data?.item?.title ||
      null;

    const image =
      data?.result?.item?.images?.[0] ||
      data?.result?.images?.[0] ||
      data?.data?.images?.[0] ||
      null;

    const price =
      data?.result?.item?.sku?.def?.price ||
      data?.result?.price ||
      data?.data?.price ||
      null;

    if (!title) {
      return res.status(404).json({ error: 'Product not found', raw: JSON.stringify(data).slice(0, 200) });
    }

    return res.status(200).json({ title, image, price });

  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
}
