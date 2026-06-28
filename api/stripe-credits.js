export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const stripeSecret = process.env.STRIPE_SECRET_KEY;
  if (!stripeSecret) return res.status(500).json({ error: 'Stripe not configured' });

  const { email, productName } = req.body;
  if (!email) return res.status(400).json({ error: 'Email required' });

  try {
    const params = new URLSearchParams({
      'mode': 'payment',
      'payment_method_types[]': 'card',
      'customer_email': email,
      'line_items[0][price_data][currency]': 'gbp',
      'line_items[0][price_data][unit_amount]': '499',
      'line_items[0][price_data][product_data][name]': 'Store Builder — 3 generations',
      'line_items[0][price_data][product_data][description]': 'Generate 3 store concepts with Hub. One-off payment, no subscription.',
      'line_items[0][quantity]': '1',
      'success_url': `${req.headers.origin}/members.html?credits=added&email=${encodeURIComponent(email)}`,
      'cancel_url': `${req.headers.origin}/members.html`,
    });

    const response = await fetch('https://api.stripe.com/v1/checkout/sessions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${stripeSecret}`,
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: params
    });

    const session = await response.json();
    if (!response.ok) {
      console.error('[Stripe Credits] Error:', session);
      return res.status(500).json({ error: session.error?.message || 'Stripe error' });
    }

    return res.status(200).json({ url: session.url });
  } catch (e) {
    console.error('[Stripe Credits] Exception:', e.message);
    return res.status(500).json({ error: 'Payment setup failed' });
  }
}
