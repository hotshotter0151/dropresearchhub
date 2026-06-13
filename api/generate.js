export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const apiKey = process.env.ANTHROPIC_API_KEY;
  const serpApiKey = process.env.SERP_API_KEY;
  if (!apiKey) return res.status(500).json({ error: 'API key not configured' });

  const body = req.body;

  // ── FETCH PRODUCT IMAGE FROM SERPAPI (with fallback) ─────────────────────
  async function searchImage(query) {
    const url = `https://serpapi.com/search.json?engine=google_images&q=${encodeURIComponent(query)}&api_key=${serpApiKey}&num=3&safe=off&gl=gb&hl=en`;
    const r = await fetch(url, { signal: AbortSignal.timeout(6000) });
    if (!r.ok) return '';
    const data = await r.json();
    // Prefer product images with original URLs
    const results = data?.images_results || [];
    const product = results.find(i => i.original && i.is_product);
    const any = results.find(i => i.original);
    return (product?.original || any?.original || results[0]?.thumbnail || '');
  }

  async function fetchProductImage(productName) {
    if (!serpApiKey) return '';
    try {
      // Try exact product name first
      let img = await searchImage(productName + ' product');
      if (img) {
        console.log('[DRH] Image found (exact):', productName);
        return img;
      }
      // Fallback: use shorter keywords from the name
      const shortName = productName.split(' ').slice(0, 3).join(' ');
      img = await searchImage(shortName + ' product buy');
      if (img) {
        console.log('[DRH] Image found (fallback):', shortName);
        return img;
      }
      console.log('[DRH] No image found for:', productName);
      return '';
    } catch (e) {
      console.log('[DRH] Image fetch failed for', productName, ':', e.message);
      return '';
    }
  }

  // ── EMERGING PRODUCTS MODE ────────────────────────────────────────────────
  if (body.mode === 'emerging') {
    console.log('[DRH] Fetching Google Trends UK data...');

    let trendingContext = '';
    try {
      const trendsRes = await fetch(
        'https://trends.google.com/trends/api/dailytrends?hl=en-GB&tz=-60&geo=GB&ns=15',
        {
          headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' },
          signal: AbortSignal.timeout(5000)
        }
      );
      if (trendsRes.ok) {
        const raw = await trendsRes.text();
        const cleaned = raw.replace(/^\)\]\}'/, '').trim();
        const json = JSON.parse(cleaned);
        const searches = json?.default?.trendingSearchesDays?.[0]?.trendingSearches || [];
        const keywords = searches.map(s => s?.title?.query).filter(Boolean).slice(0, 20);
        if (keywords.length > 0) {
          trendingContext = `REAL UK Google Trends data today (${new Date().toLocaleDateString('en-GB')}): ${keywords.join(', ')}`;
          console.log('[DRH] Got', keywords.length, 'real trending searches');
        }
      }
    } catch (e) {
      console.log('[DRH] Google Trends failed:', e.message);
    }

    const systemPrompt = trendingContext
      ? `You are an expert ecommerce product researcher for UK dropshippers. You have REAL live Google Trends UK data.

${trendingContext}

Using this real trending data, identify 5 emerging ecommerce product opportunities. Focus on physical products with good margins that a UK dropshipper could sell.

Return ONLY a valid JSON array of exactly 5 product objects. No markdown, no backticks, no text before or after.

Each object: {"name":"string","niche":"Pet|Home|Beauty|Fitness|Kitchen|Outdoor|Baby|Office|Tech|Fashion","emoji":"emoji","stage":"Emerging","season":"Evergreen|Summer peak|Winter peak","grade":"A+|A|B|C","trendScore":number,"saturation":number,"margin":"XX%","whyNow":"max 15 words","verdict":"max 20 words","whyItCouldWork":["short","short","short"],"risks":["short","short","short"],"creativeAngles":["short","short","short"],"aliSearchTerm":"term","googleTrendsKeyword":"broad term","bgColor":"#EFF6FF","growthData":[{"label":"W1","value":20},{"label":"W2","value":35},{"label":"W3","value":50},{"label":"W4","value":65},{"label":"W5","value":78},{"label":"W6","value":88}]}

Keep ALL text fields SHORT — max 15 words each. googleTrendsKeyword must be broad e.g. "ice bath" not "portable collapsible ice bath tub".`

      : `You are an expert ecommerce product researcher for UK dropshippers. Find products showing early growth signals in the UK market right now in June 2026.

Return ONLY a valid JSON array of exactly 5 product objects. No markdown, no backticks, no text before or after.

Each object: {"name":"string","niche":"Pet|Home|Beauty|Fitness|Kitchen|Outdoor|Baby|Office|Tech|Fashion","emoji":"emoji","stage":"Emerging","season":"Evergreen|Summer peak|Winter peak","grade":"A+|A|B|C","trendScore":number,"saturation":number,"margin":"XX%","whyNow":"max 15 words","verdict":"max 20 words","whyItCouldWork":["short","short","short"],"risks":["short","short","short"],"creativeAngles":["short","short","short"],"aliSearchTerm":"term","googleTrendsKeyword":"broad term","bgColor":"#EFF6FF","growthData":[{"label":"W1","value":20},{"label":"W2","value":35},{"label":"W3","value":50},{"label":"W4","value":65},{"label":"W5","value":78},{"label":"W6","value":88}]}

Keep ALL text fields SHORT — max 15 words each. googleTrendsKeyword must be broad.`;

    const aiRes = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-api-key': apiKey, 'anthropic-version': '2023-06-01' },
      body: JSON.stringify({
        model: 'claude-sonnet-4-6',
        max_tokens: 4000,
        system: systemPrompt,
        messages: [{ role: 'user', content: trendingContext
          ? 'Using the real Google Trends UK data, identify 5 emerging ecom product opportunities for UK dropshippers.'
          : 'Generate 5 genuinely emerging UK ecom products for June 2026.'
        }]
      })
    });

    if (!aiRes.ok) {
      const err = await aiRes.text();
      console.error('[DRH] AI error:', aiRes.status, err.slice(0, 200));
      return res.status(500).json({ error: 'AI error ' + aiRes.status });
    }

    const aiData = await aiRes.json();
    const rawText = (aiData.content || []).filter(b => b.type === 'text').map(b => b.text).join('');
    console.log('[DRH] AI response length:', rawText.length);

    let cleaned = rawText.replace(/```json/gi, '').replace(/```/g, '').trim();
    const start = cleaned.indexOf('[');
    const end = cleaned.lastIndexOf(']');
    if (start === -1 || end === -1) return res.status(500).json({ error: 'No product array found' });
    cleaned = cleaned.slice(start, end + 1);

    let products;
    try {
      products = JSON.parse(cleaned);
    } catch (e) {
      console.error('[DRH] Parse error:', e.message);
      return res.status(500).json({ error: 'Parse error: ' + e.message });
    }

    // Fetch real product images via SerpApi
    console.log('[DRH] Fetching product images via SerpApi...');
    const imagePromises = products.map(p => fetchProductImage(p.name));
    const images = await Promise.all(imagePromises);
    products = products.map((p, i) => ({ ...p, img: images[i] || '' }));

    const imgCount = images.filter(Boolean).length;
    console.log('[DRH] Generated', products.length, 'products,', imgCount, 'images found. Trends used:', !!trendingContext);
    return res.status(200).json({ content: [{ type: 'text', text: JSON.stringify(products) }] });
  }

  // ── PRODUCT VALIDATOR ─────────────────────────────────────────────────────
  if (body.productName) {
    console.log('[DRH] Validator:', body.productName);
    const aiRes = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-api-key': apiKey, 'anthropic-version': '2023-06-01' },
      body: JSON.stringify({
        model: 'claude-sonnet-4-6',
        max_tokens: 1500,
        system: `You are an expert ecommerce product research analyst. Return ONLY a valid JSON object — no markdown, no backticks. Fields: {"productName":"string","opportunityScore":"A+|A|B+|B|C+|C|D","marketStage":"string","growthScore":number,"competitionScore":number,"marginScore":number,"saturationRisk":"Low|Medium|High|Very High","verdict":"string","whyItCouldWork":["string","string","string"],"risks":["string","string","string"],"creativeAngles":["string","string","string"],"hooks":{"broad":"string","alt":"string"},"growthGraph":[{"label":"W1","value":number},{"label":"W2","value":number},{"label":"W3","value":number},{"label":"W4","value":number},{"label":"W5","value":number},{"label":"W6","value":number}]}`,
        messages: [{ role: 'user', content: `Analyse for UK ecommerce: ${body.productName}` }]
      })
    });
    const aiData = await aiRes.json();
    const raw = (aiData.content || []).filter(b => b.type === 'text').map(b => b.text).join('');
    try { return res.status(200).json(JSON.parse(raw.replace(/```json|```/g, '').trim())); }
    catch (e) { return res.status(500).json({ error: 'Validator parse error' }); }
  }

  // ── PASSTHROUGH ───────────────────────────────────────────────────────────
  if (body.system && body.messages) {
    console.log('[DRH] Passthrough');
    const aiRes = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-api-key': apiKey, 'anthropic-version': '2023-06-01' },
      body: JSON.stringify({
        model: 'claude-sonnet-4-6',
        max_tokens: body.max_tokens || 2000,
        system: body.system,
        messages: body.messages
      })
    });
    const aiData = await aiRes.json();
    const raw = (aiData.content || []).filter(b => b.type === 'text').map(b => b.text).join('');
    return res.status(200).json({ content: [{ type: 'text', text: raw }] });
  }

  return res.status(400).json({ error: 'Invalid request format' });
}
