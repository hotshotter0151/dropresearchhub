const SUPABASE_URL = 'https://qpkpvtsoxiqcrkztkagn.supabase.co';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;

async function sbFetch(path, method = 'GET', body) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1${path}`, {
    method,
    headers: {
      'apikey': SUPABASE_SERVICE_KEY,
      'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
      'Content-Type': 'application/json',
      'Prefer': 'return=representation'
    },
    body: body ? JSON.stringify(body) : undefined
  });
  return res.json();
}

// Monday 00:00 (UTC) of the ISO week containing `date`
function startOfISOWeek(date) {
  const d = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
  const day = d.getUTCDay() || 7; // Sunday = 7
  d.setUTCDate(d.getUTCDate() - (day - 1));
  d.setUTCHours(0, 0, 0, 0);
  return d;
}

// A 'trial' status user whose signup is more than 7 days old never converted
// (real conversions get flipped to 'active' by the Stripe webhook) — expired.
const TRIAL_DAYS = 7;
function trialExpired(u) {
  if (!u?.created_at) return false;
  return (Date.now() - new Date(u.created_at).getTime()) > TRIAL_DAYS * 86400000 + 12 * 3600000;
}

// ── Admin API token verification ──────────────────────────────────────
// Tokens are minted by auth.js on admin login (HMAC-signed).
// If ADMIN_TOKEN_SECRET isn't set in Vercel yet, checks are skipped so
// nothing breaks — set the env var to arm the protection.
import crypto from 'crypto';
const ADMIN_TOKEN_SECRET = process.env.ADMIN_TOKEN_SECRET || '';

function verifyAdminToken(token) {
  if (!ADMIN_TOKEN_SECRET) return true; // not armed yet — allow
  if (!token || !token.includes('.')) return false;
  const [payload, sig] = token.split('.');
  const expected = crypto.createHmac('sha256', ADMIN_TOKEN_SECRET).update(payload).digest('hex');
  if (sig !== expected) return false;
  try {
    const decoded = Buffer.from(payload, 'base64url').toString();
    const expires = Number(decoded.split(':').pop());
    return Number.isFinite(expires) && expires > Date.now();
  } catch {
    return false;
  }
}

function requireAdmin(req, res) {
  if (verifyAdminToken(req.headers['x-drh-admin-token'])) return true;
  res.status(401).json({ error: 'Admin authorisation required' });
  return false;
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PATCH, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();

  // GET — fetch live products (for members/trial/dashboard pages)
  //
  // Tiering:
  //   ?all=true                     -> admin feed, everything incl. non-live
  //   ?email=<active member/admin>  -> full live feed (archive included)
  //   ?email=<trialist / unknown>   -> current drop week ONLY (server-side gate)
  //   no email                      -> full live feed (backwards-compatible;
  //                                    see note below before flipping this)
  if (req.method === 'GET') {
    const all = req.query?.all === 'true';
    const email = (req.query?.email || '').trim();

    try {
      const query = all
        ? '/products?order=published_at.desc&select=*'
        : '/products?is_live=eq.true&order=published_at.desc&select=*';
      const rows = await sbFetch(query);
      const mapped = rows.map(p => ({
        ...p.data,
        id: p.id,
        is_live: p.is_live,
        published_at: p.published_at
      }));

      // Admin feed — requires admin token
      if (all) {
        if (!requireAdmin(req, res)) return;
        return res.status(200).json({ products: mapped });
      }

      // Work out the requester's tier
      let tier = 'trial'; // no email = current week only (all real pages send email)
      if (email) {
        const users = await sbFetch(
          `/users?email=eq.${encodeURIComponent(email)}&select=subscription_status,role,created_at`
        );
        const u = Array.isArray(users) ? users[0] : null;
        if (u && (u.role === 'admin' || u.subscription_status === 'active')) {
          tier = 'member';
        } else if (u && u.subscription_status === 'trial' && trialExpired(u)) {
          tier = 'expired'; // 7 days up, never converted — no products
        } else if (u && u.subscription_status === 'cancelled') {
          tier = 'expired'; // cancelled members keep nothing
        } else {
          tier = 'trial'; // live trialists, unknown emails
        }
      }

      if (tier === 'expired') {
        return res.status(200).json({
          products: [],
          tier: 'expired',
          lockedCount: mapped.length,
          totalLive: mapped.length
        });
      }

      if (tier === 'member') {
        return res.status(200).json({
          products: mapped,
          tier: 'member',
          lockedCount: 0,
          totalLive: mapped.length
        });
      }

      // Trial tier — only the current drop (the ISO week of the newest
      // published product). The archive never leaves the server.
      let visible = mapped;
      if (mapped.length && mapped[0].published_at) {
        const weekStart = startOfISOWeek(new Date(mapped[0].published_at));
        visible = mapped.filter(p =>
          p.published_at && new Date(p.published_at) >= weekStart
        );
      }

      return res.status(200).json({
        products: visible,
        tier: 'trial',
        lockedCount: Math.max(0, mapped.length - visible.length),
        totalLive: mapped.length
      });
    } catch (e) {
      return res.status(500).json({ error: e.message });
    }
  }

  // POST — publish new products to feed (admin only)
  if (req.method === 'POST') {
    if (!requireAdmin(req, res)) return;
    const { products, replace } = req.body;
    if (!Array.isArray(products)) return res.status(400).json({ error: 'No products provided' });
    try {
      if (replace) {
        await sbFetch('/products?is_live=eq.true', 'DELETE');
      }
      if (products.length > 0) {
        const rows = products.map(p => ({ name: p.name, data: p, is_live: true, published_at: new Date().toISOString() }));
        await sbFetch('/products', 'POST', rows);
      }
      return res.status(200).json({ success: true });
    } catch (e) {
      return res.status(500).json({ error: e.message });
    }
  }

  // PATCH — toggle is_live on/off for a product by name (admin only)
  if (req.method === 'PATCH') {
    if (!requireAdmin(req, res)) return;
    const { productName, is_live } = req.body;
    if (!productName) return res.status(400).json({ error: 'No product name provided' });
    try {
      await sbFetch(`/products?name=eq.${encodeURIComponent(productName)}`, 'PATCH', { is_live });
      return res.status(200).json({ success: true });
    } catch (e) {
      return res.status(500).json({ error: e.message });
    }
  }

  // DELETE — permanently remove a product by name (admin only)
  if (req.method === 'DELETE') {
    if (!requireAdmin(req, res)) return;
    const { productName } = req.body;
    if (!productName) return res.status(400).json({ error: 'No product name provided' });
    try {
      await sbFetch(`/products?name=eq.${encodeURIComponent(productName)}`, 'DELETE');
      return res.status(200).json({ success: true });
    } catch (e) {
      return res.status(500).json({ error: e.message });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
