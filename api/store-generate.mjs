export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  try {
    const anthropicKey = process.env.ANTHROPIC_API_KEY;
    if (!anthropicKey) return res.status(500).json({ error: "Missing ANTHROPIC_API_KEY" });

    const body = typeof req.body === "string" ? JSON.parse(req.body) : req.body;
    const { productName, niche, problem, brandName, brandIcon, colours, images, action } = body || {};

    // ── ACTION: GENERATE BRAND NAMES ──────────────────────────────────────────
    if (action === "brand_names") {
      if (!productName || !niche) return res.status(400).json({ error: "productName and niche required" });

      const prompt = `You are a professional brand naming consultant specialising in UK ecommerce and DTC brands.

A seller is launching a product and needs a brand name. Generate exactly 3 brand name options.

Product: ${productName}
Niche: ${niche}
Problem it solves: ${problem || "Not specified"}
Brand colours chosen: Primary ${colours?.primary || "#1E3A5F"}, Secondary ${colours?.secondary || "#F59E0B"}

Rules:
- Each name must be 1-2 words maximum
- Must be memorable, unique and brandable
- Must work as a .com domain (short, no hyphens)
- Must feel premium and trustworthy
- Must suit UK ecommerce
- Each must have a completely different personality/angle

Respond ONLY with valid JSON, no markdown, no backticks:
{
  "brands": [
    {
      "name": "BrandName",
      "icon": "single relevant emoji",
      "rationale": "One sentence explaining the personality and why it works for this product (max 20 words)",
      "angle": "Premium / Bold / Friendly / Minimal / Natural / Tech / Lifestyle (pick one)",
      "nicheTag": "Best for: X · Y · Z (3 descriptors max)"
    },
    {
      "name": "BrandName2",
      "icon": "single relevant emoji",
      "rationale": "One sentence explaining the personality and why it works for this product (max 20 words)",
      "angle": "Premium / Bold / Friendly / Minimal / Natural / Tech / Lifestyle (pick one)",
      "nicheTag": "Best for: X · Y · Z (3 descriptors max)"
    },
    {
      "name": "BrandName3",
      "icon": "single relevant emoji",
      "rationale": "One sentence explaining the personality and why it works for this product (max 20 words)",
      "angle": "Premium / Bold / Friendly / Minimal / Natural / Tech / Lifestyle (pick one)",
      "nicheTag": "Best for: X · Y · Z (3 descriptors max)"
    }
  ]
}`;

      const response = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": anthropicKey,
          "anthropic-version": "2023-06-01"
        },
        body: JSON.stringify({
          model: "claude-sonnet-4-6",
          max_tokens: 800,
          messages: [{ role: "user", content: prompt }]
        })
      });

      if (!response.ok) {
        const err = await response.text();
        return res.status(500).json({ error: "Anthropic API error", details: err });
      }

      const data = await response.json();
      const text = data.content?.[0]?.text || "";
      const clean = text.replace(/```json\s*/gi, "").replace(/```/g, "").trim();
      const parsed = JSON.parse(clean);
      return res.status(200).json({ success: true, brands: parsed.brands });
    }

    // ── ACTION: GENERATE FULL STORE ───────────────────────────────────────────
    if (action === "generate_store") {
      if (!productName || !niche || !brandName) {
        return res.status(400).json({ error: "productName, niche and brandName required" });
      }

      const primaryColour = colours?.primary || "#1E3A5F";
      const secondaryColour = colours?.secondary || "#F59E0B";
      const accentColour = colours?.accent || "#F8FAFF";

      // Determine font pairing based on niche
      const fontPairs = {
        "Tech & Gadgets": { heading: "Space Grotesk", body: "Inter" },
        "Phone & Tech Accessories": { heading: "Space Grotesk", body: "Inter" },
        "Gaming & Entertainment": { heading: "Space Grotesk", body: "Inter" },
        "Beauty & Skincare": { heading: "Playfair Display", body: "Lato" },
        "Hair Care": { heading: "Playfair Display", body: "Lato" },
        "Wellness & Self Care": { heading: "Cormorant Garamond", body: "Lato" },
        "Sleep & Relaxation": { heading: "Cormorant Garamond", body: "Lato" },
        "Fitness & Exercise": { heading: "Bebas Neue", body: "Inter" },
        "Sports & Outdoors": { heading: "Bebas Neue", body: "Inter" },
        "Kitchen & Cooking": { heading: "Merriweather", body: "Inter" },
        "Home & Living": { heading: "Merriweather", body: "Inter" },
        "Eco & Sustainable": { heading: "Josefin Sans", body: "Lato" },
        "Garden & Outdoor": { heading: "Josefin Sans", body: "Lato" },
        "Baby & Kids": { heading: "Nunito", body: "Nunito" },
        "Pet Products": { heading: "Nunito", body: "Inter" },
        "Fashion & Clothing": { heading: "Cormorant Garamond", body: "Lato" },
        "Jewellery & Accessories": { heading: "Cormorant Garamond", body: "Lato" },
      };
      const fonts = fontPairs[niche] || { heading: "Inter", body: "Inter" };

      const prompt = `You are an expert ecommerce copywriter and brand strategist specialising in UK DTC brands. You write compelling, conversion-focused copy that feels human, not AI-generated.

Generate complete store copy for a Shopify-style homepage. Every word must be specific to this product — never generic.

PRODUCT DETAILS:
- Product name: ${productName}
- Niche: ${niche}
- Problem it solves: ${problem || "Makes life easier and more enjoyable"}
- Brand name: ${brandName}
- Brand colours: Primary ${primaryColour}, Secondary ${secondaryColour}

COPY RULES:
- Hero headline: Pain-first or desire-first, punchy, max 8 words, no fluff
- All copy must be UK English (colour not color, favourite not favorite)
- Reviews must sound like real UK customers — conversational, specific, believable
- FAQ answers must be honest, reassuring and specific to this product
- Never use: "game-changer", "revolutionary", "best in class", "innovative solution"
- Trust strip: short, punchy, 4 trust signals
- Features: benefit-led not feature-led (what it DOES for the customer, not what it IS)
- Social handle: create a believable @handle based on the brand name

Respond ONLY with valid JSON, no markdown, no backticks, no comments:
{
  "meta": {
    "tagline": "3-5 word brand tagline",
    "socialHandle": "@brandhandle"
  },
  "press": ["Publication 1","Publication 2","Publication 3","Publication 4","Publication 5"],
  "comparison": [
    {"feature":"Free UK Delivery","brand":true,"generic":false,"retailer":true},
    {"feature":"30-Day Returns","brand":true,"generic":false,"retailer":true},
    {"feature":"UK Warranty","brand":true,"generic":false,"retailer":false},
    {"feature":"Problem-solving design","brand":true,"generic":false,"retailer":false},
    {"feature":"Premium quality","brand":true,"generic":false,"retailer":false},
    {"feature":"Great value","brand":true,"generic":true,"retailer":false}
  ],
  "nav": {
    "links": ["Products", "Reviews", "FAQ", "About"],
    "ctaText": "Shop Now"
  },
  "trustStrip": [
    {"icon": "🚚", "text": "Free UK Delivery"},
    {"icon": "↩️", "text": "30-Day Returns"},
    {"icon": "🔒", "text": "Secure Checkout"},
    {"icon": "⭐", "text": "4.9 Star Rated"}
  ],
  "hero": {
    "headline": "Pain-first headline max 8 words",
    "subheadline": "1-2 sentences expanding on the headline, specific to the product benefit. Max 25 words.",
    "ctaText": "Shop ${brandName}",
    "ctaSecondary": "See how it works",
    "badge": "Short urgency or social proof badge text e.g. Over 2,000 UK customers"
  },
  "problem": {
    "eyebrow": "Short eyebrow label e.g. The Problem",
    "headline": "Headline naming the problem this product solves",
    "body": "2-3 sentences describing the frustration/pain point the customer feels before they find this product. Empathetic, specific, relatable.",
    "solutionEyebrow": "The Solution",
    "solutionHeadline": "Headline introducing the product as the answer",
    "solutionBody": "2-3 sentences explaining how the product solves the problem. Confident, specific, benefit-led."
  },
  "features": [
    {"icon": "emoji", "title": "Benefit-led feature title", "body": "One sentence describing what this does for the customer. Specific, not generic."},
    {"icon": "emoji", "title": "Benefit-led feature title", "body": "One sentence describing what this does for the customer. Specific, not generic."},
    {"icon": "emoji", "title": "Benefit-led feature title", "body": "One sentence describing what this does for the customer. Specific, not generic."},
    {"icon": "emoji", "title": "Benefit-led feature title", "body": "One sentence describing what this does for the customer. Specific, not generic."}
  ],
  "reviews": [
    {
      "name": "Real UK first name",
      "location": "UK city",
      "rating": 5,
      "title": "Short review title",
      "body": "2-3 sentences. Sounds like a real UK customer. Mentions a specific benefit or moment. Conversational.",
      "verified": true,
      "daysAgo": 3
    },
    {
      "name": "Real UK first name",
      "location": "UK city",
      "rating": 5,
      "title": "Short review title",
      "body": "2-3 sentences. Different angle to review 1. Mentions a different benefit.",
      "verified": true,
      "daysAgo": 7
    },
    {
      "name": "Real UK first name",
      "location": "UK city",
      "rating": 5,
      "title": "Short review title",
      "body": "2-3 sentences. Different angle again. Could mention gifting or sharing.",
      "verified": true,
      "daysAgo": 12
    }
  ],
  "howItWorks": {
    "eyebrow": "How It Works",
    "headline": "Simple headline about ease of use",
    "steps": [
      {"number": "01", "title": "Step title", "body": "One sentence describing this step."},
      {"number": "02", "title": "Step title", "body": "One sentence describing this step."},
      {"number": "03", "title": "Step title", "body": "One sentence describing this step."}
    ]
  },
  "faq": {
    "eyebrow": "FAQ",
    "headline": "Got questions? We have answers.",
    "items": [
      {"q": "Product-specific question 1", "a": "Honest, reassuring answer. 2-3 sentences."},
      {"q": "Product-specific question 2", "a": "Honest, reassuring answer. 2-3 sentences."},
      {"q": "Shipping or delivery question", "a": "Specific answer about UK delivery."},
      {"q": "Returns or guarantee question", "a": "Reassuring answer about their purchase protection."}
    ]
  },
  "finalCta": {
    "eyebrow": "Ready?",
    "headline": "Urgency or desire-led headline max 8 words",
    "body": "One sentence reinforcing the main benefit and reducing purchase anxiety.",
    "ctaText": "Shop ${brandName} Now",
    "guarantee": "30-day money back guarantee",
    "badge": "Join X+ happy customers"
  },
  "footer": {
    "tagline": "Brand tagline for footer",
    "links": ["Privacy Policy", "Returns Policy", "Shipping Info", "Contact Us", "Terms of Service"]
  }
}`;

      const response = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": anthropicKey,
          "anthropic-version": "2023-06-01"
        },
        body: JSON.stringify({
          model: "claude-sonnet-4-6",
          max_tokens: 4000,
          messages: [{ role: "user", content: prompt }]
        })
      });

      if (!response.ok) {
        const err = await response.text();
        return res.status(500).json({ error: "Anthropic API error", details: err });
      }

      const data = await response.json();
      const text = data.content?.[0]?.text || "";
      const firstBrace = text.indexOf("{");
      const lastBrace = text.lastIndexOf("}");
      if (firstBrace === -1 || lastBrace === -1) {
        return res.status(500).json({ error: "Invalid JSON response from Sonnet" });
      }
      const clean = text.slice(firstBrace, lastBrace + 1);
      const parsed = JSON.parse(clean);

      return res.status(200).json({
        success: true,
        copy: parsed,
        fonts,
        colours: { primary: primaryColour, secondary: secondaryColour, accent: accentColour },
        brand: { name: brandName, icon: brandIcon || "✦", niche }
      });
    }

    return res.status(400).json({ error: "Invalid action. Use brand_names or generate_store." });

  } catch (err) {
    console.error("store-generate error:", err);
    return res.status(500).json({ error: "Store generator failed", details: err.message });
  }
}
