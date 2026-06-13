export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return res.status(500).json({ error: 'API key not configured' });

  const body = req.body;
  console.log('[DRH] Mode:', body.mode || (body.productName ? 'validator' : body.system ? 'passthrough' : 'unknown'));

  // ── MODE 1: EMERGING PRODUCTS WITH REAL DATA ──────────────────────────────
  if (body.mode === 'emerging') {
    let trendingKeywords = [];
    let amazonProducts = [];

    // Fetch Google Trends UK daily rising searches
    try {
      const trendsRes = await fetch('https://trends.google.com/trends/trendingsearches/daily/rss?geo=GB', {
        headers: { 'User-Agent': 'Mozilla/5.0 (compatible; DropResearchHub/1.0)' }
      });
      if (trendsRes.ok) {
        const xml = await trendsRes.text();
        const matches = xml.match(/<title><!\[CDATA\[(.*?)\]\]><\/title>/g) || xml.match(/<title>(.*?)<\/title>/g) || [];
        trendingKeywords = matches
          .map(m => m.replace(/<\/?title>|<!\[CDATA\[|\]\]>/g, '').trim())
          .filter(k => k.length > 3 && !k.includes('Google') && !k.includes('xmlns'))
          .slice(0, 20);
        console.log('[DRH] Google Trends keywords:', trendingKeywords.length);
      }
    } catch (e) {
      console.log('[DRH] Google Trends failed:', e.message);
    }

    // Fetch Amazon UK Movers & Shakers via proxy
    try {
      const proxyUrl = 'https://api.allorigins.win/get?url=' + encodeURIComponent('https://www.amazon.co.uk/gp/movers-and-shakers/kitchen');
      const amazonRes = await fetch(proxyUrl);
      if (amazonRes.ok) {
        const data = await amazonRes.json();
        const html = data.contents || '';
        const titles = html.match(/aria-label="([^"]{10,80})"/g) || [];
        amazonProducts = titles
          .map(t => t.replace(/aria-label="|"/g, '').trim())
          .filter(t => !t.includes('page') && !t.includes('navigation'))
          .slice(0, 10);
        console.log('[DRH] Amazon products:', amazonProducts.length);
      }
    } catch (e) {
      console.log('[DRH] Amazon failed:', e.message);
    }

    const dataContext = [
      trendingKeywords.length ? `UK Google Trends rising now: ${trendingKeywords.slice(0,15).join(', ')}` : '',
      amazonProducts.length ? `Amazon UK rising products: ${amazonProducts.slice(0,10).join(', ')}` : ''
    ].filter(Boolean).join('. ');

    console.log('[DRH] Data context length:', dataContext.length);

    const systemPrompt = `You are an expert ecommerce product researcher for UK dropshippers specialising in finding products JUST starting to emerge — in the first 1-3 months of a Google Trends growth curve. NOT mainstream, NOT already viral.

${dataContext ? `REAL LIVE MARKET DATA: ${dataContext}` : 'No live data available — use your knowledge of emerging micro-trends in mid-2026.'}

Return ONLY a valid JSON array of exactly 20 product objects. No markdown, no backticks, no text before or after the array.

Each object must have ALL these exact fields:
{"name":"string","niche":"Pet|Home|Beauty|Fitness|Kitchen|Outdoor|Baby|Office|Tech|Fashion","emoji":"single emoji","stage":"Emerging","season":"Evergreen|Summer peak|Winter peak|Jan peak|Back to school","grade":"A+|A|B|C","trendScore":number 60-95,"saturation":number 5-40,"margin":"XX%","whyNow":"one sentence why trending in mid-2026 specifically","verdict":"2 sentences for UK dropshipper","whyItCouldWork":["reason1","reason2","reason3"],"risks":["risk1","risk2","risk3"],"creativeAngles":["angle1","angle2","angle3"],"aliSearchTerm":"aliexpress search term","googleTrendsKeyword":"google trends keyword","bgColor":"#EFF6FF or similar subtle hex","growthData":[{"label":"W1","value":12},{"label":"W2","value":24},{"label":"W3","value":38},{"label":"W4","value":55},{"label":"W5","value":71},{"label":"W6","value":84}]}

RULES: No yoga mats, resistance bands, water bottles, phone cases. Must be SPECIFIC niche products. Max 3 per niche. growthData must show rising curve.`;

    const aiRes = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-api-key': apiKey, 'anthropic-version': '2023-06-01' },
      body: JSON.stringify({
        model: 'claude-sonnet-4-5',
        max_tokens: 8000,
        system: systemPrompt,
        messages: [{ role: 'user', content: dataContext ? 'Using the real market data provided, generate 20 emerging UK ecom products for June 2026. Prioritise products aligning with the real trending data shown.' : 'Generate 20 genuinely emerging micro-niche UK ecom products for June 2026.' }]
      })
    });

    if (!aiRes.ok) {
      const err = await aiRes.text();
      console.error('[DRH] AI error:', aiRes.status, err.slice(0,200));
      return res.status(500).json({ error: 'AI error ' + aiRes.status });
    }

    const aiData = await aiRes.json();
    const rawText = (aiData.content || []).filter(b => b.type === 'text').map(b => b.text).join('');
    console.log('[DRH] Response length:', rawText.length);

    let cleaned = rawText.replace(/```json/gi,'').replace(/```/g,'').trim();
    const start = cleaned.indexOf('[');
    const end = cleaned.lastIndexOf(']');
    if (start === -1 || end === -1) return res.status(500).json({ error: 'No product array in response' });
    cleaned = cleaned.slice(start, end + 1);

    try {
      const products = JSON.parse(cleaned);
      console.log('[DRH] Generated', products.length, 'products. Trends used:', trendingKeywords.length > 0, 'Amazon used:', amazonProducts.length > 0);
      return res.status(200).json({ content: [{ type: 'text', text: JSON.stringify(products) }] });
    } catch (e) {
      console.error('[DRH] Parse error:', e.message);
      return res.status(500).json({ error: 'Parse error: ' + e.message });
    }
  }

  // ── MODE 2: PRODUCT VALIDATOR ─────────────────────────────────────────────
  if (body.productName) {
    console.log('[DRH] Validator:', body.productName);
    const aiRes = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-api-key': apiKey, 'anthropic-version': '2023-06-01' },
      body: JSON.stringify({
        model: 'claude-sonnet-4-5',
        max_tokens: 1500,
        system: `You are an expert ecommerce product research analyst. Return ONLY a valid JSON object — no markdown, no backticks. Fields: {"productName":"string","opportunityScore":"A+|A|B+|B|C+|C|D","marketStage":"string","growthScore":number,"competitionScore":number,"marginScore":number,"saturationRisk":"Low|Medium|High|Very High","verdict":"string","whyItCouldWork":["string","string","string"],"risks":["string","string","string"],"creativeAngles":["string","string","string"],"hooks":{"broad":"string","alt":"string"},"growthGraph":[{"label":"W1","value":number},{"label":"W2","value":number},{"label":"W3","value":number},{"label":"W4","value":number},{"label":"W5","value":number},{"label":"W6","value":number}]}`,
        messages: [{ role: 'user', content: `Analyse for UK ecommerce: ${body.productName}` }]
      })
    });
    const aiData = await aiRes.json();
    const raw = (aiData.content||[]).filter(b=>b.type==='text').map(b=>b.text).join('');
    try { return res.status(200).json(JSON.parse(raw.replace(/```json|```/g,'').trim())); }
    catch(e) { return res.status(500).json({ error: 'Validator parse error' }); }
  }

  // ── MODE 3: PASSTHROUGH (creative gen, AI assistant etc) ──────────────────
  if (body.system && body.messages) {
    console.log('[DRH] Passthrough');
    const aiRes = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-api-key': apiKey, 'anthropic-version': '2023-06-01' },
      body: JSON.stringify({
        model: 'claude-sonnet-4-5',
        max_tokens: body.max_tokens || 2000,
        system: body.system,
        messages: body.messages
      })
    });
    const aiData = await aiRes.json();
    const raw = (aiData.content||[]).filter(b=>b.type==='text').map(b=>b.text).join('');
    return res.status(200).json({ content: [{ type: 'text', text: raw }] });
  }

  return res.status(400).json({ error: 'Invalid request format' });
}
