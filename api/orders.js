const { getDb } = require('./db');

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const sql = getDb();

  // GET: Fetch recent orders (for admin dashboard)
  if (req.method === 'GET') {
    try {
      if (!sql) {
        return res.status(200).json({ source: 'local', orders: [], message: 'DATABASE_URL not set' });
      }

      const orders = await sql`
        SELECT * FROM orders ORDER BY created_at DESC LIMIT 50
      `;
      return res.status(200).json({ source: 'neon', count: orders.length, orders });
    } catch (err) {
      return res.status(500).json({ error: err.message });
    }
  }

  // POST: Create a new order
  if (req.method === 'POST') {
    try {
      let body = req.body;
      if (typeof body === 'string') {
        body = JSON.parse(body);
      }

      const {
        orderId,
        customerName,
        customerPhone,
        customerAddress,
        customerCity,
        paymentMethod,
        subtotal,
        shippingFee,
        grandTotal,
        items,
        notes
      } = body;

      const orderCode = orderId || ('SS-' + Math.floor(100000 + Math.random() * 900000));

      if (sql) {
        // Insert main order record
        const orderResult = await sql`
          INSERT INTO orders (
            order_code, customer_name, customer_phone, customer_address, customer_city,
            payment_method, subtotal, shipping_fee, grand_total, status, notes
          )
          VALUES (
            ${orderCode}, ${customerName || 'Customer'}, ${customerPhone || ''}, ${customerAddress || ''},
            ${customerCity || 'Karachi'}, ${paymentMethod || 'COD'}, ${subtotal || 0}, ${shippingFee || 0},
            ${grandTotal || 0}, 'Pending', ${notes || ''}
          )
          RETURNING *
        `;

        const createdOrder = orderResult[0];

        // Insert order items if present
        if (Array.isArray(items) && items.length > 0) {
          for (const item of items) {
            await sql`
              INSERT INTO order_items (order_id, product_id, title, price, qty, total)
              VALUES (
                ${createdOrder.id}, ${item.id || null}, ${item.title || 'Item'},
                ${item.price || 0}, ${item.qty || 1}, ${(item.price || 0) * (item.qty || 1)}
              )
            `;
          }
        }

        return res.status(201).json({
          success: true,
          orderId: orderCode,
          order: createdOrder,
          message: 'Order saved successfully to Neon Database!'
        });
      } else {
        // Fallback response when DATABASE_URL is not configured yet
        return res.status(200).json({
          success: true,
          orderId: orderCode,
          message: 'Order processed successfully (Offline / Local Mode).'
        });
      }
    } catch (err) {
      console.error('Order creation error:', err);
      return res.status(500).json({ error: err.message });
    }
  }

  return res.status(405).json({ error: 'Method Not Allowed' });
};
