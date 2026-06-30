const Stripe = require('stripe');
const { createClient } = require('@supabase/supabase-js');
const { Resend } = require('resend');

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
const supabase = createClient(
  'https://qpkpvtsoxiqcrkztkagn.supabase.co',
  process.env.SUPABASE_SERVICE_KEY
);
const resend = new Resend(process.env.RESEND_API_KEY);

// ── Shared email shell — matches the weekly digest visual style ───────────
function emailShell({ eyebrow, heading, headingAccent, bodyHtml, ctaText, ctaUrl, footerNote }) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8"/>
<meta name="viewport" content="width=device-width, initial-scale=1.0"/>
<title>${heading}</title>
</head>
<body style="margin:0;padding:0;background:#F3F4F6;font-family:'Inter',Arial,sans-serif">
<div style="max-width:600px;margin:0 auto;padding:32px 16px">

  <div style="background:#142840;border-radius:20px 20px 0 0;padding:28px 32px;text-align:center">
    <img src="https://raw.githubusercontent.com/hotshotter0151/dropresearchhub/main/hub.png" alt="Hub" style="width:64px;height:64px;border-radius:50%;border:3px solid rgba(245,158,11,.5);margin-bottom:14px;display:block;margin-left:auto;margin-right:auto">
    <div style="font-size:11px;font-weight:700;color:rgba(255,255,255,.5);text-transform:uppercase;letter-spacing:1px;margin-bottom:6px">${eyebrow}</div>
    <h1 style="color:#fff;font-size:24px;font-weight:900;letter-spacing:-0.5px;margin:0 0 8px">${heading} ${headingAccent ? `<span style="color:#F59E0B">${headingAccent}</span>` : ''}</h1>
  </div>

  <div style="background:#fff;padding:28px 32px;border:1px solid #E5E7EB;border-top:none">
    ${bodyHtml}
  </div>

  <div style="background:#fff;padding:24px 32px;border:1px solid #E5E7EB;border-top:none;text-align:center;border-radius:0 0 20px 20px">
    ${ctaText ? `<a href="${ctaUrl}" style="display:inline-block;background:#F59E0B;color:#142840;text-decoration:none;border-radius:12px;padding:14px 32px;font-size:15px;font-weight:900;letter-spacing:-.2px">${ctaText}</a>` : ''}
    <p style="color:#9CA3AF;font-size:11px;margin:18px 0 0">${footerNote || 'You are receiving this because you have an account with DropResearch Hub.'}</p>
  </div>

