const SUPABASE_URL = 'https://qpkpvtsoxiqcrkztkagn.supabase.co';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;

async function supabase(path, method, body) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      'apikey': SUPABASE_SERVICE_KEY,
      'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
      'Prefer': method === 'POST' ? 'return=representation' : ''
    },
    body: body ? JSON.stringify(body) : undefined
  });
  return res.json();
}

async function hashPassword(password) {
  const encoder = new TextEncoder();
  const data = encoder.encode(password + 'drh_salt_2026');
  const hash = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(hash)).map(b => b.toString(16).padStart(2, '0')).join('');
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { action, email, password, name, stripeCustomerId, stripeSubscriptionId } = req.body;

  // REGISTER
  if (action === 'register') {
    if (!email || !password || !name) return res.status(400).json({ error: 'Missing fields' });
    const passwordHash = await hashPassword(password);
    const existing = await supabase(`/users?email=eq.${encodeURIComponent(email)}&select=id`, 'GET');
    if (existing.length > 0) return res.status(400).json({ error: 'Email already registered' });
    const user = await supabase('/users', 'POST', {
      email, name, password_hash: passwordHash,
      subscription_status: 'trial',
      stripe_customer_id: stripeCustomerId || null,
      stripe_subscription_id: stripeSubscriptionId || null
    });
    if (user.error) return res.status(500).json({ error: user.error.message });
    const u = Array.isArray(user) ? user[0] : user;
    return res.status(200).json({ success: true, user: { id: u.id, email: u.email, name: u.name, status: u.subscription_status } });
  }

  // LOGIN
  if (action === 'login') {
    if (!email || !password) return res.status(400).json({ error: 'Missing fields' });
    const passwordHash = await hashPassword(password);
    const users = await supabase(`/users?email=eq.${encodeURIComponent(email)}&select=*`, 'GET');
    if (!users.length) return res.status(401).json({ error: 'Invalid email or password' });
    const user = users[0];
    if (user.password_hash !== passwordHash) return res.status(401).json({ error: 'Invalid email or password' });
    return res.status(200).json({ success: true, user: { id: user.id, email: user.email, name: user.name, status: user.subscription_status } });
  }

  // UPDATE STATUS (called by Stripe webhook)
  if (action === 'updateStatus') {
    const { userId, status, stripeCustomerId, stripeSubscriptionId } = req.body;
    if (!userId && !stripeCustomerId) return res.status(400).json({ error: 'Missing user identifier' });
    const filter = userId ? `id=eq.${userId}` : `stripe_customer_id=eq.${stripeCustomerId}`;
    await supabase(`/users?${filter}`, 'PATCH', {
      subscription_status: status,
      stripe_subscription_id: stripeSubscriptionId || undefined
    });
    return res.status(200).json({ success: true });
  }

  return res.status(400).json({ error: 'Invalid action' });
}
