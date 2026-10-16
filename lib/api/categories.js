const fs = require('fs');
const path = require('path');
const { getDb, getSetting, saveSetting } = require('./db');
const { verifyAuthToken } = require('./auth');
const { setCorsHeaders } = require('./cors');

const DATA_DIR = path.join(process.cwd(), 'data');
const CATEGORIES_FILE = path.join(DATA_DIR, 'categories.json');

const DEFAULT_CATEGORIES = [
  { id: 'storage', name: 'Storage & Racks', slug: 'storage', description: 'Kitchen, bathroom, and home organizers', parentId: null, status: 'active', imageUrl: 'https://www.qadrigadgets.pk/images/categories/ico_6a74c8298306c.png', sortOrder: 1 },
  { id: 'gadgets', name: 'Household Gadgets', slug: 'gadgets', description: 'Electric insect killers, rechargeable lamps, daily utilities', parentId: null, status: 'active', imageUrl: 'https://www.qadrigadgets.pk/images/categories/ico_6a74c83e20ec6.png', sortOrder: 2 },
  { id: 'mugs', name: 'Mugs & Sippers', slug: 'mugs', description: 'Stainless steel vacuum bottles and temperature flasks', parentId: null, status: 'active', imageUrl: 'https://www.qadrigadgets.pk/images/categories/ico_6a74c87140f7f.png', sortOrder: 3 },
  { id: 'beauty', name: 'Beauty & Personal Care', slug: 'beauty', description: 'Electric facial tools, trimmers, wellness gadgets', parentId: null, status: 'active', imageUrl: 'https://www.qadrigadgets.pk/images/categories/ico_6a74c8856ae3d.png', sortOrder: 4 },
  { id: 'electronics', name: 'Electronics & Mobiles', slug: 'electronics', description: 'Earbuds, smart watches, chargers, cables', parentId: null, status: 'active', imageUrl: 'https://www.qadrigadgets.pk/images/categories/ico_6a74c897f26f6.png', sortOrder: 5 },
  { id: 'toys', name: 'Toys & Kids', slug: 'toys', description: 'Remote control cars, aircraft, educational toys', parentId: null, status: 'active', imageUrl: 'https://www.qadrigadgets.pk/images/categories/ico_6a74c8a9ccca2.png', sortOrder: 6 }
];

function readCategories() {
  try {
    if (fs.existsSync(CATEGORIES_FILE)) {
      const data = JSON.parse(fs.readFileSync(CATEGORIES_FILE, 'utf8'));
      if (Array.isArray(data) && data.length > 0) return data;
    }
  } catch (e) {}
  return DEFAULT_CATEGORIES;
}

function writeCategories(data) {
  try {
    fs.writeFileSync(CATEGORIES_FILE, JSON.stringify(data, null, 2), 'utf8');
  } catch (e) {}
}

async function getProducts(sql) {
  if (sql) {
    try {
      const rows = await sql`SELECT category, tab FROM saveandsmile.products`;
      if (rows && rows.length > 0) return rows;
    } catch (e) {}
  }
  try {
    return JSON.parse(fs.readFileSync(path.join(process.cwd(), 'products.json'), 'utf8'));
  } catch (e) {
    return [];
  }
}

module.exports = async function handler(req, res) {
  setCorsHeaders(req, res);

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const sql = getDb();

  // GET: List all categories with product counts
  if (req.method === 'GET') {
    try {
      let categories = [];
      const dbCats = await getSetting('categories', null);
      if (dbCats && Array.isArray(dbCats) && dbCats.length > 0) {
        categories = dbCats;
      } else {
        categories = readCategories();
      }

      // Count products per category
      const products = await getProducts(sql);
      const enriched = categories.map(cat => {
        const count = products.filter(p =>
          (p.category && p.category.toLowerCase() === cat.slug.toLowerCase()) ||
          (p.tab && p.tab.toLowerCase() === cat.slug.toLowerCase()) ||
          (p.category && p.category.toLowerCase() === cat.name.toLowerCase())
        ).length;
        return {
          ...cat,
          productCount: count,
          createdAt: cat.createdAt || new Date().toISOString()
        };
      });

      return res.status(200).json({
        success: true,
        count: enriched.length,
        categories: enriched
      });
    } catch (err) {
      return res.status(500).json({ success: false, error: err.message });
    }
  }

  // POST / PUT: Create or update category
  if (req.method === 'POST' || req.method === 'PUT') {
    verifyAuthToken(req);

    try {
      let body = req.body;
      if (typeof body === 'string') body = JSON.parse(body);

      const { id, name, slug, description = '', parentId = null, imageUrl = '', sortOrder = 0, status = 'active' } = body || {};

      if (!name) {
        return res.status(400).json({ success: false, error: 'Category name is required' });
      }

      const catSlug = slug || name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
      const catId = id || catSlug;

      const record = {
        id: String(catId),
        name,
        slug: catSlug,
        description,
        parentId: parentId || null,
        status,
        imageUrl,
        sortOrder: parseInt(sortOrder, 10) || 0,
        createdAt: new Date().toISOString()
      };

      const categories = (await getSetting('categories', null)) || readCategories();
      const idx = categories.findIndex(c => String(c.id) === String(catId) || c.slug === catSlug);
      if (idx >= 0) {
        categories[idx] = { ...categories[idx], ...record };
      } else {
        categories.push(record);
      }
      await saveSetting('categories', categories);
      writeCategories(categories);

      return res.status(200).json({ success: true, category: record });
    } catch (err) {
      return res.status(500).json({ success: false, error: err.message });
    }
  }

  // DELETE: Remove category
  if (req.method === 'DELETE') {
    verifyAuthToken(req);

    try {
      let body = req.body;
      if (typeof body === 'string') body = JSON.parse(body);
      const url = new URL(req.url, 'http://localhost');
      const id = (body && body.id) || url.searchParams.get('id');

      if (!id) return res.status(400).json({ success: false, error: 'Category id is required' });

      let categories = (await getSetting('categories', null)) || readCategories();
      categories = categories.filter(c => String(c.id) !== String(id) && c.slug !== id);
      await saveSetting('categories', categories);
      writeCategories(categories);

      return res.status(200).json({ success: true, message: 'Category removed successfully', id });
    } catch (err) {
      return res.status(500).json({ success: false, error: err.message });
    }
  }

  return res.status(405).json({ error: 'Method Not Allowed' });
};
