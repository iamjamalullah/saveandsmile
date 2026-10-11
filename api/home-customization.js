const fs = require('fs');
const path = require('path');
const { getDb } = require('./db');
const { verifyAuthToken } = require('./auth');

const DATA_DIR = path.join(__dirname, '..', 'data');
const HOME_CUSTOMIZATION_FILE = path.join(DATA_DIR, 'home_customization.json');

// Ensure local persistence data directory exists
if (!fs.existsSync(DATA_DIR)) {
  try { fs.mkdirSync(DATA_DIR, { recursive: true }); } catch (e) {}
}

const DEFAULT_HOME_CONFIG = {
  hero_slides: [
    {
      id: 1,
      title: "Wholesale Online Mega Sale",
      subtitle: "Get unbeatable prices on trending gadgets & home organizers",
      image: "https://www.qadrigadgets.pk/images/banners/6a91c696b7d39.webp",
      link: "#products",
      badge: "MEGA SALE",
      btn_text: "Shop Wholesale Now"
    },
    {
      id: 2,
      title: "Electric Insect Killers & Summer Gadgets",
      subtitle: "Premium mosquito killers and rechargeable lamps at direct wholesale rates",
      image: "https://www.qadrigadgets.pk/images/banners/6a7af65669503.webp",
      link: "#products",
      badge: "HOT SUMMER",
      btn_text: "Explore Deals"
    },
    {
      id: 3,
      title: "Trending Water Bottles & Sippers",
      subtitle: "Modern aesthetic mugs and gym motivational bottles",
      image: "https://www.qadrigadgets.pk/images/banners/6a7af65669d26.webp",
      link: "#products",
      badge: "POPULAR",
      btn_text: "View Collection"
    },
    {
      id: 4,
      title: "Store it Beautifully - Storage & Racks",
      subtitle: "Kitchen, Bathroom & Wardrobe organization solutions",
      image: "https://www.qadrigadgets.pk/images/banners/6a7af6566a0fa.webp",
      link: "#products",
      badge: "ORGANIZERS",
      btn_text: "Organize Now"
    },
    {
      id: 5,
      title: "Toys & Kids Collection",
      subtitle: "Exciting flying planes, remote control cars and educational toys",
      image: "https://www.qadrigadgets.pk/images/banners/6a6e1db8c4ccd.webp",
      link: "#products",
      badge: "KIDS SPECIAL",
      btn_text: "See Toys"
    },
    {
      id: 6,
      title: "Fashion Mobile Accessories & Tech",
      subtitle: "Earbuds, Smart Watches, Cables & Fast Chargers",
      image: "https://www.qadrigadgets.pk/images/banners/6a7af6566994b.webp",
      link: "#products",
      badge: "GADGETS",
      btn_text: "Shop Tech"
    }
  ],
  announcement_ticker: {
    enabled: true,
    speed: 32,
    items: [
      "🚀 Welcome to <strong>Save & Smile Wholesale Portal</strong> (Shop • Save • Smile)",
      "🔥 Direct Factory Wholesale Rates in Pakistan — Guaranteed Margin for Resellers",
      "🚚 Cash on Delivery (COD) Nationwide | Free Delivery Above Rs. 3,000",
      "📞 24/7 Helpline & WhatsApp: <strong>0316-2323616</strong>"
    ]
  },
  promo_banners: [
    {
      id: "flash_deal_strip",
      title: "⚡ TODAY'S FLASH SALE",
      subtitle: "Limited quantity left at discounted wholesale prices!",
      enabled: true,
      countdown_hours: 14
    },
    {
      id: "quick_finder",
      title: "Find Any Product Instantly",
      subtitle: "Search through thousands of top-selling gadgets, home organizers, smart watches, and trending electronic items in Pakistan.",
      enabled: true
    }
  ],
  sections_visibility: {
    hero_slider: true,
    categories_strip: true,
    trust_badges: true,
    front_tabs: true,
    hot_selling: true,
    new_arrivals: true,
    flash_sale: true,
    trending_picks: true,
    main_catalog: true,
    search_hero: true,
    video_reels: true,
    testimonials: true
  },
  theme: {
    primary_color: "#008060",
    gradient_from: "#004d57",
    gradient_to: "#83a82b"
  },
  updated_at: new Date().toISOString()
};

function readHomeConfig() {
  try {
    if (fs.existsSync(HOME_CUSTOMIZATION_FILE)) {
      return JSON.parse(fs.readFileSync(HOME_CUSTOMIZATION_FILE, 'utf8'));
    }
  } catch (e) {}
  return DEFAULT_HOME_CONFIG;
}

function writeHomeConfig(data) {
  try {
    fs.writeFileSync(HOME_CUSTOMIZATION_FILE, JSON.stringify(data, null, 2), 'utf8');
  } catch (e) {}
}

module.exports = async function handler(req, res) {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const sql = getDb();

  // 1. GET: Public Homepage & Hero Customization
  if (req.method === 'GET') {
    if (sql) {
      try {
        const rows = await sql`SELECT config_data FROM home_customization WHERE id = 1 LIMIT 1`;
        if (rows && rows.length > 0 && rows[0].config_data) {
          return res.status(200).json({ success: true, config: rows[0].config_data });
        }
      } catch (e) {}
    }

    const config = readHomeConfig();
    return res.status(200).json({ success: true, config });
  }

  // 2. POST: Protected Save Homepage Customization
  if (req.method === 'POST') {
    const adminUser = verifyAuthToken(req);
    if (!adminUser) {
      return res.status(401).json({ success: false, error: 'Unauthorized: Admin authentication required.' });
    }

    try {
      let body = req.body;
      if (typeof body === 'string') {
        body = JSON.parse(body);
      }

      const incoming = body.config || body;
      const current = readHomeConfig();
      const updated = {
        ...current,
        ...incoming,
        updated_at: new Date().toISOString()
      };

      if (sql) {
        try {
          await sql`
            CREATE TABLE IF NOT EXISTS home_customization (
              id INT PRIMARY KEY DEFAULT 1,
              config_data JSONB NOT NULL,
              updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
            );
          `;
          await sql`
            INSERT INTO home_customization (id, config_data, updated_at)
            VALUES (1, ${JSON.stringify(updated)}, NOW())
            ON CONFLICT (id) DO UPDATE SET
              config_data = EXCLUDED.config_data,
              updated_at = NOW();
          `;
        } catch (dbErr) {
          console.warn('Neon home customization save fallback:', dbErr.message);
        }
      }

      writeHomeConfig(updated);
      return res.status(200).json({ success: true, message: 'Homepage and Hero customization saved successfully.', config: updated });
    } catch (err) {
      return res.status(500).json({ success: false, error: err.message });
    }
  }

  return res.status(405).json({ error: 'Method Not Allowed' });
};
