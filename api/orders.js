const fs = require('fs');
const path = require('path');
const { getDb } = require('./db');
const { verifyAuthToken } = require('./auth');

// Load authentic catalog for server-side price validation fallback
let fallbackCatalog = [];
try {
  const jsonPath = path.join(__dirname, '..', 'products.json');
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
  // GET: Order Tracking (Public) OR Admin Order Listing (Protected)
  // ==========================================
  if (req.method === 'GET') {
    // 1. Public Order Tracking Lookup (Sanitized for Customer Privacy)
    if (trackParam) {
      const cleanTrack = trackParam.trim().toUpperCase();
      if (!sql) {
        return res.status(503).json({
          success: false,
          error: 'Database connection is currently unavailable for live tracking lookup.'
        });
      }

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

        if (!orderRows || orderRows.length === 0) {
          return res.status(404).json({ success: false, error: 'No order found matching this Order ID or Phone number.' });
        }

        const rawOrder = orderRows[0];
        const itemRows = await sql`
          SELECT id, product_id as "productId", title, price, qty, total
          FROM order_items
          WHERE order_id = ${rawOrder.id}
        `;

        // Privacy mask for phone number (e.g. 0300****123)
        const phone = rawOrder.customerPhone || '';
        const maskedPhone = phone.length > 6 
          ? `${phone.slice(0, 4)}****${phone.slice(-3)}`
          : '****';

        // Privacy mask for name (e.g. "Muhammad A***")
        const nameParts = (rawOrder.customerName || 'Customer').trim().split(' ');
        const maskedName = nameParts.length > 1
          ? `${nameParts[0]} ${nameParts[1][0]}***`
          : `${nameParts[0].slice(0, 3)}***`;

        const sanitizedOrder = {
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
        };

        return res.status(200).json({ success: true, order: sanitizedOrder });
      } catch (err) {
        console.error('Order tracking error:', err);
        return res.status(500).json({ success: false, error: err.message });
      }
    }

    // 2. Admin Order Listing (Protected by JWT)
    const adminUser = verifyAuthToken(req);
    if (!adminUser) {
      return res.status(401).json({ success: false, error: 'Unauthorized: Admin authentication required to list orders.' });
    }

    if (!sql) {
      return res.status(503).json({ success: false, error: 'Database service is currently unconfigured.' });
    }

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

      return res.status(200).json({ success: true, count: orders.length, orders });
    } catch (err) {
      return res.status(500).json({ success: false, error: err.message });
    }
  }

  // ==========================================
  // POST: Create Order (Customer Checkout with Server-side Price Recalculation)
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
        notes = ''
      } = body || {};

      if (!customerName || !customerPhone || !customerAddress) {
        return res.status(400).json({
          success: false,
          error: 'Customer name, phone number, and delivery address are required.'
        });
      }

      if (!items || !Array.isArray(items) || items.length === 0) {
        return res.status(400).json({
          success: false,
          error: 'Cart items are required to place an order.'
        });
      }

      // Check Database Connection FIRST — Do NOT return fake success if DB is missing
      if (!sql) {
        return res.status(503).json({
          success: false,
          error: 'Database service is currently unavailable. Order could not be saved.'
        });
      }

      // 1. Authoritative Server-Side Price & Quantity Recalculation
      let serverSubtotal = 0;
      const verifiedItems = [];

      for (const item of items) {
        const prodId = item.id || item.code;
        if (!prodId) {
          return res.status(400).json({ success: false, error: 'Product ID or Code is required for all items.' });
        }

        const rawQty = item.qty || item.quantity;
        const quantity = parseInt(rawQty, 10);
        if (isNaN(quantity) || quantity <= 0) {
          return res.status(400).json({ success: false, error: `Invalid item quantity (${rawQty}) for product ${prodId}. Quantity must be at least 1.` });
        }

        const lookup = await lookupProduct(sql, prodId);
        if (!lookup) {
          return res.status(400).json({ success: false, error: `Product '${prodId}' not found or no longer available.` });
        }

        if (lookup.stock !== undefined && lookup.stock < quantity) {
          return res.status(400).json({
            success: false,
            error: `Insufficient stock for product '${lookup.title}'. Available: ${lookup.stock}, Requested: ${quantity}`
          });
        }

        const unitPrice = parseFloat(lookup.price) || 0;
        const itemTitle = lookup.title || 'Product';
        const itemTotal = unitPrice * quantity;

        serverSubtotal += itemTotal;
        verifiedItems.push({
          productId: lookup.id || null,
          title: itemTitle,
          price: unitPrice,
          qty: quantity,
          total: itemTotal
        });
      }

      const serverShippingFee = serverSubtotal >= 3000 ? 0 : 200;
      const serverGrandTotal = serverSubtotal + serverShippingFee;
      const orderCode = 'SS-' + Math.floor(100000 + Math.random() * 900000);

      // 2. Persistence to Database
      const orderResult = await sql`
        INSERT INTO orders (
          order_code, customer_name, customer_phone, customer_address, customer_city,
          payment_method, subtotal, shipping_fee, grand_total, status, notes
        )
        VALUES (
          ${orderCode}, ${customerName.trim()}, ${customerPhone.trim()}, ${customerAddress.trim()},
          ${customerCity || 'Karachi'}, ${paymentMethod}, ${serverSubtotal}, ${serverShippingFee},
          ${serverGrandTotal}, 'Pending', ${notes}
        )
        RETURNING id, order_code as "orderCode", subtotal, shipping_fee as "shippingFee", grand_total as "grandTotal", status, created_at as "createdAt"
      `;

      const createdOrder = orderResult[0];

      // 3. Insert Verified Order Items
      for (const vItem of verifiedItems) {
        await sql`
          INSERT INTO order_items (order_id, product_id, title, price, qty, total)
          VALUES (
            ${createdOrder.id}, ${vItem.productId}, ${vItem.title},
            ${vItem.price}, ${vItem.qty}, ${vItem.total}
          )
        `;
      }

      return res.status(201).json({
        success: true,
        orderId: orderCode,
        subtotal: serverSubtotal,
        shippingFee: serverShippingFee,
        grandTotal: serverGrandTotal,
        order: {
          ...createdOrder,
          items: verifiedItems
        },
        message: 'Order created and persisted successfully!'
      });
    } catch (err) {
      console.error('Order creation error:', err);
      return res.status(500).json({ success: false, error: `Failed to save order: ${err.message}` });
    }
  }

  // ==========================================
  // PUT / PATCH: Update Order Status / Tracking (Protected by JWT)
  // ==========================================
  if (req.method === 'PUT' || req.method === 'PATCH') {
    const adminUser = verifyAuthToken(req);
    if (!adminUser) {
      return res.status(401).json({ success: false, error: 'Unauthorized: Admin authentication required to update orders.' });
    }

    if (!sql) {
      return res.status(503).json({ success: false, error: 'Database service is currently unavailable.' });
    }

    try {
      let body = req.body;
      if (typeof body === 'string') body = JSON.parse(body);

      const { orderId, status, courier, trackingNumber } = body || {};
      if (!orderId) {
        return res.status(400).json({ success: false, error: 'orderId is required.' });
      }

      await sql`
        UPDATE orders
        SET status = COALESCE(${status}, status),
            courier = COALESCE(${courier}, courier),
            tracking_number = COALESCE(${trackingNumber}, tracking_number),
            updated_at = NOW()
        WHERE order_code = ${orderId} OR id::text = ${orderId}
      `;

      return res.status(200).json({ success: true, message: `Order #${orderId} updated successfully.` });
    } catch (err) {
      return res.status(500).json({ success: false, error: err.message });
    }
  }

  return res.status(405).json({ error: 'Method Not Allowed' });
};
