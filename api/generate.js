export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return res.status(500).json({ error: 'API key not configured' });

  const body = req.body;
  console.log('[DRH] Request keys:', Object.keys(body));

  let systemPrompt, userMessage, maxTokens;

  if (body.productName) {
    // ── PRODUCT VALIDATOR MODE ──
    console.log('[DRH] Mode: product validator:', body.productName);
    systemPrompt = `You are an expert ecommerce product research analyst. Analyse the given product and return ONLY a valid JSON object — no markdown, no backticks, no explanation. 
The JSON must have exactly these fields:
{"productName":"string","opportunityScore":"A+|A|B+|B|C+|C|D","marketStage":"string","growthScore":number,"competitionScore":number,"marginScore":number,"saturationRisk":"Low|Medium|High|Very High","verdict":"string","whyItCouldWork":["string","string","string"],"risks":["string","string","string"],"creativeAngles":["string","string","string"],"hooks":{"broad":"string","alt":"string"},"growthGraph":[{"label":"W1","value":number},{"label":"W2","value":number},{"label":"W3","value":number},{"label":"W4","value":number},{"label":"W5","value":number},{"label":"W6","value":number}]}`;
    userMessage = `Analyse this product for UK ecommerce: ${body.productName}`;
    maxTokens = 1200;

  } else if (body.system && body.messages) {
    // ── FULL PASSTHROUGH MODE (admin generate, creative gen) ──
    console.log('[DRH] Mode: passthrough');
    systemPrompt = body.system;
    userMessage = body.messages[0]?.content || '';
    maxTokens = body.max_tokens || 2000;

  } else if (body.messages) {
    // ── GENERAL MESSAGES MODE ──
    console.log('[DRH] Mode: general messages');
    systemPrompt = 'You are a helpful ecommerce product research assistant for UK sellers.';
    userMessage = body.messages[0]?.content || '';
    maxTokens = body.max_tokens || 1000;

  } else {
    return res.status(400).json({ error: 'Invalid request format' });
  }

  console.log('[DRH] Calling Anthropic...');

  let anthropicRes;
  try {
    anthropicRes = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-5',
        max_tokens: maxTokens,
        system: systemPrompt,
        messages: [{ role: 'user', content: userMessage }]
      })
    });
  } catch (e) {
    console.error('[DRH] Network error:', e.message);
    return res.status(500).json({ error: 'Network error reaching AI' });
  }

  if (!anthropicRes.ok) {
    const errText = await anthropicRes.text();
    console.error('[DRH] Anthropic error:', anthropicRes.status, errText.slice(0, 300));
    return res.status(500).json({ error: `AI error ${anthropicRes.status}`, detail: errText.slice(0, 200) });
  }

  const anthropicData = await anthropicRes.json();
  const rawText = (anthropicData?.content || []).filter(b => b.type === 'text').map(b => b.text).join('');
  console.log('[DRH] Response length:', rawText.length);

  if (body.productName) {
    // Parse JSON for product validator
    const cleaned = rawText.replace(/```json|```/g, '').trim();
    try {
      const parsed = JSON.parse(cleaned);
      return res.status(200).json(parsed);
    } catch (e) {
      console.error('[DRH] JSON parse error:', e.message);
      return res.status(500).json({ error: 'Could not parse AI response' });
    }
  } else {
    // Return raw text wrapped for frontend
    return res.status(200).json({
      content: [{ type: 'text', text: rawText }]
    });
  }
}
