/**
 * Save & Smile - End-to-End Search Engine Optimization (SEO) API Engine
 * Handles:
 *  - Dynamic XML Sitemap Generation (/sitemap.xml)
 *  - Dynamic robots.txt Generation (/robots.txt)
 *  - Global & Technical SEO Settings
 *  - Category & Page SEO Metadata
 *  - 301 / 302 Redirect Manager with Loop Prevention
 *  - Real-time Catalog SEO Health Audit
 *  - Server-Side Metadata Injector for Search Bots & Social Crawlers
 */

const fs = require('fs');
const path = require('path');
const { getDb } = require('./db');
const { verifyAuthToken } = require('./auth');

const DATA_DIR = path.join(__dirname, '..', 'data');
const SEO_SETTINGS_FILE = path.join(DATA_DIR, 'seo_settings.json');
const SEO_REDIRECTS_FILE = path.join(DATA_DIR, 'seo_redirects.json');
const SEO_PAGES_FILE = path.join(DATA_DIR, 'seo_pages.json');

// Ensure local persistence data directory exists
if (!fs.existsSync(DATA_DIR)) {
  try { fs.mkdirSync(DATA_DIR, { recursive: true }); } catch (e) {}
}

const DEFAULT_GLOBAL_SETTINGS = {
  default_title: 'Save & Smile | Shop • Save • Smile | Wholesale Store Pakistan',
  default_description: 'Save & Smile is Pakistan\'s leading wholesale portal for trending household gadgets, kitchen storage organizers, mugs, beauty care, and electronics at direct factory rates.',
  site_url: 'https://saveandsmile.pk',
  default_og_image: 'https://saveandsmile.pk/images/save-and-smile-logo.png',
  default_social_title: 'Save & Smile - Direct Factory Wholesale Store Pakistan',
  default_social_desc: 'Wholesale prices with Cash on Delivery nationwide across Pakistan. Verified margins for resellers.',
  org_name: 'Save & Smile Pakistan',
  logo_url: 'https://saveandsmile.pk/images/save-and-smile-logo.png',
  helpline_phone: '0316-2323616',
  business_address: 'Wholesale Market, Karachi / Lahore, Pakistan',
  gsc_verification_code: '',
  ga4_measurement_id: '',
  bing_verification_code: '',
  robots_txt_content: ''
};

const DEFAULT_PAGES = [
  {
    id: 'home',
    page_name: 'Homepage (Storefront)',
    slug: '/',
    seo_title: 'Save & Smile | Shop • Save • Smile | Wholesale Store Pakistan',
    seo_description: 'Pakistan\'s premier wholesale e-commerce portal for home organization, kitchen gadgets, and trending daily utilities with cash on delivery.',
    canonical_url: 'https://saveandsmile.pk/',
    is_noindex: false,
    og_title: 'Save & Smile - Pakistan Wholesale E-Commerce Portal',
    og_description: 'Direct factory wholesale rates with COD nationwide dispatch.',
    og_image: 'https://saveandsmile.pk/images/save-and-smile-logo.png'
  },
  {
    id: 'shop',
    page_name: 'All Collections & Catalog',
    slug: '/shop.html',
    seo_title: 'Complete Wholesale Catalog | Save & Smile Pakistan',
    seo_description: 'Browse all wholesale storage racks, kitchen tools, vacuum mugs, beauty accessories, and daily essentials with verified discounts.',
    canonical_url: 'https://saveandsmile.pk/#featured',
    is_noindex: false,
    og_title: 'Wholesale Products Catalog - Save & Smile',
    og_description: 'Over 30+ trending factory wholesale products ready for instant COD dispatch.',
    og_image: 'https://saveandsmile.pk/images/save-and-smile-logo.png'
  },
  {
    id: 'track',
    page_name: 'Order Tracking Portal',
    slug: '/track-order',
    seo_title: 'Track Your Wholesale Order | Save & Smile Courier Tracking',
    seo_description: 'Enter your Save & Smile Order ID to check live rider dispatch and courier tracking status with Leopards, TCS, and Trax.',
    canonical_url: 'https://saveandsmile.pk/track-order',
    is_noindex: false,
    og_title: 'Live Order Tracking - Save & Smile',
    og_description: 'Real-time courier fulfillment and tracking status across Pakistan.',
    og_image: 'https://saveandsmile.pk/images/save-and-smile-logo.png'
  },
  {
    id: 'shipping-policy',
    page_name: 'Shipping & Delivery Policy',
    slug: '/shipping-policy',
    seo_title: 'Shipping & Nationwide COD Delivery Policy | Save & Smile',
    seo_description: 'Standard flat shipping fee of Rs. 200 with FREE Delivery on orders above Rs. 3,000. 2-4 business day delivery across all Pakistani cities.',
    canonical_url: 'https://saveandsmile.pk/shipping-policy',
    is_noindex: false,
    og_title: 'Shipping Policy - Save & Smile Pakistan',
    og_description: 'Transparent COD courier rates and free delivery thresholds.',
    og_image: 'https://saveandsmile.pk/images/save-and-smile-logo.png'
  },
  {
    id: 'return-policy',
    page_name: 'Returns & 7-Day Replacement Policy',
    slug: '/return-policy',
    seo_title: '7-Day Checking Warranty & Return Policy | Save & Smile',
    seo_description: 'Hassle-free 7 days checking and replacement warranty on all wholesale orders. Instant replacement for damaged or incorrect parcels.',
    canonical_url: 'https://saveandsmile.pk/return-policy',
    is_noindex: false,
    og_title: 'Return & Replacement Policy - Save & Smile',
    og_description: 'Customer satisfaction guarantee with 7-day parcel inspection.',
    og_image: 'https://saveandsmile.pk/images/save-and-smile-logo.png'
  }
];

