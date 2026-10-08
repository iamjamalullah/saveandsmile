const { query, queryOne } = require('./db');
const { hashPassword } = require('./auth');
const { slugify } = require('./http');
const { defaultHomepageSections } = require('./map-store');

async function seedIfNeeded() {
  const users = await queryOne(`SELECT COUNT(*)::int AS n FROM users`);
  if (!users || users.n === 0) {
    const email = (process.env.ADMIN_EMAIL || 'admin@saveandsmile.pk').toLowerCase();
    const password = process.env.ADMIN_PASSWORD || 'Admin@12345';
    const hash = await hashPassword(password);
    await query(
      `INSERT INTO users (email, name, password_hash, role, status) VALUES ($1,$2,$3,'super_admin','active')`,
      [email, 'Store Owner', hash]
    );
    console.log(`🔐 Admin bootstrap: ${email} / ${process.env.ADMIN_PASSWORD ? '(from ADMIN_PASSWORD)' : 'Admin@12345 — change this'}`);
  }

  const catN = await queryOne(`SELECT COUNT(*)::int AS n FROM categories`);
  if (catN && catN.n > 0) {
    const pageN = await queryOne(`SELECT COUNT(*)::int AS n FROM pages`);
    if (!pageN || pageN.n === 0) await seedHomePage();
    const setN = await queryOne(`SELECT COUNT(*)::int AS n FROM settings`);
    if (!setN || setN.n === 0) await seedSettings();
    return;
  }

  let catalog;
  try {
    catalog = require('../js/products-data');
  } catch (e) {
    console.warn('Catalog seed skipped:', e.message);
    return;
  }

  const { STORE_CONFIG, BANNERS, CATEGORIES, PRODUCTS, REELS_DATA, REVIEWS_DATA } = catalog;

  for (let i = 0; i < CATEGORIES.length; i++) {
    const c = CATEGORIES[i];
    await query(
      `INSERT INTO categories (id, name, slug, icon, sort_order, status)
       VALUES ($1,$2,$3,$4,$5,'active')
       ON CONFLICT (id) DO NOTHING`,
      [c.id, c.name, c.id, c.icon || '', i]
    );
  }
  await query(
    `INSERT INTO categories (id, name, slug, sort_order, status) VALUES
     ('jewelry','Jewelry & Accessories','jewelry', 20,'active'),
     ('travel','Bags & Travel','travel', 21,'active')
     ON CONFLICT (id) DO NOTHING`
  );

  for (const p of PRODUCTS) {
    const slug = slugify(p.title) + '-' + p.id;
    const mediaId = await urlMedia(p.image, p.title);
    await query(
      `INSERT INTO products (
         id, title, slug, sku, description, category_id, tab, price, compare_price, stock,
         status, badge, rating, reviews_count, featured_media_id, featured, published_at
       ) VALUES (
         $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,'published',$11,$12,$13,$14,$15, NOW()
       ) ON CONFLICT (id) DO NOTHING`,
      [
        p.id, p.title, slug, p.code || '', p.description || '', p.category, p.tab || p.category,
        p.price, p.originalPrice || null, p.stock || 0, p.badge || '', p.rating || 4.8,
        p.reviews || 0, mediaId, Boolean(p.isFlashSale)
      ]
    );
    if (mediaId) {
      await query(
        `INSERT INTO product_images (product_id, media_id, alt, sort_order) VALUES ($1,$2,$3,0)`,
        [p.id, mediaId, p.title]
      );
    }
  }
  await query(`SELECT setval('products_id_seq', COALESCE((SELECT MAX(id) FROM products), 1))`);

  for (let i = 0; i < BANNERS.length; i++) {
    const b = BANNERS[i];
    const mid = await urlMedia(b.image, b.title);
    await query(
      `INSERT INTO banners (title, subtitle, url, desktop_media_id, image_url, status, sort_order)
       VALUES ($1,$2,$3,$4,$5,'published',$6)`,
      [b.title, b.subtitle || '', b.link || '#products', mid, b.image, i]
    );
  }

  for (let i = 0; i < REELS_DATA.length; i++) {
    const r = REELS_DATA[i];
    await query(
      `INSERT INTO reels (title, price, compare_price, code, video_url, thumb_url, sort_order, status)
       VALUES ($1,$2,$3,$4,$5,$6,$7,'published')`,
      [r.title, r.price, r.originalPrice, r.code, r.video, r.thumb, i]
    );
  }

  for (const rv of REVIEWS_DATA) {
    await query(
      `INSERT INTO reviews (customer_name, rating, title, body, featured, status, color, created_at)
       VALUES ($1,$2,$3,$4,true,'approved',$5, NOW())`,
      [rv.name, rv.stars || 5, rv.title, rv.text, rv.color || '#007382']
    );
  }

  await query(
    `INSERT INTO shipping_zones (name, cities, flat_rate, free_threshold, eta_days, status)
     VALUES ('Pakistan Nationwide', '["Karachi","Lahore","Islamabad","Rawalpindi","Faisalabad","Multan","Peshawar","Quetta"]'::jsonb, $1, $2, '2-5 days', 'active')`,
    [STORE_CONFIG.shippingFee || 200, STORE_CONFIG.freeShippingThreshold || 3000]
  );

  await query(
    `INSERT INTO forms (name, slug, fields, status) VALUES (
      'Contact', 'contact',
      '[{"name":"name","label":"Name","type":"text","required":true},{"name":"phone","label":"Phone","type":"phone","required":true},{"name":"message","label":"Message","type":"textarea","required":true}]'::jsonb,
      'active'
    ) ON CONFLICT (slug) DO NOTHING`
  );

  await seedHomePage();
  await seedSettings(STORE_CONFIG);
}

