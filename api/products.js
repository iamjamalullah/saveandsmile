const fs = require('fs');
const path = require('path');
const { getDb } = require('./db');
const { verifyAuthToken } = require('./auth');

module.exports = async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const sql = getDb();

  // GET: Retrieve all products (Public)
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
      let staticData;
      try {
        staticData = require('../products.json');
      } catch (e) {
        const fallbackPath = path.join(__dirname, '..', 'products.json');
        staticData = JSON.parse(fs.readFileSync(fallbackPath, 'utf8'));
      }
      return res.status(200).json({ source: 'fallback', count: staticData.length, products: staticData });
    } catch (err) {
      return res.status(500).json({ error: 'Failed to read products: ' + err.message });
    }
  }

  // POST: Add new product (Protected: Requires Admin Auth)
  if (req.method === 'POST') {
    const adminUser = verifyAuthToken(req);
    if (!adminUser) {
      return res.status(401).json({ success: false, error: 'Unauthorized: Admin authentication required to create or modify products.' });
    }

    try {
      let body = req.body;
      if (typeof body === 'string') {
        body = JSON.parse(body);
      }

      const { title, description, code, category, tab, price, originalPrice, badge, image, stock } = body || {};
      if (!title || price === undefined || price === null || !image) {
        return res.status(400).json({ success: false, error: 'title, price, and image are required fields.' });
      }

      if (!sql) {
        return res.status(503).json({ success: false, error: 'Database service is currently unavailable. Cannot create product.' });
      }

      const result = await sql`
        INSERT INTO products (title, description, code, category, tab, price, original_price, badge, image, stock)
        VALUES (${title}, ${description || ''}, ${code || ''}, ${category || 'storage'}, ${tab || 'storage'}, ${parseFloat(price) || 0}, ${originalPrice ? parseFloat(originalPrice) : null}, ${badge || 'NEW'}, ${image}, ${parseInt(stock, 10) || 100})
        RETURNING *
      `;
      return res.status(201).json({ success: true, product: result[0] });
    } catch (err) {
      return res.status(500).json({ success: false, error: err.message });
    }
  }

  return res.status(405).json({ error: 'Method Not Allowed' });
};