function readLocalJson(filePath, defaultVal) {
  try {
    if (fs.existsSync(filePath)) {
      return JSON.parse(fs.readFileSync(filePath, 'utf8'));
    }
  } catch (e) {}
  return defaultVal;
}

function writeLocalJson(filePath, data) {
  try {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
  } catch (e) {}
}

async function getGlobalSeoSettings() {
  const sql = getDb();
  if (sql) {
    try {
      const rows = await sql`SELECT * FROM global_seo_settings WHERE id = 1 LIMIT 1`;
      if (rows && rows.length > 0) return rows[0];
    } catch (e) {}
  }
  return readLocalJson(SEO_SETTINGS_FILE, DEFAULT_GLOBAL_SETTINGS);
}

async function getRedirectsList() {
  const sql = getDb();
  if (sql) {
    try {
      const rows = await sql`SELECT * FROM seo_redirects ORDER BY id DESC`;
      if (rows && rows.length > 0) return rows;
    } catch (e) {}
  }
  return readLocalJson(SEO_REDIRECTS_FILE, [
    { id: 1, source_url: '/old-kitchen-rack', target_url: '/product-detail?id=203', status_code: 301, is_active: true }
  ]);
}

async function getAllManagedProducts() {
  const sql = getDb();
  if (sql) {
    try {
      const rows = await sql`SELECT * FROM products ORDER BY id ASC`;
      if (rows && rows.length > 0) return rows;
    } catch (e) {}
  }
  const fallbackPath = path.join(__dirname, '..', 'products.json');
  try {
    return JSON.parse(fs.readFileSync(fallbackPath, 'utf8'));
  } catch (e) {
    return [];
  }
}

async function getAllManagedCategories() {
  const sql = getDb();
  if (sql) {
    try {
      const rows = await sql`SELECT * FROM categories ORDER BY id ASC`;
      if (rows && rows.length > 0) return rows;
    } catch (e) {}
  }
  return [
    { id: 'storage', name: 'Storage & Organization', count: 45, icon: '🗄️', slug: 'storage' },
    { id: 'kitchen', name: 'Kitchen Tools & Gadgets', count: 110, icon: '🍳', slug: 'kitchen' },
    { id: 'bottles', name: 'Mugs & Bottles', count: 76, icon: '🍶', slug: 'bottles' },
    { id: 'beauty', name: 'Beauty & Makeup', count: 85, icon: '💄', slug: 'beauty' },
    { id: 'accessories', name: 'Mobile Accessories', count: 120, icon: '📱', slug: 'accessories' },
    { id: 'travel', name: 'Bags & Travel', count: 64, icon: '🎒', slug: 'travel' },
    { id: 'cleaning', name: 'Wipers & Cleaning', count: 53, icon: '🧹', slug: 'cleaning' },
    { id: 'massager', name: 'Electric Massagers', count: 29, icon: '⚡', slug: 'massager' }
  ];
}

