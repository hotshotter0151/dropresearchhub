export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { product, originalInput, sourceUrl, sourceType, productId } = req.body || {};

    if (!product || typeof product !== "string") {
      return res.status(400).json({ error: "Missing product name or product link" });
    }

    const apiKey = process.env.ANTHROPIC_API_KEY;

    if (!apiKey) {
      return res.status(500).json({
        error: "DropResearchHub analysis engine is not configured"
      });
    }

    const prompt = `
You are the DropResearchHub ecommerce product opportunity engine.

Analyse this ecommerce product idea or product link:

PRODUCT INPUT:
${product}

ORIGINAL USER INPUT:
${originalInput || "Not provided"}

SOURCE TYPE:
${sourceType || "text"}

SOURCE URL:
${sourceUrl || "Not provided"}

PRODUCT ID:
${productId || "Not provided"}

Rules:
- Do not mention Claude, AI, ChatGPT, Anthropic or artificial intelligence.
- Do not claim live Google Trends, TikTok, Meta Ads, Amazon sales or real-time access.
- Assess using ecommerce logic: demand, customer problem, content potential, margin, competition, saturation and ease of marketing.
- Keep it practical for a beginner ecommerce seller.
- Return ONLY valid JSON.
- No markdown.
- No text outside JSON.

Return this JSON structure:

{
  "productName": "string",
  "opportunityScore": "A+",
  "marketStage": "Emerging",
  "growthScore": 75,
  "competitionScore": 45,
  "marginScore": 70,
  "saturationRisk": "Medium",
  "verdict": "short useful paragraph",
  "whyItCouldWork": ["point 1", "point 2", "point 3"],
  "risks": ["risk 1", "risk 2", "risk 3"],
  "creativeAngles": ["angle 1", "angle 2", "angle 3"],
  "hooks": ["hook 1", "hook 2", "hook 3"],
  "broad": "broader market keyword",
  "alt": "alternative product names",
  "growthGraph": [
    {"label":"W1","value":20},
    {"label":"W2","value":30},
    {"label":"W3","value":40},
    {"label":"W4","value":55},
    {"label":"W5","value":70},
    {"label":"W6","value":85}
  ]
}
`;

    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
        "content-type": "application/json"
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: 1600,
        temperature: 0.3,
        messages: [
          {
            role: "user",
            content: prompt
          }
        ]
      })
    });

    const data = await response.json();

    if (!response.ok) {
  return res.status(500).json({
    error: "DropResearchHub analysis engine error",
    status: response.status,
    details: data
  });
}

    const text = data?.content?.[0]?.text;

    if (!text) {
      return res.status(500).json({
        error: "No analysis returned"
      });
    }

    let parsed;

    try {
      parsed = JSON.parse(text);
    } catch {
      const match = text.match(/\{[\s\S]*\}/);
      if (!match) {
        return res.status(500).json({
          error: "Analysis returned invalid format"
        });
      }
      parsed = JSON.parse(match[0]);
    }

    return res.status(200).json(parsed);
  } catch (error) {
    return res.status(500).json({
      error: "Server error"
    });
  }
}
