import { createClient } from '@supabase/supabase-js';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';

const supabase = createClient(
  'https://qpkpvtsoxiqcrkztkagn.supabase.co',
  process.env.SUPABASE_SERVICE_KEY
);

const TRIAL_DAYS = 7;

// ── Admin API token ────────────────────────────────────────────────────
// Minted on admin login, verified by write endpoints (products.js etc).
// HMAC-signed so it can't be forged without ADMIN_TOKEN_SECRET.
const ADMIN_TOKEN_SECRET = process.env.ADMIN_TOKEN_SECRET || '';

function mintAdminToken(email) {
  if (!ADMIN_TOKEN_SECRET) return null;
  const expires = Date.now() + 7 * 86400000; // 7 days
  const payload = Buffer.from(`${email}:${expires}`).toString('base64url');
  const sig = crypto.createHmac('sha256', ADMIN_TOKEN_SECRET).update(payload).digest('hex');
  return `${payload}.${sig}`;
}

function computeTrialEnd(user) {
  // If the webhook ever stores a real Stripe trial end date on the row,
  // prefer it. Otherwise approximate: signup date + 7 days.
  if (!user?.created_at) return null;
  return new Date(
    new Date(user.created_at).getTime() + TRIAL_DAYS * 86400000
  ).toISOString();
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { action, email, password, name, website } = req.body;

  // ── Register ───────────────────────────────────────────────────────────
  if (action === 'register') {
    // Honeypot: 'website' is an invisible field humans never see.
    // Bots auto-fill it — return a fake success and create nothing.
    if (website) return res.status(200).json({ success: true });

    if (!email || !password || !name)
      return res.status(400).json({ error: 'Name, email and password required' });

    const { data: existing } = await supabase
      .from('users')
      .select('id')
      .eq('email', email)
      .single();

    if (existing) return res.status(409).json({ error: 'Email already registered' });

    const password_hash = await bcrypt.hash(password, 10);

    const { data: user, error } = await supabase
      .from('users')
      .insert([{
        email,
        name,
        password_hash,
        subscription_status: 'trial',
        role: 'member',
        created_at: new Date().toISOString(),
      }])
      .select()
      .single();

    if (error) return res.status(500).json({ error: 'Registration failed', detail: error.message });

    return res.status(200).json({
      success: true,
      userId: user.id,
      email: user.email,
      name: user.name,
      subscription_status: user.subscription_status,
    });
  }

  // ── Login ──────────────────────────────────────────────────────────────
  // Single unified login path for everyone, including admin.
  // Admin status comes from the `role` column on the user's own row,
  // checked against a real hashed password — never a hardcoded string.
  if (action === 'login') {
    if (!email || !password)
      return res.status(400).json({ error: 'Email and password required' });

    const { data: user, error } = await supabase
      .from('users')
      .select('id, email, name, password_hash, subscription_status, role, created_at')
      .eq('email', email)
      .single();

    if (error || !user)
      return res.status(401).json({ error: 'Invalid email or password' });

    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) return res.status(401).json({ error: 'Invalid email or password' });

    if (user.role === 'admin') {
      return res.status(200).json({
        success: true,
        userId: user.id,
        email: user.email,
        name: user.name,
        role: 'admin',
        subscription_status: 'active',
        admin_token: mintAdminToken(user.email),
        redirect: '/admin.html',
      });
    }

    // Trialists now get the real dashboard — trial.html is retired.
    const redirect =
      user.subscription_status === 'active' ? '/members.html' : '/dashboard.html';

    return res.status(200).json({
      success: true,
      userId: user.id,
      email: user.email,
      name: user.name,
      role: user.role || 'member',
      subscription_status: user.subscription_status,
      trial_ends_at:
        user.subscription_status === 'trial' ? computeTrialEnd(user) : null,
      redirect,
    });
  }

  // ── Check status ───────────────────────────────────────────────────────
  if (action === 'checkStatus') {
    if (!email) return res.status(400).json({ error: 'Email required' });

    const { data: user, error } = await supabase
      .from('users')
      .select('subscription_status, name, role, created_at')
      .eq('email', email)
      .single();

    if (error || !user) return res.status(404).json({ error: 'User not found' });

    // Trial older than 7 days that never converted (webhook flips real
    // conversions to 'active') — report it as expired so the frontend
    // can lock products and show the restart prompt.
    let status = user.subscription_status;
    const endsAt = status === 'trial' ? computeTrialEnd(user) : null;
    if (status === 'trial' && endsAt && new Date(endsAt).getTime() + 12 * 3600000 < Date.now()) {
      status = 'trial_expired';
    }

    return res.status(200).json({
      success: true,
      subscription_status: status,
      role: user.role || 'member',
      name: user.name,
      trial_ends_at: endsAt,
    });
  }

  return res.status(400).json({ error: 'Invalid action' });
}