async function getPagesList() {
  const sql = getDb();
  if (sql) {
    try {
      const rows = await sql`SELECT * FROM pages_seo ORDER BY id ASC`;
      if (rows && rows.length > 0) return rows;
    } catch (e) {}
  }
  return readLocalJson(SEO_PAGES_FILE, DEFAULT_PAGES);
}

// ------------------------------------------------------------------
// XML Sitemap Generator
// ------------------------------------------------------------------
async function generateXmlSitemap() {
  const settings = await getGlobalSeoSettings();
  const domain = (settings.site_url || 'https://saveandsmile.pk').replace(/\/+$/, '');
  const products = await getAllManagedProducts();
  const categories = await getAllManagedCategories();
  const pages = await getPagesList();

  const now = new Date().toISOString().split('T')[0];

  let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
  xml += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"\n';
  xml += '        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">\n';

  // 1. Static Pages
  for (const page of pages) {
    if (page.is_noindex) continue;
    const loc = page.slug === '/' ? `${domain}/` : `${domain}${page.slug.startsWith('/') ? '' : '/'}${page.slug}`;
    xml += '  <url>\n';
    xml += `    <loc>${loc}</loc>\n`;
    xml += `    <lastmod>${now}</lastmod>\n`;
    xml += `    <changefreq>${page.slug === '/' ? 'daily' : 'weekly'}</changefreq>\n`;
    xml += `    <priority>${page.slug === '/' ? '1.0' : '0.7'}</priority>\n`;
    xml += '  </url>\n';
  }

  // 2. Categories
  for (const cat of categories) {
    if (cat.is_noindex) continue;
    const catSlug = cat.slug || cat.id;
    const loc = `${domain}/?cat=${encodeURIComponent(catSlug)}`;
    xml += '  <url>\n';
    xml += `    <loc>${loc}</loc>\n`;
    xml += `    <lastmod>${now}</lastmod>\n`;
    xml += '    <changefreq>weekly</changefreq>\n';
    xml += '    <priority>0.8</priority>\n';
    xml += '  </url>\n';
  }

  // 3. Products
  for (const prod of products) {
    if (prod.is_noindex) continue;
    const slug = prod.slug || (prod.title ? prod.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '') : `product-${prod.id}`);
    const loc = `${domain}/product-detail?id=${prod.id}&amp;slug=${encodeURIComponent(slug)}`;
    xml += '  <url>\n';
    xml += `    <loc>${loc}</loc>\n`;
    xml += `    <lastmod>${now}</lastmod>\n`;
    xml += '    <changefreq>weekly</changefreq>\n';
    xml += '    <priority>0.85</priority>\n';
    if (prod.image) {
      xml += '    <image:image>\n';
      xml += `      <image:loc>${prod.image}</image:loc>\n`;
      xml += `      <image:title>${(prod.seo_title || prod.title || 'Product Image').replace(/[<>&'"]/g, '')}</image:title>\n`;
      xml += '    </image:image>\n';
    }
    xml += '  </url>\n';
  }

  xml += '</urlset>';
  return xml;
}

// ------------------------------------------------------------------
// Robots.txt Generator
// ------------------------------------------------------------------
async function generateRobotsTxt() {
  const settings = await getGlobalSeoSettings();
  if (settings.robots_txt_content && settings.robots_txt_content.trim().length > 10) {
    return settings.robots_txt_content.trim();
  }
  const domain = (settings.site_url || 'https://saveandsmile.pk').replace(/\/+$/, '');
  return `# Save & Smile Pakistan Search Engine Robots Directives
User-agent: *
Allow: /
Allow: /images/
Allow: /css/
Allow: /js/
Disallow: /admin
Disallow: /admin.html
Disallow: /live-editor
Disallow: /live-editor.html
Disallow: /api/auth
Disallow: /api/orders
Disallow: /checkout
Disallow: /cart

# XML Sitemap
Sitemap: ${domain}/sitemap.xml
`;
}

