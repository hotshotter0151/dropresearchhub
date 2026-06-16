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

  // ── IMAGE FETCHING ────────────────────────────────────────────────────────
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

  // ── ALIEXPRESS ENRICHMENT ────────────────────────────────────────────────
  async function enrichFromAliExpress(aliSearchTerm) {
    const rapidApiKey = process.env.RAPIDAPI_KEY;
    if (!rapidApiKey || !aliSearchTerm) return null;
    try {
      const url = `https://aliexpress-api2.p.rapidapi.com/search?SearchText=${encodeURIComponent(aliSearchTerm)}&page=1&pageSize=3`;
      const r = await fetch(url, {
        headers: {
          'x-rapidapi-host': 'aliexpress-api2.p.rapidapi.com',
          'x-rapidapi-key': rapidApiKey
        },
        signal: AbortSignal.timeout(5000)
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
        shippingDays: first.logisticsDesc || null,
        aliTitle: first.title || null
      };
    } catch (e) {
      console.log('[DRH] AliExpress enrichment failed:', e.message);
      return null;
    }
  }

  // ── FETCH TRENDING DATA (no new sources) ─────────────────────────────────
  async function fetchTrendingData() {
    const results = [];

    try {
      const r = await fetch(
        `https://serpapi.com/search.json?engine=amazon&amazon_domain=amazon.co.uk&type=movers_and_shakers&api_key=${serpApiKey}`,
        { signal: AbortSignal.timeout(5000) }
      );
      if (r.ok) {
        const data = await r.json();
        const items = (data?.movers_and_shakers || []).slice(0, 15).map(i => i?.title).filter(Boolean);
        if (items.length) results.push(`AMAZON UK MOVERS & SHAKERS:\n${items.join('\n')}`);
      }
    } catch (e) { console.log('[DRH] Amazon UK failed'); }

    try {
      const r = await fetch(
        `https://serpapi.com/search.json?engine=amazon&amazon_domain=amazon.com&type=movers_and_shakers&api_key=${serpApiKey}`,
        { signal: AbortSignal.timeout(5000) }
      );
      if (r.ok) {
        const data = await r.json();
        const items = (data?.movers_and_shakers || []).slice(0, 15).map(i => i?.title).filter(Boolean);
        if (items.length) results.push(`AMAZON US MOVERS & SHAKERS (early UK mover intel):\n${items.join('\n')}`);
      }
    } catch (e) { console.log('[DRH] Amazon US failed'); }

    try {
      const r = await fetch(
        'https://trends.google.com/trends/api/dailytrends?hl=en-GB&tz=-60&geo=GB&ns=15',
        { headers: { 'User-Agent': 'Mozilla/5.0' }, signal: AbortSignal.timeout(5000) }
      );
      if (r.ok) {
        const raw = await r.text();
        const json = JSON.parse(raw.replace(/^\)\]\}'/, '').trim());
        const searches = json?.default?.trendingSearchesDays?.[0]?.trendingSearches || [];
        const keywords = searches.map(s => s?.title?.query).filter(Boolean).slice(0, 15);
        if (keywords.length) results.push(`UK GOOGLE TRENDS TODAY:\n${keywords.join(', ')}`);
      }
    } catch (e) { console.log('[DRH] UK Trends failed'); }

    try {
      const r = await fetch(
        'https://trends.google.com/trends/api/dailytrends?hl=en-US&tz=300&geo=US&ns=15',
        { headers: { 'User-Agent': 'Mozilla/5.0' }, signal: AbortSignal.timeout(5000) }
      );
      if (r.ok) {
        const raw = await r.text();
        const json = JSON.parse(raw.replace(/^\)\]\}'/, '').trim());
        const searches = json?.default?.trendingSearchesDays?.[0]?.trendingSearches || [];
        const keywords = searches.map(s => s?.title?.query).filter(Boolean).slice(0, 10);
        if (keywords.length) results.push(`US GOOGLE TRENDS TODAY:\n${keywords.join(', ')}`);
      }
    } catch (e) { console.log('[DRH] US Trends failed'); }

    try {
      const r = await fetch(
        `https://serpapi.com/search.json?engine=google&q=tiktok+shop+uk+trending+products+${new Date().getFullYear()}&gl=gb&hl=en&api_key=${serpApiKey}&num=5`,
        { signal: AbortSignal.timeout(5000) }
      );
      if (r.ok) {
        const data = await r.json();
        const snippets = (data?.organic_results || []).slice(0, 3).map(r => r?.snippet).filter(Boolean);
        if (snippets.length) results.push(`TIKTOK SHOP UK SIGNALS:\n${snippets.join('\n')}`);
      }
    } catch (e) { console.log('[DRH] TikTok failed'); }

    return results.join('\n\n');
  }

  // ── FETCH PUBLISHED HISTORY + NICHE TRACKING ─────────────────────────────
  async function fetchPublishedHistory() {
    if (!supabaseKey) return { names: [], recentNiches: [] };
    try {
      const r = await fetch(
        `${supabaseUrl}/rest/v1/products?select=name,data&order=published_at.desc&limit=40`,
        { headers: { 'apikey': supabaseKey, 'Authorization': `Bearer ${supabaseKey}` } }
      );
      if (!r.ok) return { names: [], recentNiches: [] };
      const data = await r.json();
      return {
        names: data.map(p => p.name).filter(Boolean),
        recentNiches: data.slice(0, 15).map(p => p.data?.niche).filter(Boolean)
      };
    } catch (e) { return { names: [], recentNiches: [] }; }
  }

  // ── NICHE ROTATION ────────────────────────────────────────────────────────
  const NICHE_POOL = [
    'Pet care & accessories',
    'Garden & outdoor living',
    'Car & van accessories',
    'Baby & toddler',
    'Sports & fitness equipment',
    'Kitchen gadgets & food prep',
    'Home organisation & storage',
    'Beauty & skincare tools',
    'Tech accessories & gadgets',
    'Office & desk productivity',
    'Travel & luggage accessories',
    'Cleaning & household',
    'Sleep & wellness',
    'Mens grooming & style',
    'Womens fashion accessories',
    'Cycling & e-scooter accessories',
    'Kids toys & education',
    'Crafts & hobbies',
    'Fishing & outdoor sports',
    'DIY & tools'
  ];

  function pickNiches(recentNiches) {
    const recentSet = new Set(recentNiches);
    const fresh = NICHE_POOL.filter(n => !recentSet.has(n));
    const pool = fresh.length >= 3 ? fresh : NICHE_POOL;
    return [...pool].sort(() => Math.random() - 0.5).slice(0, 3);
  }

  // ── EMERGING PRODUCTS MODE ────────────────────────────────────────────────
  if (body.mode === 'emerging') {

    console.log('[DRH] Starting generation...');

    const [trendingContext, history] = await Promise.all([
      fetchTrendingData(),
      fetchPublishedHistory()
    ]);

    const { names: publishedNames, recentNiches } = history;
    const selectedNiches = pickNiches(recentNiches);

    console.log('[DRH] 3 Niches:', selectedNiches.join(' | '));
    console.log('[DRH] Avoiding:', publishedNames.length, 'products');

    const systemPrompt = `You are the product intelligence analyst for DropResearch Hub, a UK dropshipping research platform. Today is ${today}.

LIVE DATA:
${trendingContext || 'Use knowledge of mid-2026 UK ecommerce trends.'}

NEVER REPEAT THESE (already published):
${publishedNames.length > 0 ? publishedNames.join(', ') : 'None yet'}

RECENT NICHES (avoid for variety):
${recentNiches.length > 0 ? recentNiches.slice(0, 8).join(', ') : 'None yet'}

ASSIGNMENT: Find exactly 3 products — one from each:
NICHE 1: ${selectedNiches[0]}
NICHE 2: ${selectedNiches[1]}
NICHE 3: ${selectedNiches[2]}

CORE PRINCIPLES:
- OPPORTUNITY over popularity. A small accelerating trend in an open market beats a large flat trend
- DISCOVERY over obviousness. Subscribers pay to find products they haven't seen before
- SUBSCRIBER VALUE. Would a paid newsletter subscriber feel genuinely excited by this pick?
- Only output products you would personally be excited to launch with £100 of your own money

HARD REJECTS (instant):
- Supplements, food, drink, medical claims, dangerous, weapons, age-restricted
- Trademarked/branded/counterfeit risk
- Requires special UK licence
- Outside assigned niche
- Digital products, print on demand
- Already in published list above
- BANNED: air fryers, massage guns, resistance bands, LED strips, posture correctors, water bottles, phone cases, beard trimmers, wireless earbuds, yoga mats, fitness trackers, bluetooth speakers

SCORE EVERY PRODUCT (using only the live data above, no new searches):

CORE /100:
- UK Market Gap /25
- Competition Barrier /20
- Problem Intensity /20
- Early Signal Strength /15
- Profit Potential /12
- Ease of Entry /8
Minimum: 62/100

ENHANCED SCORES (1-10 each, use live data only):
- Trend Velocity: Accelerating(8-10)/Rising(5-7)/Stable(3-4)/Declining(1-2). Reject Stable/Declining.
- Creative Potential: scroll-stop, demo, before/after potential. Below 6 = reject.
- Brandability: SKU range, repeat purchase, upsells. Penalise commodities.
- Retail Gap: hard to find in Tesco/Argos/B&M = high score.
- Content Longevity: 30+ TikTok/UGC concepts possible? Below 6 = penalise.
- Subscriber Excitement /10: how excited would a paid subscriber be? Below 5 = drop confidence.
- Opportunity Multiplier /10: Market Gap + Trend Velocity + Creative Potential combined. Most important.

Why Now: identify PRIMARY driver (lifestyle/cost-saving/social media/tech/behaviour/cultural/regulatory). If unclear → confidence = Speculative.
Confidence Boost: if Multiplier>=8 AND Excitement>=8 AND Creative>=8 AND Velocity=Accelerating → raise confidence one level.
Price: £10-25 impulse(55%+ margin) / £25-60 considered(45%+) / £60-150 premium(38%+).
Investment Test — all 3 YES required or exclude: 1) operator spend £100 next week? 2) confident launching ads? 3) subscriber feels genuine value?

Return ONLY a valid JSON array of exactly 3 objects. No markdown, no backticks, nothing outside the array.

Required fields per product:
{"name":"specific name","niche":"assigned niche","emoji":"emoji","stage":"Pre-launch|Early Adopter|Growing","season":"Evergreen","grade":"A+|A|B+|B","confidence":"High|Medium|Speculative","investmentTest":"TEST","trendVelocity":"Accelerating|Rising","whyNow":"primary driver + specific reason in one sentence","subscriberExcitement":number,"opportunityMultiplier":number,"trendScore":number,"problemScore":number,"saturationRisk":"Low|Medium","competitionLevel":"Low|Medium","emergingScore":number,"supplierCost":"£X-£X","sellingPrice":"£X-£X","margin":"XX%","targetCustomer":"specific UK customer","whyEmerging":"max 20 words","problemSolved":"max 15 words","mainAngle":"max 15 words","tiktokAngle":"max 20 words","metaAngle":"max 20 words","usAuSignal":"max 20 words","verdict":"Strong Opportunity|Watch List","verdictReason":"max 20 words","whyItCouldWork":["reason 1","reason 2","reason 3"],"risks":["risk 1","risk 2"],"bundleIdea":"max 15 words","repeatPurchase":true,"repeatReason":"why or null","aliSearchTerm":"term","cjSearchTerm":"term","googleTrendsKeyword":"keyword","opportunityWindow":"X-Y weeks","scoring":{"ukMarketGap":number,"competitionBarrier":number,"problemIntensity":number,"earlySignalStrength":number,"profitPotential":number,"easeOfEntry":number,"coreTotal":number,"trendVelocityScore":number,"creativePotential":number,"brandability":number,"retailGap":number,"contentLongevity":number},"bgColor":"#EFF6FF","growthData":[{"label":"W1","value":8},{"label":"W2","value":18},{"label":"W3","value":33},{"label":"W4","value":52},{"label":"W5","value":70},{"label":"W6","value":84}]}`;
    const aiRes = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-6',
        max_tokens: 6000,
        system: systemPrompt,
        messages: [{
          role: 'user',
          content: `Today is ${today}. Using the live market data above, find 3 genuinely exciting UK dropshipping discoveries — one each from: ${selectedNiches.join(' | ')}. Apply all 6 final principles. Prioritise opportunity over popularity, discovery over obviousness. Only include products that pass all three investment test questions and that you would personally be excited to launch. Return ONLY the JSON array of exactly 3 products.`
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
    console.log('[DRH] Response length:', rawText.length);

    let cleaned = rawText.replace(/```json/gi, '').replace(/```/g, '').trim();
    console.log('[DRH] Raw response start:', cleaned.slice(0, 150));

    const start = cleaned.indexOf('[');
    const end = cleaned.lastIndexOf(']');
    if (start === -1 || end === -1) {
      console.error('[DRH] No JSON array in response. Full response:', cleaned.slice(0, 500));
      // Retry with stricter instruction
      const retryRes = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-api-key': apiKey, 'anthropic-version': '2023-06-01' },
        body: JSON.stringify({
          model: 'claude-sonnet-4-6',
          max_tokens: 6000,
          system: systemPrompt,
          messages: [
            { role: 'user', content: `Today is ${today}. Find 3 UK dropshipping products — one each from: ${selectedNiches.join(' | ')}. Return ONLY the JSON array starting with [ and ending with ]. Nothing else.` },
            { role: 'assistant', content: '[' }
          ]
        })
      });
      const retryData = await retryRes.json();
      const retryText = '[' + (retryData.content || []).filter(b => b.type === 'text').map(b => b.text).join('');
      const rs = retryText.indexOf('[');
      const re = retryText.lastIndexOf(']');
      if (rs === -1 || re === -1) return res.status(500).json({ error: 'No product array found after retry' });
      cleaned = retryText.slice(rs, re + 1);
    } else {
      cleaned = cleaned.slice(start, end + 1);
    }

    let products;
    try {
      products = JSON.parse(cleaned);
    } catch (e) {
      console.error('[DRH] Parse error:', e.message, cleaned.slice(0, 200));
      return res.status(500).json({ error: 'Parse error: ' + e.message });
    }

    // Safety filter — strip any PASS products
    products = products.filter(p => p.investmentTest !== 'PASS');

    // Run AliExpress enrichment + SerpAPI fallback in parallel
    console.log('[DRH] Enriching from AliExpress...');
    const enrichments = await Promise.all(
      products.map(p => enrichFromAliExpress(p.aliSearchTerm))
    );

    // Only call SerpAPI for products AliExpress didn't match
    const serpImages = await Promise.all(
      products.map((p, i) =>
        enrichments[i]?.img ? Promise.resolve('') : fetchProductImage(p.name)
      )
    );

    // Merge enrichment into product objects
    products = products.map((p, i) => {
      const ali = enrichments[i];
      const fallbackImg = serpImages[i];
      return {
        ...p,
        img: ali?.img || fallbackImg || '',
        // Real supplier price from AliExpress — kept as returned, labelled as approximate USD
        supplierCost: ali?.supplierPrice
          ? `£${parseFloat(String(ali.supplierPrice).replace(/[^\d.]/g, '')).toFixed(2)} (AliExpress live price)`
          : p.supplierCost,
        // Real market signals
        aliOrderCount: ali?.orderCount || null,
        aliRating: ali?.rating || null,
        aliReviewCount: ali?.reviewCount || null,
        aliShipping: ali?.shippingDays || null,
        // Override Claude saturation estimate with real order data
        saturationRisk: ali?.orderCount
          ? ali.orderCount > 10000 ? 'Medium'
            : 'Low'
          : p.saturationRisk
      };
    });

    console.log('[DRH] Done:', products.map(p =>
      p.name + ' [' + p.confidence + '] [excitement:' + p.subscriberExcitement + '] [opportunity:' + p.opportunityMultiplier + ']'
    ).join(' | '));

    return res.status(200).json({ content: [{ type: 'text', text: JSON.stringify(products) }] });
  }

  // ── PRODUCT VALIDATOR ─────────────────────────────────────────────────────
  if (body.productName) {
    const aiRes = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-api-key': apiKey, 'anthropic-version': '2023-06-01' },
      body: JSON.stringify({
        model: 'claude-sonnet-4-6',
        max_tokens: 1500,
        system: `You are an expert UK ecommerce product analyst for DropResearch Hub. Analyse products for UK beginner dropshippers in 2026. Return ONLY valid JSON — no markdown, no backticks, nothing outside the JSON object.

Required fields:
{
  "productName": "string",
  "opportunityScore": "A+|A|B+|B|C+|C|D",
  "marketStage": "string",
  "growthScore": number,
  "competitionScore": number,
  "saturationRisk": "Low|Medium|High|Very High",
  "verdict": "one clear honest sentence",
  "sellingPrice": "£X–£X",
  "supplierCost": "£X–£X",
  "margin": "XX%",
  "opportunityWindow": "X–Y weeks",
  "ukMarketNotes": "specific UK market context",
  "confidence": "High|Medium|Speculative",
  "trendVelocity": "Accelerating|Rising|Stable|Declining",
  "creativePotential": number,
  "brandability": number,
  "retailGap": number,
  "contentLongevity": number,
  "subscriberExcitement": number,
  "opportunityMultiplier": number,
  "whyNow": "primary driver category and specific reason",
  "investmentTest": "TEST|PASS",
  "whyItCouldWork": ["reason 1", "reason 2", "reason 3"],
  "risks": ["risk 1", "risk 2", "risk 3"],
  "creativeAngles": ["angle 1", "angle 2", "angle 3"],
  "growthGraph": [
    {"label":"W1","value":number},
    {"label":"W2","value":number},
    {"label":"W3","value":number},
    {"label":"W4","value":number},
    {"label":"W5","value":number},
    {"label":"W6","value":number}
  ]
}`,
        messages: [{ role: 'user', content: `Analyse for UK dropshipping 2026: ${body.productName}` }]
      })
    });
    const aiData = await aiRes.json();
    const raw = (aiData.content || []).filter(b => b.type === 'text').map(b => b.text).join('');
    try {
      return res.status(200).json(JSON.parse(raw.replace(/```json|```/g, '').trim()));
    } catch (e) {
      return res.status(500).json({ error: 'Validator parse error' });
    }
  }

  // ── PASSTHROUGH ───────────────────────────────────────────────────────────
  if (body.system && body.messages) {
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
