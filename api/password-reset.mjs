import { createClient } from '@supabase/supabase-js';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';

const SUPABASE_URL = process.env.SUPABASE_URL || 'https://qpkpvtsoxiqcrkztkagn.supabase.co';

const SUPABASE_SERVICE_KEY =
  process.env.SUPABASE_SERVICE_KEY ||
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  '';

const RESEND_API_KEY = process.env.RESEND_API_KEY || '';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
  auth: {
    persistSession: false,
    autoRefreshToken: false
  }
});

function setCors(res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
}

function json(res, status, body) {
  res.setHeader('Content-Type', 'application/json');
  return res.status(status).json(body);
}

function normaliseEmail(email) {
  return String(email || '').trim().toLowerCase();
}

function hashToken(token) {
  return crypto.createHash('sha256').update(token).digest('hex');
}

function getClientIp(req) {
  const forwarded = req.headers['x-forwarded-for'];

  if (typeof forwarded === 'string' && forwarded.trim()) {
    return forwarded.split(',')[0].trim();
  }

  return req.socket?.remoteAddress || '';
}

function getBaseUrl(req) {
  const envUrl = String(process.env.SITE_URL || '').trim().replace(/\/+$/, '');

  if (envUrl) return envUrl;

  const origin = String(req.headers.origin || '').trim().replace(/\/+$/, '');

  if (origin.startsWith('http://') || origin.startsWith('https://')) {
    return origin;
  }

  const host = String(req.headers.host || '').trim();

  if (host) {
    return `https://${host}`;
  }

  return 'https://dropresearchhub.com';
}

function escapeHtml(value) {
  return String(value || '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

function resetEmailHtml(resetUrl) {
  const safeUrl = escapeHtml(resetUrl);

  return `
  <div style="margin:0;padding:0;background:#F8FAFC;font-family:Inter,Arial,sans-serif;color:#111827">
    <div style="max-width:620px;margin:0 auto;padding:32px 18px">
      <div style="background:#142840;border-radius:22px;padding:28px 28px 22px;color:#fff">
        <div style="font-size:21px;font-weight:900;letter-spacing:-0.4px">
          Drop<span style="color:#F59E0B">Research</span> Hub
        </div>

        <div style="margin-top:18px;font-size:28px;line-height:1.15;font-weight:900">
          Reset your password
        </div>

        <p style="margin:12px 0 0;color:#CBD5E1;font-size:15px;line-height:1.6">
          We received a request to reset the password for your DropResearch Hub account.
        </p>
      </div>

      <div style="background:#fff;border:1px solid #E5E7EB;border-radius:22px;padding:28px;margin-top:16px;box-shadow:0 14px 35px rgba(15,23,42,0.08)">
        <p style="font-size:15px;line-height:1.7;color:#374151;margin:0 0 20px">
          Click the button below to choose a new password. This link expires in 30 minutes.
        </p>

        <a href="${safeUrl}" style="display:inline-block;background:#F59E0B;color:#142840;text-decoration:none;font-size:15px;font-weight:900;padding:14px 20px;border-radius:14px">
          Reset my password
        </a>

        <p style="font-size:13px;line-height:1.6;color:#6B7280;margin:22px 0 0">
          If the button does not work, copy and paste this link into your browser:
        </p>

        <p style="word-break:break-all;font-size:12px;line-height:1.6;color:#1E3A5F;margin:8px 0 0">
          ${safeUrl}
        </p>

        <div style="height:1px;background:#E5E7EB;margin:24px 0"></div>

        <p style="font-size:12px;line-height:1.6;color:#9CA3AF;margin:0">
          If you did not request this, you can ignore this email. Your password will stay the same.
        </p>
      </div>
    </div>
  </div>`;
}

async function sendResetEmail(email, resetUrl) {
  const from = process.env.RESEND_FROM_EMAIL || 'DropResearch Hub <support@dropresearchhub.com>';

  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${RESEND_API_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      from,
      to: [email],
      subject: 'Reset your DropResearch Hub password',
      html: resetEmailHtml(resetUrl)
    })
  });

  const text = await response.text();

  if (!response.ok) {
    console.error('[DRH password reset] Resend failed:', response.status, text.slice(0, 500));
    throw new Error('Email send failed');
  }

  return text;
}