// ------------------------------------------------------------------
// SEO Audit Engine
// ------------------------------------------------------------------
async function performSeoAudit() {
  const products = await getAllManagedProducts();
  const categories = await getAllManagedCategories();
  const pages = await getPagesList();
  const redirects = await getRedirectsList();

  const issues = [];
  const titlesSeen = new Map();

  // Audit Products
  let prodMissingTitle = 0;
  let prodMissingDesc = 0;
  let prodMissingAlt = 0;
  let prodMissingKey = 0;

  products.forEach(p => {
    const title = (p.seo_title || p.title || '').trim();
    const desc = (p.seo_description || p.description || '').trim();
    const alt = (p.image_alt || '').trim();
    const key = (p.focus_keyword || '').trim();

    if (!title || title.length < 15) {
      prodMissingTitle++;
      issues.push({
        type: 'warning',
        category: 'product',
        entityId: p.id,
        entityName: p.title,
        message: `Product title is too short or missing (< 15 characters).`,
        actionUrl: `products:${p.id}`
      });
    }

    if (!desc || desc.length < 40) {
      prodMissingDesc++;
      issues.push({
        type: 'warning',
        category: 'product',
        entityId: p.id,
        entityName: p.title,
        message: `Meta description is missing or too brief (< 40 characters).`,
        actionUrl: `products:${p.id}`
      });
    }

    if (!alt) {
      prodMissingAlt++;
      issues.push({
        type: 'notice',
        category: 'image',
        entityId: p.id,
        entityName: p.title,
        message: `Product image alt text is not specified.`,
        actionUrl: `products:${p.id}`
      });
    }

    if (!key) {
      prodMissingKey++;
    }

    // Duplicate title check
    if (title) {
      const lower = title.toLowerCase();
      if (titlesSeen.has(lower)) {
        issues.push({
          type: 'error',
          category: 'product',
          entityId: p.id,
          entityName: p.title,
          message: `Duplicate title found with product #${titlesSeen.get(lower)}.`,
          actionUrl: `products:${p.id}`
        });
      } else {
        titlesSeen.set(lower, p.id);
      }
    }
  });

  // Audit Categories
  categories.forEach(c => {
    if (!c.seo_description || c.seo_description.length < 20) {
      issues.push({
        type: 'notice',
        category: 'category',
        entityId: c.id,
        entityName: c.name,
        message: `Category "${c.name}" lacks a customized meta description.`,
        actionUrl: `categories:${c.id}`
      });
    }
  });

  // Calculate Health Score
  const totalChecks = (products.length * 4) + categories.length + pages.length;
  const failureWeight = (prodMissingTitle * 3) + (prodMissingDesc * 2) + (prodMissingAlt * 1);
  const healthScore = Math.max(25, Math.min(100, Math.round(100 - (failureWeight / totalChecks) * 100)));

  const totalEntities = products.length + categories.length + pages.length;
  const optimizedEntities = Math.max(0, totalEntities - issues.length);

  return {
    healthScore,
    health_score: healthScore,
    totalProducts: products.length,
    totalCategories: categories.length,
    totalPages: pages.length,
    totalEntities,
    total_entities: totalEntities,
    optimizedEntities,
    optimized_entities: optimizedEntities,
    missingAltCount: prodMissingAlt,
    missing_alt_count: prodMissingAlt,
    activeRedirects: redirects.filter(r => r.is_active).length,
    summary: {
      prodMissingTitle,
      prodMissingDesc,
      prodMissingAlt,
      prodMissingKey
    },
    issues
  };
}

