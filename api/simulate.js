export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const apiKey = process.env.ANTHROPIC_API_KEY;
  const serpApiKey = process.env.SERP_API_KEY;
  if (!apiKey) return res.status(500).json({ error: 'API key not configured' });

  const { name, niche, margin, sellingPrice, supplierCost, trendScore, saturationRisk, tiktokAngle, metaAngle, mainAngle, img, adBudget, salesTarget, platform } = req.body;
  if (!name) return res.status(400).json({ error: 'Product name required' });

  const colorSchemes = [
    { bg: '#ffffff', nav: '#ffffff', navText: '#0f1f2e', accent: '#0f1f2e', text: '#0f1f2e', sub: '#5b6470', btn: '#0f1f2e', btnText: '#ffffff', border: '#e5e7eb', name: 'Mono Navy' },
    { bg: '#ffffff', nav: '#ffffff', navText: '#1a3a2a', accent: '#1a7a4a', text: '#0f1f17', sub: '#5b6f63', btn: '#1a7a4a', btnText: '#ffffff', border: '#e2ece6', name: 'Forest Clean' },
    { bg: '#ffffff', nav: '#ffffff', navText: '#1f2937', accent: '#ea580c', text: '#1f2937', sub: '#6b7280', btn: '#ea580c', btnText: '#ffffff', border: '#e5e7eb', name: 'Orange Pop' },
    { bg: '#ffffff', nav: '#ffffff', navText: '#3b1f0a', accent: '#c2410c', text: '#2a1506', sub: '#7c6555', btn: '#c2410c', btnText: '#ffffff', border: '#ede4dc', name: 'Burnt Cream' },
    { bg: '#ffffff', nav: '#ffffff', navText: '#2d1b4e', accent: '#7c3aed', text: '#1e1133', sub: '#6b6175', btn: '#7c3aed', btnText: '#ffffff', border: '#ece8f4', name: 'Purple Studio' },
    { bg: '#ffffff', nav: '#ffffff', navText: '#0c2340', accent: '#0284c7', text: '#0f172a', sub: '#5b6b7d', btn: '#0284c7', btnText: '#ffffff', border: '#e2eaf2', name: 'Sky Slate' },
    { bg: '#ffffff', nav: '#ffffff', navText: '#451a03', accent: '#d97706', text: '#2d1604', sub: '#7a6650', btn: '#d97706', btnText: '#ffffff', border: '#efe5d6', name: 'Amber Studio' },
    { bg: '#ffffff', nav: '#ffffff', navText: '#3b0764', accent: '#c026d3', text: '#27093f', sub: '#6e5e76', btn: '#c026d3', btnText: '#ffffff', border: '#f0e3f5', name: 'Magenta Bold' },
  ];
  const scheme = colorSchemes[Math.floor(Math.random() * colorSchemes.length)];

  async function fetchProductImage(productName) {
    if (!serpApiKey) return '';
    try {
      const url = `https://serpapi.com/search.json?engine=google_images&q=${encodeURIComponent(productName + ' product white background')}&api_key=${serpApiKey}&num=3&safe=off&gl=gb&hl=en`;
      const r = await fetch(url, { signal: AbortSignal.timeout(6000) });
      if (!r.ok) return '';
      const data = await r.json();
      const results = data?.images_results || [];
      const product = results.find(i => i.original && i.is_product);
      return (product?.original || results[0]?.original || results[0]?.thumbnail || '');
    } catch (e) { return ''; }
  }

  const heroImage = img || await fetchProductImage(name);

  const prompt = `You are an expert ecommerce launch strategist and brand designer for UK beginner dropshippers. Generate a complete launch simulation and store concept for this product.

Product: ${name}
Niche: ${niche || 'General'}
Selling Price: ${sellingPrice || '£34.99'}
Supplier Cost: ${supplierCost || '£8'}
Estimated Margin: ${margin || '65%'}
Trend Score: ${trendScore || 70}/100
Saturation Risk: ${saturationRisk || 'Low'}
TikTok Angle: ${tiktokAngle || ''}
Meta Angle: ${metaAngle || ''}
Main Angle: ${mainAngle || ''}
Daily Ad Budget: £${adBudget || 20}
Daily Sales Target: ${salesTarget || 5} sales
Platform: ${platform || 'TikTok + Meta'}

Return ONLY a valid JSON object, no markdown, no backticks. EVERY field below is REQUIRED — do not omit, shorten to empty, or leave any array empty. This is a strict schema and incomplete output is treated as a failure.

{
  "storeName": "2-3 word brandable store name for this product — creative, memorable, not generic, suitable as a wordmark logo",
  "navLinks": ["3 short nav link words relevant to this niche e.g. Shop, Reviews, FAQ"],
  "heroHeadline": "punchy 6-10 word hero headline for this specific product — benefit-led, not feature-led",
  "heroSubheadline": "one sentence selling the product — specific pain point solved, 15-20 words",
  "heroCTA": "4-6 word buy button text with price e.g. Shop now — £34.99",
  "heroTag": "short trust/social proof badge e.g. As seen on TikTok or 2,000+ sold this week",
  "trustBadges": ["3 short trust badges e.g. Free UK delivery, 30-day returns, 4.8★ rated"],
  "weeks": [
    {"week": 1, "title": "Week 1 — [specific phase name]", "subtitle": "5-7 word description of what this week achieves", "items": ["specific actionable step 1", "specific actionable step 2", "specific actionable step 3"]},
    {"week": 2, "title": "Week 2 — [specific phase name]", "subtitle": "5-7 word description", "items": ["step 1", "step 2", "step 3"]},
    {"week": 3, "title": "Week 3 — [specific phase name]", "subtitle": "5-7 word description", "items": ["step 1", "step 2", "step 3"]},
    {"week": 4, "title": "Week 4 — [specific phase name]", "subtitle": "5-7 word description", "items": ["step 1", "step 2", "step 3"]}
  ],
  "verdict": "2-3 full sentences — honest verdict on this product launch. Include realistic monthly profit at target sales, the biggest risk, and one specific piece of advice. Refer to as DropResearch Hub assessment, no AI mention. This field must not be empty.",
  "worstCase": "one full sentence — worst case if ads don't convert e.g. Worst case: £280 spent over 2 weeks with no profitable ad set found. This field must not be empty.",
  "bestCase": "one full sentence — best case if it works e.g. Best case: £1,200/month recurring by week 6. This field must not be empty."
}

RULES:
- Make everything SPECIFIC to this product — not generic advice
- Week 1 should always start with organic testing before paid ads for beginners
- Include specific numbers (CPM ranges, CTR targets, cost per purchase benchmarks) for this niche
- The store name should feel like a real brand not a placeholder
- Hero headline should be compelling enough that a beginner gets excited seeing it
- Be honest in the verdict — if the margin is tight or saturation is high, say so
- weeks must always contain exactly 4 objects, each with exactly 3 items
- verdict, worstCase and bestCase must never be empty strings`;

  async function callAI() {
    const aiRes = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-api-key': apiKey, 'anthropic-version': '2023-06-01' },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 2800,
        messages: [{ role: 'user', content: prompt }]
      })
    });
    const aiData = await aiRes.json();
    if (!aiRes.ok) throw new Error(aiData.error?.message || 'AI error');
    const raw = (aiData.content || []).filter(b => b.type === 'text').map(b => b.text).join('');
    let cleaned = raw.replace(/```json|```/g, '').trim();
    const s = cleaned.indexOf('{');
    const e = cleaned.lastIndexOf('}');
    if (s !== -1 && e !== -1) cleaned = cleaned.slice(s, e + 1);
    return JSON.parse(cleaned);
  }

  function isComplete(result) {
    if (!result) return false;
    if (!result.storeName || !result.heroHeadline || !result.heroSubheadline || !result.heroCTA) return false;
    if (!Array.isArray(result.weeks) || result.weeks.length !== 4) return false;
    if (result.weeks.some(w => !w.title || !Array.isArray(w.items) || w.items.length < 1)) return false;
    if (!result.verdict || !result.verdict.trim()) return false;
    if (!result.worstCase || !result.worstCase.trim()) return false;
    if (!result.bestCase || !result.bestCase.trim()) return false;
    return true;
  }

  try {
    let result = await callAI();

    // If the model skipped or thinned out required fields, retry once before giving up.
    if (!isComplete(result)) {
      console.log('[SIMULATE] First attempt incomplete, retrying...');
      result = await callAI();
    }

    if (!isComplete(result)) {
      return res.status(500).json({ error: 'Hub couldn\'t finish building the full plan — please try again.' });
    }

    return res.status(200).json({ ...result, colorScheme: scheme, heroImage });
  } catch (e) {
    return res.status(500).json({ error: e.message || 'Hub couldn\'t finish building the full plan — please try again.' });
  }
}
