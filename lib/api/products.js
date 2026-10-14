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

      const existingProduct = id ? productsList.find(p => String(p.id) === String(id)) : null;

      const effectiveTitle = title || body.name || (existingProduct && existingProduct.title) || '';
      const effectivePrice = (price !== undefined && price !== null) ? (parseFloat(price) || 0) : (existingProduct ? existingProduct.price : undefined);

      if (!id && (!effectiveTitle || effectivePrice === undefined || effectivePrice === null)) {
        return res.status(400).json({ success: false, error: 'title and price are required fields.' });
      }

      const effectiveDescription = (description !== undefined) ? description : (existingProduct ? existingProduct.description : '');
      const effectiveCode = code || (existingProduct && existingProduct.code) || ('QGW-' + Math.floor(100000 + Math.random() * 900000));
      const effectiveCategory = category || (existingProduct && existingProduct.category) || 'storage';
      const effectiveTab = tab || (existingProduct && existingProduct.tab) || effectiveCategory;
      const effectiveOriginalPrice = (originalPrice !== undefined) ? (originalPrice ? parseFloat(originalPrice) : null) : (existingProduct ? (existingProduct.originalPrice || existingProduct.original_price || null) : null);
      const effectiveBadge = badge || (existingProduct && existingProduct.badge) || 'NEW';
      const effectiveStock = (stock !== undefined) ? (parseInt(stock, 10) || 0) : (existingProduct ? existingProduct.stock : 50);
      const effectiveImage = image || (Array.isArray(images) && images.length > 0 ? (typeof images[0] === 'string' ? images[0] : images[0]?.url) : '') || (existingProduct && existingProduct.image) || '/images/placeholder.jpg';
      const effectiveImages = (Array.isArray(images) && images.length > 0) ? images.map(i => typeof i === 'string' ? i : (i.url || '')) : (existingProduct && existingProduct.images ? existingProduct.images : [effectiveImage]);
      const effectiveVariants = Array.isArray(variants) ? variants : (existingProduct && existingProduct.variants ? existingProduct.variants : []);

      const resolvedTitle = effectiveTitle;
      const resolvedImage = effectiveImage;

      const sTitle = seo_title || seoTitle || (existingProduct && existingProduct.seo_title) || resolvedTitle;
      const sDesc = seo_description || seoDescription || (existingProduct && existingProduct.seo_description) || effectiveDescription || '';
      const sSlug = slug || (existingProduct && existingProduct.slug) || (resolvedTitle ? resolvedTitle.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '') : '');
      const fKey = focus_keyword || focusKeyword || (existingProduct && existingProduct.focus_keyword) || '';
      const sKey = secondary_keywords || secondaryKeywords || (existingProduct && existingProduct.secondary_keywords) || '';
      const cUrl = canonical_url || canonicalUrl || (existingProduct && existingProduct.canonical_url) || '';
      const noIdx = is_noindex !== undefined ? is_noindex : (isNoindex !== undefined ? isNoindex : (existingProduct ? existingProduct.is_noindex : false));
      const oTitle = og_title || ogTitle || (existingProduct && existingProduct.og_title) || sTitle;
      const oDesc = og_description || ogDescription || (existingProduct && existingProduct.og_description) || sDesc;
      const oImg = og_image || ogImage || (existingProduct && existingProduct.og_image) || resolvedImage;
      const iAlt = image_alt || imageAlt || (existingProduct && existingProduct.image_alt) || resolvedTitle;

      let dbProduct = null;
      if (sql) {
        try {
          if (id) {
            const updated = await sql`
              UPDATE products SET
                title = ${resolvedTitle},
                description = ${effectiveDescription},
                code = ${effectiveCode},
                category = ${effectiveCategory},
                tab = ${effectiveTab},
                price = ${effectivePrice},
                original_price = ${effectiveOriginalPrice},
                badge = ${effectiveBadge},
                image = ${resolvedImage},
                stock = ${effectiveStock},
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
                  ${id}, ${resolvedTitle}, ${effectiveDescription}, ${effectiveCode}, ${effectiveCategory}, ${effectiveTab},
                  ${effectivePrice}, ${effectiveOriginalPrice}, ${effectiveBadge},
                  ${resolvedImage}, ${effectiveStock},
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
                ${resolvedTitle}, ${effectiveDescription}, ${effectiveCode}, ${effectiveCategory}, ${effectiveTab},
                ${effectivePrice}, ${effectiveOriginalPrice}, ${effectiveBadge},
                ${resolvedImage}, ${effectiveStock},
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

      // Re-read latest list before applying update
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
        ...(existingProduct || {}),
        id: (dbProduct && dbProduct.id) || id || String(Date.now()),
        title: resolvedTitle,
        description: effectiveDescription,
        code: effectiveCode,
        category: effectiveCategory,
        tab: effectiveTab,
        price: effectivePrice,
        originalPrice: effectiveOriginalPrice,
        badge: effectiveBadge,
        image: resolvedImage,
        images: effectiveImages,
        variants: effectiveVariants,
        stock: effectiveStock,
        slug: sSlug, seo_title: sTitle, seo_description: sDesc,
        focus_keyword: fKey, secondary_keywords: sKey, canonical_url: cUrl,
        is_noindex: noIdx, og_title: oTitle, og_description: oDesc,
        og_image: oImg, image_alt: iAlt,
        updatedAt: new Date().toISOString()
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
