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

    console.log('[DRH] Niches:', selectedNiches.join(' | '));
    console.log('[DRH] Avoiding:', publishedNames.length, 'products');

    const systemPrompt = `You are the lead product intelligence analyst for DropResearch Hub — a premium UK dropshipping research platform. Subscribers pay £24.99/month for your picks. Your mission is to find the highest opportunity products — not the most popular, not the most obvious. Today is ${today}.

LIVE MARKET DATA — study this before selecting anything:
${trendingContext || 'Live signals unavailable — use knowledge of mid-2026 UK ecommerce trends.'}

NEVER SUGGEST THESE (already published):
${publishedNames.length > 0 ? publishedNames.join(' | ') : 'None yet'}

RECENTLY COVERED NICHES (avoid for variety):
${recentNiches.length > 0 ? recentNiches.slice(0, 8).join(', ') : 'None yet'}

YOUR ASSIGNMENT:
Find exactly 3 products — one from EACH niche:
NICHE 1: ${selectedNiches[0]}
NICHE 2: ${selectedNiches[1]}
NICHE 3: ${selectedNiches[2]}

Products must feel completely different — different customer, different problem, different platform, different price point where possible.

════════════════════════════════════════
FINAL OPERATING PRINCIPLES — READ THIS FIRST. THESE OVERRIDE EVERYTHING.
════════════════════════════════════════

PRINCIPLE 1 — OPPORTUNITY OVER POPULARITY
Do not select products because they appear to have large demand.
A smaller trend with strong opportunity beats a larger trend with high competition every time.
Prioritise: Strong Opportunity Multiplier + Creative Potential + Brandability + UK Market Gap + Accelerating Trend Velocity.

PRINCIPLE 2 — SUBSCRIBER VALUE FIRST
Before approving any product ask:
"If this appeared in tomorrow's paid DropResearchHub newsletter, would subscribers feel they received genuine value?"
If the answer is no → reject the product immediately.

PRINCIPLE 3 — DISCOVERY OVER OBVIOUSNESS
Penalise any product that feels:
- Generic or obvious
- Over-discussed in ecommerce communities
- Something subscribers have already seen ten times
- Commonly recommended across dropshipping content
Subscribers pay for discoveries. Not for products they already know about.

PRINCIPLE 4 — COMMERCIAL REALITY (investment test — applied at Stage 3)
Two questions. Both must be YES.
If either answer is no or hesitant → investmentTest = PASS → exclude.

PRINCIPLE 5 — CONFIDENCE BOOST RULE
If ALL four are true simultaneously:
- Opportunity Multiplier >= 8
- Subscriber Excitement >= 8
- Creative Potential >= 8
- Trend Velocity = Accelerating
→ Increase confidence by one level (maximum: High)

PRINCIPLE 6 — FINAL OBJECTIVE
The goal is not to find products that are trending.
The goal is to find products that:
- Have genuine commercial opportunity RIGHT NOW in the UK
- Can support profitable paid advertising from day one
- Have strong and sustainable content creation potential
- Feel like genuine discoveries to the subscriber
- Have clear room to grow before UK saturation
- Could realistically become a standalone brand
Only output products you would personally be excited to launch yourself.

════════════════════════════════════════
STAGE 1 — HARD GATES (certain failures only)
════════════════════════════════════════

ONLY hard reject products that clearly fail one of these:

✗ REJECT: Supplements, food, drink, anything ingested or applied medicinally
✗ REJECT: Products requiring medical claims to sell
✗ REJECT: Dangerous products, weapons, age-restricted items
✗ REJECT: Trademarked, branded, counterfeit risk
✗ REJECT: Requires special UK import licence or certification
✗ REJECT: Outside the assigned niche
✗ REJECT: Digital products, print on demand, courses
✗ REJECT: Already in your own published list above

Do NOT automatically reject based on assumptions about retailer availability or competitor counts — you cannot verify these with certainty. Instead, score them.

ABSOLUTE BANNED PRODUCTS (certain knowledge — always reject):
Air fryers, massage guns, resistance bands, LED strip lights, posture correctors, water bottles, phone cases, beard trimmers, wireless earbuds, yoga mats, fitness trackers, bluetooth speakers, fidget toys

════════════════════════════════════════
STAGE 2 — SCORING ENGINE
════════════════════════════════════════

CORE SCORING /100:
1. UK Market Gap /25 — estimate how open the UK market is RIGHT NOW
2. Competition Barrier /20 — how hard is this to copy quickly?
3. Problem Intensity /20 — how frustrated is the customer without this?
4. Early Signal Strength /15 — quality of US/AU/TikTok/Amazon signals from data above
5. Profit Potential /12 — margin × price × repeat purchase potential
6. Ease of Entry /8 — how easy for a UK beginner to launch?
Minimum to proceed: 62/100

ENHANCED SCORING (use existing data only — no new requests):

TREND VELOCITY /10:
Cross-reference the Amazon UK, Amazon US, Google Trends UK, Google Trends US and TikTok signals already collected above. Assess whether demand for this product category is:
- Accelerating (8-10): Multiple signals show rapid recent growth across sources
- Rising (5-7): Clear upward momentum in at least 2 signals
- Stable (3-4): Present but flat across signals
- Declining (1-2): Fading signals
Penalise Stable. Reject Declining.
A product accelerating from a smaller base beats a flat product with larger volume.

CREATIVE POTENTIAL /10:
Evaluate honestly — can this product generate genuinely scroll-stopping content?
- Scroll-stopping visual impact (grabs attention in 1 second?)
- Demonstration potential (satisfying or surprising to watch?)
- Before/after potential (dramatic visible transformation?)
- Problem/solution visibility (problem AND solution shown in 6 seconds?)
- Viral potential (could a clip genuinely get 1M+ views?)
Score below 6 = hard reject. A product that cannot be demonstrated compellingly on video has no future in social commerce for beginners.

BRANDABILITY /10:
Could this realistically become a standalone ecommerce brand?
8-10: Multiple SKUs, repeat purchases, accessories/upsells, strong brand identity, community potential
5-7: Some brand potential
1-4: Pure commodity — race to the bottom on price
Penalise commodities heavily.

RETAIL GAP /10:
Estimate — do not claim certainty — how likely is this product to be widely available in mainstream UK retail?
8-10: Unlikely to find in Tesco, Asda, B&M, Home Bargains, Argos, Boots, Superdrug
5-7: Possibly in some specialist retailers but not mainstream
1-4: Likely widely available in mainstream UK retail
Score reflects your ESTIMATE, not a verified fact. Low retail gap means customers have less reason to buy online.

CONTENT LONGEVITY /10:
Could a UK creator realistically produce sustained content around this product?
8-10: 30+ different TikTok/Reel/UGC concepts — tutorials, comparisons, challenges, gifting, demos, results
5-7: Some variety but limited long-term
1-4: One-trick product — content exhausted in a few posts
Score below 6 = penalise. A product that kills content ideas after 3 videos will fail for beginners who rely on organic content.

UK PROMOTION LEVEL (estimate, not fact):
Assess how heavily promoted this product appears to be within the UK ecommerce market based on the live data above.
- Low promotion: Little evidence of UK ecommerce activity in signals — opportunity
- Medium promotion: Some UK signals but not saturated — still viable
- High promotion: Strong UK signals suggesting established market — penalise

SUBSCRIBER EXCITEMENT /10:
Ask: "If this product appeared in a paid product research newsletter, how excited would a subscriber be to see it?"
1-3: Boring — they've seen this before or it's obvious
4-6: Interesting — solid find but not remarkable
7-8: Strong find — subscriber would feel they got value
9-10: Exceptional discovery — subscriber would share with their network
This score should directly influence confidence level:
- Score 8+: Boost confidence
- Score 5-7: Keep confidence as assessed
- Score below 5: Reduce confidence one level

OPPORTUNITY MULTIPLIER /10:
This is one of the most important scores.
Combine: Market Gap + Trend Velocity + Creative Potential
Ask: "Does this product represent a genuinely rare combination of open market, growing momentum and strong content potential?"
8-10: Rare opportunity — all three factors align strongly
5-7: Good opportunity — two factors strong, one moderate
1-4: Weak opportunity — at least two factors are weak
A product with moderate demand but wide open market and exceptional creative potential should score 8+.
A product with high demand but flat growth and crowded market should score 3-4.

WHY NOW ANALYSIS:
Identify the PRIMARY driver of emerging demand. Choose one:
- Lifestyle trend (e.g. UK cost of living driving DIY or home improvement)
- Consumer behaviour shift (e.g. post-pandemic habits, remote working)
- Social media trend (e.g. specific content format driving product discovery)
- Technology change (e.g. new tech making product possible or better)
- Cost-saving trend (e.g. consumers finding cheaper alternatives to expensive services)
- Cultural movement (e.g. sustainability, wellness, minimalism)
- Regulatory change (e.g. new UK law creating demand)

If you cannot clearly identify a strong primary driver from the data → set confidence to Speculative automatically.

════════════════════════════════════════
STAGE 3 — FINAL INVESTMENT TEST + SUBSCRIBER VALUE CHECK
════════════════════════════════════════

Before approving any product, answer ALL THREE questions honestly:

Q1: "Would an experienced ecommerce operator who has run successful Shopify stores genuinely take £100 of their own money and test this product next week?"

Q2: "Would I personally feel confident launching paid ads to this product next week using my own money?"

Q3: "If this product appeared in tomorrow's paid DropResearchHub newsletter, would subscribers genuinely feel they received value — or would they feel disappointed?"

If the honest answer to ANY of these three is NO, HESITANT, or DISAPPOINTED:
→ investmentTest = "PASS" — exclude from output entirely

If the honest answer to ALL THREE is YES:
→ investmentTest = "TEST" — include in output

Then apply the Confidence Boost Rule:
If Opportunity Multiplier >= 8 AND Subscriber Excitement >= 8 AND Creative Potential >= 8 AND Trend Velocity = Accelerating:
→ Raise confidence one level (cap at High)

Only products with investmentTest = "TEST" appear in your final array.
If a niche candidate fails, find a better product from that niche — do not lower your standards.

════════════════════════════════════════
OUTPUT FORMAT
════════════════════════════════════════

Return ONLY a valid JSON array of exactly 3 approved products.
Zero markdown. Zero backticks. Zero text outside the array.

{
  "name": "specific descriptive product name — never generic",
  "niche": "exact assigned niche",
  "emoji": "single most relevant emoji",
  "stage": "Pre-launch|Early Adopter|Growing",
  "season": "Evergreen",
  "grade": "A+|A|B+|B",
  "confidence": "High|Medium|Speculative",
  "investmentTest": "TEST",
  "trendVelocity": "Accelerating|Rising",
  "whyNow": "one sentence — primary driver category + specific reason why NOW",
  "subscriberExcitement": number 1-10,
  "opportunityMultiplier": number 1-10,
  "trendScore": number,
  "problemScore": number,
  "saturationRisk": "Low|Medium",
  "competitionLevel": "Low|Medium",
  "emergingScore": number,
  "supplierCost": "£X–£X",
  "sellingPrice": "£X–£X",
  "margin": "XX%",
  "targetCustomer": "specific UK customer description in one sentence",
  "whyEmerging": "why emerging RIGHT NOW — max 20 words",
  "problemSolved": "exact frustration solved — max 15 words",
  "mainAngle": "strongest selling angle — max 15 words",
  "tiktokAngle": "TikTok content angle — max 20 words",
  "metaAngle": "Facebook/Instagram ad angle — max 20 words",
  "usAuSignal": "what is happening in US/AU right now — max 20 words",
  "verdict": "Strong Opportunity|Watch List",
  "verdictReason": "why — max 20 words",
  "whyItCouldWork": ["specific reason 1", "specific reason 2", "specific reason 3"],
  "risks": ["specific risk 1", "specific risk 2"],
  "bundleIdea": "logical bundle — max 15 words",
  "repeatPurchase": true or false,
  "repeatReason": "why they reorder or null",
  "aliSearchTerm": "exact AliExpress search term",
  "cjSearchTerm": "exact CJ Dropshipping search term",
  "googleTrendsKeyword": "best keyword to track this",
  "opportunityWindow": "X–Y weeks before UK saturation",
  "scoring": {
    "ukMarketGap": number,
    "competitionBarrier": number,
    "problemIntensity": number,
    "earlySignalStrength": number,
    "profitPotential": number,
    "easeOfEntry": number,
    "coreTotal": number,
    "trendVelocityScore": number,
    "creativePotential": number,
    "brandability": number,
    "retailGap": number,
    "contentLongevity": number
  },
  "bgColor": "#EFF6FF",
  "growthData": [
    {"label":"W1","value":8},
    {"label":"W2","value":18},
    {"label":"W3","value":33},
    {"label":"W4","value":52},
    {"label":"W5","value":70},
    {"label":"W6","value":84}
  ]
}`;

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
          content: `Today is ${today}. Using the live market data above, find 3 genuinely exciting UK dropshipping discoveries — one each from: ${selectedNiches.join(' | ')}. Apply all 6 final principles. Prioritise opportunity over popularity, discovery over obviousness. Only include products that pass all three investment test questions and that you would personally be excited to launch. Return ONLY the JSON array.`
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
    const start = cleaned.indexOf('[');
    const end = cleaned.lastIndexOf(']');
    if (start === -1 || end === -1) {
      console.error('[DRH] No array found:', cleaned.slice(0, 200));
      return res.status(500).json({ error: 'No product array found' });
    }
    cleaned = cleaned.slice(start, end + 1);

    let products;
    try {
      products = JSON.parse(cleaned);
    } catch (e) {
      console.error('[DRH] Parse error:', e.message);
      return res.status(500).json({ error: 'Parse error: ' + e.message });
    }

    // Safety filter — strip any PASS products
    products = products.filter(p => p.investmentTest !== 'PASS');

    console.log('[DRH] Fetching images...');
    const images = await Promise.all(products.map(p => fetchProductImage(p.name)));
    products = products.map((p, i) => ({ ...p, img: images[i] || '' }));

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
