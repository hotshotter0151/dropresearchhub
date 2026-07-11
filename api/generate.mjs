const SUPABASE_URL = 'https://qpkpvtsoxiqcrkztkagn.supabase.co';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;
async function sbFetch(path, method = 'GET', body) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1${path}`, {
    method,
    headers: {
      'apikey': SUPABASE_SERVICE_KEY,
      'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
      'Content-Type': 'application/json',
      'Prefer': 'return=representation'
    },
    body: body ? JSON.stringify(body) : undefined
  });
  return res.json();
}
export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PATCH, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();

  const apiKey = process.env.ANTHROPIC_API_KEY;
  const serpApiKey = process.env.SERP_API_KEY;
  const supabaseUrl = 'https://qpkpvtsoxiqcrkztkagn.supabase.co';
  const supabaseKey = process.env.SUPABASE_SERVICE_KEY;
  if (!apiKey) return res.status(500).json({ error: 'API key not configured' });

  const body = req.body;
  const today = new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });

  // ── IMAGE FUNCTIONS — UNTOUCHED ──────────────────────────────────────
  async function searchImage(query) {
    try {
      const url = `https://serpapi.com/search.json?engine=google_images&q=${encodeURIComponent(query)}&api_key=${serpApiKey}&num=3&safe=off&gl=gb&hl=en`;
      const r = await fetch(url, { signal: AbortSignal.timeout(6000) });
      if (!r.ok) return '';
      const data = await r.json();
      const results = data?.images_results || [];
      const product = results.find(i => i.original && i.is_product);
      const any = results.find(i => i.original);
      return (product?.original || any?.original || results[0]?.original || results[0]?.thumbnail || '');
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

  // ── ALI API — UNTOUCHED ──────────────────────────────────────────────
  async function enrichFromAliExpress(aliSearchTerm) {
    const rapidApiKey = process.env.RAPIDAPI_KEY;
    if (!rapidApiKey || !aliSearchTerm) return null;
    try {
      const url = `https://aliexpress-datahub.p.rapidapi.com/item_search_2?q=${encodeURIComponent(aliSearchTerm)}&page=1`;
      const r = await fetch(url, {
        headers: { 'x-rapidapi-host': 'aliexpress-datahub.p.rapidapi.com', 'x-rapidapi-key': rapidApiKey },
        signal: AbortSignal.timeout(6000)
      });
      if (!r.ok) { console.log('[ALI] HTTP error:', r.status); return null; }
      const data = await r.json();
      const items = data?.result?.resultList || [];
      const first = items[0]?.item || null;
      if (!first) { console.log('[ALI] No items for:', aliSearchTerm); return null; }
      const img = first.image ? 'https:' + first.image : null;
      console.log('[ALI] Got image:', img ? 'yes' : 'no', 'for:', aliSearchTerm);
      return {
        img,
        supplierPrice: first.sku?.def?.promotionPrice || null,
        orderCount: first.sales || null,
        rating: first.averageStarRate || null,
        reviewCount: null,
        shippingDays: null
      };
    } catch (e) { console.log('[ALI] Error:', e.message); return null; }
  }

  // ── TRENDING DATA — UNTOUCHED ────────────────────────────────────────
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

  // ── HISTORY — UNTOUCHED ──────────────────────────────────────────────
  async function fetchPublishedHistory() {
    if (!supabaseKey) return { names: [], recentNiches: [] };
    try {
      const r = await fetch(`${supabaseUrl}/rest/v1/products?select=name,data&order=published_at.desc&limit=30`, { headers: { 'apikey': supabaseKey, 'Authorization': `Bearer ${supabaseKey}` }, signal: AbortSignal.timeout(4000) });
      if (!r.ok) return { names: [], recentNiches: [] };
      const data = await r.json();
      return { names: data.map(p=>p.name).filter(Boolean), recentNiches: data.slice(0,10).map(p=>p.data?.niche).filter(Boolean) };
    } catch(e) { return { names: [], recentNiches: [] }; }
  }

  // ── NICHE POOL — UNTOUCHED ───────────────────────────────────────────
  const NICHE_POOL = ['Pet care','Garden & outdoor','Car accessories','Baby & toddler','Sports & fitness','Kitchen gadgets','Home organisation','Beauty & skincare','Tech accessories','Office & desk','Travel accessories','Cleaning & household','Sleep & wellness','Mens grooming','Womens fashion accessories','Cycling accessories','Kids toys','Crafts & hobbies','Fishing & outdoors','DIY & tools'];

  function pickNiches(recentNiches) {
    const used = new Set(recentNiches);
    const fresh = NICHE_POOL.filter(n => !used.has(n));
    const pool = fresh.length >= 3 ? fresh : NICHE_POOL;
    return [...pool].sort(() => Math.random() - 0.5).slice(0, 3);
  }

  // ── JSON REPAIR HELPERS ──────────────────────────────────────────────
  function tryParseProducts(rawText) {
    let cleaned = rawText.replace(/```json/gi,'').replace(/```/g,'').trim();
    const start = cleaned.indexOf('[');
    if (start === -1) return null;
    let end = cleaned.lastIndexOf(']');
    if (end === -1) end = cleaned.length - 1;
    cleaned = cleaned.slice(start, end + 1);

    // Attempt 1: parse as-is
    try { return JSON.parse(cleaned); } catch(e) {}

    // Attempt 2: remove trailing commas
    let fixed = cleaned.replace(/,\s*([}\]])/g, '$1');
    try { return JSON.parse(fixed); } catch(e) {}

    // Attempt 3: escape rogue double quotes inside string values.
    // Heuristic: a quote only legitimately ends a string if the next
    // non-space char is a structural char (, } ] :) — otherwise escape it.
    let out = '', inS = false, es = false;
    for (let i = 0; i < fixed.length; i++) {
      const ch = fixed[i];
      if (es) { out += ch; es = false; continue; }
      if (ch === '\\') { out += ch; es = true; continue; }
      if (ch === '"') {
        if (!inS) { inS = true; out += ch; continue; }
        let j = i + 1;
        while (j < fixed.length && /\s/.test(fixed[j])) j++;
        const nx = fixed[j];
        if (nx === ',' || nx === '}' || nx === ']' || nx === ':' || j >= fixed.length) { inS = false; out += ch; }
        else { out += '\\"'; }
        continue;
      }
      out += ch;
    }
    try { return JSON.parse(out); } catch(e) {}

    // Attempt 4: salvage complete top-level objects from a truncated array
    const objects = [];
    let depth = 0, objStart = -1, inStr = false, esc = false;
    for (let i = 0; i < cleaned.length; i++) {
      const c = cleaned[i];
      if (esc) { esc = false; continue; }
      if (c === '\\') { esc = true; continue; }
      if (c === '"') { inStr = !inStr; continue; }
      if (inStr) continue;
      if (c === '{') { if (depth === 0) objStart = i; depth++; }
      else if (c === '}') {
        depth--;
        if (depth === 0 && objStart !== -1) {
          const chunk = cleaned.slice(objStart, i + 1);
          try { objects.push(JSON.parse(chunk)); }
          catch(e) {
            try { objects.push(JSON.parse(chunk.replace(/,\s*([}\]])/g, '$1'))); } catch(e2) {}
          }
          objStart = -1;
        }
      }
    }
    return objects.length ? objects : null;
  }

  // ── EMERGING MODE ────────────────────────────────────────────────────
  if (body.mode === 'emerging') {
    console.log('[DRH] Starting...');
    const [trendingContext, history] = await Promise.all([fetchTrendingData(), fetchPublishedHistory()]);
    const { names: publishedNames, recentNiches } = history;
    const niches = pickNiches(recentNiches);
    console.log('[DRH] Niches:', niches.join(' | '));

    // sourceMode: 'mixed' (default, 2 international + 1 UK), 'uk' (all 3 UK), 'international' (all 3 international)
    const sourceMode = ['uk', 'international'].includes(body.sourceMode) ? body.sourceMode : 'mixed';

    let sourceLines, sourceRules, fulfilmentRules;
    if (sourceMode === 'uk') {
      sourceLines = `1. ${niches[0]} — UK SOURCED (choose a product that realistically has UK dropship suppliers on platforms like Avasam, Syncee, CJdropshipping UK warehouse, or Go Dropship — must be a practical physical product a UK supplier would stock)
2. ${niches[1]} — UK SOURCED (same criteria as above)
3. ${niches[2]} — UK SOURCED (same criteria as above)`;
      sourceRules = `All 3 products must be a product type realistically stocked by UK dropship suppliers.`;
      fulfilmentRules = `IMPORTANT for fulfilment field:
- All 3 products are UK sourced: sourceType="uk", ukSupplierAvailable=true, ukSupplierConfidence="High" or "Medium", ukDeliveryEstimate="1-3 working days", internationalAvailable=false, ukSupplierSearchTerms=["[product name] Avasam","[product name] Syncee UK","[product name] CJ dropshipping UK","[product name] Go Dropship","[product name] UK dropship supplier"], recommendedRoute="UK supplier for fast 1-3 day delivery — check Avasam and Syncee first"
- aliSearchTerm: still provide an AliExpress search term as a fallback reference`;
    } else if (sourceMode === 'international') {
      sourceLines = `1. ${niches[0]} — INTERNATIONAL SOURCE (AliExpress/overseas supplier)
2. ${niches[1]} — INTERNATIONAL SOURCE (AliExpress/overseas supplier)
3. ${niches[2]} — INTERNATIONAL SOURCE (AliExpress/overseas supplier)`;
      sourceRules = `All 3 products must be sourceable on AliExpress.`;
      fulfilmentRules = `IMPORTANT for fulfilment field:
- All 3 products are international: sourceType="international", ukSupplierAvailable=false, ukSupplierConfidence="Low", ukSupplierSearchTerms=[], internationalAvailable=true, recommendedRoute="International sourcing via AliExpress for best margin"`;
    } else {
      sourceLines = `1. ${niches[0]} — INTERNATIONAL SOURCE (AliExpress/overseas supplier)
2. ${niches[1]} — INTERNATIONAL SOURCE (AliExpress/overseas supplier)
3. ${niches[2]} — UK SOURCED (choose a product that realistically has UK dropship suppliers on platforms like Avasam, Syncee, CJdropshipping UK warehouse, or Go Dropship — must be a practical physical product a UK supplier would stock)`;
      sourceRules = `Products 1 and 2 must be sourceable on AliExpress.
Product 3 must be a product type realistically stocked by UK dropship suppliers.`;
      fulfilmentRules = `IMPORTANT for fulfilment field:
- Products 1 and 2 (international): sourceType="international", ukSupplierAvailable=false, ukSupplierConfidence="Low", ukSupplierSearchTerms=[], internationalAvailable=true
- Product 3 (UK sourced): sourceType="uk", ukSupplierAvailable=true, ukSupplierConfidence="High" or "Medium", ukDeliveryEstimate="1-3 working days", internationalAvailable=false, ukSupplierSearchTerms=["[product name] Avasam","[product name] Syncee UK","[product name] CJ dropshipping UK","[product name] Go Dropship","[product name] UK dropship supplier"], recommendedRoute="UK supplier for fast 1-3 day delivery — check Avasam and Syncee first"
- For products 1 and 2 recommendedRoute="International sourcing via AliExpress for best margin"
- aliSearchTerm: for product 3 (UK) still provide an AliExpress search term as a fallback reference`;
    }

    const prompt = `UK dropshipping product researcher. Today: ${today}.

LIVE SIGNALS:
${trendingContext || 'Use mid-2026 UK ecommerce knowledge.'}

ALREADY PUBLISHED (never repeat): ${publishedNames.slice(0,20).join(', ') || 'none'}

Find 3 emerging UK dropshipping products — one per niche:
${sourceLines}

Rules: physical products only, £20-£60 price, 45%+ margin, not banned (no: air fryers, massage guns, resistance bands, LED strips, posture correctors, water bottles, phone cases, beard trimmers, wireless earbuds, yoga mats), evergreen demand, strong video potential.
${sourceRules}

Return ONLY valid JSON array of 3 objects. No markdown. CRITICAL: never use double quote characters inside any string value — use single quotes or rephrase. All strings must be short and JSON-safe.

Each object: {"name":"string","niche":"string","emoji":"string","stage":"Pre-launch|Early Adopter|Growing","season":"Evergreen","grade":"A+|A|B+|B","confidence":"High|Medium|Speculative","investmentTest":"TEST|PASS","trendVelocity":"Accelerating|Rising","whyNow":"one sentence","subscriberExcitement":number,"opportunityMultiplier":number,"trendScore":number,"problemScore":number,"saturationRisk":"Low|Medium","competitionLevel":"Low|Medium","emergingScore":number,"scoring":{"ukMarketGap":number,"problemIntensity":number,"creativePotential":number,"profitPotential":number,"competitionBarrier":number,"easeOfEntry":number,"earlySignalStrength":number},"supplierCost":"£X-£X","sellingPrice":"£X-£X","margin":"XX%","targetCustomer":"string","whyEmerging":"string","problemSolved":"string","mainAngle":"string","tiktokAngle":"string","metaAngle":"string","usAuSignal":"string","verdict":"Strong Opportunity|Watch List","verdictReason":"string","whyItCouldWork":["r1","r2","r3"],"risks":["r1","r2"],"bundleIdea":"string","repeatPurchase":true,"repeatReason":"string","aliSearchTerm":"string","bgColor":"#EFF6FF","growthData":[{"label":"W1","value":8},{"label":"W2","value":18},{"label":"W3","value":33},{"label":"W4","value":52},{"label":"W5","value":70},{"label":"W6","value":84}],"sourceType":"international|uk","fulfilment":{"internationalAvailable":true,"internationalSupplierType":"AliExpress","internationalDeliveryEstimate":"7-14 days","ukSupplierAvailable":false,"ukSupplierConfidence":"Low","ukDeliveryEstimate":"","ukSupplierSearchTerms":[],"recommendedRoute":"string"}}

${fulfilmentRules}

scoring values must be real whole numbers, maxes: ukMarketGap 25, problemIntensity 20, creativePotential 10, profitPotential 12, competitionBarrier 20, easeOfEntry 8, earlySignalStrength 15.`;

    let products = null;
    for (let attempt = 1; attempt <= 2 && !products; attempt++) {
      const aiRes = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-api-key': apiKey, 'anthropic-version': '2023-06-01' },
        body: JSON.stringify({ model: 'claude-haiku-4-5-20251001', max_tokens: 6000, messages: [{ role: 'user', content: prompt }] })
      });

      if (!aiRes.ok) {
        const err = await aiRes.text();
        console.error('[DRH] AI error (attempt ' + attempt + '):', aiRes.status, err.slice(0,200));
        if (attempt === 2) return res.status(500).json({ error: 'AI error ' + aiRes.status });
        continue;
      }

      const aiData = await aiRes.json();
      const rawText = (aiData.content||[]).filter(b=>b.type==='text').map(b=>b.text).join('');
      console.log('[DRH] Response (attempt ' + attempt + '):', rawText.length, 'chars, stop_reason:', aiData.stop_reason);

      products = tryParseProducts(rawText);
      if (!products || !products.length) {
        products = null;
        console.error('[DRH] Parse failed on attempt ' + attempt);
      }
    }

    if (!products) return res.status(500).json({ error: 'Parse error: could not recover valid products after 2 attempts' });
    console.log('[DRH] Parsed', products.length, 'products');

    // ── UNTOUCHED — scoring fix ──────────────────────────────────────
    products = products.map(p => p.investmentTest === 'PASS' ? { ...p, verdict: 'Watch List', confidence: 'Speculative' } : p);

    const SCORING_MAXES = { ukMarketGap: 25, problemIntensity: 20, creativePotential: 10, profitPotential: 12, competitionBarrier: 20, easeOfEntry: 8, earlySignalStrength: 15 };
    products = products.map(p => {
      const fixedScoring = {};
      for (const [key, max] of Object.entries(SCORING_MAXES)) {
        const val = p.scoring?.[key];
        fixedScoring[key] = (typeof val === 'number' && !isNaN(val) && val >= 1) ? Math.round(val) : Math.round(max * 0.65);
      }
      const scoringTotal = Object.values(fixedScoring).reduce((a,b)=>a+b,0);
      const fixedEmergingScore = (typeof p.emergingScore === 'number' && !isNaN(p.emergingScore) && p.emergingScore >= 15) ? Math.round(p.emergingScore) : scoringTotal;
      return { ...p, scoring: fixedScoring, emergingScore: fixedEmergingScore };
    });

    // ── UNTOUCHED — Ali enrichment + image fetch ─────────────────────
    console.log('[DRH] Got', products.length, 'products, enriching...');
    const enrichments = await Promise.all(products.map(p => enrichFromAliExpress(p.aliSearchTerm)));
    const serpImages = await Promise.all(products.map((p,i) => (enrichments[i]?.img) ? Promise.resolve('') : fetchProductImage(p.name)));

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

  // ── VALIDATOR MODE — UNTOUCHED ───────────────────────────────────────
  if (body.productName) {
    const aiRes = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-api-key': apiKey, 'anthropic-version': '2023-06-01' },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001', max_tokens: 1500,
        system: `UK ecommerce product analyst. Return ONLY valid JSON object, no markdown.\nFields: {"productName":"string","opportunityScore":"A+|A|B+|B|C+|C|D","marketStage":"string","growthScore":number,"competitionScore":number,"saturationRisk":"Low|Medium|High|Very High","verdict":"string","sellingPrice":"£X-£X","supplierCost":"£X-£X","margin":"XX%","opportunityWindow":"X-Y weeks","ukMarketNotes":"string","confidence":"High|Medium|Speculative","trendVelocity":"Accelerating|Rising|Stable|Declining","creativePotential":number,"brandability":number,"retailGap":number,"contentLongevity":number,"subscriberExcitement":number,"opportunityMultiplier":number,"whyNow":"string","investmentTest":"TEST|PASS","whyItCouldWork":["s","s","s"],"risks":["s","s","s"],"creativeAngles":["s","s","s"],"growthGraph":[{"label":"W1","value":number},{"label":"W2","value":number},{"label":"W3","value":number},{"label":"W4","value":number},{"label":"W5","value":number},{"label":"W6","value":number}]}`,
        messages: [{ role: 'user', content: `Analyse for UK dropshipping 2026: ${body.productName}` }]
      })
    });
    const aiData = await aiRes.json();
    const raw = (aiData.content||[]).filter(b=>b.type==='text').map(b=>b.text).join('');
    try {
      let cleaned = raw.replace(/```json|```/g,'').trim();
      const s = cleaned.indexOf('{');
      const e = cleaned.lastIndexOf('}');
      if (s !== -1 && e !== -1) cleaned = cleaned.slice(s, e+1);
      return res.status(200).json(JSON.parse(cleaned));
    } catch(e) { return res.status(500).json({ error: 'Validator parse error' }); }
  }

  // ── PASSTHROUGH MODE — UNTOUCHED ─────────────────────────────────────
  if (body.system && body.messages) {
    const aiRes = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-api-key': apiKey, 'anthropic-version': '2023-06-01' },
      body: JSON.stringify({ model: 'claude-haiku-4-5-20251001', max_tokens: body.max_tokens||2000, system: body.system, messages: body.messages })
    });
    const aiData = await aiRes.json();
    const raw = (aiData.content||[]).filter(b=>b.type==='text').map(b=>b.text).join('');
    return res.status(200).json({ content: [{ type: 'text', text: raw }] });
  }

  return res.status(400).json({ error: 'Invalid request format' });
}
```

Copy that whole block into `api/generate.mjs`, push, and test.
