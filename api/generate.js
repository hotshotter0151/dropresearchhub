export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const apiKey = process.env.ANTHROPIC_API_KEY;
  const serpApiKey = process.env.SERP_API_KEY;
  if (!apiKey) return res.status(500).json({ error: 'API key not configured' });

  const body = req.body;
  const today = new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });

  // ── IMAGE FETCHING ────────────────────────────────────────────────────────
  async function searchImage(query) {
    try {
      const url = `https://serpapi.com/search.json?engine=google_images&q=${encodeURIComponent(query)}&api_key=${serpApiKey}&num=3&safe=off&gl=gb&hl=en`;
      const r = await fetch(url, { signal: AbortSignal.timeout(4000) });
      if (!r.ok) return '';
      const data = await r.json();
      const results = data?.images_results || [];
      const product = results.find(i => i.original && i.is_product);
      const any = results.find(i => i.original);
      return (product?.original || any?.original || results[0]?.thumbnail || '');
    } catch (e) { return ''; }
  }

  async function fetchProductImage(productName) {
    if (!serpApiKey) return '';
    try {
      let img = await searchImage(productName + ' product');
      if (img) return img;
      const broad = productName.split(' ').slice(0, 2).join(' ');
      return await searchImage(broad + ' product');
    } catch (e) { return ''; }
  }

  // ── EMERGING PRODUCTS MODE ────────────────────────────────────────────────
  if (body.mode === 'emerging') {

    let trendingContext = '';
    try {
      const trendsRes = await fetch(
        'https://trends.google.com/trends/api/dailytrends?hl=en-GB&tz=-60&geo=GB&ns=15',
        {
          headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' },
          signal: AbortSignal.timeout(5000)
        }
      );
      if (trendsRes.ok) {
        const raw = await trendsRes.text();
        const cleaned = raw.replace(/^\)\]\}'/, '').trim();
        const json = JSON.parse(cleaned);
        const searches = json?.default?.trendingSearchesDays?.[0]?.trendingSearches || [];
        const keywords = searches.map(s => s?.title?.query).filter(Boolean).slice(0, 20);
        if (keywords.length > 0) {
          trendingContext = `UK Google Trends today (${today}): ${keywords.join(', ')}`;
          console.log('[DRH] Got', keywords.length, 'trending searches');
        }
      }
    } catch (e) { console.log('[DRH] Trends failed:', e.message); }

    const systemPrompt = `You are a world-class ecommerce product researcher for DropResearch Hub, a paid platform for UK beginner dropshippers. Today is ${today}.
${trendingContext ? `\nLive UK Google Trends data: ${trendingContext}\n` : ''}
Your job is to find exactly 3 GENUINELY EMERGING physical products that subscribers can test on Shopify with Meta and TikTok ads RIGHT NOW.

PRODUCT SELECTION CRITERIA — every product MUST pass ALL of these:
1. Solves a clear, obvious problem
2. Understandable in under 3 seconds
3. Strong video demonstration potential (before/after, satisfying, visual)
4. Has an impulse-buy angle (£20–£60 price point)
5. Lightweight and easy to ship
6. Not heavily branded or copyrighted
7. NOT medical, supplements, dangerous, alcohol, nicotine, weapons, fake designer
8. Supplier cost ideally under 35% of selling price
9. NOT already a dead/saturated dropshipping product

EMERGING SIGNALS TO LOOK FOR:
- Just appearing on TikTok Shop UK (not already everywhere)
- Amazon Movers & Shakers movement (growing reviews, not peak)
- AliExpress order growth (upward, not already millions)
- Google Trends showing early upward curve, not peak
- Not yet in mainstream UK retail (Tesco, Argos, Amazon front page)
- Low competition on Facebook Ad Library (few UK ads running)

STRICTLY AVOID:
- Air fryers, massage guns, resistance bands, LED strips, posture correctors, water bottles, phone cases, beard trimmers — anything already saturated
- Products with no wow factor or that need too much explaining
- Products easily found in local shops
- Products that look cheap or gimmicky
- Products with compliance/legal issues

For each product apply this scoring:
- Trend Growth: /25 (is it actually growing NOW?)
- Problem Solving: /20 (how clearly does it solve a problem?)
- Video Potential: /15 (how demonstrable on TikTok/Reels?)
- Profit Margin: /15 (is the margin strong?)
- Competition Level: /15 (how low is competition right now?)
- Audience Size: /10 (how big is the target market?)
- TOTAL: /100

Return ONLY a valid JSON array of exactly 3 objects. No markdown, no backticks, no text before or after.

Each object must have these exact fields:
{
  "name": "Product Name",
  "niche": "Pet|Home|Beauty|Fitness|Kitchen|Outdoor|Baby|Office|Tech|Fashion",
  "emoji": "single emoji",
  "stage": "Emerging",
  "season": "Evergreen|Summer peak|Winter peak",
  "grade": "A+|A|B|C",
  "trendScore": number 0-100,
  "problemScore": number 0-100,
  "saturationRisk": "Low|Medium|High",
  "competitionLevel": "Low|Medium|High",
  "emergingScore": number 0-100,
  "supplierCost": "£X–£X",
  "sellingPrice": "£X–£X",
  "margin": "XX%",
  "targetCustomer": "one sentence describing buyer avatar",
  "whyEmerging": "max 20 words — why this is growing RIGHT NOW",
  "problemSolved": "max 15 words",
  "mainAngle": "max 15 words — core selling angle",
  "tiktokAngle": "max 20 words",
  "metaAngle": "max 20 words",
  "verdict": "Strong Opportunity|Watch List|Avoid",
  "verdictReason": "max 20 words",
  "whyItCouldWork": ["point 1", "point 2", "point 3"],
  "risks": ["risk 1", "risk 2", "risk 3"],
  "bundleIdea": "max 15 words",
  "redFlags": "max 15 words or None",
  "aliSearchTerm": "search term for AliExpress",
  "googleTrendsKeyword": "broad 1-3 word keyword",
  "scoring": {
    "trendGrowth": number,
    "problemSolving": number,
    "videoPotential": number,
    "profitMargin": number,
    "competitionLevel": number,
    "audienceSize": number
  },
  "bgColor": "#EFF6FF",
  "growthData": [
    {"label":"W1","value":15},
    {"label":"W2","value":25},
    {"label":"W3","value":38},
    {"label":"W4","value":54},
    {"label":"W5","value":70},
    {"label":"W6","value":84}
  ]
}`;

    const aiRes = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-api-key': apiKey, 'anthropic-version': '2023-06-01' },
      body: JSON.stringify({
        model: 'claude-sonnet-4-6',
        max_tokens: 5000,
        system: systemPrompt,
        tools: [{ type: 'web_search_20250305', name: 'web_search' }],
        messages: [{ role: 'user', content: `Today is ${today}. Search the web for what products are currently trending on TikTok Shop UK, Amazon UK Movers and Shakers, and AliExpress right now. Then use that real data to find 3 genuinely emerging UK dropshipping products. Apply the full scoring framework. Return ONLY the JSON array — no other text.` }]
      })
    });

    if (!aiRes.ok) {
      const err = await aiRes.text();
      console.error('[DRH] AI error:', aiRes.status, err.slice(0, 200));
      return res.status(500).json({ error: 'AI error ' + aiRes.status });
    }

    const aiData = await aiRes.json();

    // Handle multi-turn tool use — extract all text blocks from content
    const rawText = (aiData.content || [])
      .filter(b => b.type === 'text')
      .map(b => b.text)
      .join('');

    console.log('[DRH] AI response length:', rawText.length, 'stop_reason:', aiData.stop_reason);

    // If Claude used web search, we need to complete the conversation
    let finalText = rawText;
    if (aiData.stop_reason === 'tool_use') {
      console.log('[DRH] Claude used web search, completing conversation...');
      const toolUseBlocks = (aiData.content || []).filter(b => b.type === 'tool_use');
      const toolResults = toolUseBlocks.map(block => ({
        type: 'tool_result',
        tool_use_id: block.id,
        content: block.input?.query ? `Web search completed for: ${block.input.query}` : 'Search complete'
      }));

      const followUpRes = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-api-key': apiKey, 'anthropic-version': '2023-06-01' },
        body: JSON.stringify({
          model: 'claude-sonnet-4-6',
          max_tokens: 5000,
          system: systemPrompt,
          tools: [{ type: 'web_search_20250305', name: 'web_search' }],
          messages: [
            { role: 'user', content: `Today is ${today}. Search the web for what products are currently trending on TikTok Shop UK, Amazon UK Movers and Shakers, and AliExpress right now. Then use that real data to find 3 genuinely emerging UK dropshipping products. Apply the full scoring framework. Return ONLY the JSON array — no other text.` },
            { role: 'assistant', content: aiData.content },
            { role: 'user', content: toolResults }
          ]
        })
      });

      if (followUpRes.ok) {
        const followUpData = await followUpRes.json();
        finalText = (followUpData.content || [])
          .filter(b => b.type === 'text')
          .map(b => b.text)
          .join('');
        console.log('[DRH] Follow-up response length:', finalText.length);
      }
    }

    let cleaned = finalText.replace(/```json/gi, '').replace(/```/g, '').trim();
    const start = cleaned.indexOf('[');
    const end = cleaned.lastIndexOf(']');
    if (start === -1 || end === -1) return res.status(500).json({ error: 'No product array found' });
    cleaned = cleaned.slice(start, end + 1);

    let products;
    try {
      products = JSON.parse(cleaned);
    } catch (e) {
      console.error('[DRH] Parse error:', e.message);
      return res.status(500).json({ error: 'Parse error: ' + e.message });
    }

    console.log('[DRH] Fetching images for', products.length, 'products...');
    const images = await Promise.all(products.map(p => fetchProductImage(p.name)));
    products = products.map((p, i) => ({ ...p, img: images[i] || '' }));

    console.log('[DRH] Done. Images:', images.filter(Boolean).length, '/', products.length);
    return res.status(200).json({ content: [{ type: 'text', text: JSON.stringify(products) }] });
  }

  // ── PRODUCT VALIDATOR ─────────────────────────────────────────────────────
  if (body.productName) {
    console.log('[DRH] Validator:', body.productName);
    const aiRes = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-api-key': apiKey, 'anthropic-version': '2023-06-01' },
      body: JSON.stringify({
        model: 'claude-sonnet-4-6',
        max_tokens: 1500,
        system: `You are an expert ecommerce product research analyst. Return ONLY a valid JSON object — no markdown, no backticks. Fields: {"productName":"string","opportunityScore":"A+|A|B+|B|C+|C|D","marketStage":"string","growthScore":number,"competitionScore":number,"marginScore":number,"saturationRisk":"Low|Medium|High|Very High","verdict":"string","whyItCouldWork":["string","string","string"],"risks":["string","string","string"],"creativeAngles":["string","string","string"],"hooks":{"broad":"string","alt":"string"},"growthGraph":[{"label":"W1","value":number},{"label":"W2","value":number},{"label":"W3","value":number},{"label":"W4","value":number},{"label":"W5","value":number},{"label":"W6","value":number}]}`,
        messages: [{ role: 'user', content: `Analyse for UK ecommerce: ${body.productName}` }]
      })
    });
    const aiData = await aiRes.json();
    const raw = (aiData.content || []).filter(b => b.type === 'text').map(b => b.text).join('');
    try { return res.status(200).json(JSON.parse(raw.replace(/```json|```/g, '').trim())); }
    catch (e) { return res.status(500).json({ error: 'Validator parse error' }); }
  }

  // ── PASSTHROUGH ───────────────────────────────────────────────────────────
  if (body.system && body.messages) {
    const aiRes = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-api-key': apiKey, 'anthropic-version': '2023-06-01' },
      body: JSON.stringify({
        model: 'claude-sonnet-4-6',
        max_tokens: body.max_tokens || 2000,
        system: body.system,
        messages: body.messages
      })
    });
    const aiData = await aiRes.json();
    const raw = (aiData.content || []).filter(b => b.type === 'text').map(b => b.text).join('');
    return res.status(200).json({ content: [{ type: 'text', text: raw }] });
  }

  return res.status(400).json({ error: 'Invalid request format' });
}
