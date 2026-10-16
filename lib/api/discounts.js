const fs = require('fs');
const path = require('path');
const { getDb, getSetting, saveSetting } = require('./db');
const { verifyAuthToken } = require('./auth');
const { setCorsHeaders } = require('./cors');

const DATA_DIR = path.join(process.cwd(), 'data');
const DISCOUNTS_FILE = path.join(DATA_DIR, 'discounts.json');

const DEFAULT_COUPONS = [
  {
    id: 'coup_welcome10',
    code: 'SAVE10',
    description: '10% off for all wholesale customers on orders above Rs 2,500',
    type: 'percentage',
    value: 10,
    minPurchase: 2500,
    maxDiscount: 1000,
    usageCount: 42,
    usageLimit: 500,
    perCustomerLimit: 1,
    startsAt: new Date(Date.now() - 30 * 86400000).toISOString(),
    endsAt: new Date(Date.now() + 60 * 86400000).toISOString(),
    status: 'active',
    appliesTo: { products: [], categories: [] },
    eligibility: 'all',
    revenueInfluenced: 125000
  },
  {
    id: 'coup_freeship',
    code: 'FREESHIP',
    description: 'Free nationwide delivery on orders above Rs 3,000',
    type: 'free_shipping',
    value: 200,
    minPurchase: 3000,
    maxDiscount: 200,
    usageCount: 128,
    usageLimit: 1000,
    perCustomerLimit: 5,
    startsAt: new Date(Date.now() - 60 * 86400000).toISOString(),
    endsAt: new Date(Date.now() + 90 * 86400000).toISOString(),
    status: 'active',
    appliesTo: { products: [], categories: [] },
    eligibility: 'all',
    revenueInfluenced: 450000
  }
];

function readDiscounts() {
  try {
    if (fs.existsSync(DISCOUNTS_FILE)) {
      const data = JSON.parse(fs.readFileSync(DISCOUNTS_FILE, 'utf8'));
      if (Array.isArray(data) && data.length > 0) return data;
    }
  } catch (e) {}
  return DEFAULT_COUPONS;
}

function writeDiscounts(data) {
  try {
    fs.writeFileSync(DISCOUNTS_FILE, JSON.stringify(data, null, 2), 'utf8');
  } catch (e) {}
}

module.exports = async function handler(req, res) {
  setCorsHeaders(req, res);

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // GET: List coupons
  if (req.method === 'GET') {
    try {
      const dbCoupons = await getSetting('discounts', null);
      if (dbCoupons && Array.isArray(dbCoupons) && dbCoupons.length > 0) {
        writeDiscounts(dbCoupons);
        return res.status(200).json({
          success: true,
          count: dbCoupons.length,
          coupons: dbCoupons
        });
      }
    } catch (e) {}

    const discounts = readDiscounts();
    return res.status(200).json({
      success: true,
      count: discounts.length,
      coupons: discounts
    });
  }

  // POST / PUT: Create or update coupon
  if (req.method === 'POST' || req.method === 'PUT') {
    verifyAuthToken(req);

    try {
      let body = req.body;
      if (typeof body === 'string') body = JSON.parse(body);

      const {
        id, code, description = '', type = 'percentage', value = 10,
        minPurchase = 0, maxDiscount = null, usageLimit = 100,
        startsAt, endsAt, status = 'active'
      } = body || {};

      if (!code) {
        return res.status(400).json({ success: false, error: 'Coupon code is required' });
      }

      const cleanCode = code.trim().toUpperCase();
      const couponId = id || `coup_${Date.now()}`;

      const record = {
        id: couponId,
        code: cleanCode,
        description,
        type,
        value: parseFloat(value) || 0,
        minPurchase: parseFloat(minPurchase) || 0,
        maxDiscount: maxDiscount ? parseFloat(maxDiscount) : null,
        usageCount: body.usageCount || 0,
        usageLimit: parseInt(usageLimit, 10) || 100,
        perCustomerLimit: 1,
        startsAt: startsAt || new Date().toISOString(),
        endsAt: endsAt || new Date(Date.now() + 30 * 86400000).toISOString(),
        status,
        appliesTo: { products: [], categories: [] },
        eligibility: 'all',
        revenueInfluenced: body.revenueInfluenced || 0
      };

      const discounts = (await getSetting('discounts', null)) || readDiscounts();
      const idx = discounts.findIndex(c => c.id === couponId || c.code === cleanCode);
      if (idx >= 0) {
        discounts[idx] = { ...discounts[idx], ...record };
      } else {
        discounts.unshift(record);
      }
      await saveSetting('discounts', discounts);
      writeDiscounts(discounts);

      return res.status(200).json({ success: true, coupon: record });
    } catch (err) {
      return res.status(500).json({ success: false, error: err.message });
    }
  }

  // DELETE: Remove coupon
  if (req.method === 'DELETE') {
    verifyAuthToken(req);

    try {
      let body = req.body;
      if (typeof body === 'string') body = JSON.parse(body);
      const url = new URL(req.url, 'http://localhost');
      const id = (body && body.id) || url.searchParams.get('id');

      if (!id) return res.status(400).json({ success: false, error: 'Coupon id is required' });

      let discounts = (await getSetting('discounts', null)) || readDiscounts();
      discounts = discounts.filter(c => c.id !== id && c.code !== id);
      await saveSetting('discounts', discounts);
      writeDiscounts(discounts);

      return res.status(200).json({ success: true, message: 'Coupon removed successfully', id });
    } catch (err) {
      return res.status(500).json({ success: false, error: err.message });
    }
  }

  return res.status(405).json({ error: 'Method Not Allowed' });
};
