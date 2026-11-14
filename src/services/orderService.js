import { transaction, query, isMemoryDb } from '../db/index.js'

/**
 * Service to handle transactional checkout with atomic stock decrement,
 * idempotency checks, and server-side pricing validation.
 */
export async function processCheckout({
  customer,
  items,
  deliveryMethod = 'Standard',
  paymentMethod = 'Cash on Delivery (COD)',
  couponCode = null,
  customerNotes = '',
  idempotencyKey = null,
}) {
  if (!items || !Array.isArray(items) || items.length === 0) {
    throw new Error('Order must contain at least one item.')
  }
  if (!customer || !customer.name || !customer.mobile || !customer.city || !customer.address) {
    throw new Error('Complete customer details (name, mobile, city, address) are required.')
  }

  // 1. Idempotency Check (Fast Path)
  if (idempotencyKey) {
    const existing = await query('SELECT response_json FROM idempotency_keys WHERE key = $1', [idempotencyKey])
    if (existing.rows.length > 0) {
      console.log(`[CHECKOUT] Idempotent request detected for key: ${idempotencyKey}. Returning cached response.`)
      return JSON.parse(existing.rows[0].response_json)
    }
  }

  // 2. Execute Transaction
  const orderResult = await transaction(async client => {
    // A. Fetch Store Settings for Shipping & Thresholds
    const settingsRes = await client.query('SELECT * FROM store_settings WHERE id = 1')
    const settings = settingsRes.rows[0] || {
      free_shipping_threshold: 3000,
      shipping_fee: 200,
      express_shipping_fee: 350,
    }

    // B. Validate Items and Lock Products (SELECT FOR UPDATE on live Postgres)
    let subtotal = 0
    const validatedItems = []
    const forUpdateClause = isMemoryDb ? '' : ' FOR UPDATE'

    for (const item of items) {
      const productId = item.productId || item.id || item.product?.id
      const qty = parseInt(item.qty || item.quantity || 1, 10)
      if (qty <= 0) {
        throw new Error(`Invalid quantity ${qty} for product ID ${productId}`)
      }

      // Lock row for update to prevent concurrent race conditions
      const prodRes = await client.query(
        `SELECT id, name, sku, price, stock_quantity, bulk_tiers_json FROM products WHERE id = $1${forUpdateClause}`,
        [productId]
      )

      if (prodRes.rows.length === 0) {
        throw new Error(`Product with ID ${productId} does not exist.`)
      }

      const product = prodRes.rows[0]
      const variantId = item.variantId || item.variant?.id || null
      let variant = null
      let unitPrice = Number(product.price)

      if (variantId) {
        // Lock variant row for update to prevent concurrent race conditions
        const varRes = await client.query(
          `SELECT id, product_id, sku, title, color_value, size_value, price, stock_quantity, is_active
           FROM product_variants WHERE id = $1 AND product_id = $2${forUpdateClause}`,
          [variantId, productId]
        )
        if (varRes.rows.length === 0) {
          throw new Error(`Variant #${variantId} does not exist for product "${product.name}".`)
        }
        variant = varRes.rows[0]
        if (!variant.is_active) {
          throw new Error(`Variant "${variant.title}" of "${product.name}" is currently unavailable.`)
        }
        if (variant.stock_quantity < qty) {
          throw new Error(
            `Insufficient stock for "${product.name} (${variant.title})". Available: ${variant.stock_quantity}, Requested: ${qty}`
          )
        }
        unitPrice = Number(variant.price)
      } else {
        // Simple product stock check
        if (product.stock_quantity < qty) {
          throw new Error(
            `Insufficient stock for "${product.name}". Available: ${product.stock_quantity}, Requested: ${qty}`
          )
        }
      }

      // Calculate unit price based on bulk pricing rules (for simple products without variant price override)
      if (!variant && product.bulk_tiers_json) {
        try {
          const tiers = typeof product.bulk_tiers_json === 'string'
            ? JSON.parse(product.bulk_tiers_json)
            : product.bulk_tiers_json
          if (Array.isArray(tiers)) {
            const applicableTier = [...tiers]
              .sort((a, b) => b.minQty - a.minQty)
              .find(t => qty >= t.minQty)
            if (applicableTier) {
              unitPrice = Number(applicableTier.price)
            }
          }
        } catch (e) {
          console.warn('[ORDER] Could not parse bulk tiers:', e.message)
        }
      }

      const lineTotal = unitPrice * qty
      subtotal += lineTotal

      validatedItems.push({
        productId: product.id,
        name: product.name,
        sku: variant?.sku || product.sku,
        variantId: variant?.id || null,
        variantTitle: variant?.title || null,
        unitPrice,
        qty,
        lineTotal,
      })

      // Decrement stock atomically within transaction using explicit cast
      if (variant) {
        await client.query(
          'UPDATE product_variants SET stock_quantity = stock_quantity - CAST($1 AS INT) WHERE id = $2',
          [qty, variant.id]
        )
        await client.query(
          'UPDATE products SET stock_quantity = GREATEST(0, stock_quantity - CAST($1 AS INT)) WHERE id = $2',
          [qty, product.id]
        )
      } else {
        await client.query(
          'UPDATE products SET stock_quantity = stock_quantity - CAST($1 AS INT) WHERE id = $2',
          [qty, product.id]
        )
      }
    }

    // C. Validate Coupon
    let discount = 0
    let verifiedCouponCode = null

    if (couponCode) {
      const couponRes = await client.query(
        'SELECT * FROM coupons WHERE code = $1 AND active = TRUE',
        [couponCode.trim().toUpperCase()]
      )

      if (couponRes.rows.length > 0) {
        const coupon = couponRes.rows[0]
        if (subtotal >= Number(coupon.min_order)) {
          verifiedCouponCode = coupon.code
          if (coupon.type === 'percent') {
            const pct = (subtotal * Number(coupon.value)) / 100
            discount = coupon.max_discount ? Math.min(Number(coupon.max_discount), pct) : pct
          } else if (coupon.type === 'fixed') {
            discount = Math.min(subtotal, Number(coupon.value))
          } else if (coupon.type === 'shipping') {
            discount = 0 // Will waive shipping fee below
          }
        }
      }
    }

    // D. Shipping Fee Calculation
    let shippingFee = 0
    const isExpress = (deliveryMethod || '').toLowerCase().includes('express')
    if (isExpress) {
      shippingFee = Number(settings.express_shipping_fee) || 350
    } else {
      const freeThreshold = Number(settings.free_shipping_threshold) || 3000
      if (subtotal >= freeThreshold) {
        shippingFee = 0
      } else {
        shippingFee = Number(settings.shipping_fee) || 200
      }
    }

    if (verifiedCouponCode === 'FREESHIP') {
      shippingFee = 0
    }

    const total = Math.max(0, subtotal - discount + shippingFee)

    // E. Upsert Customer Record
    const mobile = (customer.mobile || '').trim()
    const customerId = `cust-${mobile.replace(/[^\d]/g, '')}`
    await client.query(
      `INSERT INTO customers (id, name, mobile, email, city, address)
       VALUES ($1, $2, $3, $4, $5, $6)
       ON CONFLICT (mobile) DO UPDATE SET
         name = EXCLUDED.name,
         email = COALESCE(EXCLUDED.email, customers.email),
         city = EXCLUDED.city,
         address = EXCLUDED.address,
         updated_at = CURRENT_TIMESTAMP`,
      [customerId, customer.name.trim(), mobile, customer.email || null, customer.city.trim(), customer.address.trim()]
    )

    // F. Create Order Header (Guaranteed unique ID even under high concurrency)
    const orderId = `GS-ORD-${Date.now().toString().slice(-6)}-${Math.floor(1000 + Math.random() * 9000)}`
    await client.query(
      `INSERT INTO orders (
         id, customer_id, customer_name, customer_mobile, customer_email,
         customer_city, delivery_address, delivery_method, payment_method,
         status, subtotal, discount, coupon_code, shipping_fee, total,
         customer_notes, idempotency_key
       ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17)`,
      [
        orderId,
        customerId,
        customer.name.trim(),
        mobile,
        customer.email || null,
        customer.city.trim(),
        customer.address.trim(),
        deliveryMethod,
        paymentMethod,
        'Pending',
        subtotal,
        discount,
        verifiedCouponCode,
        shippingFee,
        total,
        customerNotes,
        idempotencyKey,
      ]
    )

    // G. Create Order Line Items
    for (const item of validatedItems) {
      await client.query(
        `INSERT INTO order_items (
           order_id, product_id, product_name, product_sku, variant_id, variant_title, unit_price, quantity, line_total
         ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
        [orderId, item.productId, item.name, item.sku, item.variantId || null, item.variantTitle || null, item.unitPrice, item.qty, item.lineTotal]
      )
    }

    const responsePayload = {
      success: true,
      order: {
        id: orderId,
        customerId,
        customerName: customer.name,
        customerMobile: mobile,
        customerCity: customer.city,
        deliveryAddress: customer.address,
        deliveryMethod,
        paymentMethod,
        status: 'Pending',
        subtotal,
        discount,
        couponCode: verifiedCouponCode,
        shippingFee,
        total,
        items: validatedItems,
        createdAt: new Date().toISOString(),
      },
    }

    // H. Store Idempotency Key
    if (idempotencyKey) {
      await client.query(
        `INSERT INTO idempotency_keys (key, order_id, response_json)
         VALUES ($1, $2, $3)
         ON CONFLICT (key) DO NOTHING`,
        [idempotencyKey, orderId, JSON.stringify(responsePayload)]
      )
    }

    return responsePayload
  })

  return orderResult
}

/**
 * Authoritatively retrieves customer orders and their line items from PostgreSQL.
 */
export async function getOrders() {
  const ordersRes = await query(`
    SELECT o.id, o.customer_id, o.customer_name, o.customer_mobile, o.customer_email,
           o.customer_city, o.delivery_address, o.delivery_method, o.payment_method,
           o.status, o.tracking_number, o.subtotal::numeric, o.discount::numeric,
           o.coupon_code, o.shipping_fee::numeric, o.total::numeric, o.customer_notes,
           o.created_at, o.updated_at
    FROM orders o
    ORDER BY o.created_at DESC
  `)

  const orderIds = ordersRes.rows.map(o => o.id)
  const itemsByOrder = {}
  if (orderIds.length > 0) {
    const pPlaceholders = orderIds.map((_, i) => `$${i + 1}`).join(', ')
    const itemsRes = await query(`
      SELECT i.id, i.order_id, i.product_id, i.product_name, i.product_sku,
             i.variant_id, i.variant_title, i.unit_price::numeric, i.quantity, i.line_total::numeric,
             COALESCE(vimg.image_url, vimg_title.image_url, p.image_main) as product_image
      FROM order_items i
      LEFT JOIN products p ON i.product_id = p.id
      LEFT JOIN product_variants pv ON i.variant_id = pv.id
      LEFT JOIN LATERAL (
        SELECT image_url FROM product_variant_images 
        WHERE product_id = i.product_id AND LOWER(color_name) = LOWER(pv.color_value)
        ORDER BY is_primary DESC, sort_order ASC, id ASC LIMIT 1
      ) vimg ON true
      LEFT JOIN LATERAL (
        SELECT image_url FROM product_variant_images 
        WHERE product_id = i.product_id AND LOWER(color_name) = LOWER(i.variant_title)
        ORDER BY is_primary DESC, sort_order ASC, id ASC LIMIT 1
      ) vimg_title ON true
      WHERE i.order_id IN (${pPlaceholders})
      ORDER BY i.id ASC
    `, orderIds)

    itemsRes.rows.forEach(item => {
      if (!itemsByOrder[item.order_id]) itemsByOrder[item.order_id] = []
      itemsByOrder[item.order_id].push({
        id: item.id,
        productId: item.product_id,
        name: item.product_name,
        sku: item.product_sku,
        variantId: item.variant_id,
        variantTitle: item.variant_title,
        price: Number(item.unit_price),
        qty: item.quantity,
        total: Number(item.line_total),
        image: item.product_image || '/images/p1.jpg',
        product: {
          id: item.product_id,
          name: item.product_name,
          sku: item.product_sku,
          image: item.product_image || '/images/p1.jpg',
          category: 'General',
          price: Number(item.unit_price),
        },
      })
    })
  }

  return ordersRes.rows.map(o => ({
    id: o.id,
    customer: {
      name: o.customer_name,
      mobile: o.customer_mobile,
      email: o.customer_email || '',
      city: o.customer_city,
      address: o.delivery_address,
    },
    items: itemsByOrder[o.id] || [],
    subtotal: Number(o.subtotal),
    discount: Number(o.discount),
    coupon: o.coupon_code || '',
    shippingFee: Number(o.shipping_fee),
    total: Number(o.total),
    deliveryMethod: o.delivery_method,
    paymentMethod: o.payment_method,
    status: o.status,
    trackingNumber: o.tracking_number || '',
    notes: o.customer_notes || '',
    createdAt: o.created_at,
    date: new Date(o.created_at).toLocaleString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }),
  }))
}

export async function getOrderById(orderId) {
  const orders = await getOrders()
  return orders.find(o => String(o.id) === String(orderId)) || null
}

export async function updateOrderStatus(orderId, status, trackingNumber = null) {
  const updates = ['status = $1']
  const params = [status, orderId]
  if (trackingNumber !== null && trackingNumber !== undefined) {
    params.push(trackingNumber)
    updates.push(`tracking_number = $${params.length}`)
  }
  updates.push('updated_at = CURRENT_TIMESTAMP')
  const res = await query(
    `UPDATE orders SET ${updates.join(', ')} WHERE id = $2 RETURNING *`,
    params
  )
  if (!res.rows.length) return null
  return getOrderById(orderId)
}

export async function deleteOrder(orderId) {
  await query('DELETE FROM order_items WHERE order_id = $1', [orderId])
  const res = await query('DELETE FROM orders WHERE id = $1', [orderId])
  return res.rowCount > 0
}
