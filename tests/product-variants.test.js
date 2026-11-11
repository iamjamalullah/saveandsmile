import assert from 'assert'
import { getDatabasePool, query, transaction } from '../src/db/index.js'
import { runMigration } from '../migrate.js'
import { processCheckout } from '../src/services/orderService.js'

console.log('===============================================================')
console.log('   ADVANCED PRODUCT VARIANTS (COLOR, SIZE & IMAGES) TEST SUITE')
console.log('===============================================================\n')

async function runVariantsTestSuite() {
  const pool = getDatabasePool()

  console.log('[SETUP] Running database migration and verifying schema tables...')
  await runMigration()

  // ── TEST 1: SCHEMA & RELATIONAL STRUCTURE VERIFICATION ──
  console.log('\n--- TEST 1: SCHEMA & RELATIONAL STRUCTURE VERIFICATION ---')
  const tablesRes = await pool.query(`
    SELECT table_name 
    FROM information_schema.tables 
    WHERE table_schema = 'public' 
      AND table_name IN ('products', 'product_options', 'product_option_values', 'product_variants', 'product_variant_images', 'order_items')
  `)
  const foundTables = tablesRes.rows.map(r => r.table_name)
  assert(foundTables.includes('product_options'), 'product_options table must exist')
  assert(foundTables.includes('product_option_values'), 'product_option_values table must exist')
  assert(foundTables.includes('product_variants'), 'product_variants table must exist')
  assert(foundTables.includes('product_variant_images'), 'product_variant_images table must exist')

  const colsRes = await pool.query(`
    SELECT column_name 
    FROM information_schema.columns 
    WHERE table_name = 'products' AND column_name IN ('has_variants', 'variant_config')
  `)
  assert.strictEqual(colsRes.rows.length, 2, 'products table must contain has_variants and variant_config columns')

  const orderItemCols = await pool.query(`
    SELECT column_name 
    FROM information_schema.columns 
    WHERE table_name = 'order_items' AND column_name IN ('variant_id', 'variant_title')
  `)
  assert.strictEqual(orderItemCols.rows.length, 2, 'order_items table must contain variant_id and variant_title columns')
  console.log('✓ TEST 1 PASSED: Normalized relational schema and variant columns verified.')

  // ── TEST 2: SIMPLE PRODUCT BACKWARD COMPATIBILITY ──
  console.log('\n--- TEST 2: SIMPLE PRODUCT BACKWARD COMPATIBILITY ---')
  // Product #1 is a simple product
  const p1 = (await pool.query('SELECT id, name, price, stock_quantity, has_variants FROM products WHERE id = 1')).rows[0]
  assert.strictEqual(p1.has_variants, false, 'Product 1 should have has_variants=false')
  const prevStock = p1.stock_quantity

  const simpleOrder = await processCheckout({
    customer: { name: 'Simple Customer', mobile: '03001234567', city: 'Karachi', address: 'DHA Phase 5' },
    items: [{ productId: 1, qty: 1 }],
    deliveryMethod: 'Standard',
    paymentMethod: 'Cash on Delivery',
  })
  assert(simpleOrder.order?.id, 'Simple order must be created successfully')
  const p1After = (await pool.query('SELECT stock_quantity FROM products WHERE id = 1')).rows[0]
  assert.strictEqual(p1After.stock_quantity, prevStock - 1, 'Simple product stock should decrement by 1')
  console.log(`✓ TEST 2 PASSED: Simple product without variants works seamlessly (Stock ${prevStock} -> ${p1After.stock_quantity}).`)

  // ── TEST 3: COLOR-ONLY PRODUCT VARIANT CREATION & ATOMIC DECREMENT ──
  console.log('\n--- TEST 3: COLOR-ONLY PRODUCT VARIANT CREATION & ATOMIC DECREMENT ---')
  // Create a product with color variants
  const newProduct = await transaction(async (client) => {
    const maxP = (await client.query('SELECT COALESCE(MAX(id), 0) AS max FROM products')).rows[0].max
    const prodId = Number(maxP) + 1

    const prodRes = await client.query(`
      INSERT INTO products (id, sku, name, slug, category_name, group_name, price, old_price, stock_quantity, image_main, has_variants, variant_config)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
      RETURNING id, name, price, stock_quantity
    `, [prodId, 'GS-T900-TEST', 'T900 Ultra Smartwatch', 't900-ultra-smartwatch-test', 'Smartwatches', 'trending', 2500, 3200, 15, '/images/p1.jpg', true, 'color'])

    // Insert Color Option
    const optRes = await client.query(`
      INSERT INTO product_options (product_id, name, sort_order)
      VALUES ($1, 'Color', 1)
      RETURNING id
    `, [prodId])
    const optId = optRes.rows[0].id

    // Insert Option Values
    const blackVal = (await client.query(`
      INSERT INTO product_option_values (option_id, product_id, value, hex_code, sort_order)
      VALUES ($1, $2, 'Midnight Black', '#111827', 1)
      RETURNING id
    `, [optId, prodId])).rows[0].id

    const orangeVal = (await client.query(`
      INSERT INTO product_option_values (option_id, product_id, value, hex_code, sort_order)
      VALUES ($1, $2, 'Sunset Orange', '#ea580c', 2)
      RETURNING id
    `, [optId, prodId])).rows[0].id

    const maxV = (await client.query('SELECT COALESCE(MAX(id), 0) AS max FROM product_variants')).rows[0].max
    const vId1 = Number(maxV) + 1
    const vId2 = Number(maxV) + 2

    // Insert Variants
    const varBlack = (await client.query(`
      INSERT INTO product_variants (id, product_id, sku, title, color_value, price, old_price, stock_quantity, is_active)
      VALUES ($1, $2, 'GS-T900-BLK', 'Midnight Black', 'Midnight Black', 2500, 3200, 10, true)
      RETURNING id, title, stock_quantity, price
    `, [vId1, prodId])).rows[0]

    const varOrange = (await client.query(`
      INSERT INTO product_variants (id, product_id, sku, title, color_value, price, old_price, stock_quantity, is_active)
      VALUES ($1, $2, 'GS-T900-ORG', 'Sunset Orange', 'Sunset Orange', 2600, 3200, 5, true)
      RETURNING id, title, stock_quantity, price
    `, [vId2, prodId])).rows[0]

    // Insert Color Variant Images
    await client.query(`
      INSERT INTO product_variant_images (product_id, color_name, image_url, is_primary, sort_order)
      VALUES ($1, 'Midnight Black', '/uploads/t900-black.webp', true, 1),
             ($1, 'Sunset Orange', '/uploads/t900-orange.webp', true, 1)
    `, [prodId])

    return { id: prodId, varBlack, varOrange }
  })

  // Order 2 units of "Midnight Black"
  const orderColor = await processCheckout({
    customer: { name: 'Color Buyer', mobile: '03121234567', city: 'Lahore', address: 'Gulberg III' },
    items: [{ productId: newProduct.id, variantId: newProduct.varBlack.id, qty: 2 }],
    deliveryMethod: 'Standard',
    paymentMethod: 'Cash on Delivery',
  })

  assert(orderColor.order?.id, 'Color variant order created')
  assert.strictEqual(orderColor.order.subtotal, 5000, 'Subtotal should be 2 * 2500 = 5000')

  // Check stocks
  const blackStockAfter = (await pool.query('SELECT stock_quantity FROM product_variants WHERE id = $1', [newProduct.varBlack.id])).rows[0].stock_quantity
  const orangeStockAfter = (await pool.query('SELECT stock_quantity FROM product_variants WHERE id = $1', [newProduct.varOrange.id])).rows[0].stock_quantity
  const parentStockAfter = (await pool.query('SELECT stock_quantity FROM products WHERE id = $1', [newProduct.id])).rows[0].stock_quantity

  assert.strictEqual(blackStockAfter, 8, 'Midnight Black stock must decrement from 10 to 8')
  assert.strictEqual(orangeStockAfter, 5, 'Sunset Orange stock must remain untouched at 5')
  assert.strictEqual(parentStockAfter, 13, 'Parent product stock must decrement from 15 to 13')
  console.log('✓ TEST 3 PASSED: Color variant stock decremented atomically; sibling variant untouched.')

  // ── TEST 4: COMBINED COLOR + SIZE MATRIX (CARTESIAN PRODUCT) ──
  console.log('\n--- TEST 4: COMBINED COLOR + SIZE MATRIX (CARTESIAN PRODUCT) ---')
  const combinedProduct = await transaction(async (client) => {
    const maxP = (await client.query('SELECT COALESCE(MAX(id), 0) AS max FROM products')).rows[0].max
    const prodId = Number(maxP) + 1

    const prodRes = await client.query(`
      INSERT INTO products (id, sku, name, slug, category_name, group_name, price, stock_quantity, image_main, has_variants, variant_config)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      RETURNING id
    `, [prodId, 'GS-SHOE-TEST', 'Pro Sports Shoes', 'pro-sports-shoes-test', 'Footwear', 'new', 3000, 20, '/images/p2.jpg', true, 'both'])

    // Colors: Red, Blue
    // Sizes: 40, 42
    const maxV = (await client.query('SELECT COALESCE(MAX(id), 0) AS max FROM product_variants')).rows[0].max
    let nextV = Number(maxV)

    const vRed40 = (await client.query(`
      INSERT INTO product_variants (id, product_id, sku, title, color_value, size_value, price, stock_quantity, is_active)
      VALUES ($1, $2, 'GS-SHOE-RED-40', 'Red / 40', 'Red', '40', 3000, 5, true)
      RETURNING id, title, stock_quantity
    `, [++nextV, prodId])).rows[0]

    const vRed42 = (await client.query(`
      INSERT INTO product_variants (id, product_id, sku, title, color_value, size_value, price, stock_quantity, is_active)
      VALUES ($1, $2, 'GS-SHOE-RED-42', 'Red / 42', 'Red', '42', 3200, 5, true)
      RETURNING id, title, stock_quantity
    `, [++nextV, prodId])).rows[0]

    const vBlue40 = (await client.query(`
      INSERT INTO product_variants (id, product_id, sku, title, color_value, size_value, price, stock_quantity, is_active)
      VALUES ($1, $2, 'GS-SHOE-BLU-40', 'Blue / 40', 'Blue', '40', 3000, 5, true)
      RETURNING id, title, stock_quantity
    `, [++nextV, prodId])).rows[0]

    const vBlue42 = (await client.query(`
      INSERT INTO product_variants (id, product_id, sku, title, color_value, size_value, price, stock_quantity, is_active)
      VALUES ($1, $2, 'GS-SHOE-BLU-42', 'Blue / 42', 'Blue', '42', 3200, 5, true)
      RETURNING id, title, stock_quantity
    `, [++nextV, prodId])).rows[0]

    return { id: prodId, vRed40, vRed42, vBlue40, vBlue42 }
  })

  // Order Red / 42 (Price 3200)
  const orderCombo = await processCheckout({
    customer: { name: 'Shoe Customer', mobile: '03331234567', city: 'Islamabad', address: 'F-7/2' },
    items: [{ productId: combinedProduct.id, variantId: combinedProduct.vRed42.id, qty: 1 }],
    deliveryMethod: 'Standard',
    paymentMethod: 'Cash on Delivery',
  })
  assert.strictEqual(orderCombo.order.subtotal, 3200, 'Subtotal should correctly reflect the variant price override of 3200')
  const red42Stock = (await pool.query('SELECT stock_quantity FROM product_variants WHERE id = $1', [combinedProduct.vRed42.id])).rows[0].stock_quantity
  assert.strictEqual(red42Stock, 4, 'Red / 42 stock decremented to 4')
  console.log('✓ TEST 4 PASSED: Combined Color + Size matrix handled price overrides and inventory decrement.')

  // ── TEST 5: REJECTION OF OUT-OF-STOCK & INACTIVE VARIANTS ──
  console.log('\n--- TEST 5: REJECTION OF OUT-OF-STOCK & INACTIVE VARIANTS ---')
  // Try to buy 99 units of Red / 42 (only 4 available)
  let rejectedStock = false
  try {
    await processCheckout({
      customer: { name: 'Greedy Buyer', mobile: '03000000000', city: 'Karachi', address: 'Saddar' },
      items: [{ productId: combinedProduct.id, variantId: combinedProduct.vRed42.id, qty: 99 }],
      deliveryMethod: 'Standard',
      paymentMethod: 'Cash on Delivery',
    })
  } catch (err) {
    rejectedStock = true
    assert(err.message.includes('Insufficient stock'), `Expected insufficient stock error, got: ${err.message}`)
  }
  assert(rejectedStock, 'Must reject order when requested qty exceeds variant stock')

  // Verify stock remained untouched
  const red42StockAfterReject = (await pool.query('SELECT stock_quantity FROM product_variants WHERE id = $1', [combinedProduct.vRed42.id])).rows[0].stock_quantity
  assert.strictEqual(red42StockAfterReject, 4, 'Stock must remain 4 after rollback')

  // Deactivate variant Blue / 40 and test rejection
  await pool.query('UPDATE product_variants SET is_active = false WHERE id = $1', [combinedProduct.vBlue40.id])
  let rejectedInactive = false
  try {
    await processCheckout({
      customer: { name: 'Buyer', mobile: '03000000000', city: 'Karachi', address: 'Saddar' },
      items: [{ productId: combinedProduct.id, variantId: combinedProduct.vBlue40.id, qty: 1 }],
      deliveryMethod: 'Standard',
      paymentMethod: 'Cash on Delivery',
    })
  } catch (err) {
    rejectedInactive = true
    assert(err.message.includes('unavailable'), `Expected unavailable error, got: ${err.message}`)
  }
  assert(rejectedInactive, 'Must reject order for inactive variant')
  console.log('✓ TEST 5 PASSED: Out-of-stock and inactive variants safely rejected with transaction rollback.')

  // ── TEST 6: CONCURRENCY RACE CONDITION PREVENTION ──
  console.log('\n--- TEST 6: CONCURRENCY RACE CONDITION PREVENTION ---')
  // Create a limited-edition variant with stock = 2
  const flashProduct = await transaction(async (client) => {
    const maxP = (await client.query('SELECT COALESCE(MAX(id), 0) AS max FROM products')).rows[0].max
    const prodId = Number(maxP) + 1

    const prod = (await client.query(`
      INSERT INTO products (id, sku, name, slug, category_name, group_name, price, stock_quantity, image_main, has_variants, variant_config)
      VALUES ($1, 'RING-LTD', 'Limited Edition Smart Ring', 'limited-smart-ring', 'Wearables', 'trending', 8000, 2, '/images/p3.jpg', true, 'size')
      RETURNING id
    `, [prodId])).rows[0]

    const maxV = (await client.query('SELECT COALESCE(MAX(id), 0) AS max FROM product_variants')).rows[0].max
    const vId = Number(maxV) + 1

    const variant = (await client.query(`
      INSERT INTO product_variants (id, product_id, sku, title, size_value, price, stock_quantity, is_active)
      VALUES ($1, $2, 'RING-LTD-SZ9', 'Size 9', '9', 8000, 2, true)
      RETURNING id, title, stock_quantity
    `, [vId, prod.id])).rows[0]

    return { prodId: prod.id, varId: variant.id }
  })

  // 4 concurrent requests try to buy 1 unit each. Only 2 should succeed!
  const concurrentOrders = [1, 2, 3, 4].map(buyerNum =>
    processCheckout({
      customer: { name: `Concurrent Buyer ${buyerNum}`, mobile: `0300999999${buyerNum}`, city: 'Karachi', address: 'Clifton' },
      items: [{ productId: flashProduct.prodId, variantId: flashProduct.varId, qty: 1 }],
      deliveryMethod: 'Standard',
      paymentMethod: 'Cash on Delivery',
    }).then(res => ({ success: true, orderId: res.id }))
      .catch(err => ({ success: false, error: err.message }))
  )

  const results = await Promise.all(concurrentOrders)
  const successfulCount = results.filter(r => r.success).length
  const failedCount = results.filter(r => !r.success).length

  console.log(`Concurrent results: ${successfulCount} succeeded, ${failedCount} rejected.`)
  assert.strictEqual(successfulCount, 2, 'Exactly 2 orders must succeed for stock of 2')
  assert.strictEqual(failedCount, 2, 'Exactly 2 orders must be rejected when stock depletes')

  const finalStock = (await pool.query('SELECT stock_quantity FROM product_variants WHERE id = $1', [flashProduct.varId])).rows[0].stock_quantity
  assert.strictEqual(finalStock, 0, 'Final variant stock must be exactly 0 (no negative stock)')
  console.log('✓ TEST 6 PASSED: Row-locking prevented overselling; exact concurrency isolation guaranteed.')

  // ── TEST 7: DYNAMIC MULTI-OPTION RESOLUTION & EXISTENCE CONTRACT ──
  console.log('\n--- TEST 7: DYNAMIC MULTI-OPTION RESOLUTION & SELECTIVE EXISTENCE ---')
  const multiProduct = await transaction(async (client) => {
    const maxP = (await client.query('SELECT COALESCE(MAX(id), 0) AS max FROM products')).rows[0].max
    const prodId = Number(maxP) + 1

    await client.query(`
      INSERT INTO products (id, sku, name, slug, category_name, group_name, price, stock_quantity, image_main, has_variants, variant_config)
      VALUES ($1, 'PHONE-MULTI', 'Pro Phone 16', 'pro-phone-16', 'Phones', 'trending', 120000, 10, '/images/phone.jpg', true, 'custom')
    `, [prodId])

    // Color: Black, Silver; Storage: 128GB, 256GB
    // Admin creates 128GB Black (Active), 256GB Black (Active), 128GB Silver (Active), but unchecks 256GB Silver (Inactive/Non-existent)
    const maxV = (await client.query('SELECT COALESCE(MAX(id), 0) AS max FROM product_variants')).rows[0].max
    let nextV = Number(maxV)

    const v1 = (await client.query(`
      INSERT INTO product_variants (id, product_id, sku, title, color_value, size_value, options, price, stock_quantity, is_active)
      VALUES ($1, $2, 'PH-BLK-128', 'Black / 128GB', 'Black', '128GB', '{"Color":"Black","Storage":"128GB"}', 120000, 5, true)
      RETURNING id, title, price, stock_quantity, is_active
    `, [++nextV, prodId])).rows[0]

    const v2 = (await client.query(`
      INSERT INTO product_variants (id, product_id, sku, title, color_value, size_value, options, price, stock_quantity, is_active)
      VALUES ($1, $2, 'PH-BLK-256', 'Black / 256GB', 'Black', '256GB', '{"Color":"Black","Storage":"256GB"}', 140000, 5, true)
      RETURNING id, title, price, stock_quantity, is_active
    `, [++nextV, prodId])).rows[0]

    const v3 = (await client.query(`
      INSERT INTO product_variants (id, product_id, sku, title, color_value, size_value, options, price, stock_quantity, is_active)
      VALUES ($1, $2, 'PH-SLV-128', 'Silver / 128GB', 'Silver', '128GB', '{"Color":"Silver","Storage":"128GB"}', 120000, 3, true)
      RETURNING id, title, price, stock_quantity, is_active
    `, [++nextV, prodId])).rows[0]

    const v4 = (await client.query(`
      INSERT INTO product_variants (id, product_id, sku, title, color_value, size_value, options, price, stock_quantity, is_active)
      VALUES ($1, $2, 'PH-SLV-256', 'Silver / 256GB', 'Silver', '256GB', '{"Color":"Silver","Storage":"256GB"}', 140000, 0, false)
      RETURNING id, title, price, stock_quantity, is_active
    `, [++nextV, prodId])).rows[0]

    return { id: prodId, v1, v2, v3, v4 }
  })

  // Order active combination Silver / 128GB
  const orderSilver128 = await processCheckout({
    customer: { name: 'Tech Lover', mobile: '03451234567', city: 'Rawalpindi', address: 'Saddar' },
    items: [{ productId: multiProduct.id, variantId: multiProduct.v3.id, qty: 1 }],
    deliveryMethod: 'Standard',
    paymentMethod: 'Cash on Delivery',
  })
  assert.strictEqual(orderSilver128.order.subtotal, 120000, 'Subtotal should match Silver 128GB price')
  assert.strictEqual(orderSilver128.order.items[0].variantTitle, 'Silver / 128GB')

  // Attempting to checkout inactive Silver / 256GB must fail
  let silver256Rejected = false
  try {
    await processCheckout({
      customer: { name: 'Fails', mobile: '03450000000', city: 'Lahore', address: 'DHA' },
      items: [{ productId: multiProduct.id, variantId: multiProduct.v4.id, qty: 1 }],
      deliveryMethod: 'Standard',
      paymentMethod: 'Cash on Delivery',
    })
  } catch (err) {
    silver256Rejected = true
  }
  assert(silver256Rejected, 'Unchecked/inactive combination (Silver 256GB) must be rejected by backend')
  console.log('✓ TEST 7 PASSED: Arbitrary dynamic options (Storage) and selective existence enforced.')

  // ── TEST 8: PRODUCT CARD HOVER ACTION BUTTONS CSS VERIFICATION ──
  console.log('\n--- TEST 8: PRODUCT CARD HOVER ACTION BUTTONS CSS VERIFICATION ---')
  const fs = await import('fs')
  const stylesCss = fs.readFileSync('src/styles.css', 'utf-8')
  assert(stylesCss.includes('@media (hover: hover) and (pointer: fine)'), 'Must contain desktop hover media query')
  assert(stylesCss.includes('.qg-card .qg-card-row1'), 'Must style .qg-card .qg-card-row1')
  assert(stylesCss.includes('opacity: 0;'), 'Desktop default must have opacity: 0')
  assert(stylesCss.includes('pointer-events: none;'), 'Desktop default must have pointer-events: none')
  assert(stylesCss.includes('.qg-card:hover .qg-card-row1'), 'Hover state must reveal buttons')
  assert(stylesCss.includes('.qg-card:focus-within .qg-card-row1'), 'Keyboard focus-within must reveal buttons')
  assert(stylesCss.includes('@media (hover: none), (pointer: coarse), (max-width: 768px)'), 'Mobile media query must be present')
  console.log('✓ TEST 8 PASSED: Product card action buttons hover, keyboard accessibility, and mobile overrides verified in CSS.')

  console.log('\n===============================================================')
  console.log('   ALL 8 PRODUCT VARIANTS & HOVER INTEGRATION TESTS PASSED!    ')
  console.log('===============================================================')
}

runVariantsTestSuite().catch(err => {
  console.error('\n[TEST FATAL]:', err)
  process.exit(1)
})
