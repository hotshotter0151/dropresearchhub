export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return res.status(500).json({ error: 'API key not configured' });

  const { name, niche, margin, sellingPrice, supplierCost, trendScore, saturationRisk, tiktokAngle, metaAngle, mainAngle, img, adBudget, salesTarget, platform } = req.body;
  if (!name) return res.status(400).json({ error: 'Product name required' });

  const colorSchemes = [
    { bg: '#0f1f36', nav: '#091628', accent: '#F59E0B', text: '#ffffff', sub: 'rgba(255,255,255,0.65)', btn: '#F59E0B', btnText: '#0f1f36', name: 'Navy Gold' },
    { bg: '#1a3a2a', nav: '#0f2218', accent: '#4ade80', text: '#ffffff', sub: 'rgba(255,255,255,0.65)', btn: '#4ade80', btnText: '#0f2218', name: 'Forest Green' },
    { bg: '#18181b', nav: '#09090b', accent: '#f97316', text: '#ffffff', sub: 'rgba(255,255,255,0.6)', btn: '#f97316', btnText: '#18181b', name: 'Black Orange' },
    { bg: '#4a0e1a', nav: '#350a12', accent: '#fde68a', text: '#ffffff', sub: 'rgba(255,255,255,0.65)', btn: '#fde68a', btnText: '#4a0e1a', name: 'Burgundy Cream' },
    { bg: '#2d1b69', nav: '#1e1254', accent: '#6ee7b7', text: '#ffffff', sub: 'rgba(255,255,255,0.65)', btn: '#6ee7b7', btnText: '#2d1b69', name: 'Purple Mint' },
    { bg: '#1e293b', nav: '#0f172a', accent: '#38bdf8', text: '#ffffff', sub: 'rgba(255,255,255,0.65)', btn: '#38bdf8', btnText: '#1e293b', name: 'Slate Blue' },
    { bg: '#3b1f0a', nav: '#2a1506', accent: '#fb923c', text: '#ffffff', sub: 'rgba(255,255,255,0.65)', btn: '#fb923c', btnText: '#3b1f0a', name: 'Burnt Orange' },
    { bg: '#0c1a3a', nav: '#071028', accent: '#e879f9', text: '#ffffff', sub: 'rgba(255,255,255,0.65)', btn: '#e879f9', btnText: '#0c1a3a', name: 'Navy Purple' },
  ];
  const scheme = colorSchemes[Math.floor(Math.random() * colorSchemes.length)];

  const prompt = `You are an expert ecommerce launch strategist for UK beginner dropshippers. Generate a complete launch simulation for this product.

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

Return ONLY a valid JSON object, no markdown, no backticks:

{
  "storeName": "2-3 word brandable store name for this product — creative, memorable, not generic",
  "heroHeadline": "punchy 6-10 word hero headline for this specific product — benefit-led, not feature-led",
  "heroSubheadline": "one sentence selling the product — specific pain point solved, 15-20 words",
  "heroCTA": "4-6 word buy button text with price e.g. Shop now — £34.99 →",
  "heroTag": "short trust/social proof badge e.g. As seen on TikTok or 2,000+ sold this week",
  "weeks": [
    {
      "week": 1,
      "title": "Week 1 — [specific phase name]",
      "subtitle": "5-7 word description of what this week achieves",
      "items": ["specific actionable step 1", "specific actionable step 2", "specific actionable step 3"]
    },
    {
      "week": 2,
      "title": "Week 2 — [specific phase name]",
      "subtitle": "5-7 word description",
      "items": ["step 1", "step 2", "step 3"]
    },
    {
      "week": 3,
      "title": "Week 3 — [specific phase name]",
      "subtitle": "5-7 word description",
      "items": ["step 1", "step 2", "step 3"]
    },
    {
      "week": 4,
      "title": "Week 4 — [specific phase name]",
      "subtitle": "5-7 word description",
      "items": ["step 1", "step 2", "step 3"]
    }
  ],
  "verdict": "2-3 sentence honest verdict on this product launch. Include realistic monthly profit at target sales, the biggest risk, and one specific piece of advice. Refer to as DropResearch Hub assessment, no AI mention.",
  "worstCase": "one sentence — worst case if ads don't convert e.g. Worst case: £280 spent over 2 weeks with no profitable ad set found",
  "bestCase": "one sentence — best case if it works e.g. Best case: £1,200/month recurring by week 6"
}

RULES:
- Make everything SPECIFIC to this product — not generic advice
- Week 1 should always start with organic testing before paid ads for beginners
- Include specific numbers (CPM ranges, CTR targets, cost per purchase benchmarks) for this niche
- The store name should feel like a real brand not a placeholder
- Hero headline should be compelling enough that a beginner gets excited seeing it
- Be honest in the verdict — if the margin is tight or saturation is high, say so`;

  try {
    const aiRes = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-api-key': apiKey, 'anthropic-version': '2023-06-01' },
      body: JSON.stringify({
        model: 'claude-sonnet-4-6',
        max_tokens: 1500,
        messages: [{ role: 'user', content: prompt }]
      })
    });

    const aiData = await aiRes.json();
    if (!aiRes.ok) return res.status(500).json({ error: aiData.error?.message || 'AI error' });

    const raw = (aiData.content || []).filter(b => b.type === 'text').map(b => b.text).join('');
    const cleaned = raw.replace(/```json|```/g, '').trim();
    const result = JSON.parse(cleaned);

    return res.status(200).json({ ...result, colorScheme: scheme });
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
}
