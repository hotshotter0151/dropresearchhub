const { createClient } = require('@supabase/supabase-js');
const bcrypt = require('bcryptjs');

const supabase = createClient(
  'https://qpkpvtsoxiqcrkztkagn.supabase.co',
  process.env.SUPABASE_SERVICE_KEY
);

const ADMIN_PASSWORD = 'Billy1234.';

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { action, email, password, name } = req.body;

  // ── Admin shortcut ─────────────────────────────────────────────────────
  if (action === 'login' && password === ADMIN_PASSWORD) {
    return res.status(200).json({
      success: true,
      role: 'admin',
      redirect: '/members.html',
    });
  }

  // ── Register ───────────────────────────────────────────────────────────
  if (action === 'register') {
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
  if (action === 'login') {
    if (!email || !password)
      return res.status(400).json({ error: 'Email and password required' });

    const { data: user, error } = await supabase
      .from('users')
      .select('id, email, name, password_hash, subscription_status')
      .eq('email', email)
      .single();

    if (error || !user)
      return res.status(401).json({ error: 'Invalid email or password' });

    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) return res.status(401).json({ error: 'Invalid email or password' });

    // Route based on live subscription status from Supabase
    const redirect =
      user.subscription_status === 'active' ? '/members.html' : '/trial.html';

    return res.status(200).json({
      success: true,
      userId: user.id,
      email: user.email,
      name: user.name,
      subscription_status: user.subscription_status,
      redirect,
    });
  }

  // ── Check status (called on page load to verify session) ──────────────
  if (action === 'checkStatus') {
    if (!email) return res.status(400).json({ error: 'Email required' });

    const { data: user, error } = await supabase
      .from('users')
      .select('subscription_status')
      .eq('email', email)
      .single();

    if (error || !user) return res.status(404).json({ error: 'User not found' });

    return res.status(200).json({
      success: true,
      subscription_status: user.subscription_status,
    });
  }

  return res.status(400).json({ error: 'Invalid action' });
};
