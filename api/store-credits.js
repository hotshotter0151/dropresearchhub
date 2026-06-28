import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://qpkpvtsoxiqcrkztkagn.supabase.co',
  process.env.SUPABASE_SERVICE_KEY
);

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { action, email } = req.body;
  if (!email) return res.status(400).json({ error: 'Email required' });

  // Check credits
  if (action === 'check') {
    const { data: user, error } = await supabase
      .from('users')
      .select('store_credits')
      .eq('email', email)
      .single();

    if (error || !user) return res.status(404).json({ error: 'User not found' });
    return res.status(200).json({ success: true, credits: user.store_credits });
  }

  // Deduct one credit
  if (action === 'deduct') {
    const { data: user, error } = await supabase
      .from('users')
      .select('store_credits')
      .eq('email', email)
      .single();

    if (error || !user) return res.status(404).json({ error: 'User not found' });
    if (user.store_credits < 1) return res.status(403).json({ error: 'No credits remaining', credits: 0 });

    const { error: updateError } = await supabase
      .from('users')
      .update({ store_credits: user.store_credits - 1 })
      .eq('email', email);

    if (updateError) return res.status(500).json({ error: 'Failed to deduct credit' });
    return res.status(200).json({ success: true, credits: user.store_credits - 1 });
  }

  // Add credits (called after successful £4.99 payment)
  if (action === 'add') {
    const { data: user, error } = await supabase
      .from('users')
      .select('store_credits')
      .eq('email', email)
      .single();

    if (error || !user) return res.status(404).json({ error: 'User not found' });

    const { error: updateError } = await supabase
      .from('users')
      .update({ store_credits: user.store_credits + 3 })
      .eq('email', email);

    if (updateError) return res.status(500).json({ error: 'Failed to add credits' });
    return res.status(200).json({ success: true, credits: user.store_credits + 3 });
  }

  return res.status(400).json({ error: 'Invalid action' });
}
