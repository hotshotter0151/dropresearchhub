export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return res.status(500).json({ error: 'API key not configured' });

  const body = req.body;

  // ── EMERGING PRODUCTS MODE ──
  if (body.mode === 'emerging') {
    console.log('[DRH] Generating 20 emerging products');
    const aiRes = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-api-key': apiKey, 'anthropic-version': '2023-06-01' },
      body: JSON.stringify({
        model: 'claude-sonnet-4-5',
        max_tokens: 4000,
        system: `You are an expert ecommerce product researcher for UK dropshippers. Find products JUST starting to emerge — first 1-3 months of a Google Trends growth curve. NOT mainstream, NOT already viral on TikTok or Instagram.

Return ONLY a valid JSON array of exactly 10 product objects. No markdown, no backticks, no text before or after.

Each object must have ALL these fields:
{"name":"string","niche":"Pet|Home|Beauty|Fitness|Kitchen|Outdoor|Baby|Office|Tech|Fashion","emoji":"single emoji","stage":"Emerging","season":"Evergreen|Summer peak|Winter peak|Jan peak|Back to school","grade":"A+|A|B|C","trendScore":number 60-95,"saturation":number 5-40,"margin":"XX%","whyNow":"one sentence why trending mid-2026","verdict":"2 sentences for UK dropshipper","whyItCouldWork":["reason1","reason2","reason3"],"risks":["risk1","risk2","risk3"],"creativeAngles":["angle1","angle2","angle3"],"aliSearchTerm":"aliexpress search term","googleTrendsKeyword":"google trends keyword","bgColor":"#EFF6FF","growthData":[{"label":"W1","value":12},{"label":"W2","value":25},{"label":"W3","value":40},{"label":"W4","value":58},{"label":"W5","value":72},{"label":"W6","value":86}]}

RULES: No yoga mats, resistance bands, water bottles, phone cases, fidget toys. Must be SPECIFIC niche products. Max 3 per niche. growthData must show a rising curve.`,
        messages: [{ role: 'user', content: 'Generate 10 genuinely emerging micro-niche UK ecom products for June 2026. Specific, unusual, problem-solving items not yet found by most dropshippers.' }]
      })
    });

    if (!aiRes.ok) {
      const err = await aiRes.text();
      console.error('[DRH] AI error:', aiRes.status, err.slice(0,200));
      return res.status(500).json({ error: 'AI error ' + aiRes.status });
    }

    const aiData = await aiRes.json();
    const rawText = (aiData.content || []).filter(b => b.type === 'text').map(b => b.text).join('');
    console.log('[DRH] Response length:', rawText.length);

    let cleaned = rawText.replace(/```json/gi,'').replace(/```/g,'').trim();
    const start = cleaned.indexOf('[');
    const end = cleaned.lastIndexOf(']');
    if (start === -1 || end === -1) return res.status(500).json({ error: 'No product array found' });
    cleaned = cleaned.slice(start, end + 1);

    try {
      const products = JSON.parse(cleaned);
      console.log('[DRH] Generated', products.length, 'products');
      return res.status(200).json({ content: [{ type: 'text', text: JSON.stringify(products) }] });
    } catch (e) {
      console.error('[DRH] Parse error:', e.message);
      return res.status(500).json({ error: 'Parse error: ' + e.message });
    }
  }

  // ── PRODUCT VALIDATOR ──
  if (body.productName) {
    console.log('[DRH] Validator:', body.productName);
    const aiRes = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-api-key': apiKey, 'anthropic-version': '2023-06-01' },
      body: JSON.stringify({
        model: 'claude-sonnet-4-5',
        max_tokens: 1500,
        system: `You are an expert ecommerce product research analyst. Return ONLY a valid JSON object — no markdown, no backticks. Fields: {"productName":"string","opportunityScore":"A+|A|B+|B|C+|C|D","marketStage":"string","growthScore":number,"competitionScore":number,"marginScore":number,"saturationRisk":"Low|Medium|High|Very High","verdict":"string","whyItCouldWork":["string","string","string"],"risks":["string","string","string"],"creativeAngles":["string","string","string"],"hooks":{"broad":"string","alt":"string"},"growthGraph":[{"label":"W1","value":number},{"label":"W2","value":number},{"label":"W3","value":number},{"label":"W4","value":number},{"label":"W5","value":number},{"label":"W6","value":number}]}`,
        messages: [{ role: 'user', content: `Analyse for UK ecommerce: ${body.productName}` }]
      })
    });
    const aiData = await aiRes.json();
    const raw = (aiData.content||[]).filter(b=>b.type==='text').map(b=>b.text).join('');
    try { return res.status(200).json(JSON.parse(raw.replace(/```json|```/g,'').trim())); }
    catch(e) { return res.status(500).json({ error: 'Validator parse error' }); }
  }

  // ── PASSTHROUGH ──
  if (body.system && body.messages) {
    console.log('[DRH] Passthrough');
    const aiRes = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-api-key': apiKey, 'anthropic-version': '2023-06-01' },
      body: JSON.stringify({
        model: 'claude-sonnet-4-5',
        max_tokens: body.max_tokens || 2000,
        system: body.system,
        messages: body.messages
      })
    });
    const aiData = await aiRes.json();
    const raw = (aiData.content||[]).filter(b=>b.type==='text').map(b=>b.text).join('');
    return res.status(200).json({ content: [{ type: 'text', text: raw }] });
  }

  return res.status(400).json({ error: 'Invalid request format' });
}
