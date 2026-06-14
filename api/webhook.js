const SUPABASE_URL = 'https://qpkpvtsoxiqcrkztkagn.supabase.co';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;
const STRIPE_WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET;

async function supabase(path, method, body) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      'apikey': SUPABASE_SERVICE_KEY,
      'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`
    },
    body: body ? JSON.stringify(body) : undefined
  });
  return res.json();
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const payload = req.body;
  const event = typeof payload === 'string' ? JSON.parse(payload) : payload;

  try {
    switch (event.type) {

      case 'checkout.session.completed': {
        const session = event.data.object;
        const email = session.customer_email || session.customer_details?.email;
        const customerId = session.customer;
        const subscriptionId = session.subscription;
        if (email) {
          // Update user status to trial (they just paid, trial starts)
          const users = await supabase(`/users?email=eq.${encodeURIComponent(email)}&select=id`, 'GET');
          if (users.length > 0) {
            await supabase(`/users?email=eq.${encodeURIComponent(email)}`, 'PATCH', {
              subscription_status: 'trial',
              stripe_customer_id: customerId,
              stripe_subscription_id: subscriptionId
            });
          } else {
            // Create user if they don't exist yet
            await supabase('/users', 'POST', {
              email,
              name: session.customer_details?.name || '',
              subscription_status: 'trial',
              stripe_customer_id: customerId,
              stripe_subscription_id: subscriptionId
            });
          }
        }
        break;
      }

      case 'customer.subscription.updated':
      case 'invoice.payment_succeeded': {
        const obj = event.data.object;
        const customerId = obj.customer;
        const status = obj.status === 'active' ? 'active' : 'trial';
        if (customerId) {
          await supabase(`/users?stripe_customer_id=eq.${customerId}`, 'PATCH', {
            subscription_status: status
          });
        }
        break;
      }

      case 'customer.subscription.deleted':
      case 'invoice.payment_failed': {
        const obj = event.data.object;
        const customerId = obj.customer;
        if (customerId) {
          await supabase(`/users?stripe_customer_id=eq.${customerId}`, 'PATCH', {
            subscription_status: 'cancelled'
          });
        }
        break;
      }
    }

    return res.status(200).json({ received: true });
  } catch (e) {
    console.error('[Webhook] Error:', e.message);
    return res.status(500).json({ error: e.message });
  }
}
