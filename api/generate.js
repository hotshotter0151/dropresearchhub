// api/generate.js — DropResearchHub Product Validator

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.status(200).end();

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { product, originalInput, sourceUrl, sourceType, productId } = req.body || {};

    if (!product || typeof product !== "string" || product.trim().length < 2) {
      return res.status(400).json({
        error: "A valid product name or product link is required."
      });
    }

    const apiKey = process.env.ANTHROPIC_API_KEY;

    if (!apiKey) {
      console.error("[generate] Missing ANTHROPIC_API_KEY");
      return res.status(500).json({
        error: "DropResearchHub analysis engine is not configured."
      });
    }

    const systemPrompt = `
You are the DropResearchHub ecommerce product opportunity engine.

You analyse ecommerce and dropshipping product ideas for beginner sellers.

Do not mention Claude, Anthropic, AI, ChatGPT, language models or artificial intelligence.

Return ONLY valid JSON.
No markdown.
No explanations outside JSON.
`;

    const userPrompt = `
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

Assess using ecommerce logic:
- market demand
- likely customer problem
- content potential
- margin potential
- competition risk
- saturation risk
- ease of marketing
- beginner seller suitability

Return ONLY this exact JSON structure:

{
  "productName": "cleaned product name",
  "opportunityScore": "A+ | A | B | C | D",
  "marketStage": "Emerging | Growing | Mature | Saturated | Needs Research",
  "growthScore": 75,
  "competitionScore": 45,
  "marginScore": 70,
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
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01"
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-6",
        max_tokens: 1600,
        temperature: 0.3,
        system: systemPrompt,
        messages: [
          {
            role: "user",
            content: userPrompt
          }
        ]
      })
    });

    const data = await response.json();

    if (!response.ok) {
      console.error("[generate] Upstream error:", response.status, data);

      return res.status(502).json({
        error: "DropResearchHub analysis engine error",
        status: response.status,
        details: data
      });
    }

    const raw = data?.content?.[0]?.text;

    if (!raw) {
      console.error("[generate] No text returned:", data);

      return res.status(500).json({
        error: "No analysis returned"
      });
    }

    let cleaned = raw
      .replace(/^```json\s*/i, "")
      .replace(/^```\s*/i, "")
      .replace(/```$/i, "")
      .trim();

    let parsed;

    try {
      parsed = JSON.parse(cleaned);
    } catch (error) {
      const match = cleaned.match(/\{[\s\S]*\}/);

      if (!match) {
        console.error("[generate] Invalid JSON:", cleaned);

        return res.status(500).json({
          error: "Analysis returned invalid format"
        });
      }

      parsed = JSON.parse(match[0]);
    }

    const required = [
      "productName",
      "opportunityScore",
      "marketStage",
      "growthScore",
      "competitionScore",
      "marginScore",
      "saturationRisk",
      "verdict",
      "whyItCouldWork",
      "risks",
      "creativeAngles",
      "hooks",
      "broad",
      "alt",
      "growthGraph"
    ];

    const missing = required.filter((key) => !(key in parsed));

    if (missing.length > 0) {
      console.error("[generate] Missing fields:", missing);

      return res.status(500).json({
        error: "Incomplete analysis result",
        missing
      });
    }

    return res.status(200).json(parsed);
  } catch (error) {
    console.error("[generate] Server error:", error);

    return res.status(500).json({
      error: "Server error",
      message: error.message
    });
  }
}
