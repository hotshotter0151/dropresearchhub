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
    console.log('[DRH] Fetching Google Trends UK data...');
    
    let trendingContext = '';
    
    try {
      // Google Trends daily trending searches for UK - real live data
      const trendsRes = await fetch(
        'https://trends.google.com/trends/api/dailytrends?hl=en-GB&tz=-60&geo=GB&ns=15',
        { 
          headers: { 
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
            'Accept': 'application/json'
          },
          signal: AbortSignal.timeout(5000) // 5 second timeout max
        }
      );
      
      if (trendsRes.ok) {
        const raw = await trendsRes.text();
        // Google returns )]}' prefix - strip it
        const cleaned = raw.replace(/^\)\]\}'/, '').trim();
        const json = JSON.parse(cleaned);
        
        // Extract trending search titles
        const searches = json?.default?.trendingSearchesDays?.[0]?.trendingSearches || [];
        const keywords = searches
          .map(s => s?.title?.query)
          .filter(Boolean)
          .slice(0, 20);
        
        if (keywords.length > 0) {
          trendingContext = `REAL UK Google Trends data right now (${new Date().toLocaleDateString('en-GB')}): ${keywords.join(', ')}`;
          console.log('[DRH] Got', keywords.length, 'real trending searches:', keywords.slice(0,5).join(', '));
        }
      }
    } catch (e) {
      console.log('[DRH] Google Trends fetch failed (using AI knowledge):', e.message);
    }

    console.log('[DRH] Calling AI with', trendingContext ? 'REAL trend data' : 'AI knowledge only');

    const systemPrompt = trendingContext
      ? `You are an expert ecommerce product researcher for UK dropshippers. You have access to REAL live Google Trends UK data.

${trendingContext}

Using this real trending data, identify 5 emerging ecommerce product opportunities. Look for products related to or inspired by these real trends that a UK dropshipper could sell. Focus on physical products with good margins.

Return ONLY a valid JSON array of exactly 5 product objects. No markdown, no backticks.

Each object must have ALL these fields:
{"name":"string","niche":"Pet|Home|Beauty|Fitness|Kitchen|Outdoor|Baby|Office|Tech|Fashion","emoji":"single emoji","stage":"Emerging","season":"Evergreen|Summer peak|Winter peak|Jan peak|Back to school","grade":"A+|A|B|C","trendScore":number 65-95,"saturation":number 5-40,"margin":"XX%","whyNow":"one sentence connecting this product to the real trending data","verdict":"2 sentences for UK dropshipper","whyItCouldWork":["reason1","reason2","reason3"],"risks":["risk1","risk2","risk3"],"creativeAngles":["angle1","angle2","angle3"],"aliSearchTerm":"aliexpress search term","googleTrendsKeyword":"broader keyword that shows on Google Trends UK","bgColor":"#EFF6FF","growthData":[{"label":"W1","value":20},{"label":"W2","value":35},{"label":"W3","value":50},{"label":"W4","value":65},{"label":"W5","value":78},{"label":"W6","value":88}]}

IMPORTANT: googleTrendsKeyword must be a BROAD term that will actually show data on Google Trends UK — not too specific. For example use "ice bath" not "portable collapsible ice bath tub".`

      : `You are an expert ecommerce product researcher for UK dropshippers. Find products showing early growth signals in the UK market right now in June 2026.

Return ONLY a valid JSON array of exactly 5 product objects. No markdown, no backticks.

Each object must have ALL these fields:
{"name":"string","niche":"Pet|Home|Beauty|Fitness|Kitchen|Outdoor|Baby|Office|Tech|Fashion","emoji":"single emoji","stage":"Emerging","season":"Evergreen|Summer peak|Winter peak|Jan peak|Back to school","grade":"A+|A|B|C","trendScore":number 65-95,"saturation":number 5-40,"margin":"XX%","whyNow":"one sentence why trending mid-2026 UK","verdict":"2 sentences for UK dropshipper","whyItCouldWork":["reason1","reason2","reason3"],"risks":["risk1","risk2","risk3"],"creativeAngles":["angle1","angle2","angle3"],"aliSearchTerm":"aliexpress search term","googleTrendsKeyword":"broad keyword that shows real data on Google Trends UK","bgColor":"#EFF6FF","growthData":[{"label":"W1","value":20},{"label":"W2","value":35},{"label":"W3","value":50},{"label":"W4","value":65},{"label":"W5","value":78},{"label":"W6","value":88}]}

IMPORTANT: googleTrendsKeyword must be broad enough to show real data on Google Trends UK. No yoga mats, resistance bands, water bottles. Specific but searchable products.`;

    const aiRes = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-api-key': apiKey, 'anthropic-version': '2023-06-01' },
      body: JSON.stringify({
        model: 'claude-haiku-4-5',
        max_tokens: 3000,
        system: systemPrompt,
        messages: [{ role: 'user', content: trendingContext 
          ? 'Using the real Google Trends UK data provided, identify 5 emerging ecom product opportunities for UK dropshippers.' 
          : 'Generate 5 genuinely emerging UK ecom products for June 2026 with broad googleTrendsKeyword values that will show real data.' 
        }]
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
      console.log('[DRH] Generated', products.length, 'products. Real trends used:', !!trendingContext);
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
        model: 'claude-haiku-4-5',
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
        model: 'claude-haiku-4-5',
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
