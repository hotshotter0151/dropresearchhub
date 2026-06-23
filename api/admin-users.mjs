import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const { data: users, error } = await supabase
      .from('users')
      .select('id, name, email, subscription_status, stripe_customer_id, created_at')
      .order('created_at', { ascending: false });

    if (error) throw new Error(error.message);

    return res.status(200).json({ users: users || [] });
  } catch (err) {
    console.error('Admin users error:', err);
    return res.status(500).json({ error: err.message });
  }
}
