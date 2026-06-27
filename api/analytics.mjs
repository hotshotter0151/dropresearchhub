export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method !== "GET") {
    return res.status(405).json({
      error: "Method not allowed",
      message: "Use GET only"
    });
  }

  try {
    const supabaseUrl = process.env.SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !serviceRoleKey) {
      return res.status(500).json({
        error: "Missing Supabase environment variables",
        details: "SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY is missing in Vercel"
      });
    }

    const range = String(req.query.range || "today").toLowerCase();
    const now = new Date();
    let startDate = new Date();

    if (range === "today") {
      startDate.setHours(0, 0, 0, 0);
    } else if (range === "7d") {
      startDate.setDate(now.getDate() - 7);
    } else if (range === "30d") {
      startDate.setDate(now.getDate() - 30);
    } else {
      startDate.setHours(0, 0, 0, 0);
    }

    const query = new URL(`${supabaseUrl}/rest/v1/analytics_events`);
    query.searchParams.set("select", "*");
    query.searchParams.set("created_at", `gte.${startDate.toISOString()}`);
    query.searchParams.set("order", "created_at.desc");
    query.searchParams.set("limit", "1000");

    const response = await fetch(query.toString(), {
      method: "GET",
      headers: {
        apikey: serviceRoleKey,
        Authorization: `Bearer ${serviceRoleKey}`,
        "Content-Type": "application/json"
      }
    });

    const text = await response.text();

    if (!response.ok) {
      return res.status(response.status).json({
        error: "Supabase analytics query failed",
        details: text
      });
    }

    let rows = [];

    try {
      rows = JSON.parse(text);
    } catch (err) {
      return res.status(500).json({
        error: "Could not parse Supabase response",
        details: err.message
      });
    }

    const events = rows.map((row) => {
      const deviceValue = row.device_type || row.device || "Unknown";
      const pageValue = row.page_path || row.path || row.page || "/";
      const eventValue = row.event_name || row.event || "page_view";
      const sourceValue = row.source || row.referrer || "Direct";

      return {
        id: row.id || "",
        event_name: eventValue,
        event: eventValue,
        page_path: pageValue,
        page: pageValue,
        referrer: row.referrer || "",
        source: sourceValue,
        device_type: deviceValue,
        device: deviceValue,
        browser: row.browser || "Unknown",
        session_id: row.session_id || row.visitor_id || row.id || "",
        created_at: row.created_at || row.timestamp || new Date().toISOString(),
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

  } catch (error) {
    return res.status(500).json({
      error: "Admin analytics API failed",
      details: error.message
    });
  }
}
