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

  // POST: Add new product (Protected: Requires Admin Auth in Production)
  if (req.method === 'POST' || req.method === 'PUT') {
    const adminUser = verifyAuthToken(req);
    if (!adminUser) {
      return res.status(401).json({ success: false, error: 'Unauthorized: Admin authentication required to create or modify products.' });
    }

    try {
      let body = req.body;
      if (typeof body === 'string') {
        body = JSON.parse(body);
      }

      const {
        id, title, description, code, category, tab, price, originalPrice, badge, image, stock,
        slug, seo_title, seoTitle, seo_description, seoDescription,
        focus_keyword, focusKeyword, secondary_keywords, secondaryKeywords,
        canonical_url, canonicalUrl, is_noindex, isNoindex,
        og_title, ogTitle, og_description, ogDescription, og_image, ogImage,
        image_alt, imageAlt
      } = body || {};

      if (!title || price === undefined || price === null || !image) {
        return res.status(400).json({ success: false, error: 'title, price, and image are required fields.' });
      }

      const sTitle = seo_title || seoTitle || title;
      const sDesc = seo_description || seoDescription || description || '';
      const sSlug = slug || (title ? title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '') : '');
      const fKey = focus_keyword || focusKeyword || '';
      const sKey = secondary_keywords || secondaryKeywords || '';
      const cUrl = canonical_url || canonicalUrl || '';
      const noIdx = is_noindex !== undefined ? is_noindex : (isNoindex || false);
      const oTitle = og_title || ogTitle || sTitle;
      const oDesc = og_description || ogDescription || sDesc;
      const oImg = og_image || ogImage || image;
      const iAlt = image_alt || imageAlt || title;

      if (sql) {
        if (req.method === 'PUT' && id) {
          const updated = await sql`
            UPDATE products SET
              title = ${title},
              description = ${description || ''},
              code = ${code || ''},
              category = ${category || 'storage'},
              tab = ${tab || 'storage'},
              price = ${parseFloat(price) || 0},
              original_price = ${originalPrice ? parseFloat(originalPrice) : null},
              badge = ${badge || 'NEW'},
              image = ${image},
              stock = ${parseInt(stock, 10) || 100},
              slug = ${sSlug},
              seo_title = ${sTitle},
              seo_description = ${sDesc},
              focus_keyword = ${fKey},
              secondary_keywords = ${sKey},
              canonical_url = ${cUrl},
              is_noindex = ${noIdx},
              og_title = ${oTitle},
              og_description = ${oDesc},
              og_image = ${oImg},
              image_alt = ${iAlt}
            WHERE id = ${id}
            RETURNING *
          `;
          return res.status(200).json({ success: true, product: updated[0] });
        }

        const result = await sql`
          INSERT INTO products (
            title, description, code, category, tab, price, original_price, badge, image, stock,
            slug, seo_title, seo_description, focus_keyword, secondary_keywords,
            canonical_url, is_noindex, og_title, og_description, og_image, image_alt
          )
          VALUES (
            ${title}, ${description || ''}, ${code || ''}, ${category || 'storage'}, ${tab || 'storage'},
            ${parseFloat(price) || 0}, ${originalPrice ? parseFloat(originalPrice) : null}, ${badge || 'NEW'},
            ${image}, ${parseInt(stock, 10) || 100},
            ${sSlug}, ${sTitle}, ${sDesc}, ${fKey}, ${sKey},
            ${cUrl}, ${noIdx}, ${oTitle}, ${oDesc}, ${oImg}, ${iAlt}
          )
          RETURNING *
        `;
        return res.status(201).json({ success: true, product: result[0] });
      }

      // Local fallback file persistence if Neon DB is not configured
      const fallbackPath = path.join(__dirname, '..', 'products.json');
      let productsList = [];
      try {
        productsList = JSON.parse(fs.readFileSync(fallbackPath, 'utf8'));
      } catch (e) {
        productsList = [];
      }

      const productRecord = {
        id: id || String(Date.now()),
        title, description: description || '',
        code: code || ('QGW-' + Math.floor(100000 + Math.random() * 900000)),
        category: category || 'storage', tab: tab || 'storage',
        price: parseFloat(price) || 0,
        originalPrice: originalPrice ? parseFloat(originalPrice) : null,
        badge: badge || 'NEW', image, stock: parseInt(stock, 10) || 100,
        slug: sSlug, seo_title: sTitle, seo_description: sDesc,
        focus_keyword: fKey, secondary_keywords: sKey, canonical_url: cUrl,
        is_noindex: noIdx, og_title: oTitle, og_description: oDesc,
        og_image: oImg, image_alt: iAlt
      };

      if (req.method === 'PUT' && id) {
        const idx = productsList.findIndex(p => String(p.id) === String(id));
        if (idx >= 0) productsList[idx] = { ...productsList[idx], ...productRecord };
        else productsList.push(productRecord);
      } else {
        productsList.unshift(productRecord);
      }

      try {
        fs.writeFileSync(fallbackPath, JSON.stringify(productsList, null, 2), 'utf8');
      } catch (writeErr) {
        console.warn('Failed to write products fallback file:', writeErr.message);
      }

      return res.status(req.method === 'PUT' ? 200 : 201).json({ success: true, product: productRecord, source: 'local_fallback' });
    } catch (err) {
      return res.status(500).json({ success: false, error: err.message });
    }
  }

  return res.status(405).json({ error: 'Method Not Allowed' });
};