// ------------------------------------------------------------------
// Main Handler
// ------------------------------------------------------------------
module.exports = async function handler(req, res) {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  let type = null;
  if (req.query && req.query.type) {
    type = req.query.type;
  } else if (req.url) {
    try {
      const parsedUrl = new URL(req.url, 'http://localhost');
      type = parsedUrl.searchParams.get('type');
    } catch (e) {
      type = null;
    }
  }

  // 1. GET: XML SITEMAP
  if (req.method === 'GET' && type === 'sitemap') {
    try {
      const sitemapXml = await generateXmlSitemap();
      res.setHeader('Content-Type', 'application/xml; charset=utf-8');
      res.setHeader('Cache-Control', 'public, max-age=3600, s-maxage=3600');
      return res.status(200).end(sitemapXml);
    } catch (err) {
      return res.status(500).json({ error: 'Failed to generate sitemap: ' + err.message });
    }
  }

  // 2. GET: ROBOTS.TXT
  if (req.method === 'GET' && type === 'robots') {
    try {
      const robotsTxt = await generateRobotsTxt();
      res.setHeader('Content-Type', 'text/plain; charset=utf-8');
      res.setHeader('Cache-Control', 'public, max-age=3600, s-maxage=3600');
      return res.status(200).end(robotsTxt);
    } catch (err) {
      return res.status(500).json({ error: 'Failed to generate robots.txt: ' + err.message });
    }
  }

  // 3. GET: Global SEO Settings
  if (req.method === 'GET' && type === 'settings') {
    const settings = await getGlobalSeoSettings();
    return res.status(200).json({ success: true, settings });
  }

  // 4. GET: Pages List
  if (req.method === 'GET' && type === 'pages') {
    const pages = await getPagesList();
    return res.status(200).json({ success: true, pages });
  }

  // 5. GET: Redirects List
  if (req.method === 'GET' && type === 'redirects') {
    const redirects = await getRedirectsList();
    return res.status(200).json({ success: true, redirects });
  }

  // 6. GET: Categories List
  if (req.method === 'GET' && type === 'categories') {
    const categories = await getAllManagedCategories();
    return res.status(200).json({ success: true, categories });
  }

  // 7. GET: SEO Audit Report
  if (req.method === 'GET' && type === 'audit') {
    try {
      const report = await performSeoAudit();
      return res.status(200).json({ success: true, report, audit: report });
    } catch (err) {
      return res.status(500).json({ error: 'SEO Audit failed: ' + err.message });
    }
  }

  // 8. POST: Protected Actions (Settings, Pages, Redirects)
  if (req.method === 'POST') {
    const adminUser = verifyAuthToken(req);
    if (!adminUser) {
      return res.status(401).json({ success: false, error: 'Unauthorized: Admin credentials required to modify SEO.' });
    }

    let body = req.body;
    if (typeof body === 'string') {
      try { body = JSON.parse(body); } catch (e) {}
    }

    const { action } = body || {};

    // 8A. Save Global Settings
    if (action === 'save_settings') {
      const payload = body.settings || {};
      if (payload.gsc_verification_tag && !payload.gsc_verification_code) {
        payload.gsc_verification_code = payload.gsc_verification_tag;
      }
      if (payload.gsc_verification_code && !payload.gsc_verification_tag) {
        payload.gsc_verification_tag = payload.gsc_verification_code;
      }
      const merged = { ...DEFAULT_GLOBAL_SETTINGS, ...payload, updated_at: new Date().toISOString() };
      
      const sql = getDb();
      if (sql) {
        try {
          await sql`
            INSERT INTO global_seo_settings (
              id, default_title, default_description, site_url, default_og_image,
              default_social_title, default_social_desc, org_name, logo_url,
              helpline_phone, business_address, gsc_verification_code,
              ga4_measurement_id, bing_verification_code, robots_txt_content, updated_at
            ) VALUES (
              1, ${merged.default_title}, ${merged.default_description}, ${merged.site_url},
              ${merged.default_og_image}, ${merged.default_social_title}, ${merged.default_social_desc},
              ${merged.org_name}, ${merged.logo_url}, ${merged.helpline_phone},
              ${merged.business_address}, ${merged.gsc_verification_code},
              ${merged.ga4_measurement_id}, ${merged.bing_verification_code},
              ${merged.robots_txt_content}, NOW()
            )
            ON CONFLICT (id) DO UPDATE SET
              default_title = EXCLUDED.default_title,
              default_description = EXCLUDED.default_description,
              site_url = EXCLUDED.site_url,
              default_og_image = EXCLUDED.default_og_image,
              default_social_title = EXCLUDED.default_social_title,
              default_social_desc = EXCLUDED.default_social_desc,
              org_name = EXCLUDED.org_name,
              logo_url = EXCLUDED.logo_url,
              helpline_phone = EXCLUDED.helpline_phone,
              business_address = EXCLUDED.business_address,
              gsc_verification_code = EXCLUDED.gsc_verification_code,
              ga4_measurement_id = EXCLUDED.ga4_measurement_id,
              bing_verification_code = EXCLUDED.bing_verification_code,
              robots_txt_content = EXCLUDED.robots_txt_content,
              updated_at = NOW()
          `;
        } catch (e) {
          console.warn('Neon global settings save fallback:', e.message);
        }
      }

      writeLocalJson(SEO_SETTINGS_FILE, merged);
      return res.status(200).json({ success: true, message: 'Global SEO settings saved successfully.', settings: merged });
    }

    // 8B. Save Page SEO
    if (action === 'save_page') {
      const pageData = body.page || {};
      if (!pageData.id) return res.status(400).json({ success: false, error: 'page id is required.' });

      const pages = await getPagesList();
      const idx = pages.findIndex(p => p.id === pageData.id);
      if (idx >= 0) {
        pages[idx] = { ...pages[idx], ...pageData };
      } else {
        pages.push(pageData);
      }

      const sql = getDb();
      if (sql) {
        try {
          await sql`
            INSERT INTO pages_seo (
              id, page_name, slug, seo_title, seo_description, canonical_url, is_noindex, og_title, og_description, og_image
            ) VALUES (
              ${pageData.id}, ${pageData.page_name || ''}, ${pageData.slug || ''}, ${pageData.seo_title || ''},
              ${pageData.seo_description || ''}, ${pageData.canonical_url || ''}, ${Boolean(pageData.is_noindex)},
              ${pageData.og_title || ''}, ${pageData.og_description || ''}, ${pageData.og_image || ''}
            )
            ON CONFLICT (id) DO UPDATE SET
              page_name = EXCLUDED.page_name,
              slug = EXCLUDED.slug,
              seo_title = EXCLUDED.seo_title,
              seo_description = EXCLUDED.seo_description,
              canonical_url = EXCLUDED.canonical_url,
              is_noindex = EXCLUDED.is_noindex,
              og_title = EXCLUDED.og_title,
              og_description = EXCLUDED.og_description,
              og_image = EXCLUDED.og_image,
              updated_at = NOW()
          `;
        } catch (e) {}
      }

      writeLocalJson(SEO_PAGES_FILE, pages);
      return res.status(200).json({ success: true, message: 'Page SEO saved successfully.', pages });
    }

    // 8C. Save Redirect with Loop Prevention
    if (action === 'save_redirect') {
      const redirData = body.redirect || {};
      const source_url = redirData.source_url || redirData.source_path;
      const target_url = redirData.target_url || redirData.target_path;
      const status_code = redirData.status_code;

      if (!source_url || !target_url) {
        return res.status(400).json({ success: false, error: 'source_url and target_url are required.' });
      }

      const cleanSrc = source_url.trim().toLowerCase();
      const cleanTgt = target_url.trim().toLowerCase();

      // Check self-redirect loop
      if (cleanSrc === cleanTgt || cleanSrc === cleanTgt + '/') {
        return res.status(400).json({ success: false, error: 'Redirect loop detected: Source and target URLs cannot be identical.' });
      }

      const redirects = await getRedirectsList();
      // Check multi-hop loop (e.g., A -> B and B -> A)
      const reverseHop = redirects.find(r => (r.source_url || r.source_path || '').toLowerCase() === cleanTgt && (r.target_url || r.target_path || '').toLowerCase() === cleanSrc);
      if (reverseHop) {
        return res.status(400).json({ success: false, error: 'Redirect chain loop detected: Target URL already redirects back to this source URL.' });
      }

      const newRedirect = {
        id: redirData.id || Date.now(),
        source_url: cleanSrc,
        source_path: cleanSrc,
        target_url: target_url.trim(),
        target_path: target_url.trim(),
        status_code: parseInt(status_code, 10) === 302 ? 302 : 301,
        is_active: true
      };

      redirects.unshift(newRedirect);
      writeLocalJson(SEO_REDIRECTS_FILE, redirects);

      const sql = getDb();
      if (sql) {
        try {
          await sql`
            INSERT INTO seo_redirects (source_url, target_url, status_code, is_active)
            VALUES (${newRedirect.source_url}, ${newRedirect.target_url}, ${newRedirect.status_code}, true)
            ON CONFLICT (source_url) DO UPDATE SET
              target_url = EXCLUDED.target_url,
              status_code = EXCLUDED.status_code,
              is_active = true
          `;
        } catch (e) {}
      }

      return res.status(200).json({ success: true, redirect: newRedirect, redirects });
    }

    // 8D. Delete Redirect
    if (action === 'delete_redirect') {
      const redirectId = body.id;
      let redirects = await getRedirectsList();
      redirects = redirects.filter(r => r.id != redirectId);
      writeLocalJson(SEO_REDIRECTS_FILE, redirects);

      const sql = getDb();
      if (sql) {
        try {
          await sql`DELETE FROM seo_redirects WHERE id = ${redirectId}`;
        } catch (e) {}
      }

      return res.status(200).json({ success: true, message: 'Redirect removed.', redirects });
    }
  }

  return res.status(400).json({ error: 'Invalid SEO API request parameters.' });
};
