const SUPABASE_URL = 'https://qpkpvtsoxiqcrkztkagn.supabase.co';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;

async function sbFetch(path, method = 'GET', body) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1${path}`, {
    method,
    headers: {
      'apikey': SUPABASE_SERVICE_KEY,
      'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
      'Content-Type': 'application/json',
      'Prefer': 'return=representation'
    },
    body: body ? JSON.stringify(body) : undefined
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Supabase error ${res.status}: ${err}`);
  }
  const text = await res.text();
  return text ? JSON.parse(text) : [];
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();

  // GET — fetch user's saved products
  if (req.method === 'GET') {
    const { email } = req.query;
    if (!email) return res.status(400).json({ error: 'Email required' });
    try {
      const rows = await sbFetch(`/saved_products?user_email=eq.${encodeURIComponent(email)}&order=saved_at.desc&select=*`);
      return res.status(200).json({ saved: rows.map(r => ({ ...r.product_data, _savedId: r.id })) });
    } catch(e) {
      return res.status(500).json({ error: e.message });
    }
  }

  // POST — save a product
  if (req.method === 'POST') {
    const { email, product } = req.body;
    if (!email || !product) return res.status(400).json({ error: 'Email and product required' });
    try {
      // Check if already saved
      const existing = await sbFetch(`/saved_products?user_email=eq.${encodeURIComponent(email)}&product_name=eq.${encodeURIComponent(product.name)}&select=id`);
      if (existing.length > 0) return res.status(200).json({ success: true, alreadySaved: true });
      await sbFetch('/saved_products', 'POST', [{
        user_email: email,
        product_name: product.name,
        product_data: product,
        saved_at: new Date().toISOString()
      }]);
      return res.status(200).json({ success: true });
    } catch(e) {
      return res.status(500).json({ error: e.message });
    }
  }

  // DELETE — unsave a product
  if (req.method === 'DELETE') {
    const { email, productName } = req.body;
    if (!email || !productName) return res.status(400).json({ error: 'Email and product name required' });
    try {
      await sbFetch(`/saved_products?user_email=eq.${encodeURIComponent(email)}&product_name=eq.${encodeURIComponent(productName)}`, 'DELETE');
      return res.status(200).json({ success: true });
    } catch(e) {
      return res.status(500).json({ error: e.message });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
