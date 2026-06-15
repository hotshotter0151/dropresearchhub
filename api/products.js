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
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PATCH, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();

  // GET — fetch live products (for members/trial pages)
  if (req.method === 'GET') {
    const all = req.query?.all === 'true';
    try {
      const query = all
        ? '/products?order=published_at.desc&select=*'
        : '/products?is_live=eq.true&order=published_at.desc&select=*';
      const products = await sbFetch(query);
      return res.status(200).json({ products: products.map(p => ({ ...p.data, id: p.id, is_live: p.is_live })) });
    } catch(e) {
      return res.status(500).json({ error: e.message });
    }
  }

  // POST — publish new products to feed
  if (req.method === 'POST') {
    const { products, replace } = req.body;
    if (!Array.isArray(products)) return res.status(400).json({ error: 'No products provided' });
    try {
      if (replace) {
        await sbFetch('/products?is_live=eq.true', 'DELETE');
      }
      if (products.length > 0) {
        const rows = products.map(p => ({ name: p.name, data: p, is_live: true, published_at: new Date().toISOString() }));
        await sbFetch('/products', 'POST', rows);
      }
      return res.status(200).json({ success: true });
    } catch(e) {
      return res.status(500).json({ error: e.message });
    }
  }

  // PATCH — toggle is_live on/off for a product by name
  if (req.method === 'PATCH') {
    const { productName, is_live } = req.body;
    if (!productName) return res.status(400).json({ error: 'No product name provided' });
    try {
      await sbFetch(`/products?name=eq.${encodeURIComponent(productName)}`, 'PATCH', { is_live });
      return res.status(200).json({ success: true });
    } catch(e) {
      return res.status(500).json({ error: e.message });
    }
  }

  // DELETE — permanently remove a product by name
  if (req.method === 'DELETE') {
    const { productName } = req.body;
    if (!productName) return res.status(400).json({ error: 'No product name provided' });
    try {
      await sbFetch(`/products?name=eq.${encodeURIComponent(productName)}`, 'DELETE');
      return res.status(200).json({ success: true });
    } catch(e) {
      return res.status(500).json({ error: e.message });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
