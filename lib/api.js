const { ensureSchema, query, queryOne, getMode } = require('./db');
const { seedIfNeeded } = require('./seed');
const { parseUrl, sendJson, readJson, readBody, rateLimit, slugify } = require('./http');
const { createSession, destroySession, requireUser, verifyPassword, hashPassword, currentUser } = require('./auth');
const { requirePerm } = require('./permissions');
const { processBuffer, importFromUrl, srcsetFrom } = require('./media');
const { parseJson, mediaUrl, toStoreProduct, toStoreCategory, defaultHomepageSections, SECTION_DOM } = require('./map-store');

let booted = false;
async function boot() {
  if (booted) return;
  await ensureSchema();
  await seedIfNeeded();
  booted = true;
}

function parseJsonb(v, fb) {
  return parseJson(v, fb);
}

async function handleApi(req, res) {
  await boot();
  const { pathname, query: qs } = parseUrl(req);
  const method = (req.method || 'GET').toUpperCase();
  const path = pathname.replace(/\/+$/, '') || '/';

  if (method === 'OPTIONS') {
    res.writeHead(204, {
      'Access-Control-Allow-Methods': 'GET,POST,PUT,PATCH,DELETE,OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, X-CSRF-Token',
      'Access-Control-Allow-Credentials': 'true'
    });
    return res.end();
  }

  try {
    if (path === '/api/health' && method === 'GET') {
      const n = await queryOne(`SELECT COUNT(*)::int AS products FROM products`);
      return sendJson(res, 200, {
        status: 'online',
        db: getMode(),
        products: n ? n.products : 0,
        timestamp: new Date().toISOString()
      });
    }

    if (path === '/api/auth/login' && method === 'POST') {
      const ip = req.socket.remoteAddress || 'ip';
      if (!rateLimit('login:' + ip, 12, 10 * 60 * 1000)) {
        return sendJson(res, 429, { error: 'Too many login attempts' });
      }
      const body = await readJson(req);
      const email = String(body.email || '').trim().toLowerCase();
      const password = String(body.password || '');
      const user = await queryOne(`SELECT * FROM users WHERE email = $1`, [email]);
      if (!user || user.status !== 'active' || !(await verifyPassword(password, user.password_hash))) {
        return sendJson(res, 401, { error: 'Invalid email or password' });
      }
      const csrf = await createSession(res, user);
      return sendJson(res, 200, { ok: true, csrf, user: publicUser(user) });
    }

    if (path === '/api/auth/logout' && method === 'POST') {
      await destroySession(req, res);
      return sendJson(res, 200, { ok: true });
    }

    if (path === '/api/auth/me' && method === 'GET') {
      const user = await currentUser(req);
      if (!user) return sendJson(res, 401, { error: 'Not authenticated' });
      return sendJson(res, 200, { user: publicUser(user), csrf: user.csrf });
    }

    if (path === '/api/store/bootstrap' && method === 'GET') {
      const preview = qs.preview === '1';
      let user = null;
      if (preview) user = await currentUser(req);
      const data = await storeBootstrap(preview && user);
      res.setHeader('Cache-Control', preview ? 'no-store' : 'public, max-age=15');
      return sendJson(res, 200, data);
    }

    if (path === '/api/store/track' && method === 'GET') {
      const q = String(qs.q || '').trim();
      if (q.length < 3) return sendJson(res, 400, { error: 'Enter order ID or phone' });
      const rows = await query(
        `SELECT order_code, customer_name, customer_phone, customer_city, customer_address,
                grand_total, status, payment_method, created_at, coupon_code
         FROM orders
         WHERE order_code ILIKE $1 OR customer_phone ILIKE $2
         ORDER BY created_at DESC LIMIT 10`,
        [q, '%' + q.replace(/\s+/g, '') + '%']
      );
      const ids = rows.map(r => r.order_code);
      const items = ids.length ? await query(
        `SELECT o.order_code, i.title, i.qty, i.price FROM order_items i JOIN orders o ON o.id = i.order_id WHERE o.order_code = ANY($1::text[])`,
        [ids]
      ) : [];
      const grouped = rows.map(o => ({
        orderId: o.order_code,
        name: o.customer_name,
        phone: o.customer_phone,
        city: o.customer_city,
        address: o.customer_address,
        grandTotal: Number(o.grand_total),
        status: o.status,
        payment: o.payment_method,
        date: o.created_at,
        items: items.filter(i => i.order_code === o.order_code)
      }));
      return sendJson(res, 200, { orders: grouped });
    }

    if (path === '/api/store/coupon' && method === 'POST') {
      const body = await readJson(req);
      const result = await applyCoupon(body.code, Number(body.subtotal) || 0, body.phone, false);
      return sendJson(res, result.ok ? 200 : 400, result);
    }

    if (path === '/api/store/orders' && method === 'POST') {
      const ip = req.socket.remoteAddress || 'ip';
      if (!rateLimit('order:' + ip, 20, 60 * 60 * 1000)) {
        return sendJson(res, 429, { error: 'Too many orders' });
      }
      const body = await readJson(req);
      const created = await createStoreOrder(body);
      return sendJson(res, 201, created);
    }

    if (path === '/api/store/forms' && method === 'POST') {
      const body = await readJson(req);
      const form = await queryOne(`SELECT * FROM forms WHERE slug = $1 AND status = 'active'`, [body.slug || 'contact']);
      if (!form) return sendJson(res, 404, { error: 'Form not found' });
      await query(`INSERT INTO form_submissions (form_id, payload) VALUES ($1,$2::jsonb)`, [form.id, JSON.stringify(body.fields || body)]);
      return sendJson(res, 201, { ok: true });
    }

    // --- Admin ---
    if (path.startsWith('/api/admin')) {
      const user = await requireUser(req, res);
      if (!user) return;
      return handleAdmin(req, res, user, path, method, qs);
    }

    return sendJson(res, 404, { error: 'API endpoint not found' });
  } catch (err) {
    console.error('API error', err);
    return sendJson(res, err.status || 500, { error: err.message || 'Server error' });
  }
}

function publicUser(u) {
  return { id: u.id, email: u.email, name: u.name, role: u.role };
}

