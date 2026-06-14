const Stripe = require('stripe');
const { createClient } = require('@supabase/supabase-js');

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
const supabase = createClient(
  'https://qpkpvtsoxiqcrkztkagn.supabase.co',
  process.env.SUPABASE_SERVICE_KEY
);

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { email } = req.body;
  if (!email) return res.status(400).json({ error: 'Email required' });

  // Look up stripe_customer_id from Supabase
  const { data: user, error } = await supabase
    .from('users')
    .select('stripe_customer_id, subscription_status')
    .eq('email', email)
    .single();

  if (error || !user) return res.status(404).json({ error: 'User not found' });
  if (!user.stripe_customer_id) return res.status(400).json({ error: 'No Stripe customer found' });

  const origin = req.headers.origin || 'https://dropresearchhub.vercel.app';
  const returnUrl =
    user.subscription_status === 'active'
      ? `${origin}/members.html`
      : `${origin}/trial.html`;

  const session = await stripe.billingPortal.sessions.create({
    customer: user.stripe_customer_id,
    return_url: returnUrl,
  });

  return res.status(200).json({ url: session.url });
};
