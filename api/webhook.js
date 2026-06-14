const Stripe = require('stripe');
const { createClient } = require('@supabase/supabase-js');

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
const supabase = createClient(
  'https://qpkpvtsoxiqcrkztkagn.supabase.co',
  process.env.SUPABASE_SERVICE_KEY
);

module.exports = async (req, res) => {
  if (req.method !== 'POST') return res.status(405).end();

  const sig = req.headers['stripe-signature'];
  let event;

  try {
    // Vercel does not auto-parse for webhooks — need raw body
    const rawBody = await getRawBody(req);
    event = stripe.webhooks.constructEvent(rawBody, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    console.error('Webhook signature verification failed:', err.message);
    return res.status(400).json({ error: `Webhook error: ${err.message}` });
  }

  const subscription = event.data.object;

  switch (event.type) {
    // ── New checkout completed (trial starts) ──────────────────────────
    case 'checkout.session.completed': {
      const session = event.data.object;
      const customerId = session.customer;
      const subscriptionId = session.subscription;
      const customerEmail = session.customer_details?.email || session.customer_email;

      if (customerEmail) {
        await supabase
          .from('users')
          .update({
            stripe_customer_id: customerId,
            stripe_subscription_id: subscriptionId,
            subscription_status: 'trial',
          })
          .eq('email', customerEmail);
      }
      break;
    }

    // ── Trial converts to paid ─────────────────────────────────────────
    case 'customer.subscription.updated': {
      const customerId = subscription.customer;
      const status = subscription.status; // 'active', 'trialing', 'past_due', etc.

      // Map Stripe statuses → our statuses
      let appStatus;
      if (status === 'active') appStatus = 'active';
      else if (status === 'trialing') appStatus = 'trial';
      else if (status === 'canceled' || status === 'cancelled') appStatus = 'cancelled';
      else if (status === 'past_due' || status === 'unpaid') appStatus = 'cancelled';
      else appStatus = 'trial'; // fallback

      await supabase
        .from('users')
        .update({ subscription_status: appStatus })
        .eq('stripe_customer_id', customerId);
      break;
    }

    // ── Subscription cancelled ─────────────────────────────────────────
    case 'customer.subscription.deleted': {
      const customerId = subscription.customer;
      await supabase
        .from('users')
        .update({ subscription_status: 'cancelled' })
        .eq('stripe_customer_id', customerId);
      break;
    }

    // ── Invoice paid (covers renewals) ────────────────────────────────
    case 'invoice.payment_succeeded': {
      const invoice = event.data.object;
      const customerId = invoice.customer;
      // If billing_reason is 'subscription_cycle' or 'subscription_update', mark active
      if (invoice.billing_reason !== 'subscription_create') {
        await supabase
          .from('users')
          .update({ subscription_status: 'active' })
          .eq('stripe_customer_id', customerId);
      }
      break;
    }

    // ── Invoice failed ─────────────────────────────────────────────────
    case 'invoice.payment_failed': {
      const invoice = event.data.object;
      const customerId = invoice.customer;
      await supabase
        .from('users')
        .update({ subscription_status: 'cancelled' })
        .eq('stripe_customer_id', customerId);
      break;
    }

    default:
      console.log(`Unhandled event type: ${event.type}`);
  }

  return res.status(200).json({ received: true });
};

// ── Helper: get raw body from Vercel request ───────────────────────────────
function getRawBody(req) {
  return new Promise((resolve, reject) => {
    let data = '';
    req.on('data', chunk => { data += chunk; });
    req.on('end', () => resolve(data));
    req.on('error', reject);
  });
}
