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
  return res.json();
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();

  // GET — fetch live products
  if (req.method === 'GET') {
    try {
      const products = await sbFetch('/products?is_live=eq.true&order=published_at.desc&select=*');
      return res.status(200).json({ products: products.map(p => p.data) });
    } catch(e) {
      return res.status(500).json({ error: e.message });
    }
  }

  // POST — add products to feed (append, don't replace)
  if (req.method === 'POST') {
    const { products, replace } = req.body;
    if (!products?.length) return res.status(400).json({ error: 'No products provided' });
    try {
      if (replace) {
        // Only clear if explicitly requested
        await sbFetch('/products?is_live=eq.true', 'DELETE');
      }
      // Insert new ones
      const rows = products.map(p => ({ name: p.name, data: p, is_live: true }));
      await sbFetch('/products', 'POST', rows);
      return res.status(200).json({ success: true });
    } catch(e) {
      return res.status(500).json({ error: e.message });
    }
  }

  // DELETE — remove a product by index
  if (req.method === 'DELETE') {
    const { productName } = req.body;
    if (!productName) return res.status(400).json({ error: 'No product name provided' });
    try {
      await sbFetch(`/products?name=eq.${encodeURIComponent(productName)}&is_live=eq.true`, 'PATCH',
        { is_live: false });
      return res.status(200).json({ success: true });
    } catch(e) {
      return res.status(500).json({ error: e.message });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
