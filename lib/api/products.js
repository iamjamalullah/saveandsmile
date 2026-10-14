const fs = require('fs');
const path = require('path');
const { getDb } = require('./db');
const { verifyAuthToken } = require('./auth');
const { setCorsHeaders } = require('./cors');

module.exports = async function handler(req, res) {
  setCorsHeaders(req, res);

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const sql = getDb();

  // GET: Retrieve all products (Public)
  if (req.method === 'GET') {
    let sqlRows = null;
    try {
      if (sql) {
        const rows = await sql`SELECT * FROM products ORDER BY id ASC`;
        if (rows && rows.length > 0) {
          sqlRows = rows;
        }
      }
    } catch (err) {
      console.warn('Neon query failed, using static fallback:', err.message);
    }

    // Fallback to static products.json (always read fresh from disk, avoid require.cache)
    try {
      const candidates = [
        path.join(process.cwd(), 'products.json'),
        path.join(process.cwd(), 'public', 'products.json')
      ];
      let staticData = [];
      for (const p of candidates) {
        if (fs.existsSync(p)) {
          staticData = JSON.parse(fs.readFileSync(p, 'utf8'));
          if (Array.isArray(staticData) && staticData.length > 0) break;
        }
      }

      const allProducts = (sqlRows && sqlRows.length > 0) ? sqlRows : staticData;
      const queryId = (req.query && (req.query.id || req.query.code)) || null;

      if (queryId) {
        const single = allProducts.find(p => String(p.id) === String(queryId) || p.code === queryId);
        if (single) return res.status(200).json({ success: true, product: single });
        return res.status(404).json({ success: false, error: 'Product not found' });
      }

      return res.status(200).json({
        success: true,
        source: (sqlRows && sqlRows.length > 0) ? 'neon' : 'fallback',
        count: allProducts.length,
        products: allProducts
      });
    } catch (err) {
      return res.status(500).json({ error: 'Failed to read products: ' + err.message });
    }
  }

  // POST: Add or update product
  if (req.method === 'POST' || req.method === 'PUT') {
    const adminUser = verifyAuthToken(req);

    try {

      let body = req.body;
      if (typeof body === 'string') {
        body = JSON.parse(body);
      }

      const {
        id, title, description, code, category, tab, price, originalPrice, badge, image, images, variants, stock,
        slug, seo_title, seoTitle, seo_description, seoDescription,
        focus_keyword, focusKeyword, secondary_keywords, secondaryKeywords,
        canonical_url, canonicalUrl, is_noindex, isNoindex,
        og_title, ogTitle, og_description, ogDescription, og_image, ogImage,
        image_alt, imageAlt
      } = body || {};

      const effectiveTitle = title || body.name || '';
      const effectiveImage = image || (Array.isArray(images) && images.length > 0 ? (typeof images[0] === 'string' ? images[0] : images[0]?.url) : '') || '/images/placeholder.jpg';

      if (!effectiveTitle || price === undefined || price === null) {
        return res.status(400).json({ success: false, error: 'title and price are required fields.' });
      }

      const resolvedTitle = effectiveTitle;
      const resolvedImage = effectiveImage;

      const sTitle = seo_title || seoTitle || resolvedTitle;
      const sDesc = seo_description || seoDescription || description || '';
      const sSlug = slug || (resolvedTitle ? resolvedTitle.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '') : '');
      const fKey = focus_keyword || focusKeyword || '';
      const sKey = secondary_keywords || secondaryKeywords || '';
      const cUrl = canonical_url || canonicalUrl || '';
      const noIdx = is_noindex !== undefined ? is_noindex : (isNoindex || false);
      const oTitle = og_title || ogTitle || sTitle;
      const oDesc = og_description || ogDescription || sDesc;
      const oImg = og_image || ogImage || resolvedImage;
      const iAlt = image_alt || imageAlt || resolvedTitle;

      let dbProduct = null;
      if (sql) {
        try {
          if (id) {
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
            if (updated && updated.length > 0) {
              dbProduct = updated[0];
            } else {
              const result = await sql`
                INSERT INTO products (
                  id, title, description, code, category, tab, price, original_price, badge, image, stock,
                  slug, seo_title, seo_description, focus_keyword, secondary_keywords,
                  canonical_url, is_noindex, og_title, og_description, og_image, image_alt
                )
                VALUES (
                  ${id}, ${title}, ${description || ''}, ${code || ''}, ${category || 'storage'}, ${tab || 'storage'},
                  ${parseFloat(price) || 0}, ${originalPrice ? parseFloat(originalPrice) : null}, ${badge || 'NEW'},
                  ${image}, ${parseInt(stock, 10) || 100},
                  ${sSlug}, ${sTitle}, ${sDesc}, ${fKey}, ${sKey},
                  ${cUrl}, ${noIdx}, ${oTitle}, ${oDesc}, ${oImg}, ${iAlt}
                )
                RETURNING *
              `;
              if (result && result.length > 0) dbProduct = result[0];
            }
          } else {
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
            if (result && result.length > 0) dbProduct = result[0];
          }
        } catch (dbErr) {
          console.warn('Neon DB mutation error, syncing to JSON fallback:', dbErr.message);
        }
      }

      // Synchronize with JSON persistence files (both root and public)
      const fallbackPath = path.join(process.cwd(), 'products.json');
      const publicFallbackPath = path.join(process.cwd(), 'public', 'products.json');
      let productsList = [];
      try {
        productsList = JSON.parse(fs.readFileSync(fallbackPath, 'utf8'));
      } catch (e) {
        try {
          productsList = JSON.parse(fs.readFileSync(publicFallbackPath, 'utf8'));
        } catch (e2) {
          productsList = [];
        }
      }

      const productRecord = {
        id: (dbProduct && dbProduct.id) || id || String(Date.now()),
        title: resolvedTitle, description: description || '',
        code: code || ('QGW-' + Math.floor(100000 + Math.random() * 900000)),
        category: category || 'storage', tab: tab || 'storage',
        price: parseFloat(price) || 0,
        originalPrice: originalPrice ? parseFloat(originalPrice) : null,
        badge: badge || 'NEW', image: resolvedImage,
        images: Array.isArray(images) && images.length > 0 ? images : [resolvedImage],
        variants: Array.isArray(variants) ? variants : [],
        stock: parseInt(stock, 10) || 100,
        slug: sSlug, seo_title: sTitle, seo_description: sDesc,
        focus_keyword: fKey, secondary_keywords: sKey, canonical_url: cUrl,
        is_noindex: noIdx, og_title: oTitle, og_description: oDesc,
        og_image: oImg, image_alt: iAlt
      };

      const existingIdx = id ? productsList.findIndex(p => String(p.id) === String(id)) : -1;
      if (existingIdx >= 0) {
        productsList[existingIdx] = { ...productsList[existingIdx], ...productRecord };
      } else {
        productsList.unshift(productRecord);
      }

      try {
        fs.writeFileSync(fallbackPath, JSON.stringify(productsList, null, 2), 'utf8');
      } catch (writeErr) {
        console.warn('Failed to write products fallback file:', writeErr.message);
      }
      try {
        if (fs.existsSync(path.dirname(publicFallbackPath))) {
          fs.writeFileSync(publicFallbackPath, JSON.stringify(productsList, null, 2), 'utf8');
        }
      } catch (pubWriteErr) {
        console.warn('Failed to write public products fallback file:', pubWriteErr.message);
      }

      try {
        delete require.cache[path.join(process.cwd(), 'products.json')];
      } catch (e) {}

      return res.status(req.method === 'PUT' ? 200 : 201).json({
        success: true,
        product: dbProduct || productRecord,
        source: dbProduct ? 'neon' : 'local_fallback'
      });
    } catch (err) {
      return res.status(500).json({ success: false, error: err.message });
    }
  }

  // DELETE: Remove product
  if (req.method === 'DELETE') {
    const adminUser = verifyAuthToken(req);

    try {

      let body = req.body;
      if (typeof body === 'string') {
        try { body = JSON.parse(body); } catch (e) {}
      }
      const id = (body && body.id) || (req.query && req.query.id);
      if (!id) {
        return res.status(400).json({ success: false, error: 'Product id is required for deletion.' });
      }

      if (sql) {
        try {
          await sql`DELETE FROM products WHERE id = ${String(id)}`;
        } catch (dbErr) {
          console.warn('Neon DELETE failed:', dbErr.message);
        }
      }

      const fallbackPath = path.join(process.cwd(), 'products.json');
      const publicFallbackPath = path.join(process.cwd(), 'public', 'products.json');
      try {
        let productsList = JSON.parse(fs.readFileSync(fallbackPath, 'utf8'));
        productsList = productsList.filter(p => String(p.id) !== String(id));
        fs.writeFileSync(fallbackPath, JSON.stringify(productsList, null, 2), 'utf8');
      } catch (fileErr) {
        console.warn('Fallback file delete warning:', fileErr.message);
      }
      try {
        if (fs.existsSync(path.dirname(publicFallbackPath))) {
          let productsList = JSON.parse(fs.readFileSync(publicFallbackPath, 'utf8'));
          productsList = productsList.filter(p => String(p.id) !== String(id));
          fs.writeFileSync(publicFallbackPath, JSON.stringify(productsList, null, 2), 'utf8');
        }
      } catch (pubErr) {
        console.warn('Public fallback delete warning:', pubErr.message);
      }

      try {
        delete require.cache[path.join(process.cwd(), 'products.json')];
      } catch (e) {}

      return res.status(200).json({ success: true, message: 'Product deleted successfully', id });
    } catch (err) {
      return res.status(500).json({ success: false, error: err.message });
    }
  }

  return res.status(405).json({ error: 'Method Not Allowed' });
};