async function storeBootstrap(previewUser) {
  const store = parseJsonb((await queryOne(`SELECT value FROM settings WHERE key = 'store'`))?.value, {});
  const seo = parseJsonb((await queryOne(`SELECT value FROM settings WHERE key = 'seo'`))?.value, {});
  const theme = parseJsonb((await queryOne(`SELECT value FROM settings WHERE key = 'theme'`))?.value, { theme: 'green' });

  const products = await query(
    `SELECT p.*, m.url AS image_url, m.variants AS image_variants, m.width AS img_width, m.height AS img_height
     FROM products p LEFT JOIN media m ON m.id = p.featured_media_id
     WHERE p.status = 'published' ORDER BY p.id ASC`
  );
  const categories = await query(
    `SELECT c.*, (SELECT COUNT(*) FROM products p WHERE p.category_id = c.id AND p.status = 'published') AS product_count
     FROM categories c WHERE c.status = 'active' ORDER BY c.sort_order ASC, c.name ASC`
  );
  const banners = await query(
    `SELECT b.*, md.url AS desktop_url, mm.url AS mobile_url
     FROM banners b
     LEFT JOIN media md ON md.id = b.desktop_media_id
     LEFT JOIN media mm ON mm.id = b.mobile_media_id
     WHERE b.status = 'published'
       AND (b.start_at IS NULL OR b.start_at <= NOW())
       AND (b.end_at IS NULL OR b.end_at >= NOW())
     ORDER BY b.sort_order ASC, b.id ASC`
  );
  const reels = await query(`SELECT * FROM reels WHERE status = 'published' ORDER BY sort_order ASC`);
  const reviews = await query(`SELECT * FROM reviews WHERE status = 'approved' ORDER BY featured DESC, created_at DESC LIMIT 20`);
  const collections = await query(`SELECT * FROM collections WHERE status = 'published' ORDER BY id ASC`);
  const payments = store.payments || { COD: true, JazzCash: true, EasyPaisa: true };

  let homepage = defaultHomepageSections();
  const home = await queryOne(`SELECT * FROM pages WHERE slug = 'home'`);
  if (home) {
    let versionId = home.published_version_id;
    if (previewUser) {
      const draft = await queryOne(`SELECT * FROM page_versions WHERE page_id = $1 ORDER BY id DESC LIMIT 1`, [home.id]);
      if (draft) versionId = draft.id;
    }
    if (versionId) {
      const ver = await queryOne(`SELECT sections FROM page_versions WHERE id = $1`, [versionId]);
      if (ver) homepage = parseJsonb(ver.sections, homepage);
    }
  }

  const mappedProducts = products.map((p) => toStoreProduct(p, {
    url: p.image_url,
    variants: p.image_variants,
    width: p.img_width,
    height: p.img_height
  }));

  return {
    source: 'database',
    preview: Boolean(previewUser),
    store: {
      name: store.name,
      tagline: store.tagline,
      phone: store.phone,
      whatsapp: store.whatsapp,
      email: store.email,
      logo: store.logo,
      address: store.address,
      currency: store.currency || 'Rs.',
      freeShippingThreshold: Number(store.freeShippingThreshold) || 3000,
      shippingFee: Number(store.shippingFee) || 200,
      payments
    },
    seo,
    theme,
    products: mappedProducts,
    categories: categories.map(toStoreCategory),
    banners: banners.map((b) => ({
      id: b.id,
      title: b.title,
      subtitle: b.subtitle,
      image: b.desktop_url || b.image_url,
      mobileImage: b.mobile_url || b.desktop_url || b.image_url,
      link: b.url || '#products'
    })),
    reels: reels.map((r) => ({
      id: r.id,
      video: r.video_url,
      title: r.title,
      price: Number(r.price),
      originalPrice: Number(r.compare_price),
      thumb: r.thumb_url,
      code: r.code
    })),
    reviews: reviews.map((r) => ({
      name: r.customer_name,
      initial: (r.customer_name || 'C').charAt(0).toUpperCase(),
      color: r.color || '#007382',
      stars: r.rating,
      title: r.title,
      text: r.body,
      date: r.created_at
    })),
    collections,
    homepage,
    sectionDom: SECTION_DOM
  };
}

async function applyCoupon(code, subtotal, phone, commit) {
  const c = await queryOne(`SELECT * FROM coupons WHERE UPPER(code) = UPPER($1)`, [String(code || '').trim()]);
  if (!c || c.status !== 'active') return { ok: false, error: 'Invalid coupon' };
  const now = new Date();
  if (c.starts_at && new Date(c.starts_at) > now) return { ok: false, error: 'Coupon not started' };
  if (c.ends_at && new Date(c.ends_at) < now) return { ok: false, error: 'Coupon expired' };
  if (c.usage_limit && c.used_count >= c.usage_limit) return { ok: false, error: 'Coupon usage limit reached' };
  if (subtotal < Number(c.min_order || 0)) return { ok: false, error: 'Minimum order not met' };
  if (phone && c.per_customer_limit) {
    const used = await queryOne(
      `SELECT COUNT(*)::int AS n FROM coupon_redemptions WHERE coupon_id = $1 AND customer_phone = $2`,
      [c.id, phone]
    );
    if (used && used.n >= c.per_customer_limit) return { ok: false, error: 'Coupon already used' };
  }
  let discount = 0;
  if (c.type === 'percentage') discount = subtotal * (Number(c.value) / 100);
  else if (c.type === 'fixed') discount = Number(c.value);
  if (c.max_discount) discount = Math.min(discount, Number(c.max_discount));
  discount = Math.round(Math.min(discount, subtotal) * 100) / 100;
  return {
    ok: true,
    code: c.code,
    discount,
    freeShipping: Boolean(c.free_shipping),
    couponId: c.id,
    commit: Boolean(commit)
  };
}

async function createStoreOrder(body) {
  const name = String(body.customerName || body.name || '').trim();
  const phone = String(body.customerPhone || body.phone || '').trim();
  const address = String(body.customerAddress || body.address || '').trim();
  const city = String(body.customerCity || body.city || '').trim();
  const items = Array.isArray(body.items) ? body.items : [];
  if (!name || !phone || !address || !city) {
    const err = new Error('Name, phone, address and city are required');
    err.status = 400;
    throw err;
  }
  if (!items.length) {
    const err = new Error('Cart is empty');
    err.status = 400;
    throw err;
  }

  const store = parseJsonb((await queryOne(`SELECT value FROM settings WHERE key = 'store'`))?.value, {});
  const payments = store.payments || { COD: true };
  const method = body.paymentMethod || 'COD';
  if (!payments[method] && method !== 'COD') {
    const err = new Error('Payment method is not enabled');
    err.status = 400;
    throw err;
  }

  let subtotal = 0;
  const lines = [];
  for (const item of items) {
    const pid = item.id || item.productId;
    const p = pid ? await queryOne(`SELECT * FROM products WHERE id = $1`, [pid]) : null;
    const price = p ? Number(p.price) : Number(item.price) || 0;
    const qty = Math.max(1, parseInt(item.qty, 10) || 1);
    const title = p ? p.title : (item.title || 'Item');
    if (p && p.status !== 'published') {
      const err = new Error('Product unavailable: ' + title);
      err.status = 400;
      throw err;
    }
    if (p && Number(p.stock) < qty) {
      const err = new Error('Insufficient stock for ' + title);
      err.status = 400;
      throw err;
    }
    subtotal += price * qty;
    lines.push({ p, title, price, qty, sku: p ? p.sku : item.code });
  }

  let shipping = subtotal >= Number(store.freeShippingThreshold || 3000) ? 0 : Number(store.shippingFee || 200);
  let discount = 0;
  let couponRow = null;
  if (body.couponCode) {
    const c = await applyCoupon(body.couponCode, subtotal, phone, false);
    if (!c.ok) {
      const err = new Error(c.error);
      err.status = 400;
      throw err;
    }
    discount = c.discount;
    if (c.freeShipping) shipping = 0;
    couponRow = c;
  }
  const grand = Math.max(0, subtotal - discount + shipping);
  const orderCode = body.orderId || ('SS-' + Math.floor(100000 + Math.random() * 900000));

  let customer = await queryOne(`SELECT * FROM customers WHERE phone = $1`, [phone]);
  if (!customer) {
    const created = await query(
      `INSERT INTO customers (name, phone, email, order_count, total_spent) VALUES ($1,$2,$3,0,0) RETURNING *`,
      [name, phone, body.customerEmail || body.email || '']
    );
    customer = created[0];
    await query(
      `INSERT INTO customer_addresses (customer_id, city, address, landmark, area) VALUES ($1,$2,$3,$4,$5)`,
      [customer.id, city, address, body.landmark || '', body.area || '']
    );
  }

  const orderIns = await query(
    `INSERT INTO orders (
      order_code, customer_id, customer_name, customer_phone, customer_email, customer_address, customer_city,
      area, landmark, delivery_notes, payment_method, coupon_code, discount_amount, subtotal, shipping_fee, grand_total, status, notes
    ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,'Pending',$17) RETURNING *`,
    [
      orderCode, customer.id, name, phone, body.customerEmail || '', address, city,
      body.area || '', body.landmark || '', body.deliveryNotes || body.notes || '',
      method, couponRow ? couponRow.code : null, discount, subtotal, shipping, grand,
      body.notes || ''
    ]
  );
  const order = orderIns[0];
  await query(`INSERT INTO order_events (order_id, status, note) VALUES ($1,'Pending','Order placed')`, [order.id]);

  for (const line of lines) {
    await query(
      `INSERT INTO order_items (order_id, product_id, title, sku, price, qty, total) VALUES ($1,$2,$3,$4,$5,$6,$7)`,
      [order.id, line.p ? line.p.id : null, line.title, line.sku || '', line.price, line.qty, line.price * line.qty]
    );
    if (line.p) {
      await query(`UPDATE products SET stock = stock - $1, updated_at = NOW() WHERE id = $2`, [line.qty, line.p.id]);
      await query(
        `INSERT INTO inventory_movements (product_id, delta, reason, note) VALUES ($1,$2,'sale',$3)`,
        [line.p.id, -line.qty, orderCode]
      );
    }
  }

  if (couponRow) {
    await query(`UPDATE coupons SET used_count = used_count + 1 WHERE id = $1`, [couponRow.couponId]);
    await query(`INSERT INTO coupon_redemptions (coupon_id, customer_phone, order_id) VALUES ($1,$2,$3)`, [couponRow.couponId, phone, order.id]);
  }

  await query(
    `UPDATE customers SET order_count = order_count + 1, total_spent = total_spent + $1 WHERE id = $2`,
    [grand, customer.id]
  );

  return { success: true, orderId: orderCode, order };
}

