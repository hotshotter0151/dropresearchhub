export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.status(200).end();

  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const supabaseUrl = process.env.SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !serviceRoleKey) {
      return res.status(500).json({
        error: "Missing Supabase environment variables"
      });
    }

    const range = String(req.query.range || "today").toLowerCase();

    const now = new Date();
    const startDate = new Date();

    if (range === "7d") {
      startDate.setDate(now.getDate() - 7);
    } else if (range === "30d") {
      startDate.setDate(now.getDate() - 30);
    } else {
      startDate.setHours(0, 0, 0, 0);
    }

    const cleanUrl = supabaseUrl.replace(/\/$/, "");

    const url =
      `${cleanUrl}/rest/v1/analytics_events` +
      `?select=*` +
      `&order=created_at.desc` +
      `&limit=1000`;

    const response = await fetch(url, {
      method: "GET",
      headers: {
        apikey: serviceRoleKey,
        Authorization: `Bearer ${serviceRoleKey}`,
        "Content-Type": "application/json"
      }
    });

    const rawText = await response.text();

    if (!response.ok) {
      return res.status(500).json({
        error: "Supabase analytics query failed",
        details: rawText
      });
    }

    let rows = [];

    try {
      rows = JSON.parse(rawText);
    } catch (err) {
      return res.status(500).json({
        error: "Supabase returned invalid JSON",
        details: err.message
      });
    }

    if (!Array.isArray(rows)) rows = [];

    const filteredRows = rows.filter((row) => {
      if (!row.created_at) return true;
      return new Date(row.created_at).getTime() >= startDate.getTime();
    });

    const events = filteredRows.map((row) => {
      const eventName = row.event_name || "page_view";
      const pagePath = row.page_path || "/";
      const deviceType = row.device_type || "Unknown";
      const browser = row.browser || "Unknown";
      const source = row.source || row.referrer || "Direct";

      return {
        id: row.id || "",
        event_name: eventName,
        event: eventName,
        page_path: pagePath,
        page: pagePath,
        referrer: row.referrer || "",
        source: source,
        device_type: deviceType,
        device: deviceType,
        browser: browser,
        session_id: row.session_id || row.id || "",
        created_at: row.created_at || new Date().toISOString(),
        medium: row.medium || "",
        campaign: row.campaign || "",
        metadata: row.metadata || {}
      };
    });

    return res.status(200).json({
      success: true,
      range,
      count: events.length,
      events
    });
  } catch (err) {
    return res.status(500).json({
      error: "Admin analytics API crashed",
      details: err.message
    });
  }
}
