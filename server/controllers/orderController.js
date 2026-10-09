const { getPool, isMssqlConnected, sql } = require('../config/mssql');
const fs = require('fs');
const path = require('path');

// Fallback in-memory orders
let fallbackOrders = [];

/**
 * Generate unique Order Number (e.g. SS-20261009-8472)
 */
function generateOrderNumber() {
  const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const randomSuffix = Math.floor(1000 + Math.random() * 9000);
  return `SS-${dateStr}-${randomSuffix}`;
}

/**
 * Create Order (Customer Checkout)
 */
async function createOrder(req, res, next) {
  try {
    let customer = req.body.customer;
    if (!customer && req.body.customerName) {
      customer = {
        fullName: req.body.customerName,
        phone: req.body.customerPhone,
        address: req.body.customerAddress,
        city: req.body.customerCity || 'Karachi',
        email: req.body.customerEmail || null
      };
    }

    const {
      items,
      shippingAddress = customer ? customer.address : '',
      paymentMethod = 'COD',
      notes = ''
    } = req.body;

    if (!customer || !customer.phone || !customer.fullName) {
      return res.status(400).json({ success: false, message: 'Customer full name and phone number are required.' });
    }

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ success: false, message: 'Cart items are required.' });
    }

    const orderNumber = generateOrderNumber();

    if (isMssqlConnected()) {
      const pool = getPool();
      const transaction = new sql.Transaction(pool);

      await transaction.begin();

      try {
        // 1. Find or create Customer
        const findCustRequest = new sql.Request(transaction);
        const custCheck = await findCustRequest
          .input('phone', sql.NVarChar(50), customer.phone)
          .query(`SELECT id, total_orders, total_spent FROM Customers WHERE phone = @phone`);

        let customerId;
        if (custCheck.recordset && custCheck.recordset.length > 0) {
          customerId = custCheck.recordset[0].id;
          const updateCustRequest = new sql.Request(transaction);
          await updateCustRequest
            .input('id', sql.Int, customerId)
            .input('name', sql.NVarChar(200), customer.fullName)
            .input('email', sql.NVarChar(255), customer.email || null)
            .input('address', sql.NVarChar(sql.MAX), customer.address || shippingAddress || null)
            .input('city', sql.NVarChar(100), customer.city || 'Karachi')
            .query(`
              UPDATE Customers 
              SET full_name = COALESCE(@name, full_name),
                  email = COALESCE(@email, email),
                  address = COALESCE(@address, address),
                  city = COALESCE(@city, city),
                  total_orders = total_orders + 1,
                  updated_at = GETDATE()
              WHERE id = @id
            `);
        } else {
          const insertCustRequest = new sql.Request(transaction);
          const newCust = await insertCustRequest
            .input('name', sql.NVarChar(200), customer.fullName)
            .input('phone', sql.NVarChar(50), customer.phone)
            .input('email', sql.NVarChar(255), customer.email || null)
            .input('address', sql.NVarChar(sql.MAX), customer.address || shippingAddress || null)
            .input('city', sql.NVarChar(100), customer.city || 'Karachi')
            .query(`
              INSERT INTO Customers (full_name, phone, email, address, city, total_orders, total_spent)
              OUTPUT INSERTED.id
              VALUES (@name, @phone, @email, @address, @city, 1, 0)
            `);
          customerId = newCust.recordset[0].id;
        }

        // 2. Recalculate prices and verify items
        let subtotal = 0;
        const verifiedItems = [];

        for (const item of items) {
          const prodReq = new sql.Request(transaction);
          const prodRes = await prodReq
            .input('idOrCode', sql.NVarChar(100), String(item.id || item.code))
            .query(`SELECT id, sku, code, name, title, price, stock_quantity FROM Products WHERE id = TRY_CAST(@idOrCode AS INT) OR code = @idOrCode OR sku = @idOrCode`);

          let unitPrice = parseFloat(item.price) || 0;
          let prodId = null;
          let prodName = item.title || item.name || 'Product';
          let prodSku = item.code || item.sku || 'N/A';

          if (prodRes.recordset && prodRes.recordset.length > 0) {
            const dbProd = prodRes.recordset[0];
            prodId = dbProd.id;
            prodName = dbProd.title || dbProd.name;
            prodSku = dbProd.sku || dbProd.code;
            unitPrice = parseFloat(dbProd.price); // Trust server price
          }

          const quantity = Math.max(1, parseInt(item.quantity || 1, 10));
          const lineTotal = unitPrice * quantity;
          subtotal += lineTotal;

          verifiedItems.push({
            productId: prodId,
            productName: prodName,
            sku: prodSku,
            price: unitPrice,
            quantity,
            lineTotal
          });
        }

        const shippingCost = subtotal >= 2000 ? 0 : 200; // Free shipping threshold or standard
        const totalAmount = subtotal + shippingCost;

        // 3. Insert Order
        const insertOrderReq = new sql.Request(transaction);
        const orderInsert = await insertOrderReq
          .input('orderNumber', sql.NVarChar(50), orderNumber)
          .input('customerId', sql.Int, customerId)
          .input('subtotal', sql.Decimal(12, 2), subtotal)
          .input('shippingCost', sql.Decimal(12, 2), shippingCost)
          .input('totalAmount', sql.Decimal(12, 2), totalAmount)
          .input('paymentMethod', sql.NVarChar(50), paymentMethod)
          .input('paymentStatus', sql.NVarChar(50), paymentMethod === 'COD' ? 'Pending' : 'Paid')
          .input('orderStatus', sql.NVarChar(50), 'Pending')
          .input('shippingName', sql.NVarChar(200), customer.fullName)
          .input('shippingPhone', sql.NVarChar(50), customer.phone)
          .input('shippingAddress', sql.NVarChar(sql.MAX), customer.address || shippingAddress)
          .input('shippingCity', sql.NVarChar(100), customer.city || 'Karachi')
          .input('notes', sql.NVarChar(sql.MAX), notes)
          .query(`
            INSERT INTO Orders (
              order_number, customer_id, subtotal, shipping_cost, total_amount,
              payment_method, payment_status, order_status,
              shipping_name, shipping_phone, shipping_address, shipping_city, notes
            )
            OUTPUT INSERTED.id, INSERTED.order_number, INSERTED.total_amount, INSERTED.created_at
            VALUES (
              @orderNumber, @customerId, @subtotal, @shippingCost, @totalAmount,
              @paymentMethod, @paymentStatus, @orderStatus,
              @shippingName, @shippingPhone, @shippingAddress, @shippingCity, @notes
            )
          `);

        const createdOrder = orderInsert.recordset[0];
        const orderId = createdOrder.id;

        // 4. Insert Order Items & Deduct Inventory
        for (const item of verifiedItems) {
          const itemReq = new sql.Request(transaction);
          await itemReq
            .input('orderId', sql.Int, orderId)
            .input('productId', sql.Int, item.productId)
            .input('productName', sql.NVarChar(255), item.productName)
            .input('sku', sql.NVarChar(100), item.sku)
            .input('price', sql.Decimal(12, 2), item.price)
            .input('quantity', sql.Int, item.quantity)
            .input('totalPrice', sql.Decimal(12, 2), item.lineTotal)
            .query(`
              INSERT INTO OrderItems (order_id, product_id, product_name, sku, unit_price, quantity, total_price)
              VALUES (@orderId, @productId, @productName, @sku, @price, @quantity, @totalPrice)
            `);

          // Stock deduction & movement tracking
          if (item.productId) {
            const stockReq = new sql.Request(transaction);
            await stockReq
              .input('productId', sql.Int, item.productId)
              .input('qty', sql.Int, item.quantity)
              .input('ref', sql.NVarChar(100), `Order #${orderNumber}`)
              .query(`
                UPDATE Products 
                SET stock_quantity = CASE WHEN stock_quantity >= @qty THEN stock_quantity - @qty ELSE 0 END
                WHERE id = @productId;

                INSERT INTO InventoryMovements (product_id, movement_type, quantity, reference, reason)
                VALUES (@productId, 'SALE', -@qty, @ref, 'Customer order checkout');
              `);
          }
        }

        // Commit transaction
        await transaction.commit();

        if (req.logAudit) {
          req.logAudit('CREATE_ORDER', 'Order', orderId, { orderNumber, totalAmount, customerPhone: customer.phone });
        }

        return res.status(201).json({
          success: true,
          message: 'Order placed successfully!',
          orderNumber,
          orderId,
          totalAmount,
          order: {
            orderNumber,
            id: orderId,
            items: verifiedItems,
            total: totalAmount,
            subtotal,
            shipping: shippingCost,
            customer,
            status: 'Pending',
            createdAt: createdOrder.created_at
          }
        });
      } catch (txErr) {
        await transaction.rollback();
        throw txErr;
      }
    }

    // JSON / Memory Fallback
    const subtotal = items.reduce((sum, item) => sum + (parseFloat(item.price || 0) * parseInt(item.quantity || 1, 10)), 0);
    const shippingCost = subtotal >= 2000 ? 0 : 200;
    const totalAmount = subtotal + shippingCost;

    const fallbackOrder = {
      id: Date.now(),
      orderNumber,
      customer,
      items,
      subtotal,
      shippingCost,
      totalAmount,
      paymentMethod,
      orderStatus: 'Pending',
      createdAt: new Date().toISOString()
    };

    fallbackOrders.unshift(fallbackOrder);

    return res.status(201).json({
      success: true,
      message: 'Order placed successfully (memory mode)!',
      orderNumber,
      orderId: fallbackOrder.id,
      totalAmount,
      order: fallbackOrder
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Track Order by Order Number or Phone
 */
async function trackOrder(req, res, next) {
  try {
    const { identifier } = req.params;

    if (!identifier) {
      return res.status(400).json({ success: false, message: 'Order number or phone is required.' });
    }

    if (isMssqlConnected()) {
      const pool = getPool();
      const orderReq = new sql.Request(pool);
      const orderRes = await orderReq
        .input('id', sql.NVarChar(100), identifier.trim())
        .query(`
          SELECT 
            o.id,
            o.order_number AS orderNumber,
            o.subtotal,
            o.shipping_cost AS shippingCost,
            o.total_amount AS totalAmount,
            o.payment_method AS paymentMethod,
            o.payment_status AS paymentStatus,
            o.order_status AS orderStatus,
            o.shipping_name AS shippingName,
            o.shipping_phone AS shippingPhone,
            o.shipping_address AS shippingAddress,
            o.shipping_city AS shippingCity,
            o.created_at AS createdAt
          FROM Orders o
          WHERE o.order_number = @id OR o.shipping_phone = @id
          ORDER BY o.created_at DESC
        `);

      if (!orderRes.recordset || orderRes.recordset.length === 0) {
        return res.status(404).json({ success: false, message: 'No orders found matching this order number or phone.' });
      }

      const order = orderRes.recordset[0];

      // Get items
      const itemsReq = new sql.Request(pool);
      const itemsRes = await itemsReq
        .input('orderId', sql.Int, order.id)
        .query(`
          SELECT id, product_name AS productName, sku, unit_price AS price, quantity, total_price AS totalPrice
          FROM OrderItems
          WHERE order_id = @orderId
        `);

      order.items = itemsRes.recordset;

      return res.json({
        success: true,
        order
      });
    }

    // Fallback
    const found = fallbackOrders.find(o => o.orderNumber === identifier || (o.customer && o.customer.phone === identifier));
    if (found) {
      return res.json({ success: true, order: found });
    }

    return res.status(404).json({ success: false, message: 'Order not found.' });
  } catch (error) {
    next(error);
  }
}

/**
 * Get all orders (Admin)
 */
async function getOrders(req, res, next) {
  try {
    const { page = 1, limit = 50, status = '', search = '' } = req.query;
    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.max(1, Math.min(100, parseInt(limit, 10) || 50));
    const offset = (pageNum - 1) * limitNum;

    if (isMssqlConnected()) {
      const pool = getPool();
      let whereClauses = [];
      const params = {};

      if (status) {
        whereClauses.push('o.order_status = @status');
        params.status = status;
      }

      if (search) {
        whereClauses.push('(o.order_number LIKE @search OR o.shipping_name LIKE @search OR o.shipping_phone LIKE @search)');
        params.search = `%${search}%`;
      }

      const whereSql = whereClauses.length ? `WHERE ${whereClauses.join(' AND ')}` : '';

      const countReq = new sql.Request(pool);
      Object.keys(params).forEach(k => countReq.input(k, params[k]));
      const countRes = await countReq.query(`SELECT COUNT(*) AS total FROM Orders o ${whereSql}`);
      const total = countRes.recordset[0].total;

      const dataReq = new sql.Request(pool);
      Object.keys(params).forEach(k => dataReq.input(k, params[k]));
      dataReq.input('offset', sql.Int, offset);
      dataReq.input('limit', sql.Int, limitNum);

      const dataRes = await dataReq.query(`
        SELECT 
          o.id,
          o.order_number AS orderNumber,
          o.subtotal,
          o.shipping_cost AS shippingCost,
          o.total_amount AS totalAmount,
          o.payment_method AS paymentMethod,
          o.payment_status AS paymentStatus,
          o.order_status AS orderStatus,
          o.shipping_name AS shippingName,
          o.shipping_phone AS shippingPhone,
          o.shipping_address AS shippingAddress,
          o.shipping_city AS shippingCity,
          o.created_at AS createdAt
        FROM Orders o
        ${whereSql}
        ORDER BY o.created_at DESC
        OFFSET @offset ROWS FETCH NEXT @limit ROWS ONLY
      `);

      return res.json({
        success: true,
        total,
        page: pageNum,
        totalPages: Math.ceil(total / limitNum),
        orders: dataRes.recordset
      });
    }

    return res.json({
      success: true,
      total: fallbackOrders.length,
      page: 1,
      totalPages: 1,
      orders: fallbackOrders
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Update Order Status
 */
async function updateOrderStatus(req, res, next) {
  try {
    const { id } = req.params;
    const { status, paymentStatus } = req.body;

    if (isMssqlConnected()) {
      const pool = getPool();
      const updateReq = new sql.Request(pool);
      await updateReq
        .input('id', sql.Int, id)
        .input('status', sql.NVarChar(50), status || null)
        .input('paymentStatus', sql.NVarChar(50), paymentStatus || null)
        .query(`
          UPDATE Orders 
          SET order_status = COALESCE(@status, order_status),
              payment_status = COALESCE(@paymentStatus, payment_status),
              updated_at = GETDATE()
          WHERE id = @id
        `);

      if (req.logAudit) {
        req.logAudit('UPDATE_ORDER_STATUS', 'Order', id, { status, paymentStatus });
      }

      return res.json({ success: true, message: 'Order updated successfully.' });
    }

    const order = fallbackOrders.find(o => String(o.id) === String(id) || o.orderNumber === id);
    if (order) {
      if (status) order.orderStatus = status;
      if (paymentStatus) order.paymentStatus = paymentStatus;
    }

    return res.json({ success: true, message: 'Order status updated (memory mode).' });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  createOrder,
  trackOrder,
  getOrders,
  updateOrderStatus
};