async function handleAdmin(req, res, user, path, method, qs) {
  const rest = path.replace('/api/admin', '') || '/';

  if (rest === '/dashboard' && method === 'GET') {
    requirePerm(user, 'dashboard', 'view');
    const stats = await queryOne(`
      SELECT
        (SELECT COUNT(*)::int FROM orders) AS orders,
        (SELECT COALESCE(SUM(grand_total),0) FROM orders WHERE status NOT IN ('Cancelled','Refunded')) AS revenue,
        (SELECT COUNT(*)::int FROM customers) AS customers,
        (SELECT COUNT(*)::int FROM products) AS products,
        (SELECT COUNT(*)::int FROM products WHERE stock <= low_stock) AS low_stock,
        (SELECT COUNT(*)::int FROM orders WHERE status = 'Pending') AS pending_orders
    `);
    const recent = await query(`SELECT order_code, customer_name, grand_total, status, created_at FROM orders ORDER BY created_at DESC LIMIT 8`);
    const series = await query(`
      SELECT DATE(created_at) AS d, COUNT(*)::int AS orders, COALESCE(SUM(grand_total),0) AS revenue
      FROM orders WHERE created_at >= NOW() - INTERVAL '14 days'
      GROUP BY DATE(created_at) ORDER BY d ASC
    `);
    return sendJson(res, 200, { stats, recent, series });
  }

  if (rest === '/products' && method === 'GET') return sendJson(res, 200, { items: await listAdminProducts(qs) });
  if (rest === '/products' && method === 'POST') {
    requirePerm(user, 'products', 'create');
    const body = await readJson(req);
    const p = await upsertProduct(null, body, user);
    return sendJson(res, 201, { item: p });
  }
  const prodMatch = rest.match(/^\/products\/(\d+)$/);
  if (prodMatch && method === 'GET') {
    const p = await getAdminProduct(prodMatch[1]);
    if (!p) return sendJson(res, 404, { error: 'Not found' });
    return sendJson(res, 200, { item: p });
  }
  if (prodMatch && (method === 'PUT' || method === 'PATCH')) {
    requirePerm(user, 'products', 'edit');
    const body = await readJson(req);
    const p = await upsertProduct(prodMatch[1], body, user);
    return sendJson(res, 200, { item: p });
  }
  if (prodMatch && method === 'DELETE') {
    requirePerm(user, 'products', 'delete');
    await query(`DELETE FROM products WHERE id = $1`, [prodMatch[1]]);
    return sendJson(res, 200, { ok: true });
  }
  if (rest.match(/^\/products\/(\d+)\/duplicate$/) && method === 'POST') {
    requirePerm(user, 'products', 'create');
    const id = rest.match(/^\/products\/(\d+)/)[1];
    const src = await getAdminProduct(id);
    if (!src) return sendJson(res, 404, { error: 'Not found' });
    src.title = src.title + ' (Copy)';
    src.slug = slugify(src.title) + '-' + Date.now();
    src.sku = (src.sku || 'SKU') + '-COPY';
    src.status = 'draft';
    const p = await upsertProduct(null, src, user);
    return sendJson(res, 201, { item: p });
  }

  if (rest === '/categories' && method === 'GET') {
    const items = await query(`SELECT * FROM categories ORDER BY sort_order, name`);
    return sendJson(res, 200, { items });
  }
  if (rest === '/categories' && method === 'POST') {
    requirePerm(user, 'categories', 'create');
    const b = await readJson(req);
    const id = slugify(b.id || b.name);
    await query(
      `INSERT INTO categories (id, name, slug, parent_id, icon, image_media_id, description, sort_order, status, featured, seo)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11::jsonb)`,
      [id, b.name, slugify(b.slug || b.name), b.parent_id || null, b.icon || '', b.image_media_id || null, b.description || '', b.sort_order || 0, b.status || 'active', !!b.featured, JSON.stringify(b.seo || {})]
    );
    return sendJson(res, 201, { item: await queryOne(`SELECT * FROM categories WHERE id = $1`, [id]) });
  }
  const catMatch = rest.match(/^\/categories\/([^/]+)$/);
  if (catMatch && method === 'PUT') {
    requirePerm(user, 'categories', 'edit');
    const b = await readJson(req);
    await query(
      `UPDATE categories SET name=$2, slug=$3, parent_id=$4, icon=$5, image_media_id=$6, description=$7, sort_order=$8, status=$9, featured=$10, seo=$11::jsonb
       WHERE id=$1`,
      [catMatch[1], b.name, slugify(b.slug || b.name), b.parent_id || null, b.icon || '', b.image_media_id || null, b.description || '', b.sort_order || 0, b.status || 'active', !!b.featured, JSON.stringify(b.seo || {})]
    );
    return sendJson(res, 200, { item: await queryOne(`SELECT * FROM categories WHERE id = $1`, [catMatch[1]]) });
  }
  if (catMatch && method === 'DELETE') {
    requirePerm(user, 'categories', 'delete');
    await query(`DELETE FROM categories WHERE id = $1`, [catMatch[1]]);
    return sendJson(res, 200, { ok: true });
  }

  if (rest === '/collections' && method === 'GET') return sendJson(res, 200, { items: await query(`SELECT * FROM collections ORDER BY id DESC`) });
  if (rest === '/collections' && method === 'POST') {
    requirePerm(user, 'collections', 'create');
    const b = await readJson(req);
    const rows = await query(
      `INSERT INTO collections (title, slug, type, description, image_media_id, conditions, sort_mode, status, seo)
       VALUES ($1,$2,$3,$4,$5,$6::jsonb,$7,$8,$9::jsonb) RETURNING *`,
      [b.title, slugify(b.slug || b.title), b.type || 'manual', b.description || '', b.image_media_id || null, JSON.stringify(b.conditions || {}), b.sort_mode || 'manual', b.status || 'published', JSON.stringify(b.seo || {})]
    );
    if (Array.isArray(b.product_ids)) {
      for (let i = 0; i < b.product_ids.length; i++) {
        await query(`INSERT INTO collection_products (collection_id, product_id, sort_order) VALUES ($1,$2,$3) ON CONFLICT DO NOTHING`, [rows[0].id, b.product_ids[i], i]);
      }
    }
    return sendJson(res, 201, { item: rows[0] });
  }
  const colMatch = rest.match(/^\/collections\/(\d+)$/);
  if (colMatch && method === 'PUT') {
    requirePerm(user, 'collections', 'edit');
    const b = await readJson(req);
    await query(
      `UPDATE collections SET title=$2, slug=$3, type=$4, description=$5, image_media_id=$6, conditions=$7::jsonb, sort_mode=$8, status=$9, seo=$10::jsonb WHERE id=$1`,
      [colMatch[1], b.title, slugify(b.slug || b.title), b.type || 'manual', b.description || '', b.image_media_id || null, JSON.stringify(b.conditions || {}), b.sort_mode || 'manual', b.status || 'published', JSON.stringify(b.seo || {})]
    );
    if (Array.isArray(b.product_ids)) {
      await query(`DELETE FROM collection_products WHERE collection_id = $1`, [colMatch[1]]);
      for (let i = 0; i < b.product_ids.length; i++) {
        await query(`INSERT INTO collection_products (collection_id, product_id, sort_order) VALUES ($1,$2,$3)`, [colMatch[1], b.product_ids[i], i]);
      }
    }
    return sendJson(res, 200, { item: await queryOne(`SELECT * FROM collections WHERE id = $1`, [colMatch[1]]) });
  }
  if (colMatch && method === 'DELETE') {
    requirePerm(user, 'collections', 'delete');
    await query(`DELETE FROM collections WHERE id = $1`, [colMatch[1]]);
    return sendJson(res, 200, { ok: true });
  }

  if (rest === '/brands' && method === 'GET') return sendJson(res, 200, { items: await query(`SELECT * FROM brands ORDER BY name`) });
  if (rest === '/brands' && method === 'POST') {
    requirePerm(user, 'brands', 'create');
    const b = await readJson(req);
    const rows = await query(
      `INSERT INTO brands (name, slug, logo_media_id, description, status, seo) VALUES ($1,$2,$3,$4,$5,$6::jsonb) RETURNING *`,
      [b.name, slugify(b.slug || b.name), b.logo_media_id || null, b.description || '', b.status || 'active', JSON.stringify(b.seo || {})]
    );
    return sendJson(res, 201, { item: rows[0] });
  }
  const brandMatch = rest.match(/^\/brands\/(\d+)$/);
  if (brandMatch && method === 'PUT') {
    requirePerm(user, 'brands', 'edit');
    const b = await readJson(req);
    await query(`UPDATE brands SET name=$2, slug=$3, logo_media_id=$4, description=$5, status=$6, seo=$7::jsonb WHERE id=$1`,
      [brandMatch[1], b.name, slugify(b.slug || b.name), b.logo_media_id || null, b.description || '', b.status || 'active', JSON.stringify(b.seo || {})]);
    return sendJson(res, 200, { item: await queryOne(`SELECT * FROM brands WHERE id = $1`, [brandMatch[1]]) });
  }
  if (brandMatch && method === 'DELETE') {
    requirePerm(user, 'brands', 'delete');
    await query(`DELETE FROM brands WHERE id = $1`, [brandMatch[1]]);
    return sendJson(res, 200, { ok: true });
  }

  if (rest === '/orders' && method === 'GET') {
    const status = qs.status;
    const q = qs.q;
    let sql = `SELECT * FROM orders WHERE 1=1`;
    const params = [];
    if (status) { params.push(status); sql += ` AND status = $${params.length}`; }
    if (q) { params.push('%' + q + '%'); sql += ` AND (order_code ILIKE $${params.length} OR customer_phone ILIKE $${params.length} OR customer_name ILIKE $${params.length})`; }
    sql += ` ORDER BY created_at DESC LIMIT 200`;
    return sendJson(res, 200, { items: await query(sql, params) });
  }
  const orderMatch = rest.match(/^\/orders\/(\d+)$/);
  if (orderMatch && method === 'GET') {
    const order = await queryOne(`SELECT * FROM orders WHERE id = $1`, [orderMatch[1]]);
    if (!order) return sendJson(res, 404, { error: 'Not found' });
    const items = await query(`SELECT * FROM order_items WHERE order_id = $1`, [order.id]);
    const events = await query(`SELECT * FROM order_events WHERE order_id = $1 ORDER BY created_at ASC`, [order.id]);
    return sendJson(res, 200, { item: { ...order, items, events } });
  }
  if (orderMatch && method === 'PATCH') {
    requirePerm(user, 'orders', 'edit');
    const b = await readJson(req);
    const allowed = ['Pending', 'Confirmed', 'Processing', 'Packed', 'Shipped', 'Delivered', 'Cancelled', 'Returned', 'Refunded'];
    if (b.status && !allowed.includes(b.status)) return sendJson(res, 400, { error: 'Invalid status' });
    if (b.status) {
      await query(`UPDATE orders SET status = $2, updated_at = NOW() WHERE id = $1`, [orderMatch[1], b.status]);
      await query(`INSERT INTO order_events (order_id, status, note) VALUES ($1,$2,$3)`, [orderMatch[1], b.status, b.note || 'Status updated']);
      if (b.status === 'Cancelled' || b.status === 'Returned' || b.status === 'Refunded') {
        const lines = await query(`SELECT * FROM order_items WHERE order_id = $1`, [orderMatch[1]]);
        for (const line of lines) {
          if (line.product_id) {
            await query(`UPDATE products SET stock = stock + $1 WHERE id = $2`, [line.qty, line.product_id]);
            await query(`INSERT INTO inventory_movements (product_id, delta, reason, note) VALUES ($1,$2,'restock',$3)`, [line.product_id, line.qty, 'order ' + orderMatch[1]]);
          }
        }
      }
    }
    if (b.notes != null) await query(`UPDATE orders SET notes = $2 WHERE id = $1`, [orderMatch[1], b.notes]);
    return sendJson(res, 200, { item: await queryOne(`SELECT * FROM orders WHERE id = $1`, [orderMatch[1]]) });
  }

  if (rest === '/customers' && method === 'GET') {
    return sendJson(res, 200, { items: await query(`SELECT * FROM customers ORDER BY created_at DESC LIMIT 300`) });
  }
  const custMatch = rest.match(/^\/customers\/(\d+)$/);
  if (custMatch && method === 'GET') {
    const c = await queryOne(`SELECT * FROM customers WHERE id = $1`, [custMatch[1]]);
    if (!c) return sendJson(res, 404, { error: 'Not found' });
    const addresses = await query(`SELECT * FROM customer_addresses WHERE customer_id = $1`, [c.id]);
    const orders = await query(`SELECT * FROM orders WHERE customer_id = $1 ORDER BY created_at DESC`, [c.id]);
    return sendJson(res, 200, { item: { ...c, addresses, orders } });
  }
  if (custMatch && method === 'PATCH') {
    requirePerm(user, 'customers', 'edit');
    const b = await readJson(req);
    await query(`UPDATE customers SET name=COALESCE($2,name), email=COALESCE($3,email), notes=COALESCE($4,notes), customer_group=COALESCE($5,customer_group), status=COALESCE($6,status) WHERE id=$1`,
      [custMatch[1], b.name || null, b.email || null, b.notes || null, b.customer_group || null, b.status || null]);
    return sendJson(res, 200, { item: await queryOne(`SELECT * FROM customers WHERE id = $1`, [custMatch[1]]) });
  }

  if (rest === '/inventory/adjust' && method === 'POST') {
    requirePerm(user, 'inventory', 'adjust');
    const b = await readJson(req);
    const delta = parseInt(b.delta, 10);
    if (!b.product_id || !delta) return sendJson(res, 400, { error: 'product_id and delta required' });
    await query(`UPDATE products SET stock = stock + $2, updated_at = NOW() WHERE id = $1`, [b.product_id, delta]);
    await query(`INSERT INTO inventory_movements (product_id, variant_id, delta, reason, note, user_id) VALUES ($1,$2,$3,$4,$5,$6)`,
      [b.product_id, b.variant_id || null, delta, b.reason || 'adjustment', b.note || '', user.id]);
    return sendJson(res, 200, { item: await queryOne(`SELECT id, title, sku, stock, low_stock FROM products WHERE id = $1`, [b.product_id]) });
  }
  if (rest === '/inventory/history' && method === 'GET') {
    const items = await query(`SELECT m.*, p.title FROM inventory_movements m LEFT JOIN products p ON p.id = m.product_id ORDER BY m.created_at DESC LIMIT 200`);
    return sendJson(res, 200, { items });
  }

  if (rest === '/media' && method === 'GET') {
    const q = qs.q ? '%' + qs.q + '%' : null;
    const items = q
      ? await query(`SELECT * FROM media WHERE title ILIKE $1 OR alt ILIKE $1 OR original_name ILIKE $1 ORDER BY created_at DESC LIMIT 200`, [q])
      : await query(`SELECT * FROM media ORDER BY created_at DESC LIMIT 200`);
    return sendJson(res, 200, { items });
  }
  if (rest === '/media/upload' && method === 'POST') {
    requirePerm(user, 'media', 'create');
    const buf = await readBody(req);
    const item = await processBuffer(buf, {
      filename: req.headers['x-filename'] || 'upload',
      mime: (req.headers['content-type'] || '').split(';')[0],
      alt: req.headers['x-alt'] || '',
      title: req.headers['x-title'] || req.headers['x-filename'] || ''
    });
    return sendJson(res, 201, { item });
  }
  if (rest === '/media/from-url' && method === 'POST') {
    requirePerm(user, 'media', 'create');
    const b = await readJson(req);
    const item = await importFromUrl(b.url, b);
    return sendJson(res, 201, { item });
  }
  const mediaMatch = rest.match(/^\/media\/([^/]+)$/);
  if (mediaMatch && method === 'PATCH') {
    requirePerm(user, 'media', 'edit');
    const b = await readJson(req);
    await query(`UPDATE media SET title=COALESCE($2,title), alt=COALESCE($3,alt), caption=COALESCE($4,caption), description=COALESCE($5,description) WHERE id=$1`,
      [mediaMatch[1], b.title || null, b.alt || null, b.caption || null, b.description || null]);
    return sendJson(res, 200, { item: await queryOne(`SELECT * FROM media WHERE id = $1`, [mediaMatch[1]]) });
  }
  if (mediaMatch && method === 'DELETE') {
    requirePerm(user, 'media', 'delete');
    await query(`DELETE FROM media WHERE id = $1`, [mediaMatch[1]]);
    return sendJson(res, 200, { ok: true });
  }

  if (rest === '/banners' && method === 'GET') return sendJson(res, 200, { items: await query(`SELECT * FROM banners ORDER BY sort_order, id`) });
  if (rest === '/banners' && method === 'POST') {
    requirePerm(user, 'banners', 'edit');
    const b = await readJson(req);
    const rows = await query(
      `INSERT INTO banners (title, subtitle, cta, url, desktop_media_id, mobile_media_id, image_url, start_at, end_at, status, sort_order)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11) RETURNING *`,
      [b.title, b.subtitle || '', b.cta || '', b.url || '', b.desktop_media_id || null, b.mobile_media_id || null, b.image_url || '', b.start_at || null, b.end_at || null, b.status || 'published', b.sort_order || 0]
    );
    return sendJson(res, 201, { item: rows[0] });
  }
  const banMatch = rest.match(/^\/banners\/(\d+)$/);
  if (banMatch && method === 'PUT') {
    requirePerm(user, 'banners', 'edit');
    const b = await readJson(req);
    await query(
      `UPDATE banners SET title=$2, subtitle=$3, cta=$4, url=$5, desktop_media_id=$6, mobile_media_id=$7, image_url=$8, start_at=$9, end_at=$10, status=$11, sort_order=$12 WHERE id=$1`,
      [banMatch[1], b.title, b.subtitle || '', b.cta || '', b.url || '', b.desktop_media_id || null, b.mobile_media_id || null, b.image_url || '', b.start_at || null, b.end_at || null, b.status || 'published', b.sort_order || 0]
    );
    return sendJson(res, 200, { item: await queryOne(`SELECT * FROM banners WHERE id = $1`, [banMatch[1]]) });
  }
  if (banMatch && method === 'DELETE') {
    requirePerm(user, 'banners', 'edit');
    await query(`DELETE FROM banners WHERE id = $1`, [banMatch[1]]);
    return sendJson(res, 200, { ok: true });
  }

  if (rest === '/reels' && method === 'GET') return sendJson(res, 200, { items: await query(`SELECT * FROM reels ORDER BY sort_order`) });
  if (rest === '/reels' && method === 'POST') {
    requirePerm(user, 'banners', 'edit');
    const b = await readJson(req);
    const rows = await query(
      `INSERT INTO reels (title, price, compare_price, code, video_url, thumb_url, product_id, sort_order, status)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING *`,
      [b.title, b.price || 0, b.compare_price || 0, b.code || '', b.video_url || '', b.thumb_url || '', b.product_id || null, b.sort_order || 0, b.status || 'published']
    );
    return sendJson(res, 201, { item: rows[0] });
  }
  const reelMatch = rest.match(/^\/reels\/(\d+)$/);
  if (reelMatch && method === 'PUT') {
    requirePerm(user, 'banners', 'edit');
    const b = await readJson(req);
    await query(`UPDATE reels SET title=$2, price=$3, compare_price=$4, code=$5, video_url=$6, thumb_url=$7, product_id=$8, sort_order=$9, status=$10 WHERE id=$1`,
      [reelMatch[1], b.title, b.price || 0, b.compare_price || 0, b.code || '', b.video_url || '', b.thumb_url || '', b.product_id || null, b.sort_order || 0, b.status || 'published']);
    return sendJson(res, 200, { item: await queryOne(`SELECT * FROM reels WHERE id = $1`, [reelMatch[1]]) });
  }
  if (reelMatch && method === 'DELETE') {
    await query(`DELETE FROM reels WHERE id = $1`, [reelMatch[1]]);
    return sendJson(res, 200, { ok: true });
  }

  if (rest === '/reviews' && method === 'GET') return sendJson(res, 200, { items: await query(`SELECT * FROM reviews ORDER BY created_at DESC`) });
  if (rest === '/reviews' && method === 'POST') {
    requirePerm(user, 'reviews', 'edit');
    const b = await readJson(req);
    const rows = await query(
      `INSERT INTO reviews (product_id, customer_name, rating, title, body, image_url, video_url, verified, featured, status, color)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11) RETURNING *`,
      [b.product_id || null, b.customer_name, b.rating || 5, b.title || '', b.body || '', b.image_url || '', b.video_url || '', !!b.verified, !!b.featured, b.status || 'approved', b.color || '#007382']
    );
    return sendJson(res, 201, { item: rows[0] });
  }
  const revMatch = rest.match(/^\/reviews\/(\d+)$/);
  if (revMatch && method === 'PATCH') {
    requirePerm(user, 'reviews', 'edit');
    const b = await readJson(req);
    await query(`UPDATE reviews SET status=COALESCE($2,status), featured=COALESCE($3,featured), title=COALESCE($4,title), body=COALESCE($5,body) WHERE id=$1`,
      [revMatch[1], b.status || null, b.featured == null ? null : b.featured, b.title || null, b.body || null]);
    return sendJson(res, 200, { item: await queryOne(`SELECT * FROM reviews WHERE id = $1`, [revMatch[1]]) });
  }
  if (revMatch && method === 'DELETE') {
    await query(`DELETE FROM reviews WHERE id = $1`, [revMatch[1]]);
    return sendJson(res, 200, { ok: true });
  }

  if (rest === '/coupons' && method === 'GET') return sendJson(res, 200, { items: await query(`SELECT * FROM coupons ORDER BY id DESC`) });
  if (rest === '/coupons' && method === 'POST') {
    requirePerm(user, 'coupons', 'edit');
    const b = await readJson(req);
    const rows = await query(
      `INSERT INTO coupons (code, type, value, min_order, max_discount, usage_limit, per_customer_limit, first_order_only, free_shipping, starts_at, ends_at, status)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12) RETURNING *`,
      [String(b.code).toUpperCase(), b.type || 'percentage', b.value || 0, b.min_order || 0, b.max_discount || null, b.usage_limit || null, b.per_customer_limit || 1, !!b.first_order_only, !!b.free_shipping, b.starts_at || null, b.ends_at || null, b.status || 'active']
    );
    return sendJson(res, 201, { item: rows[0] });
  }
  const couponMatch = rest.match(/^\/coupons\/(\d+)$/);
  if (couponMatch && method === 'PUT') {
    requirePerm(user, 'coupons', 'edit');
    const b = await readJson(req);
    await query(
      `UPDATE coupons SET code=$2, type=$3, value=$4, min_order=$5, max_discount=$6, usage_limit=$7, per_customer_limit=$8, free_shipping=$9, starts_at=$10, ends_at=$11, status=$12 WHERE id=$1`,
      [couponMatch[1], String(b.code).toUpperCase(), b.type, b.value, b.min_order || 0, b.max_discount || null, b.usage_limit || null, b.per_customer_limit || 1, !!b.free_shipping, b.starts_at || null, b.ends_at || null, b.status || 'active']
    );
    return sendJson(res, 200, { item: await queryOne(`SELECT * FROM coupons WHERE id = $1`, [couponMatch[1]]) });
  }
  if (couponMatch && method === 'DELETE') {
    await query(`DELETE FROM coupons WHERE id = $1`, [couponMatch[1]]);
    return sendJson(res, 200, { ok: true });
  }

  if (rest === '/pages' && method === 'GET') return sendJson(res, 200, { items: await query(`SELECT * FROM pages ORDER BY id`) });
  if (rest === '/pages' && method === 'POST') {
    requirePerm(user, 'pages', 'edit');
    const b = await readJson(req);
    const rows = await query(`INSERT INTO pages (title, slug, type, status, seo) VALUES ($1,$2,$3,'draft',$4::jsonb) RETURNING *`,
      [b.title, slugify(b.slug || b.title), b.type || 'page', JSON.stringify(b.seo || {})]);
    const ver = await query(`INSERT INTO page_versions (page_id, label, sections, created_by) VALUES ($1,'Draft',$2::jsonb,$3) RETURNING *`,
      [rows[0].id, JSON.stringify(b.sections || defaultHomepageSections()), user.id]);
    return sendJson(res, 201, { item: rows[0], version: ver[0] });
  }
  const pageMatch = rest.match(/^\/pages\/(\d+)$/);
  if (pageMatch && method === 'GET') {
    const page = await queryOne(`SELECT * FROM pages WHERE id = $1`, [pageMatch[1]]);
    if (!page) return sendJson(res, 404, { error: 'Not found' });
    const versions = await query(`SELECT id, label, created_at FROM page_versions WHERE page_id = $1 ORDER BY id DESC LIMIT 20`, [page.id]);
    const current = await queryOne(`SELECT * FROM page_versions WHERE id = $1`, [page.published_version_id || versions[0]?.id]);
    const latest = await queryOne(`SELECT * FROM page_versions WHERE page_id = $1 ORDER BY id DESC LIMIT 1`, [page.id]);
    return sendJson(res, 200, { item: page, versions, draft: latest, published: current });
  }
  if (pageMatch && method === 'PUT') {
    requirePerm(user, 'pages', 'edit');
    const b = await readJson(req);
    const ver = await query(
      `INSERT INTO page_versions (page_id, label, sections, created_by) VALUES ($1,$2,$3::jsonb,$4) RETURNING *`,
      [pageMatch[1], b.label || 'Draft', JSON.stringify(b.sections || []), user.id]
    );
    await query(`UPDATE pages SET title=COALESCE($2,title), seo=COALESCE($3::jsonb, seo), updated_at=NOW() WHERE id=$1`,
      [pageMatch[1], b.title || null, b.seo ? JSON.stringify(b.seo) : null]);
    return sendJson(res, 200, { version: ver[0] });
  }
  if (rest.match(/^\/pages\/(\d+)\/publish$/) && method === 'POST') {
    requirePerm(user, 'pages', 'publish');
    const id = rest.match(/^\/pages\/(\d+)/)[1];
    const b = await readJson(req).catch(() => ({}));
    let versionId = b.version_id;
    if (!versionId) {
      const latest = await queryOne(`SELECT id FROM page_versions WHERE page_id = $1 ORDER BY id DESC LIMIT 1`, [id]);
      versionId = latest && latest.id;
    }
    await query(`UPDATE pages SET published_version_id = $2, status = 'published', updated_at = NOW() WHERE id = $1`, [id, versionId]);
    return sendJson(res, 200, { ok: true, published_version_id: versionId });
  }
  if (rest.match(/^\/pages\/(\d+)\/restore$/) && method === 'POST') {
    requirePerm(user, 'pages', 'publish');
    const id = rest.match(/^\/pages\/(\d+)/)[1];
    const b = await readJson(req);
    const src = await queryOne(`SELECT * FROM page_versions WHERE id = $1 AND page_id = $2`, [b.version_id, id]);
    if (!src) return sendJson(res, 404, { error: 'Version not found' });
    const ver = await query(`INSERT INTO page_versions (page_id, label, sections, created_by) VALUES ($1,$2,$3::jsonb,$4) RETURNING *`,
      [id, 'Restore ' + src.id, typeof src.sections === 'string' ? src.sections : JSON.stringify(src.sections), user.id]);
    return sendJson(res, 200, { version: ver[0] });
  }

  if (rest === '/settings' && method === 'GET') {
    const rows = await query(`SELECT key, value FROM settings`);
    const map = {};
    rows.forEach((r) => { map[r.key] = parseJsonb(r.value, {}); });
    return sendJson(res, 200, { settings: map });
  }
  if (rest === '/settings' && method === 'PUT') {
    requirePerm(user, 'settings', 'edit');
    const b = await readJson(req);
    for (const [k, v] of Object.entries(b)) {
      await query(`INSERT INTO settings (key, value) VALUES ($1,$2::jsonb) ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value`, [k, JSON.stringify(v)]);
    }
    return sendJson(res, 200, { ok: true });
  }

  if (rest === '/users' && method === 'GET') {
    requirePerm(user, 'users', 'view');
    const items = await query(`SELECT id, email, name, role, status, created_at FROM users ORDER BY id`);
    return sendJson(res, 200, { items });
  }
  if (rest === '/users' && method === 'POST') {
    requirePerm(user, 'users', 'edit');
    const b = await readJson(req);
    const hash = await hashPassword(b.password || 'ChangeMe@123');
    const rows = await query(`INSERT INTO users (email, name, password_hash, role, status) VALUES ($1,$2,$3,$4,$5) RETURNING id, email, name, role, status`,
      [String(b.email).toLowerCase(), b.name, hash, b.role || 'editor', b.status || 'active']);
    return sendJson(res, 201, { item: rows[0] });
  }
  const userMatch = rest.match(/^\/users\/(\d+)$/);
  if (userMatch && method === 'PATCH') {
    requirePerm(user, 'users', 'edit');
    const b = await readJson(req);
    if (b.password) {
      const hash = await hashPassword(b.password);
      await query(`UPDATE users SET password_hash=$2 WHERE id=$1`, [userMatch[1], hash]);
    }
    await query(`UPDATE users SET name=COALESCE($2,name), role=COALESCE($3,role), status=COALESCE($4,status) WHERE id=$1`,
      [userMatch[1], b.name || null, b.role || null, b.status || null]);
    return sendJson(res, 200, { item: await queryOne(`SELECT id, email, name, role, status FROM users WHERE id = $1`, [userMatch[1]]) });
  }

  if (rest === '/shipping' && method === 'GET') return sendJson(res, 200, { items: await query(`SELECT * FROM shipping_zones ORDER BY id`) });
  if (rest === '/shipping' && method === 'POST') {
    requirePerm(user, 'shipping', 'edit');
    const b = await readJson(req);
    const rows = await query(
      `INSERT INTO shipping_zones (name, cities, flat_rate, free_threshold, cod_charge, eta_days, status)
       VALUES ($1,$2::jsonb,$3,$4,$5,$6,$7) RETURNING *`,
      [b.name, JSON.stringify(b.cities || []), b.flat_rate || 0, b.free_threshold || null, b.cod_charge || 0, b.eta_days || '', b.status || 'active']
    );
    return sendJson(res, 201, { item: rows[0] });
  }
  const shipMatch = rest.match(/^\/shipping\/(\d+)$/);
  if (shipMatch && method === 'PUT') {
    requirePerm(user, 'shipping', 'edit');
    const b = await readJson(req);
    await query(`UPDATE shipping_zones SET name=$2, cities=$3::jsonb, flat_rate=$4, free_threshold=$5, cod_charge=$6, eta_days=$7, status=$8 WHERE id=$1`,
      [shipMatch[1], b.name, JSON.stringify(b.cities || []), b.flat_rate, b.free_threshold, b.cod_charge, b.eta_days, b.status]);
    return sendJson(res, 200, { item: await queryOne(`SELECT * FROM shipping_zones WHERE id = $1`, [shipMatch[1]]) });
  }
  if (shipMatch && method === 'DELETE') {
    await query(`DELETE FROM shipping_zones WHERE id = $1`, [shipMatch[1]]);
    return sendJson(res, 200, { ok: true });
  }

  if (rest === '/redirects' && method === 'GET') return sendJson(res, 200, { items: await query(`SELECT * FROM redirects ORDER BY id DESC`) });
  if (rest === '/redirects' && method === 'POST') {
    requirePerm(user, 'seo', 'edit');
    const b = await readJson(req);
    const rows = await query(`INSERT INTO redirects (from_path, to_path, status_code) VALUES ($1,$2,$3) RETURNING *`, [b.from_path, b.to_path, b.status_code || 301]);
    return sendJson(res, 201, { item: rows[0] });
  }
  const redMatch = rest.match(/^\/redirects\/(\d+)$/);
  if (redMatch && method === 'DELETE') {
    await query(`DELETE FROM redirects WHERE id = $1`, [redMatch[1]]);
    return sendJson(res, 200, { ok: true });
  }

  if (rest === '/forms' && method === 'GET') return sendJson(res, 200, { items: await query(`SELECT * FROM forms ORDER BY id`) });
  if (rest === '/forms/submissions' && method === 'GET') {
    const items = await query(`SELECT s.*, f.name AS form_name FROM form_submissions s JOIN forms f ON f.id = s.form_id ORDER BY s.created_at DESC LIMIT 200`);
    return sendJson(res, 200, { items });
  }

  if (rest === '/popups' && method === 'GET') return sendJson(res, 200, { items: await query(`SELECT * FROM popups ORDER BY id DESC`) });
  if (rest === '/popups' && method === 'POST') {
    requirePerm(user, 'popups', 'edit');
    const b = await readJson(req);
    const rows = await query(`INSERT INTO popups (title, type, content, pages, delay_seconds, status, desktop_only, mobile_only) VALUES ($1,$2,$3::jsonb,$4::jsonb,$5,$6,$7,$8) RETURNING *`,
      [b.title, b.type || 'promo', JSON.stringify(b.content || {}), JSON.stringify(b.pages || []), b.delay_seconds || 0, b.status || 'draft', !!b.desktop_only, !!b.mobile_only]);
    return sendJson(res, 201, { item: rows[0] });
  }
  const popMatch = rest.match(/^\/popups\/(\d+)$/);
  if (popMatch && method === 'PUT') {
    const b = await readJson(req);
    await query(`UPDATE popups SET title=$2, type=$3, content=$4::jsonb, pages=$5::jsonb, delay_seconds=$6, status=$7 WHERE id=$1`,
      [popMatch[1], b.title, b.type, JSON.stringify(b.content || {}), JSON.stringify(b.pages || []), b.delay_seconds || 0, b.status]);
    return sendJson(res, 200, { item: await queryOne(`SELECT * FROM popups WHERE id = $1`, [popMatch[1]]) });
  }
  if (popMatch && method === 'DELETE') {
    await query(`DELETE FROM popups WHERE id = $1`, [popMatch[1]]);
    return sendJson(res, 200, { ok: true });
  }

  return sendJson(res, 404, { error: 'Admin endpoint not found' });
}

