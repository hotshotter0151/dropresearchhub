export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return res.status(500).json({ error: 'API key not configured' });

  const { name, niche, trendScore, saturationRisk, emergingScore, competitionLevel, scoring } = req.body;
  if (!name) return res.status(400).json({ error: 'Product name required' });

  const prompt = `You are a product market analyst for DropResearch Hub, a UK dropshipping research platform.

Analyse this product and generate a growth projection:

Product: ${name}
Niche: ${niche || 'General'}
Trend Score: ${trendScore || 50}/100
Saturation Risk: ${saturationRisk || 'Medium'}
Emerging Score: ${emergingScore || 60}/100
Competition Level: ${competitionLevel || 'Medium'}
Scoring: ${JSON.stringify(scoring || {})}

Return ONLY a valid JSON object, no markdown, no backticks:

{
  "growthCurve": [number, number, number, number, number, number, number],
  "windowClosesWeek": number,
  "whyNowDetailed": "2-3 sentences explaining why this specific product is emerging right now. Reference specific signals like content patterns, seasonal timing, consumer behaviour shifts. Written as DropResearch Hub analysis, not mentioning AI.",
  "projectionSummary": "One punchy sentence summarising the opportunity window e.g. Strong entry window — early movers have 8 weeks before feeds fill up.",
  "launchReadiness": [
    {"check": "Demonstrable in under 10 seconds of video", "pass": true},
    {"check": "Solves a problem most people recognise instantly", "pass": true},
    {"check": "Available on AliExpress under £10", "pass": true},
    {"check": "Sellable between £20-£60", "pass": true},
    {"check": "Not already saturating UK TikTok feeds", "pass": true},
    {"check": "Strong impulse-buy angle", "pass": true},
    {"check": "Lightweight and easy to ship", "pass": true},
    {"check": "No legal or compliance issues", "pass": true}
  ],
  "supplierSearchTerms": ["exact aliexpress search term 1", "exact aliexpress search term 2", "exact aliexpress search term 3"]
}

RULES for growthCurve — exactly 7 numbers between 0-100 reflecting THIS product's actual trajectory:
- High trendScore + Low saturation = steep early rise e.g. [15,32,55,74,86,88,84]
- Low trendScore + Low saturation = slow burn e.g. [8,12,18,27,39,54,68]
- High trendScore + High saturation = fast spike then plateau e.g. [20,42,68,82,85,80,72]
- Medium everything = steady climb e.g. [18,28,40,53,65,74,80]
Use the actual scores provided to determine the shape. Every product must have a different curve.

RULES for windowClosesWeek — between 4 and 12:
- High saturation risk = closes early (week 4-6)
- Low saturation risk = closes later (week 9-12)
- Medium = week 7-8

RULES for launchReadiness — be honest based on the product. If it is likely to have shipping issues or compliance concerns set those to false.`;

  try {
    const aiRes = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-api-key': apiKey, 'anthropic-version': '2023-06-01' },
      body: JSON.stringify({
        model: 'claude-sonnet-4-6',
        max_tokens: 1000,
        messages: [{ role: 'user', content: prompt }]
      })
    });

    const aiData = await aiRes.json();
    if (!aiRes.ok) return res.status(500).json({ error: aiData.error?.message || 'AI error' });

    const raw = (aiData.content || []).filter(b => b.type === 'text').map(b => b.text).join('');
    const cleaned = raw.replace(/```json|```/g, '').trim();
    const result = JSON.parse(cleaned);
    return res.status(200).json(result);
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
}
