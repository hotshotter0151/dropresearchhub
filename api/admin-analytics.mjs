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

    function cleanPageName(path) {
      const value = String(path || "/").trim();

      if (value === "/" || value === "") return "Homepage";
      if (value.includes("index.html")) return "Homepage";
      if (value.includes("signup.html")) return "Signup";
      if (value.includes("login.html")) return "Login";
      if (value.includes("dashboard.html")) return "Dashboard";
      if (value.includes("members.html")) return "Members Area";
      if (value.includes("trial.html")) return "Trial Area";
      if (value.includes("pulse.html")) return "Market Pulse";
      if (value.includes("admin.html")) return "Admin";
      if (value.includes("contact.html")) return "Contact";
      if (value.includes("privacy.html")) return "Privacy Policy";
      if (value.includes("terms.html")) return "Terms";
      if (value.includes("refunds.html")) return "Refund Policy";
      if (value.includes("cookies.html")) return "Cookie Policy";
      if (value.includes("disclaimer.html")) return "Disclaimer";

      return value
        .replace("/", "")
        .replace(".html", "")
        .replace(/-/g, " ")
        .replace(/\b\w/g, (char) => char.toUpperCase());
    }

    function cleanSource(row) {
      const source = String(row.source || "").toLowerCase();
      const referrer = String(row.referrer || "").toLowerCase();

      const combined = `${source} ${referrer}`;

      if (combined.includes("tiktok")) return "TikTok";
      if (combined.includes("facebook") || combined.includes("fb.")) return "Facebook";
      if (combined.includes("instagram")) return "Instagram";
      if (combined.includes("google")) return "Google";
      if (combined.includes("bing")) return "Bing";
      if (combined.includes("youtube")) return "YouTube";
      if (combined.includes("email") || combined.includes("resend")) return "Email";
      if (combined.includes("chatgpt") || combined.includes("openai")) return "ChatGPT";
      if (combined.includes("claude") || combined.includes("anthropic")) return "Claude";
      if (combined.includes("dropresearchhub.com")) return "Internal";
      if (source && source !== "direct") return source.charAt(0).toUpperCase() + source.slice(1);

      return "Direct";
    }

    function cleanDevice(value) {
      const device = String(value || "").toLowerCase();

      if (device.includes("mobile")) return "Mobile";
      if (device.includes("tablet")) return "Tablet";
      if (device.includes("desktop")) return "Desktop";

      return "Unknown";
    }

    function cleanBrowser(value) {
      const browser = String(value || "").trim();

      if (!browser) return "Unknown";
      if (browser.toLowerCase().includes("chrome")) return "Chrome";
      if (browser.toLowerCase().includes("safari")) return "Safari";
      if (browser.toLowerCase().includes("edge")) return "Edge";
      if (browser.toLowerCase().includes("firefox")) return "Firefox";

      return browser.charAt(0).toUpperCase() + browser.slice(1);
    }

    const events = filteredRows.map((row) => {
      const eventName = row.event_name || "page_view";
      const rawPagePath = row.page_path || "/";
      const prettyPage = cleanPageName(rawPagePath);
      const deviceType = cleanDevice(row.device_type);
      const browser = cleanBrowser(row.browser);
      const source = cleanSource(row);

      return {
        id: row.id || "",
        event_name: eventName,
        event: eventName,
        page_path: prettyPage,
        raw_page_path: rawPagePath,
        page: prettyPage,
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
