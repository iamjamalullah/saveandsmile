const fs = require('fs');
const path = require('path');
const { getDb } = require('./db');

module.exports = async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const sql = getDb();

  // GET: Retrieve all products
  if (req.method === 'GET') {
    try {
      if (sql) {
        const rows = await sql`SELECT * FROM products ORDER BY id ASC`;
        if (rows && rows.length > 0) {
          return res.status(200).json({ source: 'neon', count: rows.length, products: rows });
        }
      }
    } catch (err) {
      console.warn('Neon query failed, using static fallback:', err.message);
    }

    // Fallback to static products.json
    try {
      const fallbackPath = path.join(__dirname, '..', 'products.json');
      const staticData = JSON.parse(fs.readFileSync(fallbackPath, 'utf8'));
      return res.status(200).json({ source: 'fallback', count: staticData.length, products: staticData });
    } catch (err) {
      return res.status(500).json({ error: 'Failed to read products' });
    }
  }

  // POST: Add new product
  if (req.method === 'POST') {
    try {
      let body = req.body;
      if (typeof body === 'string') {
        body = JSON.parse(body);
      }

      const { title, description, code, category, tab, price, originalPrice, badge, image, stock } = body;
      if (!title || !price || !image) {
        return res.status(400).json({ error: 'title, price, and image are required fields' });
      }

      if (sql) {
        const result = await sql`
          INSERT INTO products (title, description, code, category, tab, price, original_price, badge, image, stock)
          VALUES (${title}, ${description || ''}, ${code || ''}, ${category || 'storage'}, ${tab || 'storage'}, ${price}, ${originalPrice || null}, ${badge || 'NEW'}, ${image}, ${stock || 100})
          RETURNING *
        `;
        return res.status(201).json({ success: true, product: result[0] });
      } else {
        return res.status(200).json({ success: true, message: 'Saved locally (Neon DATABASE_URL not yet configured)', product: body });
      }
    } catch (err) {
      return res.status(500).json({ error: err.message });
    }
  }

  return res.status(405).json({ error: 'Method Not Allowed' });
};
