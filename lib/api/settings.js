const fs = require('fs');
const path = require('path');
const { getDb } = require('./db');
const { verifyAuthToken } = require('./auth');
const { setCorsHeaders } = require('./cors');

const DATA_DIR = path.join(process.cwd(), 'data');
const SETTINGS_FILE = path.join(DATA_DIR, 'settings.json');
const SEO_SETTINGS_FILE = path.join(DATA_DIR, 'seo_settings.json');

if (!fs.existsSync(DATA_DIR)) {
  try { fs.mkdirSync(DATA_DIR, { recursive: true }); } catch (e) {}
}

const DEFAULT_SETTINGS = {
  store: {
    name: "Save & Smile",
    tagline: "Shop • Save • Smile | Wholesale Store Pakistan",
    email: "support@saveandsmile.pk",
    phone: "0316-2323616",
    whatsapp: "923162323616",
    address: "Wholesale Market, Karachi / Lahore, Pakistan",
    currency: "PKR",
    timezone: "Asia/Karachi",
    language: "en-PK",
    status: "online"
  },
  shipping: {
    flatRate: 200,
    freeShippingThreshold: 3000,
    estimatedDays: "2-4 Business Days",
    couriers: ["Trax", "Leopard Courier", "PostEx", "M&P", "TCS"],
    allowCOD: true
  },
  payments: {
    cod: {
      enabled: true,
      title: "Cash on Delivery (COD)",
      description: "Pay cash upon delivery anywhere in Pakistan."
    },
    bankTransfer: {
      enabled: true,
      title: "Bank Transfer / JazzCash / EasyPaisa",
      instructions: "Direct bank transfer. Contact WhatsApp 0316-2323616 with payment receipt."
    }
  },
  notifications: {
    orderConfirmationEmail: true,
    whatsappUpdates: true,
    lowStockAlerts: true,
    stockAlertThreshold: 5
  },
  security: {
    sessionTimeoutHours: 24,
    enforceStrongPasswords: true
  }
};

function readSettings() {
  try {
    if (fs.existsSync(SETTINGS_FILE)) {
      const data = JSON.parse(fs.readFileSync(SETTINGS_FILE, 'utf8'));
      return { ...DEFAULT_SETTINGS, ...data };
    }
  } catch (e) {}
  return DEFAULT_SETTINGS;
}

function writeSettings(data) {
  try {
    fs.writeFileSync(SETTINGS_FILE, JSON.stringify(data, null, 2), 'utf8');

    // Sync shipping settings with SEO settings file if it exists
    if (fs.existsSync(SEO_SETTINGS_FILE)) {
      try {
        const seoData = JSON.parse(fs.readFileSync(SEO_SETTINGS_FILE, 'utf8'));
        if (data.shipping) {
          seoData.shipping_fee = data.shipping.flatRate;
          seoData.free_shipping_threshold = data.shipping.freeShippingThreshold;
        }
        if (data.store) {
          seoData.org_name = data.store.name;
          seoData.helpline_phone = data.store.phone;
          seoData.whatsapp = data.store.whatsapp;
        }
        fs.writeFileSync(SEO_SETTINGS_FILE, JSON.stringify(seoData, null, 2), 'utf8');
      } catch (err) {}
    }
  } catch (e) {}
}

module.exports = async function handler(req, res) {
  setCorsHeaders(req, res);

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method === 'GET') {
    const settings = readSettings();
    return res.status(200).json({
      success: true,
      settings
    });
  }

  if (req.method === 'POST' || req.method === 'PUT') {
    verifyAuthToken(req);

    try {
      let body = req.body;
      if (typeof body === 'string') body = JSON.parse(body);

      const current = readSettings();
      const updated = {
        store: { ...current.store, ...(body.store || {}) },
        shipping: { ...current.shipping, ...(body.shipping || {}) },
        payments: { ...current.payments, ...(body.payments || {}) },
        notifications: { ...current.notifications, ...(body.notifications || {}) },
        security: { ...current.security, ...(body.security || {}) }
      };

      writeSettings(updated);

      return res.status(200).json({
        success: true,
        message: 'Settings updated successfully',
        settings: updated
      });
    } catch (err) {
      return res.status(500).json({
        success: false,
        error: err.message || 'Failed to update settings'
      });
    }
  }

  return res.status(405).json({ success: false, error: 'Method not allowed' });
};
