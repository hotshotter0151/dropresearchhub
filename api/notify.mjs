import { createClient } from '@supabase/supabase-js';
import { Resend } from 'resend';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

const resend = new Resend(process.env.RESEND_API_KEY);

function gradeColor(grade) {
  if (!grade) return '#6B7280';
  const g = String(grade).toUpperCase();
  if (g.startsWith('A')) return '#16A34A';
  if (g.startsWith('B')) return '#D97706';
  return '#DC2626';
}

function gradeColorBg(grade) {
  if (!grade) return '#F3F4F6';
  const g = String(grade).toUpperCase();
  if (g.startsWith('A')) return '#DCFCE7';
  if (g.startsWith('B')) return '#FEF3C7';
  return '#FEE2E2';
}

function buildEmail(topProduct, totalCount) {
  const grade = topProduct?.grade || 'A';
  const name = topProduct?.name || 'This week\'s top pick';
  const niche = topProduct?.niche || '';
  const why = topProduct?.whyEmerging || topProduct?.whyNow || 'Early trend signal detected — get in before the window closes.';
  const trendScore = topProduct?.trendScore || '—';
  const margin = topProduct?.margin || '—';
  const satRisk = topProduct?.saturationRisk || '—';
  const satColor = satRisk === 'Low' ? '#16A34A' : satRisk === 'Medium' ? '#D97706' : '#DC2626';

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8"/>
<meta name="viewport" content="width=device-width, initial-scale=1.0"/>
<title>Hub found ${totalCount} new products this week</title>
</head>
<body style="margin:0;padding:0;background:#F3F4F6;font-family:'Inter',Arial,sans-serif">
<div style="max-width:600px;margin:0 auto;padding:32px 16px">

  <div style="background:#142840;border-radius:20px 20px 0 0;padding:28px 32px;text-align:center">
    <img src="https://raw.githubusercontent.com/hotshotter0151/dropresearchhub/main/hub.png" alt="Hub" style="width:64px;height:64px;border-radius:50%;border:3px solid rgba(245,158,11,.5);margin-bottom:14px;display:block;margin-left:auto;margin-right:auto">
    <div style="font-size:11px;font-weight:700;color:rgba(255,255,255,.5);text-transform:uppercase;letter-spacing:1px;margin-bottom:6px">Weekly Product Drop</div>
    <h1 style="color:#fff;font-size:24px;font-weight:900;letter-spacing:-0.5px;margin:0 0 8px">Hub found <span style="color:#F59E0B">${totalCount} new product${totalCount !== 1 ? 's' : ''}</span> this week</h1>
    <p style="color:rgba(255,255,255,.6);font-size:14px;margin:0">Fresh opportunities before the window closes — get in before everyone else catches on.</p>
  </div>

  <div style="background:#1E3A5F;padding:18px 32px;border-left:3px solid #F59E0B">
    <p style="color:rgba(255,255,255,.85);font-size:13px;line-height:1.65;margin:0;font-style:italic">"I've gone through the market this week and these are the products showing early signals right now — strong demand, low saturation, still in the entry window. Log in and see the full breakdown." — <strong style="color:#F59E0B;font-style:normal">Hub</strong></p>
  </div>

  <div style="background:#fff;padding:24px 32px;border:1px solid #E5E7EB;border-top:none">
    <div style="font-size:11px;font-weight:700;color:#9CA3AF;text-transform:uppercase;letter-spacing:1px;margin-bottom:14px">Hub's top pick this week</div>
    <div style="margin-bottom:16px">
      <div style="display:inline-block;background:${gradeColorBg(grade)};color:${gradeColor(grade)};border-radius:10px;padding:6px 14px;font-size:14px;font-weight:900;margin-bottom:10px">Grade ${grade}</div>
      <div style="font-size:17px;font-weight:800;color:#111827;margin-bottom:3px">${name}</div>
      <div style="font-size:12px;color:#9CA3AF">${niche}</div>
    </div>
    <div style="background:#F9FAFB;border-left:3px solid #F59E0B;border-radius:0 8px 8px 0;padding:12px 14px;font-size:13px;color:#374151;line-height:1.6;margin-bottom:16px;font-style:italic">"${why}"</div>
    <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse">
      <tr>
        <td style="width:33%;padding:4px">
          <div style="background:#F9FAFB;border:1px solid #E5E7EB;border-radius:10px;padding:10px;text-align:center">
            <div style="font-size:9px;color:#9CA3AF;font-weight:700;text-transform:uppercase;letter-spacing:.5px">Trend Score</div>
            <div style="font-size:18px;font-weight:900;color:#1E3A5F;margin-top:3px">${trendScore}</div>
          </div>
        </td>
        <td style="width:33%;padding:4px">
          <div style="background:#F9FAFB;border:1px solid #E5E7EB;border-radius:10px;padding:10px;text-align:center">
            <div style="font-size:9px;color:#9CA3AF;font-weight:700;text-transform:uppercase;letter-spacing:.5px">Est. Margin</div>
            <div style="font-size:18px;font-weight:900;color:#16A34A;margin-top:3px">${margin}</div>
          </div>
        </td>
        <td style="width:33%;padding:4px">
          <div style="background:#F9FAFB;border:1px solid #E5E7EB;border-radius:10px;padding:10px;text-align:center">
            <div style="font-size:9px;color:#9CA3AF;font-weight:700;text-transform:uppercase;letter-spacing:.5px">Sat. Risk</div>
            <div style="font-size:18px;font-weight:900;color:${satColor};margin-top:3px">${satRisk}</div>
          </div>
        </td>
      </tr>
    </table>
  </div>

  <div style="background:#fff;padding:24px 32px;border:1px solid #E5E7EB;border-top:none;text-align:center;border-radius:0 0 20px 20px">
    <p style="color:#6B7280;font-size:13px;margin:0 0 18px">Plus ${totalCount > 1 ? `${totalCount - 1} more product${totalCount - 1 !== 1 ? 's' : ''} with full scoring breakdowns, ad angles and supplier search terms` : 'full scoring breakdown, ad angles and supplier search terms'} — all inside your members area.</p>
    <a href="https://dropresearchhub.com/members.html" style="display:inline-block;background:#F59E0B;color:#142840;text-decoration:none;border-radius:12px;padding:14px 32px;font-size:15px;font-weight:900;letter-spacing:-.2px">See all ${totalCount} products</a>
    <p style="color:#9CA3AF;font-size:11px;margin:18px 0 0">You are receiving this because you are a DropResearch Hub member.</p>
  </div>

</div>
</body>
</html>`;
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const { data: products, error: prodError } = await supabase
      .from('products')
      .select('data, is_live')
      .eq('is_live', true)
      .order('created_at', { ascending: false });

    if (prodError) throw new Error('Could not load products: ' + prodError.message);
    if (!products || products.length === 0) {
      return res.status(400).json({ error: 'No live products to notify about' });
    }

    const parsedProducts = products.map(row => {
      try { return typeof row.data === 'string' ? JSON.parse(row.data) : row.data; } catch { return row.data; }
    }).filter(Boolean);

    const totalCount = parsedProducts.length;

    const topProduct =
      parsedProducts.find(p => p.grade === 'A+') ||
      parsedProducts.find(p => p.grade === 'A') ||
      parsedProducts[0];

    const { data: users, error: userError } = await supabase
      .from('users')
      .select('email, name')
      .eq('subscription_status', 'active');

    if (userError) throw new Error('Could not load users: ' + userError.message);
    if (!users || users.length === 0) {
      return res.status(400).json({ error: 'No active members to notify' });
    }

    const emailHtml = buildEmail(topProduct, totalCount);
    let sent = 0;
    let failed = 0;
    const errors = [];

    const batchSize = 10;
    for (let i = 0; i < users.length; i += batchSize) {
      const batch = users.slice(i, i + batchSize);
      await Promise.all(batch.map(async (user) => {
        try {
          await resend.emails.send({
            from: 'Hub at DropResearch Hub <hub@dropresearchhub.com>',
            to: user.email,
            subject: `Hub found ${totalCount} new product${totalCount !== 1 ? 's' : ''} this week`,
            html: emailHtml,
          });
          sent++;
        } catch (e) {
          failed++;
          errors.push(user.email + ': ' + e.message);
        }
      }));
      if (i + batchSize < users.length) {
        await new Promise(r => setTimeout(r, 300));
      }
    }

    return res.status(200).json({
      success: true,
      sent,
      failed,
      totalMembers: users.length,
      totalProducts: totalCount,
      topProduct: topProduct?.name,
      errors: errors.length ? errors : undefined
    });

  } catch (err) {
    console.error('Notify error:', err);
    return res.status(500).json({ error: err.message });
  }
}