async function requestReset(req, res, body) {
  if (!SUPABASE_SERVICE_KEY) {
    return json(res, 500, {
      success: false,
      error: 'Supabase service key is missing in Vercel.'
    });
  }

  if (!RESEND_API_KEY) {
    return json(res, 500, {
      success: false,
      error: 'RESEND_API_KEY is missing in Vercel.'
    });
  }

  const email = normaliseEmail(body.email);

  if (!email || !email.includes('@')) {
    return json(res, 400, {
      success: false,
      error: 'Enter a valid email address.'
    });
  }

  const genericSuccess = {
    success: true,
    message: 'If that email is registered, a password reset link has been sent.'
  };

  const { data: user, error: userError } = await supabase
    .from('users')
    .select('email, name, role, subscription_status')
    .eq('email', email)
    .maybeSingle();

  if (userError) {
    console.error('[DRH password reset] User lookup failed:', userError.message);

    return json(res, 500, {
      success: false,
      error: 'Could not start password reset. Try again.'
    });
  }

  // Do not reveal whether the account exists.
  if (!user) {
    return json(res, 200, genericSuccess);
  }

  try {
    await supabase
      .from('password_reset_tokens')
      .update({ used_at: new Date().toISOString() })
      .eq('email', email)
      .is('used_at', null);

    const rawToken = crypto.randomBytes(32).toString('hex');
    const tokenHash = hashToken(rawToken);
    const expiresAt = new Date(Date.now() + 30 * 60 * 1000).toISOString();

    const { error: insertError } = await supabase
      .from('password_reset_tokens')
      .insert({
        email,
        token_hash: tokenHash,
        expires_at: expiresAt,
        ip_address: getClientIp(req),
        user_agent: String(req.headers['user-agent'] || '').slice(0, 500)
      });

    if (insertError) {
      console.error('[DRH password reset] Token insert failed:', insertError.message);

      return json(res, 500, {
        success: false,
        error: 'Could not create reset link. Try again.'
      });
    }

    const resetUrl = new URL('/reset-password.html', getBaseUrl(req));

    resetUrl.searchParams.set('token', rawToken);
    resetUrl.searchParams.set('email', email);

    await sendResetEmail(email, resetUrl.toString());

    return json(res, 200, genericSuccess);
  } catch (error) {
    console.error('[DRH password reset] Request failed:', error.message);

    return json(res, 500, {
      success: false,
      error: 'Could not send reset email. Try again.'
    });
  }
}

async function resetPassword(req, res, body) {
  if (!SUPABASE_SERVICE_KEY) {
    return json(res, 500, {
      success: false,
      error: 'Supabase service key is missing in Vercel.'
    });
  }

  const token = String(body.token || '').trim();
  const password = String(body.password || '');
  const confirmPassword = String(body.confirmPassword || '');

  if (!token || token.length < 40) {
    return json(res, 400, {
      success: false,
      error: 'This reset link is invalid. Request a new one.'
    });
  }

  if (password.length < 8) {
    return json(res, 400, {
      success: false,
      error: 'Password must be at least 8 characters.'
    });
  }

  if (!/[a-zA-Z]/.test(password) || !/[0-9]/.test(password)) {
    return json(res, 400, {
      success: false,
      error: 'Password must include at least one letter and one number.'
    });
  }

  if (password !== confirmPassword) {
    return json(res, 400, {
      success: false,
      error: 'Passwords do not match.'
    });
  }

  const tokenHash = hashToken(token);

  const { data: tokenRow, error: tokenError } = await supabase
    .from('password_reset_tokens')
    .select('id, email, expires_at, used_at')
    .eq('token_hash', tokenHash)
    .maybeSingle();

  if (tokenError) {
    console.error('[DRH password reset] Token lookup failed:', tokenError.message);

    return json(res, 500, {
      success: false,
      error: 'Could not check reset link. Try again.'
    });
  }

  if (!tokenRow || tokenRow.used_at) {
    return json(res, 400, {
      success: false,
      error: 'This reset link is invalid or has already been used.'
    });
  }

  if (new Date(tokenRow.expires_at).getTime() < Date.now()) {
    await supabase
      .from('password_reset_tokens')
      .update({ used_at: new Date().toISOString() })
      .eq('id', tokenRow.id);

    return json(res, 400, {
      success: false,
      error: 'This reset link has expired. Request a new one.'
    });
  }

  const passwordHash = await bcrypt.hash(password, 10);

  const { error: updateError } = await supabase
    .from('users')
    .update({ password_hash: passwordHash })
    .eq('email', tokenRow.email);

  if (updateError) {
    console.error('[DRH password reset] Password update failed:', updateError.message);

    return json(res, 500, {
      success: false,
      error: 'Could not update password. Try again.'
    });
  }

  await supabase
    .from('password_reset_tokens')
    .update({ used_at: new Date().toISOString() })
    .eq('id', tokenRow.id);

  return json(res, 200, {
    success: true,
    message: 'Password updated. You can now log in with your new password.'
  });
}

export default async function handler(req, res) {
  setCors(res);

  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }

  if (req.method === 'GET') {
    return json(res, 200, {
      success: true,
      route: '/api/password-reset',
      status: 'Password reset API is live',
      allowedMethods: ['POST']
    });
  }

  if (req.method !== 'POST') {
    return json(res, 405, {
      success: false,
      error: 'Method not allowed.'
    });
  }

  let body = req.body || {};

  if (typeof body === 'string') {
    try {
      body = JSON.parse(body);
    } catch {
      return json(res, 400, {
        success: false,
        error: 'Invalid JSON body.'
      });
    }
  }

  const action = String(body.action || '').trim();

  if (action === 'requestReset') {
    return requestReset(req, res, body);
  }

  if (action === 'resetPassword') {
    return resetPassword(req, res, body);
  }

  return json(res, 400, {
    success: false,
    error: 'Unknown password reset action.'
  });
}
