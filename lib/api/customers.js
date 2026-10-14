const fs = require('fs');
const path = require('path');
const { getDb } = require('./db');
const { setCorsHeaders } = require('./cors');

const DATA_DIR = path.join(process.cwd(), 'data');
const ORDERS_FILE = path.join(DATA_DIR, 'orders.json');

async function getRawOrders(sql) {
  if (sql) {
    try {
      const rows = await sql`
        SELECT id, order_code as "orderCode", customer_name as "customerName",
               customer_phone as "customerPhone", customer_address as "customerAddress",
               customer_city as "customerCity", payment_method as "paymentMethod",
               subtotal, shipping_fee as "shippingFee", grand_total as "grandTotal",
               status, courier, tracking_number as "trackingNumber", notes, created_at as "createdAt"
        FROM orders
        ORDER BY created_at DESC
      `;
      if (rows && rows.length > 0) return rows;
    } catch (e) {}
  }

  try {
    if (fs.existsSync(ORDERS_FILE)) {
      const data = JSON.parse(fs.readFileSync(ORDERS_FILE, 'utf8'));
      if (Array.isArray(data)) return data;
    }
  } catch (e) {}

  return [];
}

module.exports = async function handler(req, res) {
  setCorsHeaders(req, res);

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const sql = getDb();
  const url = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
  const idParam = url.searchParams.get('id');
  const searchParam = (url.searchParams.get('q') || url.searchParams.get('search') || '').toLowerCase().trim();

  try {
    const orders = await getRawOrders(sql);

    // Group orders by unique customer phone (or clean customer name)
    const customerMap = new Map();

    for (const ord of orders) {
      const phone = (ord.customerPhone || ord.customer?.phone || '').trim();
      const name = (ord.customerName || ord.customer?.name || 'Guest Customer').trim();
      const address = (ord.customerAddress || ord.customer?.address || '').trim();
      const city = (ord.customerCity || ord.customer?.city || 'Pakistan').trim();
      const total = parseFloat(ord.grandTotal) || parseFloat(ord.total) || 0;
      const createdAt = ord.createdAt || new Date().toISOString();

      // Identifier key: phone is primary unique key; if phone missing, use lowercase name
      const key = phone ? phone.replace(/[^0-9]/g, '') : name.toLowerCase();
      if (!key) continue;

      if (!customerMap.has(key)) {
        customerMap.set(key, {
          id: `cust_${key}`,
          name,
          phone: phone || 'N/A',
          email: `${key}@customer.saveandsmile.pk`,
          status: 'active',
          segment: 'new',
          ordersCount: 0,
          totalSpent: 0,
          averageOrderValue: 0,
          firstOrderAt: createdAt,
          lastOrderAt: createdAt,
          createdAt,
          addresses: [
            {
              line1: address || 'Standard Delivery Address',
              city,
              region: city,
              postalCode: '74000',
              country: 'Pakistan',
              phone
            }
          ],
          marketingOptIn: true,
          orders: []
        });
      }

      const cust = customerMap.get(key);
      cust.ordersCount += 1;
      cust.totalSpent += total;
      if (new Date(createdAt) > new Date(cust.lastOrderAt)) {
        cust.lastOrderAt = createdAt;
      }
      if (new Date(createdAt) < new Date(cust.firstOrderAt)) {
        cust.firstOrderAt = createdAt;
      }
      cust.orders.push(ord);
    }

    // Calculate customer metrics & segments
    const allCustomers = Array.from(customerMap.values()).map(c => {
      c.averageOrderValue = c.ordersCount > 0 ? Math.round(c.totalSpent / c.ordersCount) : 0;
      if (c.ordersCount >= 3 || c.totalSpent >= 10000) {
        c.segment = 'vip';
      } else if (c.ordersCount >= 2) {
        c.segment = 'returning';
      } else {
        c.segment = 'new';
      }
      return c;
    });

    // Handle single customer lookup: /api/customers?id=...
    if (idParam) {
      const match = allCustomers.find(c => c.id === idParam || c.phone.includes(idParam));
      if (!match) {
        return res.status(404).json({ success: false, error: 'Customer not found' });
      }
      return res.status(200).json({ success: true, customer: match });
    }

    // Filter by search query if provided
    let filtered = allCustomers;
    if (searchParam) {
      filtered = allCustomers.filter(c =>
        c.name.toLowerCase().includes(searchParam) ||
        c.phone.toLowerCase().includes(searchParam) ||
        c.addresses.some(a => a.city.toLowerCase().includes(searchParam))
      );
    }

    return res.status(200).json({
      success: true,
      count: filtered.length,
      customers: filtered
    });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
};