async function urlMedia(url, title) {
  if (!url) return null;
  const existing = await queryOne(`SELECT id FROM media WHERE url = $1 LIMIT 1`, [url]);
  if (existing) return existing.id;
  const id = require('crypto').randomUUID();
  await query(
    `INSERT INTO media (id, title, alt, url, variants, source, mime)
     VALUES ($1,$2,$3,$4,$5::jsonb,'url','image/jpeg')`,
    [id, title || url, title || '', url, JSON.stringify({ original: url, medium: url })]
  );
  return id;
}

async function seedHomePage() {
  const existing = await queryOne(`SELECT id FROM pages WHERE slug = 'home'`);
  if (existing) return;
  const ins = await query(
    `INSERT INTO pages (title, slug, type, status, seo) VALUES ('Homepage','home','homepage','published', '{}'::jsonb) RETURNING id`
  );
  const pageId = ins[0].id;
  const ver = await query(
    `INSERT INTO page_versions (page_id, label, sections) VALUES ($1,'Initial live layout',$2::jsonb) RETURNING id`,
    [pageId, JSON.stringify(defaultHomepageSections())]
  );
  await query(`UPDATE pages SET published_version_id = $1, status = 'published' WHERE id = $2`, [ver[0].id, pageId]);
}

async function seedSettings(cfg = {}) {
  const value = {
    name: cfg.name || 'Save & Smile',
    tagline: cfg.tagline || 'Shop • Save • Smile | Wholesale Gadgets in Pakistan',
    phone: cfg.phone || '0316-2323616',
    whatsapp: cfg.whatsapp || '923162323616',
    email: cfg.email || 'info@saveandsmile.pk',
    logo: cfg.logo || 'images/save-and-smile-logo.png',
    address: cfg.address || 'Wholesale Market, Karachi / Lahore, Pakistan',
    currency: cfg.currency || 'Rs.',
    freeShippingThreshold: cfg.freeShippingThreshold || 3000,
    shippingFee: cfg.shippingFee || 200,
    payments: { COD: true, JazzCash: true, EasyPaisa: true, BankTransfer: false, Card: false },
    whatsappTemplates: {
      product: 'Salam {store}! I want to buy *{title}* in wholesale bulk quantity.',
      order: 'Salam {store}! I want to confirm my wholesale order.'
    }
  };
  await query(`INSERT INTO settings (key, value) VALUES ('store', $1::jsonb) ON CONFLICT (key) DO NOTHING`, [JSON.stringify(value)]);
  await query(
    `INSERT INTO settings (key, value) VALUES ('seo', $2::jsonb) ON CONFLICT (key) DO NOTHING`,
    [null, JSON.stringify({
      metaTitle: 'Save & Smile | Shop • Save • Smile | Wholesale Store Pakistan',
      metaDescription: "Save & Smile is Pakistan's leading wholesale portal for trending gadgets, kitchen organizers, smart watches and electronics at direct factory rates.",
      robots: 'index,follow',
      ogImage: value.logo
    })]
  );
  await query(
    `INSERT INTO settings (key, value) VALUES ('theme', $1::jsonb) ON CONFLICT (key) DO NOTHING`,
    [JSON.stringify({ theme: 'green' })]
  );
}

module.exports = { seedIfNeeded };
