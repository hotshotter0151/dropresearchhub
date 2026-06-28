export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const stripeSecret = process.env.STRIPE_SECRET_KEY;
  if (!stripeSecret) return res.status(500).json({ error: 'Stripe not configured' });

  const { email, name, skipTrial } = req.body;
  if (!email) return res.status(400).json({ error: 'Email required' });

  try {
    const params = {
      'mode': 'subscription',
      'payment_method_types[]': 'card',
      'customer_email': email,
      'line_items[0][price]': 'price_1TiCZIISGIe4s9cWPzpWDqRm',
      'line_items[0][quantity]': '1',
      'success_url': `${req.headers.origin}/trial.html?signup=success&email=${encodeURIComponent(email)}`,
      'cancel_url': `${req.headers.origin}/signup.html`,
      'allow_promotion_codes': 'true'
    };

    // Only add trial if this is a fresh signup, not an upgrade from trial page
    if (!skipTrial) {
      params['subscription_data[trial_period_days]'] = '7';
    }

    const response = await fetch('https://api.stripe.com/v1/checkout/sessions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${stripeSecret}`,
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: new URLSearchParams(params)
    });

    const session = await response.json();
    if (!response.ok) {
      console.error('[Stripe] Error:', session);
      return res.status(500).json({ error: session.error?.message || 'Stripe error' });
    }

    return res.status(200).json({ url: session.url });
  } catch (e) {
    console.error('[Stripe] Exception:', e.message);
    return res.status(500).json({ error: 'Checkout failed' });
  }
}