</div>
</body>
</html>`;
}

async function sendEmail({ to, subject, html, text }) {
  try {
    await resend.emails.send({
      from: 'DropResearch Hub <hub@dropresearchhub.com>',
      to,
      subject,
      html,
      text,
    });
  } catch (e) {
    console.error('Email send failed for', to, ':', e.message);
  }
}

// ── Email 1: Trial started ─────────────────────────────────────────────
function trialStartedEmail(name) {
  const greeting = name ? `Hi ${name},` : 'Hi,';
  const body = `
    <p style="font-size:15px;color:#374151;line-height:1.6;margin:0 0 16px">${greeting}</p>
    <p style="font-size:15px;color:#374151;line-height:1.6;margin:0 0 16px">Your 7-day free trial of DropResearch Hub is live. I'm already scanning the market for early-signal products — strong demand, low saturation, still in the entry window.</p>
    <p style="font-size:15px;color:#374151;line-height:1.6;margin:0 0 16px">Log in any time over the next 7 days to see what I've found, run the Unit Economics Engine on anything that catches your eye, and start building your product pipeline.</p>
    <p style="font-size:13px;color:#9CA3AF;line-height:1.6;margin:0">No charge until your trial ends — cancel any time from your account if it's not for you.</p>
  `;
  return emailShell({
    eyebrow: 'Trial Started',
    heading: 'Your trial is',
    headingAccent: 'live',
    bodyHtml: body,
    ctaText: 'Go to members area',
    ctaUrl: 'https://dropresearchhub.com/members.html',
  });
}

// ── Email 2: Trial converted to paid ───────────────────────────────────
function subscriptionActiveEmail(name) {
  const greeting = name ? `Hi ${name},` : 'Hi,';
  const body = `
    <p style="font-size:15px;color:#374151;line-height:1.6;margin:0 0 16px">${greeting}</p>
    <p style="font-size:15px;color:#374151;line-height:1.6;margin:0 0 16px">Your DropResearch Hub subscription is now active — your trial has converted and your first payment has gone through.</p>
    <p style="font-size:15px;color:#374151;line-height:1.6;margin:0 0 16px">You'll keep getting full access to new product drops, scoring breakdowns, ad angles and supplier search terms, plus your weekly digest straight to your inbox.</p>
    <p style="font-size:13px;color:#9CA3AF;line-height:1.6;margin:0">You can manage or cancel your subscription any time from your account settings.</p>
  `;
  return emailShell({
    eyebrow: 'Subscription Active',
    heading: "You're",
    headingAccent: 'all set',
    bodyHtml: body,
    ctaText: 'Go to members area',
    ctaUrl: 'https://dropresearchhub.com/members.html',
  });
}

// ── Email 3: Cancellation confirmation ─────────────────────────────────
function cancellationEmail(name) {
  const greeting = name ? `Hi ${name},` : 'Hi,';
  const body = `
    <p style="font-size:15px;color:#374151;line-height:1.6;margin:0 0 16px">${greeting}</p>
    <p style="font-size:15px;color:#374151;line-height:1.6;margin:0 0 16px">Your DropResearch Hub subscription has been cancelled. You'll keep access until the end of your current billing period, and you won't be charged again after that.</p>
    <p style="font-size:15px;color:#374151;line-height:1.6;margin:0 0 16px">If you change your mind, you're welcome back any time — your saved products will still be waiting.</p>
  `;
  return emailShell({
    eyebrow: 'Subscription Cancelled',
    heading: 'Sorry to see',
    headingAccent: 'you go',
    bodyHtml: body,
    ctaText: 'Resubscribe',
    ctaUrl: 'https://dropresearchhub.com/index.html',
    footerNote: 'You are receiving this because your DropResearch Hub subscription was just cancelled.',
  });
}

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
        const { data: userRow } = await supabase
          .from('users')
          .update({
            stripe_customer_id: customerId,
            stripe_subscription_id: subscriptionId,
            subscription_status: 'trial',
          })
          .eq('email', customerEmail)
          .select('name')
          .single();

        await sendEmail({
          to: customerEmail,
          subject: 'Your DropResearch Hub trial is live',
          html: trialStartedEmail(userRow?.name),
          text: `Your 7-day free trial of DropResearch Hub is live. Log in any time to see this week's product picks: https://dropresearchhub.com/members.html`,
        });
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
      const { data: userRow } = await supabase
        .from('users')
        .update({ subscription_status: 'cancelled' })
        .eq('stripe_customer_id', customerId)
        .select('email, name')
        .single();

      if (userRow?.email) {
        await sendEmail({
          to: userRow.email,
          subject: 'Your DropResearch Hub subscription has been cancelled',
          html: cancellationEmail(userRow.name),
          text: `Your DropResearch Hub subscription has been cancelled. You'll keep access until the end of your current billing period.`,
        });
      }
      break;
    }

    // ── Invoice paid (covers renewals AND trial→paid conversion) ───────
    case 'invoice.payment_succeeded': {
      const invoice = event.data.object;
      const customerId = invoice.customer;
      // If billing_reason is 'subscription_cycle' or 'subscription_update', mark active
      if (invoice.billing_reason !== 'subscription_create') {
        const { data: userRow } = await supabase
          .from('users')
          .update({ subscription_status: 'active' })
          .eq('stripe_customer_id', customerId)
          .select('email, name, subscription_status')
          .single();

        // Only send the "you're all set" email on the FIRST real conversion
        // (i.e. they were on trial before this payment), not every renewal.
        // We check the previous status via the invoice billing_reason itself:
        // 'subscription_cycle' covers both trial-end conversion and normal renewals,
        // so we gate on a flag to avoid emailing every month.
        if (userRow?.email && invoice.billing_reason === 'subscription_cycle') {
          const { data: alreadyNotified } = await supabase
            .from('users')
            .select('trial_conversion_emailed')
            .eq('stripe_customer_id', customerId)
            .single();

          if (!alreadyNotified?.trial_conversion_emailed) {
            await sendEmail({
              to: userRow.email,
              subject: "You're all set — DropResearch Hub subscription active",
              html: subscriptionActiveEmail(userRow.name),
              text: `Your DropResearch Hub subscription is now active. Log in any time: https://dropresearchhub.com/members.html`,
            });
            await supabase
              .from('users')
              .update({ trial_conversion_emailed: true })
              .eq('stripe_customer_id', customerId);
          }
        }
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
