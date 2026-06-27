export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed", message: "Use POST only" });
  }

  try {
    const supabaseUrl = process.env.SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!supabaseUrl || !serviceRoleKey) {
      return res.status(500).json({ error: "Missing Supabase environment variables" });
    }

    const body = typeof req.body === "string" ? JSON.parse(req.body) : req.body;
    const {
      event_name,
      page_path,
      referrer,
      source,
      medium,
      campaign,
      device_type,
      browser,
      session_id,
      metadata
    } = body || {};

    if (!event_name) {
      return res.status(400).json({ error: "event_name is required" });
    }

    const row = {
      event_name: String(event_name).slice(0, 100),
      page_path: String(page_path || "/").slice(0, 255),
      referrer: String(referrer || "").slice(0, 500),
      source: String(source || "Direct").slice(0, 255),
      medium: String(medium || "").slice(0, 100),
      campaign: String(campaign || "").slice(0, 100),
      device_type: String(device_type || "Unknown").slice(0, 50),
      browser: String(browser || "Unknown").slice(0, 50),
      session_id: String(session_id || "").slice(0, 100),
      metadata: metadata && typeof metadata === "object" ? metadata : {},
      created_at: new Date().toISOString()
    };

    const response = await fetch(`${supabaseUrl.replace(/\/$/, "")}/rest/v1/analytics_events`, {
      method: "POST",
      headers: {
        apikey: serviceRoleKey,
        Authorization: `Bearer ${serviceRoleKey}`,
        "Content-Type": "application/json",
        Prefer: "return=minimal"
      },
      body: JSON.stringify(row)
    });

    if (!response.ok) {
      const text = await response.text();
      return res.status(response.status).json({ error: "Supabase insert failed", details: text });
    }

    return res.status(200).json({ success: true });
  } catch (err) {
    return res.status(500).json({ error: "Analytics collect failed", details: err.message });
  }
}