async function listAdminProducts(qs) {
  const params = [];
  let sql = `SELECT p.*, m.url AS image_url FROM products p LEFT JOIN media m ON m.id = p.featured_media_id WHERE 1=1`;
  if (qs.status) { params.push(qs.status); sql += ` AND p.status = $${params.length}`; }
  if (qs.q) { params.push('%' + qs.q + '%'); sql += ` AND (p.title ILIKE $${params.length} OR p.sku ILIKE $${params.length})`; }
  sql += ` ORDER BY p.updated_at DESC LIMIT 300`;
  return query(sql, params);
}

async function getAdminProduct(id) {
  const p = await queryOne(`SELECT p.*, m.url AS image_url FROM products p LEFT JOIN media m ON m.id = p.featured_media_id WHERE p.id = $1`, [id]);
  if (!p) return null;
  p.gallery = await query(`SELECT pi.*, m.url, m.variants FROM product_images pi LEFT JOIN media m ON m.id = pi.media_id WHERE pi.product_id = $1 ORDER BY pi.sort_order`, [id]);
  p.variants = await query(`SELECT * FROM product_variants WHERE product_id = $1`, [id]);
  p.seo = parseJsonb(p.seo, {});
  p.specs = parseJsonb(p.specs, {});
  p.video_meta = parseJsonb(p.video_meta, {});
  return p;
}

