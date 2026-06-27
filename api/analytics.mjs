export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const SUPABASE_URL = process.env.SUPABASE_URL;
    const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!SUPABASE_URL) {
      return res.status(500).json({ error: 'Missing SUPABASE_URL' });
    }

    if (!SUPABASE_SERVICE_ROLE_KEY) {
      return res.status(500).json({ error: 'Missing SUPABASE_SERVICE_ROLE_KEY' });
    }

    const event = req.body || {};

    const payload = {
      event_name: event.event_name || 'page_view',
      page_path: event.page_path || '',
      referrer: event.referrer || '',
      source: event.source || '',
      medium: event.medium || '',
      campaign: event.campaign || '',
      device_type: event.device_type || '',
      browser: event.browser || '',
      session_id: event.session_id || '',
      metadata: event.metadata || {}
    };

    const response = await fetch(`${SUPABASE_URL}/rest/v1/analytics_events`, {
      method: 'POST',
      headers: {
        apikey: SUPABASE_SERVICE_ROLE_KEY,
        Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
        'Content-Type': 'application/json',
        Prefer: 'return=minimal'
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      const text = await response.text();
      return res.status(500).json({
        error: 'Supabase insert failed',
        details: text
      });
    }

    return res.status(200).json({ success: true });
  } catch (err) {
    return res.status(500).json({
      error: 'Analytics API crashed',
      details: err.message
    });
  }
}
