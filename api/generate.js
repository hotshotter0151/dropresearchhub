export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const {
      product,
      originalInput,
      sourceUrl,
      sourceType,
      productId
    } = req.body || {};

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

Important rules:
- Do not mention Claude, AI, ChatGPT, Anthropic or artificial intelligence.
- Do not claim you have live Google Trends, TikTok, Meta Ads, Amazon sales or real-time data access.
- Assess the product using ecommerce logic: market demand, likely customer problem, content potential, margin potential, competition risk, saturation risk and ease of marketing.
- If the user pasted only a URL and the exact product title is unclear, say further product detail is needed.
- Keep it practical for a beginner ecommerce seller.
- Return ONLY valid JSON.
- No markdown.
- No text outside the JSON.

Return this exact JSON structure:

{
  "productName": "string",
  "opportunityScore": "A+ | A | B | C | D",
  "marketStage": "Emerging | Growing | Mature | Saturated | Needs Research",
  "growthScore": 0,
  "competitionScore": 0,
  "marginScore": 0,
  "saturationRisk": "Low | Medium | High",
  "verdict": "short useful paragraph",
  "whyItCouldWork": ["point 1", "point 2", "point 3"],
  "risks": ["risk 1", "risk 2", "risk 3"],
  "creativeAngles": ["angle 1", "angle 2", "angle 3"],
  "hooks": ["hook 1", "hook 2", "hook 3"],
  "broad": "broader market keyword",
  "alt": "alternative product names or related keywords",
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
        model: "claude-3-5-sonnet-latest",
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
      return res.status(response.status).json({
        error: "DropResearchHub analysis engine error",
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
    } catch (error) {
      const match = text.match(/\{[\s\S]*\}/);

      if (!match) {
        return res.status(500).json({
          error: "Analysis returned invalid format",
          raw: text
        });
      }

      parsed = JSON.parse(match[0]);
    }

    return res.status(200).json(parsed);
  } catch (error) {
    return res.status(500).json({
      error: "Server error",
      message: error.message
    });
  }
}