async function upsertProduct(id, b, user) {
  const slug = slugify(b.slug || b.title);
  const seo = JSON.stringify(b.seo || {});
  const specs = JSON.stringify(b.specs || {});
  const videoMeta = JSON.stringify(b.video_meta || {});
  const related = JSON.stringify(b.related_ids || []);
  const cross = JSON.stringify(b.cross_sell_ids || []);
  const upsell = JSON.stringify(b.upsell_ids || []);
  const vals = [
    b.title, slug, b.sku || b.code || '', b.barcode || '', b.description || '', b.short_description || '',
    b.category_id || b.category || null, b.tab || b.category_id || b.category || null, b.brand_id || null, b.tags || '',
    b.price || 0, b.compare_price || b.originalPrice || null, b.cost_price || null, b.tax_rate || 0,
    b.stock == null ? 0 : b.stock, b.low_stock == null ? 5 : b.low_stock,
    b.weight_grams || null, b.length_cm || null, b.width_cm || null, b.height_cm || null,
    b.status || 'published', !!b.featured, b.badge || '', b.featured_media_id || null, b.video_url || '',
    videoMeta, related, cross, upsell, seo, specs
  ];
  let productId = id;
  if (!id) {
    const rows = await query(
      `INSERT INTO products (
        title, slug, sku, barcode, description, short_description, category_id, tab, brand_id, tags,
        price, compare_price, cost_price, tax_rate, stock, low_stock, weight_grams, length_cm, width_cm, height_cm,
        status, featured, badge, featured_media_id, video_url, video_meta, related_ids, cross_sell_ids, upsell_ids, seo, specs, published_at
      ) VALUES (
        $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,$22,$23,$24,$25,$26::jsonb,$27::jsonb,$28::jsonb,$29::jsonb,$30::jsonb,$31::jsonb,
        CASE WHEN $21 = 'published' THEN NOW() ELSE NULL END
      ) RETURNING *`,
      vals
    );
    productId = rows[0].id;
  } else {
    await query(
      `UPDATE products SET
        title=$2, slug=$3, sku=$4, barcode=$5, description=$6, short_description=$7, category_id=$8, tab=$9, brand_id=$10, tags=$11,
        price=$12, compare_price=$13, cost_price=$14, tax_rate=$15, stock=$16, low_stock=$17, weight_grams=$18, length_cm=$19, width_cm=$20, height_cm=$21,
        status=$22, featured=$23, badge=$24, featured_media_id=$25, video_url=$26, video_meta=$27::jsonb, related_ids=$28::jsonb, cross_sell_ids=$29::jsonb, upsell_ids=$30::jsonb, seo=$31::jsonb, specs=$32::jsonb, updated_at=NOW()
       WHERE id=$1`,
      [id, ...vals]
    );
  }
  if (Array.isArray(b.gallery)) {
    await query(`DELETE FROM product_images WHERE product_id = $1`, [productId]);
    for (let i = 0; i < b.gallery.length; i++) {
      const g = b.gallery[i];
      const mid = typeof g === 'string' ? g : g.media_id;
      if (!mid) continue;
      await query(`INSERT INTO product_images (product_id, media_id, alt, sort_order) VALUES ($1,$2,$3,$4)`, [productId, mid, g.alt || b.title, i]);
    }
  }
  if (Array.isArray(b.variants)) {
    await query(`DELETE FROM product_variants WHERE product_id = $1`, [productId]);
    for (const v of b.variants) {
      await query(
        `INSERT INTO product_variants (product_id, title, sku, barcode, options, price, compare_price, cost_price, stock, weight_grams, media_id, status)
         VALUES ($1,$2,$3,$4,$5::jsonb,$6,$7,$8,$9,$10,$11,$12)`,
        [productId, v.title || '', v.sku || '', v.barcode || '', JSON.stringify(v.options || {}), v.price || null, v.compare_price || null, v.cost_price || null, v.stock || 0, v.weight_grams || null, v.media_id || null, v.status || 'active']
      );
    }
  }
  return getAdminProduct(productId);
}

