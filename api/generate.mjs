export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const apiKey = process.env.ANTHROPIC_API_KEY;
  const serpApiKey = process.env.SERP_API_KEY;
  const supabaseUrl = 'https://qpkpvtsoxiqcrkztkagn.supabase.co';
  const supabaseKey = process.env.SUPABASE_SERVICE_KEY;
  if (!apiKey) return res.status(500).json({ error: 'API key not configured' });

  const body = req.body;
  const today = new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });

  async function searchImage(query) {
    try {
      const url = `https://serpapi.com/search.json?engine=google_images&q=${encodeURIComponent(query)}&api_key=${serpApiKey}&num=3&safe=off&gl=gb&hl=en`;
      const r = await fetch(url, { signal: AbortSignal.timeout(4000) });
      if (!r.ok) return '';
      const data = await r.json();
      const results = data?.images_results || [];
      const product = results.find(i => i.original && i.is_product);
      const any = results.find(i => i.original);
      return (product?.original || any?.original || results[0]?.thumbnail || '');
    } catch (e) { return ''; }
  }

  async function fetchProductImage(productName) {
    if (!serpApiKey) return '';
    try {
      let img = await searchImage(productName + ' product white background');
      if (img) return img;
      return await searchImage(productName.split(' ').slice(0, 3).join(' '));
    } catch (e) { return ''; }
  }

  async function enrichFromAliExpress(aliSearchTerm) {
    const rapidApiKey = process.env.RAPIDAPI_KEY;
    if (!rapidApiKey || !aliSearchTerm) return null;
    try {
      const url = `https://aliexpress-api2.p.rapidapi.com/search?SearchText=${encodeURIComponent(aliSearchTerm)}&page=1&pageSize=3`;
      const r = await fetch(url, {
        headers: { 'x-rapidapi-host': 'aliexpress-api2.p.rapidapi.com', 'x-rapidapi-key': rapidApiKey },
        signal: AbortSignal.timeout(4000)
      });
      if (!r.ok) return null;
      const data = await r.json();
      const items = data?.result?.resultList || data?.data?.products || [];
      const first = items[0]?.item || items[0];
      if (!first) return null;
      return {
        img: first.image || first.productImage || first.img || null,
        supplierPrice: first.salePrice || first.price?.current || null,
        orderCount: first.tradeCount || first.soldCount || first.orders || null,
        rating: first.starRating || first.averageStar || null,
        reviewCount: first.feedbackRating?.totalValidNum || first.reviewCount || null,
        shippingDays: first.logisticsDesc || null
      };
    } catch (e) { return null; }
  }

  async function fetchTrendingData() {
    const results = [];
    try {
      const r = await fetch(`https://serpapi.com/search.json?engine=amazon&amazon_domain=amazon.co.uk&type=movers_and_shakers&api_key=${serpApiKey}`, { signal: AbortSignal.timeout(3000) });
      if (r.ok) { const d = await r.json(); const items = (d?.movers_and_shakers||[]).slice(0,10).map(i=>i?.title).filter(Boolean); if (items.length) results.push(`Amazon UK trending: ${items.join(', ')}`); }
    } catch(e) {}
    try {
      const r = await fetch(`https://serpapi.com/search.json?engine=amazon&amazon_domain=amazon.com&type=movers_and_shakers&api_key=${serpApiKey}`, { signal: AbortSignal.timeout(3000) });
      if (r.ok) { const d = await r.json(); const items = (d?.movers_and_shakers||[]).slice(0,10).map(i=>i?.title).filter(Boolean); if (items.length) results.push(`Amazon US trending: ${items.join(', ')}`); }
    } catch(e) {}
    try {
      const r = await fetch('https://trends.google.com/trends/api/dailytrends?hl=en-GB&tz=-60&geo=GB&ns=15', { headers: {'User-Agent':'Mozilla/5.0'}, signal: AbortSignal.timeout(3000) });
      if (r.ok) { const raw = await r.text(); const json = JSON.parse(raw.replace(/^\)\]\}'/,'').trim()); const kw = (json?.default?.trendingSearchesDays?.[0]?.trendingSearches||[]).map(s=>s?.title?.query).filter(Boolean).slice(0,10); if (kw.length) results.push(`UK trends: ${kw.join(', ')}`); }
    } catch(e) {}
    try {
      const r = await fetch(`https://serpapi.com/search.json?engine=google&q=tiktok+shop+uk+trending+products+${new Date().getFullYear()}&gl=gb&hl=en&api_key=${serpApiKey}&num=3`, { signal: AbortSignal.timeout(3000) });
      if (r.ok) { const d = await r.json(); const s = (d?.organic_results||[]).slice(0,2).map(r=>r?.snippet).filter(Boolean); if (s.length) results.push(`TikTok UK: ${s.join(' ')}`); }
    } catch(e) {}
    return results.join('\n');
  }

  async function fetchPublishedHistory() {
    if (!supabaseKey) return { names: [], recentNiches: [] };
    try {
      const r = await fetch(`${supabaseUrl}/rest/v1/products?select=name,data&order=published_at.desc&limit=30`, { headers: { 'apikey': supabaseKey, 'Authorization': `Bearer ${supabaseKey}` }, signal: AbortSignal.timeout(4000) });
      if (!r.ok) return { names: [], recentNiches: [] };
      const data = await r.json();
      return { names: data.map(p=>p.name).filter(Boolean), recentNiches: data.slice(0,10).map(p=>p.data?.niche).filter(Boolean) };
    } catch(e) { return { names: [], recentNiches: [] }; }
  }

  const NICHE_POOL = ['Pet care','Garden & outdoor','Car accessories','Baby & toddler','Sports & fitness','Kitchen gadgets','Home organisation','Beauty & skincare','Tech accessories','Office & desk','Travel accessories','Cleaning & household','Sleep & wellness','Mens grooming','Womens fashion accessories','Cycling accessories','Kids toys','Crafts & hobbies','Fishing & outdoors','DIY & tools'];

  function pickNiches(recentNiches) {
    const used = new Set(recentNiches);
    const fresh = NICHE_POOL.filter(n => !used.has(n));
    const pool = fresh.length >= 3 ? fresh : NICHE_POOL;
    return [...pool].sort(() => Math.random() - 0.5).slice(0, 3);
  }

  if (body.mode === 'emerging') {
    console.log('[DRH] Starting...');
    const [trendingContext, history] = await Promise.all([fetchTrendingData(), fetchPublishedHistory()]);
    const { names: publishedNames, recentNiches } = history;
    const niches = pickNiches(recentNiches);
    console.log('[DRH] Niches:', niches.join(' | '));

    const prompt = `UK dropshipping product researcher. Today: ${today}.

LIVE SIGNALS:
${trendingContext || 'Use mid-2026 UK ecommerce knowledge.'}

ALREADY PUBLISHED (never repeat): ${publishedNames.slice(0,20).join(', ') || 'none'}

Find 3 emerging UK dropshipping products — one per niche:
1. ${niches[0]}
2. ${niches[1]}  
3. ${niches[2]}

Rules: physical products only, £20-£60 price, 45%+ margin, not banned (no: air fryers, massage guns, resistance bands, LED strips, posture correctors, water bottles, phone cases, beard trimmers, wireless earbuds, yoga mats), sourceable on AliExpress, evergreen demand, strong video potential.

Return ONLY valid JSON array of 3 objects. No markdown.

Each object: {"name":"string","niche":"string","emoji":"string","stage":"Pre-launch|Early Adopter|Growing","season":"Evergreen","grade":"A+|A|B+|B","confidence":"High|Medium|Speculative","investmentTest":"TEST|PASS","trendVelocity":"Accelerating|Rising","whyNow":"one sentence","subscriberExcitement":number,"opportunityMultiplier":number,"trendScore":number,"problemScore":number,"saturationRisk":"Low|Medium","competitionLevel":"Low|Medium","emergingScore":number,"supplierCost":"£X-£X","sellingPrice":"£X-£X","margin":"XX%","targetCustomer":"string","whyEmerging":"string","problemSolved":"string","mainAngle":"string","tiktokAngle":"string","metaAngle":"string","usAuSignal":"string","verdict":"Strong Opportunity|Watch List","verdictReason":"string","whyItCouldWork":["r1","r2","r3"],"risks":["r1","r2"],"bundleIdea":"string","repeatPurchase":true,"repeatReason":"string","aliSearchTerm":"string","bgColor":"#EFF6FF","growthData":[{"label":"W1","value":8},{"label":"W2","value":18},{"label":"W3","value":33},{"label":"W4","value":52},{"label":"W5","value":70},{"label":"W6","value":84}]}`;

    const aiRes = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-api-key': apiKey, 'anthropic-version': '2023-06-01' },
      body: JSON.stringify({ model: 'claude-sonnet-4-6', max_tokens: 3000, messages: [{ role: 'user', content: prompt }] })
    });

    if (!aiRes.ok) {
      const err = await aiRes.text();
      console.error('[DRH] AI error:', aiRes.status, err.slice(0,200));
      return res.status(500).json({ error: 'AI error ' + aiRes.status });
    }

    const aiData = await aiRes.json();
    const rawText = (aiData.content||[]).filter(b=>b.type==='text').map(b=>b.text).join('');
    console.log('[DRH] Response:', rawText.length, 'chars');

    let cleaned = rawText.replace(/```json/gi,'').replace(/```/g,'').trim();
    const start = cleaned.indexOf('[');
    const end = cleaned.lastIndexOf(']');
    if (start === -1 || end === -1) {
      console.error('[DRH] No JSON array:', cleaned.slice(0,200));
      return res.status(500).json({ error: 'No product array in response' });
    }
    cleaned = cleaned.slice(start, end + 1);

    let products;
    try { products = JSON.parse(cleaned); }
    catch(e) { console.error('[DRH] Parse error:', e.message); return res.status(500).json({ error: 'Parse error: ' + e.message }); }

    products = products.map(p => p.investmentTest === 'PASS' ? { ...p, verdict: 'Watch List', confidence: 'Speculative' } : p);

    console.log('[DRH] Got', products.length, 'products, enriching...');
    const enrichments = await Promise.all(products.map(p => enrichFromAliExpress(p.aliSearchTerm)));
    const serpImages = await Promise.all(products.map((p,i) => enrichments[i]?.img ? Promise.resolve('') : fetchProductImage(p.name)));

    products = products.map((p,i) => {
      const ali = enrichments[i];
      return {
        ...p,
        img: ali?.img || serpImages[i] || '',
        supplierCost: ali?.supplierPrice ? `£${parseFloat(String(ali.supplierPrice).replace(/[^\d.]/g,'')).toFixed(2)} (AliExpress)` : p.supplierCost,
        aliOrderCount: ali?.orderCount || null,
        aliRating: ali?.rating || null,
        saturationRisk: ali?.orderCount ? (ali.orderCount > 10000 ? 'Medium' : 'Low') : p.saturationRisk
      };
    });

    console.log('[DRH] Done:', products.map(p=>p.name).join(' | '));
    return res.status(200).json({ content: [{ type: 'text', text: JSON.stringify(products) }] });
  }

  if (body.productName) {
    const aiRes = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-api-key': apiKey, 'anthropic-version': '2023-06-01' },
      body: JSON.stringify({
        model: 'claude-sonnet-4-6', max_tokens: 1500,
        system: `UK ecommerce product analyst. Return ONLY valid JSON object, no markdown.\nFields: {"productName":"string","opportunityScore":"A+|A|B+|B|C+|C|D","marketStage":"string","growthScore":number,"competitionScore":number,"saturationRisk":"Low|Medium|High|Very High","verdict":"string","sellingPrice":"£X-£X","supplierCost":"£X-£X","margin":"XX%","opportunityWindow":"X-Y weeks","ukMarketNotes":"string","confidence":"High|Medium|Speculative","trendVelocity":"Accelerating|Rising|Stable|Declining","creativePotential":number,"brandability":number,"retailGap":number,"contentLongevity":number,"subscriberExcitement":number,"opportunityMultiplier":number,"whyNow":"string","investmentTest":"TEST|PASS","whyItCouldWork":["s","s","s"],"risks":["s","s","s"],"creativeAngles":["s","s","s"],"growthGraph":[{"label":"W1","value":number},{"label":"W2","value":number},{"label":"W3","value":number},{"label":"W4","value":number},{"label":"W5","value":number},{"label":"W6","value":number}]}`,
        messages: [{ role: 'user', content: `Analyse for UK dropshipping 2026: ${body.productName}` }]
      })
    });
    const aiData = await aiRes.json();
    const raw = (aiData.content||[]).filter(b=>b.type==='text').map(b=>b.text).join('');
    try { return res.status(200).json(JSON.parse(raw.replace(/```json|```/g,'').trim())); }
    catch(e) { return res.status(500).json({ error: 'Validator parse error' }); }
  }

  if (body.system && body.messages) {
    const aiRes = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-api-key': apiKey, 'anthropic-version': '2023-06-01' },
      body: JSON.stringify({ model: 'claude-sonnet-4-6', max_tokens: body.max_tokens||2000, system: body.system, messages: body.messages })
    });
    const aiData = await aiRes.json();
    const raw = (aiData.content||[]).filter(b=>b.type==='text').map(b=>b.text).join('');
    return res.status(200).json({ content: [{ type: 'text', text: raw }] });
  }

  return res.status(400).json({ error: 'Invalid request format' });
}
