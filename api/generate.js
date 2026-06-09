export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { product } = req.body || {};

    if (!product || typeof product !== 'string') {
      return res.status(400).json({ error: 'Missing product name' });
    }

    const apiKey = process.env.ANTHROPIC_API_KEY;

    if (!apiKey) {
      return res.status(500).json({ error: 'ANTHROPIC_API_KEY is not set in Vercel environment variables' });
    }

    const prompt = `You are an ecommerce product research analyst for a UK dropshipping/product research platform called DropResearch Hub.

Analyse this product idea: "${product}"

Important rules:
- Do not claim you have live Google Trends, Meta Ads, TikTok Ads, Amazon sales, or real-time data access.
- Give a practical ecommerce assessment based on general market knowledge, product characteristics, likely demand, content potential, saturation risk, margin potential, and ease of marketing.
- Keep it useful for a beginner ecommerce seller.
- Return ONLY valid JSON. No markdown. No explanation outside JSON.

Return this exact JSON structure:
{
  "productName": "string",
  "opportunityScore": "A+ | A | B | C | D",
  "marketStage": "Emerging | Growing | Mature | Saturated | Needs Research",
  "growthScore": number between 0 and 100,
  "competitionScore": number between 0 and 100,
  "marginScore": number between 0 and 100,
  "saturationRisk": "Low | Medium | High",
  "verdict": "short paragraph",
  "whyItCouldWork": ["point 1", "point 2", "point 3"],
  "risks": ["risk 1", "risk 2", "risk 3"],
  "creativeAngles": ["angle 1", "angle 2", "angle 3"],
  "hooks": ["hook 1", "hook 2", "hook 3"],
  "growthGraph": [
    {"label":"Week 1","value":number},
    {"label":"Week 2","value":number},
    {"label":"Week 3","value":number},
    {"label":"Week 4","value":number},
    {"label":"Week 5","value":number},
    {"label":"Week 6","value":number}
  ]
}`;

    const anthropicResponse = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json'
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-5-20250929',
        max_tokens: 1600,
        temperature: 0.3,
        messages: [
          {
            role: 'user',
            content: prompt
          }
        ]
      })
    });

    const data = await anthropicResponse.json();

    if (!anthropicResponse.ok) {
      return res.status(anthropicResponse.status).json({
        error: 'Claude API error',
        details: data
      });
    }

    const text = data?.content?.[0]?.text;

    if (!text) {
      return res.status(500).json({ error: 'No response text returned from Claude' });
    }

    let parsed;
    try {
      parsed = JSON.parse(text);
    } catch (parseError) {
      const match = text.match(/\{[\s\S]*\}/);
      if (!match) {
        return res.status(500).json({ error: 'Claude did not return valid JSON', raw: text });
      }
      parsed = JSON.parse(match[0]);
    }

    return res.status(200).json(parsed);
  } catch (error) {
    return res.status(500).json({
      error: 'Server error',
      message: error.message
    });
  }
}
