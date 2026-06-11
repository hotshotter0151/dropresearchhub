export default async function handler(req, res) {

  // ── CORS headers (needed for some Vercel configs) ──────────────────────────
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Handle preflight
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Only allow POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // ── Pull API key from environment ──────────────────────────────────────────
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    console.error('[DRH] ANTHROPIC_API_KEY is not set in environment variables');
    return res.status(500).json({ error: 'DropResearchHub analysis engine error: configuration missing' });
  }

  // ── Read body ──────────────────────────────────────────────────────────────
  const body = req.body;
  console.log('[DRH] Incoming request body:', JSON.stringify(body).slice(0, 300));

  // Support two modes:
  // 1. Product validator mode  → body.productName is set
  // 2. General AI mode         → body.messages is set (used by chat, creative gen etc.)
  const isProductValidator = !!body.productName;

  let systemPrompt, userMessage, maxTokens;

  if (isProductValidator) {
    // ── PRODUCT VALIDATOR MODE ────────────────────────────────────────────────
    const { productName, niche, costPrice, sellPrice } = body;

    systemPrompt = `You are an expert ecommerce product research analyst. Analyse the given product and return ONLY a valid JSON object — no markdown, no backticks, no explanation, nothing else. 

The JSON must have exactly these fields:
{
  "productName": "string",
  "opportunityScore": "A+|A|B+|B|C+|C|D",
  "marketStage": "string (e.g. Early Growth, Peak, Declining, Emerging)",
  "growthScore": number between 0 and 100,
  "competitionScore": number between 0 and 100,
  "marginScore": number between 0 and 100,
  "saturationRisk": "Low|Medium|High|Very High",
  "verdict": "string (one punchy sentence verdict)",
  "whyItCouldWork": ["string", "string", "string"],
  "risks": ["string", "string", "string"],
  "creativeAngles": ["string", "string", "string"],
  "hooks": {
    "broad": "string (a strong broad TikTok hook line)",
    "alt": "string (an alternative unexpected hook line)"
  },
  "growthGraph": [
    {"label":"W1","value": number},
    {"label":"W2","value": number},
    {"label":"W3","value": number},
    {"label":"W4","value": number},
    {"label":"W5","value": number},
    {"label":"W6","value": number}
  ]
}

growthGraph values represent relative search/trend interest from 0-100 over the last 6 weeks. Make them realistic and varied — not all the same number.
opportunityScore should reflect overall product opportunity: A+ is exceptional, D is avoid.
competitionScore: higher = more competition (worse). marginScore: higher = better margins.`;

    userMessage = `Analyse this product for UK ecommerce/dropshipping:
Product: ${productName}
Niche: ${niche || 'Unknown'}
Cost price: ${costPrice || 'Unknown'}
Sell price: ${sellPrice || 'Unknown'}

Give me a full product opportunity assessment.`;

    maxTokens = 1200;

  } else {
    // ── GENERAL AI MODE (creative gen, AI assistant, store audit etc.) ────────
    systemPrompt = body.system || 'You are a helpful ecommerce product research assistant for UK sellers.';
    userMessage = body.messages?.[0]?.content || body.prompt || '';
    maxTokens = body.max_tokens || 1000;

    if (!userMessage) {
      return res.status(400).json({ error: 'No message provided' });
    }
  }

  // ── Call Anthropic Messages API ────────────────────────────────────────────
  console.log('[DRH] Calling Anthropic API...');

  let anthropicResponse;
  try {
    anthropicResponse = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-5',          // ← correct model name
        max_tokens: maxTokens,
        system: systemPrompt,
        messages: [
          { role: 'user', content: userMessage }
        ],
      }),
    });
  } catch (networkErr) {
    console.error('[DRH] Network error reaching Anthropic:', networkErr.message);
    return res.status(500).json({ error: 'DropResearchHub analysis engine error: network failure' });
  }

  // ── Check HTTP status from Anthropic ──────────────────────────────────────
  if (!anthropicResponse.ok) {
    const errText = await anthropicResponse.text();
    console.error(`[DRH] Anthropic returned ${anthropicResponse.status}:`, errText.slice(0, 500));
    return res.status(500).json({
      error: `DropResearchHub analysis engine error: upstream ${anthropicResponse.status}`,
      detail: errText.slice(0, 200),   // visible in Vercel logs, not shown to user
    });
  }

  // ── Parse Anthropic response ───────────────────────────────────────────────
  let anthropicData;
  try {
    anthropicData = await anthropicResponse.json();
  } catch (parseErr) {
    console.error('[DRH] Failed to parse Anthropic JSON response:', parseErr.message);
    return res.status(500).json({ error: 'DropResearchHub analysis engine error: response parse failure' });
  }

  console.log('[DRH] Anthropic response type:', anthropicData?.type);
  console.log('[DRH] Content blocks:', anthropicData?.content?.length);

  // Extract text from content blocks
  const rawText = (anthropicData?.content || [])
    .filter(block => block.type === 'text')
    .map(block => block.text)
    .join('');

  console.log('[DRH] Raw text length:', rawText.length);
  console.log('[DRH] Raw text preview:', rawText.slice(0, 200));

  // ── Return result ──────────────────────────────────────────────────────────
  if (isProductValidator) {
    // Try to parse as JSON — strip any accidental markdown fences
    const cleaned = rawText
      .replace(/^```json\s*/i, '')
      .replace(/^```\s*/i, '')
      .replace(/```\s*$/i, '')
      .trim();

    let parsed;
    try {
      parsed = JSON.parse(cleaned);
    } catch (jsonErr) {
      console.error('[DRH] JSON parse error on model output:', jsonErr.message);
      console.error('[DRH] Model output was:', cleaned.slice(0, 500));
      return res.status(500).json({
        error: 'DropResearchHub analysis engine error: could not parse assessment',
      });
    }

    console.log('[DRH] Successfully parsed product assessment for:', parsed.productName);
    return res.status(200).json(parsed);

  } else {
    // General mode — return the raw text wrapped so frontend can read it
    return res.status(200).json({
      content: [{ type: 'text', text: rawText }],
    });
  }
}
