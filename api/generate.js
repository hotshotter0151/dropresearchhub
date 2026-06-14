export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();

  const ANTHROPIC_KEY = process.env.ANTHROPIC_API_KEY;
  const SERP_KEY = process.env.SERP_API_KEY;
  if (!ANTHROPIC_KEY) return res.status(500).json({ error: 'API key not configured' });

  const body = req.body || {};

  // ── Ad Creative Generator ─────────────────────────────────────────────
  if (body.system && body.messages) {
    try {
      const r = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: { 'x-api-key': ANTHROPIC_KEY, 'anthropic-version': '2023-06-01', 'content-type': 'application/json' },
        body: JSON.stringify({ model: 'claude-sonnet-4-6', max_tokens: 2000, system: body.system, messages: body.messages })
      });
      const rd = await r.json();
      return res.status(200).json(rd);
    } catch (e) {
      return res.status(500).json({ error: e.message });
    }
  }

  // ── Fetch trending market data via SerpApi ────────────────────────────
  async function fetchTrendData() {
    if (!SERP_KEY) return '';
    try {
      const [amazon, tiktok] = await Promise.all([
        fetch(`https://serpapi.com/search.json?engine=google&q=amazon+uk+movers+and+shakers+2026&api_key=${SERP_KEY}&gl=uk&hl=en&num=3`).then(r => r.json()).catch(() => ({})),
        fetch(`https://serpapi.com/search.json?engine=google&q=tiktok+shop+uk+trending+products+2026&api_key=${SERP_KEY}&gl=uk&hl=en&num=3`).then(r => r.json()).catch(() => ({}))
      ]);
      const amazonSnippets = (amazon.organic_results || []).slice(0, 2).map(r => r.snippet).filter(Boolean).join(' ');
      const tiktokSnippets = (tiktok.organic_results || []).slice(0, 2).map(r => r.snippet).filter(Boolean).join(' ');
      return `LIVE MARKET SIGNALS:
Amazon UK Movers & Shakers: ${amazonSnippets || 'Data unavailable'}
TikTok Shop UK Trending: ${tiktokSnippets || 'Data unavailable'}`;
    } catch (e) { return ''; }
  }

  // ── Fetch product image via SerpApi ──────────────────────────────────
  async function fetchImage(productName) {
    if (!SERP_KEY) return '';
    try {
      const queries = [
        `${productName} product`,
        productName.split(' ').slice(0, 3).join(' '),
        productName.split(' ').slice(0, 2).join(' ')
      ];
      for (const q of queries) {
        const r = await fetch(`https://serpapi.com/search.json?engine=google_images&q=${encodeURIComponent(q)}&api_key=${SERP_KEY}&num=3&gl=gb&hl=en`, { signal: AbortSignal.timeout(4000) });
        const d = await r.json();
        const img = d?.images_results?.[0]?.original || d?.images_results?.[0]?.thumbnail || '';
        if (img) return img;
      }
    } catch (e) {}
    return '';
  }

  // ── Emerging Products Generation ──────────────────────────────────────
  const mode = body.mode || 'emerging';
  if (mode === 'emerging') {
    const trendData = await fetchTrendData();
    const today = new Date().toISOString().split('T')[0];

    const prompt = `You are a world-class ecommerce product researcher specialising in finding emerging dropshipping products for UK beginners. Today is ${today}.

${trendData}

Generate exactly 3 GENUINELY EMERGING products — items just starting to gain traction NOW, NOT already saturated classics.

STRICT RULES:
- Never suggest: massage guns, resistance bands, air fryers, posture correctors, LED lights, phone cases, or anything viral for over 12 months
- Each product must solve a clear problem, be demonstrable in under 10 seconds of video, and have impulse-buy potential
- Price range: £20-£60 sell price, supplier cost under 35% of sell price
- Must be lightweight, unbranded, non-medical, non-supplement, non-weapon
- Must show signs of EARLY growth — not peak, not declining

Respond ONLY with a valid JSON array, no markdown, no backticks:

[
  {
    "name": "Product Name",
    "emoji": "📦",
    "niche": "Niche Category",
    "season": "Evergreen",
    "grade": "A+",
    "verdict": "Strong Opportunity",
    "verdictReason": "One sentence explaining the verdict",
    "emergingScore": 87,
    "trendScore": 82,
    "problemScore": 78,
    "saturationRisk": "Low",
    "saturation": 25,
    "margin": "65%",
    "sellingPrice": "£34.99",
    "supplierCost": "£8.50",
    "whyEmerging": "One punchy sentence why this is emerging RIGHT NOW",
    "whyNow": "Same as whyEmerging",
    "whyNowDetailed": "2-3 sentences of specific reasoning about WHY this product is emerging now. Mention specific signals like content patterns, consumer behaviour shifts, seasonal triggers. Be honest this is AI assessment not live data.",
    "targetCustomer": "Who buys this and why",
    "problemSolved": "The specific problem this solves",
    "mainAngle": "The strongest selling angle",
    "tiktokAngle": "Specific TikTok content angle",
    "metaAngle": "Specific Meta ad angle",
    "bundleIdea": "What to bundle or upsell",
    "redFlags": "Any risks or None",
    "aliSearchTerm": "aliexpress search term",
    "googleTrendsKeyword": "2 word max keyword",
    "supplierSearchTerms": ["exact search term 1", "exact search term 2", "exact search term 3"],
    "growthCurve": [12, 19, 28, 41, 58, 72, 85],
    "windowClosesWeek": 8,
    "scoring": {
      "trendGrowth": 22,
      "problemSolving": 17,
      "videoPotential": 13,
      "profitMargin": 12,
      "competitionLevel": 11,
      "audienceSize": 8
    },
    "launchReadiness": [
      { "check": "Demonstrable in under 10 seconds of video", "pass": true },
      { "check": "Solves a problem most people recognise instantly", "pass": true },
      { "check": "Available on AliExpress under £10", "pass": true },
      { "check": "Sellable between £20-£60", "pass": true },
      { "check": "Not already saturating UK TikTok feeds", "pass": true },
      { "check": "Strong impulse-buy angle", "pass": true },
      { "check": "Lightweight and easy to ship", "pass": true },
      { "check": "No legal or compliance issues", "pass": true }
    ],
    "whyItCouldWork": ["Reason 1", "Reason 2", "Reason 3"],
    "risks": ["Risk 1", "Risk 2"],
    "creativeAngles": ["Angle 1", "Angle 2", "Angle 3"],
    "growthData": [
      {"label":"W1","value":12},{"label":"W2","value":22},{"label":"W3","value":36},
      {"label":"W4","value":54},{"label":"W5","value":71},{"label":"W6","value":86}
    ]
  }
]

IMPORTANT for growthCurve — generate 7 numbers reflecting the ACTUAL trajectory of this specific product:
- Slow burn: [8,12,18,27,39,54,68]
- Rapid spike: [15,32,58,79,88,85,78]
- Steady climb: [20,30,42,54,65,75,84]
- Early stage: [5,8,13,21,34,50,65]
Make each product curve genuinely different.

IMPORTANT for windowClosesWeek — be specific per product:
- Fast-rising products: week 5-6
- Steady climbers: week 9-10
- Slow burns: week 11-12

IMPORTANT for launchReadiness — be honest. If shipping is slow set that to false. If compliance is borderline set it false. Don't make everything pass=true.`;

    try {
      const aiRes = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: { 'x-api-key': ANTHROPIC_KEY, 'anthropic-version': '2023-06-01', 'content-type': 'application/json' },
        body: JSON.stringify({ model: 'claude-sonnet-4-6', max_tokens: 4000, messages: [{ role: 'user', content: prompt }] })
      });
      const aiData = await aiRes.json();
      if (!aiRes.ok) return res.status(500).json({ error: aiData.error?.message || 'AI error' });
      const rawText = (aiData.content || []).map(i => i.text || '').join('');
      const s = rawText.indexOf('[');
      const e = rawText.lastIndexOf(']');
      if (s === -1 || e === -1) return res.status(500).json({ error: 'No product array in response' });
      let products = JSON.parse(rawText.slice(s, e + 1));

      // Fetch images in parallel
      const withImages = await Promise.all(
        products.map(async (p) => {
          const img = await Promise.race([
            fetchImage(p.name),
            new Promise(resolve => setTimeout(() => resolve(''), 8000))
          ]);
          return { ...p, img };
        })
      );
      return res.status(200).json({ content: [{ type: 'text', text: JSON.stringify(withImages) }] });
    } catch (e) {
      return res.status(500).json({ error: e.message });
    }
  }

  return res.status(400).json({ error: 'Unknown mode' });
}
