const fs = require('fs');
const path = require('path');
const { getDb } = require('./db');
const { verifyAuthToken } = require('./auth');

const DATA_DIR = path.join(__dirname, '..', 'data');
const ORDERS_FILE = path.join(DATA_DIR, 'orders.json');

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
  try { fs.mkdirSync(DATA_DIR, { recursive: true }); } catch (e) {}
}

function readLocalOrders() {
  try {
    if (fs.existsSync(ORDERS_FILE)) {
      const data = JSON.parse(fs.readFileSync(ORDERS_FILE, 'utf8'));
      if (Array.isArray(data)) return data;
    }
  } catch (e) {}
  return [];
}

function writeLocalOrders(orders) {
  try {
    fs.writeFileSync(ORDERS_FILE, JSON.stringify(orders, null, 2), 'utf8');
  } catch (e) {
    console.warn('Failed to write local orders file:', e.message);
  }
}

// Load authentic catalog for server-side price validation fallback
let fallbackCatalog = [];
try {
  const jsonPath = path.join(process.cwd(), 'products.json');
  if (fs.existsSync(jsonPath)) {
    fallbackCatalog = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
  }
} catch (e) {}

/**
 * Server-side product price & title lookup
 */
async function lookupProduct(sql, idOrCode) {
  const cleanId = String(idOrCode || '').trim();
  if (!cleanId) return null;

  // 1. Query Database if connected
  if (sql) {
    try {
      const rows = await sql`
        SELECT id, code, title, price, stock 
        FROM products 
        WHERE id::text = ${cleanId} OR code = ${cleanId}
        LIMIT 1
      `;
      if (rows && rows.length > 0) {
        return {
          id: rows[0].id,
          code: rows[0].code,
          title: rows[0].title,
          price: parseFloat(rows[0].price) || 0,
          stock: parseInt(rows[0].stock, 10) || 100
        };
      }
    } catch (e) {}
  }

  // 2. Query fallback catalog
  const match = fallbackCatalog.find(p => String(p.id) === cleanId || p.code === cleanId);
  if (match) {
    return {
      id: match.id,
      code: match.code,
      title: match.title,
      price: parseFloat(match.price) || 0,
      stock: parseInt(match.stock, 10) || 100
    };
  }

  return null;
}

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const sql = getDb();
  const url = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
  const trackParam = url.searchParams.get('track') || url.searchParams.get('id') || url.searchParams.get('orderCode');

  // ==========================================
  // GET: Order Tracking (Public) OR Admin Order Listing
  // ==========================================
  if (req.method === 'GET') {
    // 1. Public Order Tracking Lookup
    if (trackParam) {
      const cleanTrack = trackParam.trim().toUpperCase();

      if (sql) {
        try {
          const orderRows = await sql`
            SELECT id, order_code as "orderCode", customer_name as "customerName",
                   customer_phone as "customerPhone", customer_city as "customerCity",
                   payment_method as "paymentMethod", subtotal, shipping_fee as "shippingFee",
                   grand_total as "grandTotal", status, courier, tracking_number as "trackingNumber",
                   created_at as "createdAt"
            FROM orders
            WHERE UPPER(order_code) = ${cleanTrack} OR customer_phone = ${cleanTrack} OR tracking_number = ${cleanTrack}
            ORDER BY created_at DESC
            LIMIT 1
          `;

          if (orderRows && orderRows.length > 0) {
            const rawOrder = orderRows[0];
            const itemRows = await sql`
              SELECT product_id as "productId", product_title as "title", price, qty, total
              FROM order_items
              WHERE order_id = ${rawOrder.id}
            `;

            const phone = rawOrder.customerPhone || '';
            const maskedPhone = phone.length > 6
              ? phone.substring(0, 4) + '****' + phone.substring(phone.length - 3)
              : '****';
            const nameParts = (rawOrder.customerName || 'Customer').split(' ');
            const maskedName = nameParts.length > 1
              ? `${nameParts[0]} ${nameParts[1][0]}***`
              : `${nameParts[0].substring(0, 3)}***`;

            return res.status(200).json({
              success: true,
              order: {
                orderId: rawOrder.orderCode,
                orderCode: rawOrder.orderCode,
                customerName: maskedName,
                customerPhone: maskedPhone,
                customerCity: rawOrder.customerCity || 'Karachi',
                paymentMethod: rawOrder.paymentMethod,
                subtotal: parseFloat(rawOrder.subtotal) || 0,
                shippingFee: parseFloat(rawOrder.shippingFee) || 0,
                grandTotal: parseFloat(rawOrder.grandTotal) || 0,
                status: rawOrder.status || 'Processing',
                courier: rawOrder.courier || 'Leopards Courier Service',
                trackingNumber: rawOrder.trackingNumber || 'LEOP-849201',
                createdAt: rawOrder.createdAt,
                items: itemRows || []
              }
            });
          }
        } catch (e) {
          console.warn('Neon order tracking lookup fallback:', e.message);
        }
      }

      // Check Local File Fallback
      const localOrders = readLocalOrders();
      const found = localOrders.find(o => 
        String(o.orderCode || o.trackingId || o.id || '').toUpperCase() === cleanTrack ||
        String(o.customerPhone || o.customer?.phone || '').toUpperCase() === cleanTrack ||
        String(o.trackingNumber || '').toUpperCase() === cleanTrack
      );

      if (found) {
        return res.status(200).json({
          success: true,
          order: {
            orderId: found.orderCode || found.trackingId || found.id,
            orderCode: found.orderCode || found.trackingId || found.id,
            customerName: found.customerName || found.customer?.name || 'Customer',
            customerPhone: found.customerPhone || found.customer?.phone || '',
            customerCity: found.customerCity || found.customer?.city || 'Karachi',
            paymentMethod: found.paymentMethod || 'COD',
            subtotal: found.subtotal || 0,
            shippingFee: found.shippingFee || found.shipping || 0,
            grandTotal: found.grandTotal || 0,
            status: found.status || 'Processing',
            courier: found.courier || 'Standard Courier',
            trackingNumber: found.trackingNumber || found.trackingId || 'TRK-1001',
            createdAt: found.createdAt || found.date || new Date().toISOString(),
            items: found.items || []
          }
        });
      }

      return res.status(404).json({ success: false, error: 'No order found matching this Order ID or Phone number.' });
    }

    // 2. Admin Order Listing
    if (sql) {
      try {
        const orders = await sql`
          SELECT id, order_code as "orderCode", customer_name as "customerName",
                 customer_phone as "customerPhone", customer_address as "customerAddress",
                 customer_city as "customerCity", payment_method as "paymentMethod",
                 subtotal, shipping_fee as "shippingFee", grand_total as "grandTotal",
                 status, courier, tracking_number as "trackingNumber", notes, created_at as "createdAt"
          FROM orders
          ORDER BY created_at DESC
          LIMIT 100
        `;
        if (orders && orders.length > 0) {
          return res.status(200).json({ success: true, count: orders.length, orders });
        }
      } catch (err) {
        console.warn('Neon admin order list fallback to JSON file:', err.message);
      }
    }

    const localOrders = readLocalOrders();
    return res.status(200).json({
      success: true,
      count: localOrders.length,
      orders: localOrders
    });
  }

  // ==========================================
  // POST: Create Order (Customer Checkout)
  // ==========================================
  if (req.method === 'POST') {
    try {
      let body = req.body;
      if (typeof body === 'string') {
        body = JSON.parse(body);
      }

      const {
        customerName,
        customerPhone,
        customerAddress,
        customerCity,
        paymentMethod = 'COD',
        items,
        notes = '',
        trackingId
      } = body || {};

      const custName = customerName || body.customer?.name || '';
      const custPhone = customerPhone || body.customer?.phone || '';
      const custAddress = customerAddress || body.customer?.address || '';
      const custCity = customerCity || body.customer?.city || 'Karachi';
      const custNotes = notes || body.customer?.notes || '';
      const payMethod = paymentMethod || body.paymentMethod || 'COD';
      const orderItems = items || body.items || [];

      if (!custName || !custPhone || !custAddress) {
        return res.status(400).json({
          success: false,
          error: 'Customer name, phone number, and delivery address are required.'
        });
      }

      if (!orderItems || !Array.isArray(orderItems) || orderItems.length === 0) {
        return res.status(400).json({
          success: false,
          error: 'Cart items are required to place an order.'
        });
      }

      // 1. Authoritative Server-Side Price & Quantity Recalculation
      let serverSubtotal = 0;
      const verifiedItems = [];

      for (const item of orderItems) {
        const prodId = item.id || item.code;
        const lookup = await lookupProduct(sql, prodId);
        const authenticPrice = lookup ? lookup.price : (parseFloat(item.price) || 0);
        const itemQty = Math.max(1, parseInt(item.qty, 10) || 1);
        const itemTotal = authenticPrice * itemQty;

        serverSubtotal += itemTotal;
        verifiedItems.push({
          productId: prodId || 'item',
          title: (lookup ? lookup.title : item.title) || 'Product',
          price: authenticPrice,
          qty: itemQty,
          total: itemTotal,
          variant: item.variant || null
        });
      }

      // Shipping policy: Free for orders >= 3000, else 200
      const serverShippingFee = serverSubtotal >= 3000 || serverSubtotal === 0 ? 0 : 200;
      const serverGrandTotal = serverSubtotal + serverShippingFee;
      const orderCode = trackingId || `SNS-${Math.floor(100000 + Math.random() * 900000)}`;

      const orderRecord = {
        id: Date.now(),
        orderCode,
        trackingId: orderCode,
        customerName: custName,
        customerPhone: custPhone,
        customerAddress: custAddress,
        customerCity: custCity,
        customer: {
          name: custName,
          phone: custPhone,
          address: custAddress,
          city: custCity,
          notes: custNotes
        },
        paymentMethod: payMethod,
        subtotal: serverSubtotal,
        shippingFee: serverShippingFee,
        grandTotal: serverGrandTotal,
        status: 'Processing',
        courier: 'Leopards Courier Service',
        trackingNumber: `LEOP-${Math.floor(100000 + Math.random() * 900000)}`,
        notes: custNotes,
        createdAt: new Date().toISOString(),
        items: verifiedItems
      };

      // 2. Try DB Insert if available
      let dbInserted = false;
      if (sql) {
        try {
          const insertedOrder = await sql`
            INSERT INTO orders (
              order_code, customer_name, customer_phone, customer_address, customer_city,
              payment_method, subtotal, shipping_fee, grand_total, status, courier, tracking_number, notes
            )
            VALUES (
              ${orderCode}, ${custName}, ${custPhone}, ${custAddress}, ${custCity},
              ${payMethod}, ${serverSubtotal}, ${serverShippingFee}, ${serverGrandTotal},
              'Processing', 'Leopards Courier Service', ${orderRecord.trackingNumber}, ${custNotes}
            )
            RETURNING *
          `;

          if (insertedOrder && insertedOrder.length > 0) {
            dbInserted = true;
            for (const vItem of verifiedItems) {
              await sql`
                INSERT INTO order_items (order_id, product_id, product_title, price, qty, total)
                VALUES (${insertedOrder[0].id}, ${String(vItem.productId)}, ${vItem.title}, ${vItem.price}, ${vItem.qty}, ${vItem.total})
              `;
            }
          }
        } catch (dbErr) {
          console.warn('Neon DB order insert fallback to JSON file:', dbErr.message);
        }
      }

      // 3. Always synchronize with local JSON file
      const localOrders = readLocalOrders();
      localOrders.unshift(orderRecord);
      writeLocalOrders(localOrders);

      return res.status(201).json({
        success: true,
        orderId: orderCode,
        subtotal: serverSubtotal,
        shippingFee: serverShippingFee,
        grandTotal: serverGrandTotal,
        order: orderRecord,
        source: dbInserted ? 'neon' : 'local_json',
        message: 'Order created and persisted successfully!'
      });
    } catch (err) {
      console.error('Order creation error:', err);
      return res.status(500).json({ success: false, error: `Failed to save order: ${err.message}` });
    }
  }

  // ==========================================
  // PUT / PATCH: Update Order Status / Tracking
  // ==========================================
  if (req.method === 'PUT' || req.method === 'PATCH') {
    try {
      let body = req.body;
      if (typeof body === 'string') body = JSON.parse(body);

      const { id, orderId, status, courier, trackingNumber } = body || {};
      const targetId = orderId || id;
      if (!targetId) {
        return res.status(400).json({ success: false, error: 'orderId is required.' });
      }

      // Update in DB if available
      if (sql) {
        try {
          await sql`
            UPDATE orders
            SET status = COALESCE(${status}, status),
                courier = COALESCE(${courier}, courier),
                tracking_number = COALESCE(${trackingNumber}, tracking_number),
                updated_at = NOW()
            WHERE order_code = ${targetId} OR id::text = ${targetId}
          `;
        } catch (e) {
          console.warn('Neon update order fallback:', e.message);
        }
      }

      // Update in local file
      const localOrders = readLocalOrders();
      let matched = false;
      const updated = localOrders.map(o => {
        if (String(o.orderCode || o.trackingId || o.id) === String(targetId)) {
          matched = true;
          return {
            ...o,
            status: status || o.status,
            courier: courier || o.courier,
            trackingNumber: trackingNumber || o.trackingNumber,
            updatedAt: new Date().toISOString()
          };
        }
        return o;
      });

      if (matched) {
        writeLocalOrders(updated);
      }

      return res.status(200).json({ success: true, message: `Order #${targetId} updated successfully.` });
    } catch (err) {
      return res.status(500).json({ success: false, error: err.message });
    }
  }

  return res.status(405).json({ error: 'Method Not Allowed' });
};