async function generateSitemap(origin) {
  const products = await query(`SELECT slug, updated_at FROM products WHERE status = 'published'`);
  const cats = await query(`SELECT slug FROM categories WHERE status = 'active'`);
  const pages = await query(`SELECT slug, updated_at FROM pages WHERE status = 'published'`);
  const urls = [
    locXml(origin + '/', '1.0'),
    locXml(origin + '/cart.html', '0.4'),
    locXml(origin + '/track-order.html', '0.4')
  ];
  products.forEach((p) => urls.push(locXml(`${origin}/product-detail.html?id=${encodeURIComponent(p.slug || '')}`, '0.8')));
  cats.forEach((c) => urls.push(locXml(`${origin}/index.html?cat=${c.slug}`, '0.6')));
  pages.filter((p) => p.slug !== 'home').forEach((p) => urls.push(locXml(`${origin}/page.html?slug=${p.slug}`, '0.5')));
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.join('\n')}\n</urlset>`;
}

function locXml(loc, pri) {
  return `<url><loc>${escapeXml(loc)}</loc><changefreq>daily</changefreq><priority>${pri}</priority></url>`;
}
function escapeXml(s) {
  return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

async function generateRobots(origin) {
  return `User-agent: *\nAllow: /\nDisallow: /admin\nDisallow: /admin.html\nDisallow: /api/admin\nSitemap: ${origin}/sitemap.xml\n`;
}

module.exports = { handleApi, boot, generateSitemap, generateRobots, storeBootstrap };
