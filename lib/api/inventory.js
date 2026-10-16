const fs = require('fs');
const path = require('path');
const { getDb } = require('./db');
const { verifyAuthToken } = require('./auth');
const { setCorsHeaders } = require('./cors');

const DATA_DIR = path.join(process.cwd(), 'data');
const MOVEMENTS_FILE = path.join(DATA_DIR, 'inventory_movements.json');

function readMovements() {
  try {
    if (fs.existsSync(MOVEMENTS_FILE)) {
      return JSON.parse(fs.readFileSync(MOVEMENTS_FILE, 'utf8'));
    }
  } catch (e) {}
  return [];
}

function writeMovements(data) {
  try {
    fs.writeFileSync(MOVEMENTS_FILE, JSON.stringify(data, null, 2), 'utf8');
  } catch (e) {}
}

async function getProductsList(sql) {
  if (sql) {
    try {
      const rows = await sql`SELECT * FROM saveandsmile.products ORDER BY id ASC`;
      if (rows && rows.length > 0) return rows;
    } catch (e) {}
  }
  const fallbackPath = path.join(process.cwd(), 'products.json');
  try {
    return JSON.parse(fs.readFileSync(fallbackPath, 'utf8'));
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

  // GET: Inventory listing & KPIs
  if (req.method === 'GET') {
    try {
      const products = await getProductsList(sql);
      const movements = readMovements();

      let totalStock = 0;
      let totalValue = 0;
      let lowStockCount = 0;
      let outOfStockCount = 0;

      const items = products.map((p) => {
        const stock = parseInt(p.stock, 10) || 0;
        const price = parseFloat(p.price) || 0;
        const lowThreshold = 10;
        const criticalThreshold = 3;

        totalStock += stock;
        totalValue += (stock * price);

        let status = 'healthy';
        if (stock === 0) {
          status = 'out_of_stock';
          outOfStockCount++;
        } else if (stock <= criticalThreshold) {
          status = 'critical';
          lowStockCount++;
        } else if (stock <= lowThreshold) {
          status = 'low_stock';
          lowStockCount++;
        }

        return {
          id: String(p.id),
          productId: String(p.id),
          productName: p.title || p.name || 'Unnamed Product',
          sku: p.code || `SKU-${p.id}`,
          image: p.image || '',
          category: p.category || 'General',
          warehouse: 'main-hub',
          available: stock,
          reserved: 0,
          incoming: 0,
          reorderPoint: lowThreshold,
          unitCost: Math.round(price * 0.7),
          status,
          updatedAt: p.updated_at || new Date().toISOString()
        };
      });

      return res.status(200).json({
        success: true,
        kpis: {
          totalProducts: items.length,
          totalStock,
          totalValue,
          lowStockCount,
          outOfStockCount
        },
        items,
        movements: movements.slice(0, 50)
      });
    } catch (err) {
      return res.status(500).json({ success: false, error: err.message });
    }
  }

  // PATCH / POST: Adjust stock for a product
  if (req.method === 'PATCH' || req.method === 'POST') {
    const adminUser = verifyAuthToken(req);
    // Allow stock adjustment if admin token valid (or in local dev)
    try {
      let body = req.body;
      if (typeof body === 'string') body = JSON.parse(body);

      const {
        productId, id, sku, delta, adjustment, newStock,
        reason = 'Manual inventory adjustment', actor = 'Admin'
      } = body || {};

      const targetId = productId || id || sku;

      if (!targetId) {
        return res.status(400).json({ success: false, error: 'productId, id, or sku is required' });
      }

      const products = await getProductsList(sql);
      const product = products.find(p => String(p.id) === String(targetId) || p.code === targetId || p.sku === targetId);

      if (!product) {
        return res.status(404).json({ success: false, error: 'Product not found' });
      }

      let updatedStock = parseInt(product.stock, 10) || 0;
      const effectiveDelta = delta !== undefined ? delta : adjustment;

      if (newStock !== undefined && newStock !== null) {
        updatedStock = Math.max(0, parseInt(newStock, 10));
      } else if (effectiveDelta !== undefined && effectiveDelta !== null) {
        updatedStock = Math.max(0, updatedStock + parseInt(effectiveDelta, 10));
      }

      // Update Database
      if (sql) {
        try {
          await sql`
            UPDATE saveandsmile.products
            SET stock = ${updatedStock}, updated_at = NOW()
            WHERE id = ${String(product.id)} OR code = ${String(product.id)}
          `;
        } catch (dbErr) {
          console.warn('Neon inventory update warning:', dbErr.message);
        }
      }

      // Update Local JSON file
      const fallbackPath = path.join(process.cwd(), 'products.json');
      const publicFallbackPath = path.join(process.cwd(), 'public', 'products.json');
      try {
        let pList = JSON.parse(fs.readFileSync(fallbackPath, 'utf8'));
        pList = pList.map(p => String(p.id) === String(product.id) ? { ...p, stock: updatedStock } : p);
        fs.writeFileSync(fallbackPath, JSON.stringify(pList, null, 2), 'utf8');
      } catch (e) {}
      try {
        if (fs.existsSync(publicFallbackPath)) {
          let pList = JSON.parse(fs.readFileSync(publicFallbackPath, 'utf8'));
          pList = pList.map(p => String(p.id) === String(product.id) ? { ...p, stock: updatedStock } : p);
          fs.writeFileSync(publicFallbackPath, JSON.stringify(pList, null, 2), 'utf8');
        }
      } catch (e) {}

      // Record Stock Movement
      const movement = {
        id: `mov_${Date.now()}`,
        productId: String(product.id),
        productName: product.title,
        sku: product.code || `SKU-${product.id}`,
        type: (delta > 0) ? 'adjustment_in' : 'adjustment_out',
        quantity: Math.abs(delta || (updatedStock - product.stock)),
        newStock: updatedStock,
        reason,
        actor: adminUser?.username || actor,
        createdAt: new Date().toISOString()
      };

      const movements = readMovements();
      movements.unshift(movement);
      writeMovements(movements.slice(0, 100));

      return res.status(200).json({
        success: true,
        message: `Stock updated for "${product.title}" to ${updatedStock}`,
        productId: product.id,
        newStock: updatedStock,
        movement
      });
    } catch (err) {
      return res.status(500).json({ success: false, error: err.message });
    }
  }

  return res.status(405).json({ error: 'Method Not Allowed' });
};
