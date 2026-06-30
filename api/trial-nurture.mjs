import { createClient } from '@supabase/supabase-js';
import { Resend } from 'resend';
import Stripe from 'stripe';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);
const resend = new Resend(process.env.RESEND_API_KEY);
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

// ── Shared email shell — matches the rest of the Hub-branded emails ───────
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
    <p style="color:#9CA3AF;font-size:11px;margin:18px 0 0">${footerNote || 'You are receiving this because you had a trial with DropResearch Hub.'}</p>
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
    return true;
  } catch (e) {
    console.error('Nurture email send failed for', to, ':', e.message);
    return false;
  }
}

// ── Email 1: 24hr — pure value reminder, NO discount ───────────────────
function valueReminderEmail(name) {
  const greeting = name ? `Hi ${name},` : 'Hi,';
  const body = `
    <p style="font-size:15px;color:#374151;line-height:1.6;margin:0 0 16px">${greeting}</p>
    <p style="font-size:15px;color:#374151;line-height:1.6;margin:0 0 16px">Your DropResearch Hub trial wrapped up yesterday — but the products I found while you were exploring are still live, and new ones have already started coming in this week.</p>
    <p style="font-size:15px;color:#374151;line-height:1.6;margin:0 0 16px">Members are still getting early access to graded products, unit economics breakdowns, ad angles and supplier search terms — all before the saturation window closes on the best ones.</p>
    <p style="font-size:13px;color:#9CA3AF;line-height:1.6;margin:0">If now's not the right time, no worries — you can pick back up whenever suits you.</p>
  `;
  return emailShell({
    eyebrow: 'Trial Ended',
    heading: "Don't miss",
    headingAccent: "this week's picks",
    bodyHtml: body,
    ctaText: 'See what\'s new',
    ctaUrl: 'https://dropresearchhub.com/index.html',
  });
}

// ── Email 2: 48hr — discount offer with deadline ───────────────────────
function discountOfferEmail(name, couponCode) {
  const greeting = name ? `Hi ${name},` : 'Hi,';
  const body = `
    <p style="font-size:15px;color:#374151;line-height:1.6;margin:0 0 16px">${greeting}</p>
    <p style="font-size:15px;color:#374151;line-height:1.6;margin:0 0 16px">I wanted to make it easier to jump back in — here's your first month back for <strong>£14.99</strong> instead of £24.99. After that, it reverts to the normal price automatically, no strings attached.</p>
    <div style="background:#F9FAFB;border:2px dashed #F59E0B;border-radius:12px;padding:18px;text-align:center;margin:0 0 16px">
      <div style="font-size:10px;color:#9CA3AF;font-weight:700;text-transform:uppercase;letter-spacing:1px;margin-bottom:6px">Your code</div>
      <div style="font-size:22px;font-weight:900;color:#142840;letter-spacing:1px;font-family:monospace">${couponCode}</div>
    </div>
    <p style="font-size:14px;color:#DC2626;font-weight:700;line-height:1.6;margin:0 0 16px">This code expires in 48 hours.</p>
    <p style="font-size:13px;color:#9CA3AF;line-height:1.6;margin:0">Enter it at checkout to apply the discount to your first month.</p>
  `;
  return emailShell({
    eyebrow: 'Limited Time Offer',
    heading: 'First month for',
    headingAccent: '£14.99',
    bodyHtml: body,
    ctaText: 'Claim your discount',
    ctaUrl: 'https://dropresearchhub.com/index.html',
    footerNote: 'This is a one-time offer for your first month only. Your subscription will renew at the standard £24.99/month price after that.',
  });
}

// ── Create a unique, single-use Stripe promotion code ──────────────────
async function createUniquePromoCode(stripeCouponId) {
  const randomSuffix = Math.random().toString(36).substring(2, 8).toUpperCase();
  const code = `WINBACK-${randomSuffix}`;

  const promo = await stripe.promotionCodes.create({
    coupon: stripeCouponId,
    code,
    max_redemptions: 1,
    expires_at: Math.floor(Date.now() / 1000) + (48 * 60 * 60), // 48 hours from now
  });

  return promo.code;
}

export default async function handler(req, res) {
  // Allow Vercel Cron (GET) or manual trigger (POST) — both fine
  if (req.method !== 'GET' && req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Optional: protect against unauthorized manual triggers
  const cronSecret = req.headers['authorization'];
  if (process.env.CRON_SECRET && cronSecret !== `Bearer ${process.env.CRON_SECRET}`) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const results = { sent24h: 0, sent48h: 0, errors: [] };

  try {
    const now = new Date();
    const cutoff24h = new Date(now.getTime() - 24 * 60 * 60 * 1000); // trial ended >=24h ago
    const cutoff48h = new Date(now.getTime() - 48 * 60 * 60 * 1000); // trial ended >=48h ago
    const cutoff72h = new Date(now.getTime() - 72 * 60 * 60 * 1000); // safety window upper bound

    // ── 24hr batch: trial_ends_at between 24h and 48h ago, not yet emailed ──
    const { data: users24h, error: err24h } = await supabase
      .from('users')
      .select('email, name, trial_ends_at, subscription_status')
      .eq('nurture_24h_emailed', false)
      .lte('trial_ends_at', cutoff24h.toISOString())
      .gt('trial_ends_at', cutoff48h.toISOString());

    if (err24h) throw new Error('24h query failed: ' + err24h.message);

    for (const user of users24h || []) {
      // Skip anyone who actually converted to active/paid in the meantime
      if (user.subscription_status === 'active') continue;

      const sent = await sendEmail({
        to: user.email,
        subject: "This week's products are still live",
        html: valueReminderEmail(user.name),
        text: `Your DropResearch Hub trial wrapped up — new graded products are still coming in. Log in to see what's new: https://dropresearchhub.com/index.html`,
      });

      if (sent) {
        await supabase
          .from('users')
          .update({ nurture_24h_emailed: true })
          .eq('email', user.email);
        results.sent24h++;
      }
    }

    // ── 48hr batch: trial_ends_at between 48h and 72h ago, not yet emailed ──
    const { data: users48h, error: err48h } = await supabase
      .from('users')
      .select('email, name, trial_ends_at, subscription_status')
      .eq('nurture_48h_emailed', false)
      .lte('trial_ends_at', cutoff48h.toISOString())
      .gt('trial_ends_at', cutoff72h.toISOString());

    if (err48h) throw new Error('48h query failed: ' + err48h.message);

    for (const user of users48h || []) {
      if (user.subscription_status === 'active') continue;

      try {
        const couponCode = await createUniquePromoCode(process.env.STRIPE_WINBACK_COUPON_ID);

        const sent = await sendEmail({
          to: user.email,
          subject: 'Your first month back for £14.99 (48 hours only)',
          html: discountOfferEmail(user.name, couponCode),
          text: `Come back to DropResearch Hub — first month for £14.99 instead of £24.99. Use code ${couponCode} at checkout. Expires in 48 hours.`,
        });

        if (sent) {
          await supabase
            .from('users')
            .update({ nurture_48h_emailed: true })
            .eq('email', user.email);
          results.sent48h++;
        }
      } catch (e) {
        results.errors.push(`${user.email}: ${e.message}`);
      }
    }

    return res.status(200).json({ success: true, ...results });
  } catch (err) {
    console.error('Trial nurture error:', err);
    return res.status(500).json({ error: err.message, ...results });
  }
}
