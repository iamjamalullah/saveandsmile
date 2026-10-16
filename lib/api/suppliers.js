const fs = require('fs');
const path = require('path');
const { setCorsHeaders } = require('./cors');
const { logAudit } = require('./audit');
const { getDb } = require('./db');

const DATA_DIR = path.join(process.cwd(), 'data');
const SUPPLIERS_FILE = path.join(DATA_DIR, 'suppliers.json');
const PO_FILE = path.join(DATA_DIR, 'purchase_orders.json');
const MOVEMENTS_FILE = path.join(DATA_DIR, 'inventory_movements.json');
const PRODUCTS_FILE = path.join(process.cwd(), 'products.json');
const PUB_PRODUCTS_FILE = path.join(process.cwd(), 'public', 'products.json');

function readJson(file, fallback = []) {
  try {
    if (fs.existsSync(file)) return JSON.parse(fs.readFileSync(file, 'utf8'));
  } catch (e) {}
  return fallback;
}

function writeJson(file, data) {
  try {
    fs.writeFileSync(file, JSON.stringify(data, null, 2), 'utf8');
  } catch (e) {
    console.warn('Failed to write file:', file, e.message);
  }
}

module.exports = async function handler(req, res) {
  setCorsHeaders(req, res);

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // GET: Suppliers & Purchase Orders
  if (req.method === 'GET') {
    const suppliers = readJson(SUPPLIERS_FILE, []);
    const purchaseOrders = readJson(PO_FILE, []);
    return res.status(200).json({
      success: true,
      suppliers,
      purchaseOrders
    });
  }

  // POST: Add or Edit Supplier OR Add Purchase Order
  if (req.method === 'POST') {
    try {
      let body = req.body;
      if (typeof body === 'string') body = JSON.parse(body);

      const type = body.type || 'supplier'; // 'supplier' or 'po'

      if (type === 'po') {
        const pos = readJson(PO_FILE, []);
        const newPO = {
          id: body.id || `PO-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`,
          poNumber: body.poNumber || `PO-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`,
          supplierId: body.supplierId || 'sup_1',
          supplierName: body.supplierName || 'Wholesale Supplier',
          orderDate: body.orderDate || new Date().toISOString(),
          expectedDate: body.expectedDate || new Date(Date.now() + 7 * 86400000).toISOString(),
          status: body.status || 'ordered',
          totalAmount: parseFloat(body.totalAmount) || 0,
          paidAmount: parseFloat(body.paidAmount) || 0,
          items: Array.isArray(body.items) ? body.items : [],
          notes: body.notes || ''
        };
        pos.unshift(newPO);
        writeJson(PO_FILE, pos);
        logAudit({ action: 'PURCHASE_ORDER_CREATED', entity: 'Purchase Order', entityId: newPO.poNumber, details: `Created PO ${newPO.poNumber} for Rs. ${newPO.totalAmount}` });
        return res.status(201).json({ success: true, po: newPO });
      }

      // Default: Supplier CRUD
      const suppliers = readJson(SUPPLIERS_FILE, []);
      const supplierId = body.id || `sup_${Date.now()}`;
      const existingIdx = suppliers.findIndex(s => s.id === supplierId);

      const supplierRecord = {
        id: supplierId,
        name: body.name || 'New Supplier',
        contactPerson: body.contactPerson || '',
        email: body.email || '',
        phone: body.phone || '',
        city: body.city || 'Karachi',
        address: body.address || '',
        category: body.category || 'General Gadgets',
        leadTimeDays: parseInt(body.leadTimeDays, 10) || 3,
        status: body.status || 'active',
        rating: parseFloat(body.rating) || 5.0,
        notes: body.notes || ''
      };

      if (existingIdx >= 0) {
        suppliers[existingIdx] = supplierRecord;
      } else {
        suppliers.push(supplierRecord);
      }

      writeJson(SUPPLIERS_FILE, suppliers);
      logAudit({ action: existingIdx >= 0 ? 'SUPPLIER_UPDATED' : 'SUPPLIER_CREATED', entity: 'Supplier', entityId: supplierRecord.name, details: `${supplierRecord.name} (${supplierRecord.city})` });
      return res.status(200).json({ success: true, supplier: supplierRecord });
    } catch (err) {
      return res.status(500).json({ success: false, error: err.message });
    }
  }

  // PUT: Receive inventory from Purchase Order (Syncs with stock!)
  if (req.method === 'PUT') {
    try {
      let body = req.body;
      if (typeof body === 'string') body = JSON.parse(body);

      const { poId, receivedItems } = body;
      const pos = readJson(PO_FILE, []);
      const poIdx = pos.findIndex(p => p.id === poId || p.poNumber === poId);

      if (poIdx === -1) {
        return res.status(404).json({ success: false, error: 'Purchase Order not found' });
      }

      const po = pos[poIdx];
      let products = readJson(PRODUCTS_FILE, []);
      let movements = readJson(MOVEMENTS_FILE, []);

      // Process received quantities
      if (Array.isArray(receivedItems)) {
        for (const item of receivedItems) {
          const prodIdx = products.findIndex(p => String(p.id) === String(item.productId));
          const addQty = parseInt(item.receiveQty, 10) || 0;
          if (prodIdx >= 0 && addQty > 0) {
            const oldStock = parseInt(products[prodIdx].stock, 10) || 0;
            products[prodIdx].stock = newStock;

            // Live DB Update
            const sql = getDb();
            if (sql) {
              try {
                await sql`UPDATE saveandsmile.products SET stock = ${newStock}, updated_at = NOW() WHERE id = ${String(item.productId)}`;
              } catch (sqlErr) {}
            }

            // Log movement
            movements.unshift({
              id: 'mov_' + Date.now() + '_' + Math.random().toString(36).substring(2, 5),
              productId: String(item.productId),
              productTitle: products[prodIdx].title,
              sku: products[prodIdx].code || `QGW-${item.productId}`,
              type: 'IN',
              quantity: addQty,
              previousStock: oldStock,
              newStock,
              reason: `PO Received: ${po.poNumber}`,
              date: new Date().toISOString(),
              user: 'Hamza Khan (Inventory Mgr)'
            });
          }

          // Update PO item receivedQty
          const poItem = (po.items || []).find(i => String(i.productId) === String(item.productId));
          if (poItem) {
            poItem.receivedQty = (poItem.receivedQty || 0) + addQty;
          }
        }
      }

      // Check if all items fully received
      const allDone = (po.items || []).every(i => (i.receivedQty || 0) >= (i.orderedQty || 0));
      po.status = allDone ? 'received' : 'partial';

      pos[poIdx] = po;

      // Save files
      writeJson(PO_FILE, pos);
      writeJson(PRODUCTS_FILE, products);
      writeJson(PUB_PRODUCTS_FILE, products);
      writeJson(MOVEMENTS_FILE, movements);

      logAudit({ action: 'PO_INVENTORY_RECEIVED', entity: 'Inventory', entityId: po.poNumber, details: `Received inventory for PO ${po.poNumber}. Stock updated live.` });

      return res.status(200).json({
        success: true,
        message: 'PO inventory received and product stock updated.',
        po
      });
    } catch (err) {
      return res.status(500).json({ success: false, error: err.message });
    }
  }

  // DELETE: Remove supplier
  if (req.method === 'DELETE') {
    try {
      let body = req.body;
      if (typeof body === 'string') body = JSON.parse(body);
      const id = (body && body.id) || (req.query && req.query.id);
      if (!id) return res.status(400).json({ success: false, error: 'Supplier ID is required' });

      let suppliers = readJson(SUPPLIERS_FILE, []);
      suppliers = suppliers.filter(s => s.id !== id);
      writeJson(SUPPLIERS_FILE, suppliers);

      logAudit({ action: 'SUPPLIER_DELETED', entity: 'Supplier', entityId: id, details: `Deleted supplier ID ${id}` });
      return res.status(200).json({ success: true, message: 'Supplier deleted successfully' });
    } catch (err) {
      return res.status(500).json({ success: false, error: err.message });
    }
  }

  return res.status(405).json({ success: false, error: 'Method not allowed' });
};
