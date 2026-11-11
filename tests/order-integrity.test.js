import { runMigration } from '../migrate.js'
import { processCheckout } from '../src/services/orderService.js'
import { query } from '../src/db/index.js'

async function runTestSuite() {
  console.log('===============================================================')
  console.log('   TRANSACTIONAL INVENTORY & ORDER INTEGRITY TEST SUITE')
  console.log('===============================================================')

  // 1. Reset / Seed database from migration
  console.log('\n[SETUP] Initializing schema and migrating baseline data...')
  await runMigration()

  // 2. Inspect initial stock of target test product
  const initialProdRes = await query('SELECT id, name, price, stock_quantity FROM products WHERE id = 1')
  const initialProd = initialProdRes.rows[0]
  const initialStock = initialProd.stock_quantity
  console.log(`\n[BASELINE] Product #1 "${initialProd.name}" Initial Stock: ${initialStock}, Price: Rs. ${initialProd.price}`)

  // --------------------------------------------------------------------------
  // TEST 1: ATOMIC STOCK DECREMENT ON VALID ORDER
  // --------------------------------------------------------------------------
  console.log('\n--- TEST 1: ATOMIC STOCK DECREMENT ---')
  const order1 = await processCheckout({
    customer: {
      name: 'Ahmed Khan',
      mobile: '03001234567',
      city: 'Karachi',
      address: 'Plot 45, Gulshan-e-Iqbal Block 13D',
    },
    items: [
      { productId: 1, qty: 2 },
    ],
    deliveryMethod: 'Standard',
  })

  console.log(`Order created successfully: ${order1.order.id}`)
  console.log(`Subtotal: Rs. ${order1.order.subtotal} | Total: Rs. ${order1.order.total}`)

  const afterOrder1ProdRes = await query('SELECT stock_quantity FROM products WHERE id = 1')
  const stockAfterOrder1 = afterOrder1ProdRes.rows[0].stock_quantity
  console.log(`Stock after ordering 2 units: ${stockAfterOrder1}`)

  if (stockAfterOrder1 === initialStock - 2) {
    console.log('✓ TEST 1 PASSED: Stock decremented atomically by exact quantity (2).')
  } else {
    throw new Error(`TEST 1 FAILED: Expected stock ${initialStock - 2}, got ${stockAfterOrder1}`)
  }

  // --------------------------------------------------------------------------
  // TEST 2: SAFE ROLLBACK ON INSUFFICIENT STOCK
  // --------------------------------------------------------------------------
  console.log('\n--- TEST 2: SAFE ROLLBACK ON INSUFFICIENT STOCK ---')
  let caughtError = null
  try {
    await processCheckout({
      customer: {
        name: 'Oversell Tester',
        mobile: '03009999999',
        city: 'Lahore',
        address: 'DHA Phase 5',
      },
      items: [
        { productId: 1, qty: 99999 }, // Far exceeds available stock
      ],
    })
  } catch (err) {
    caughtError = err
    console.log(`Expected rejection caught: "${err.message}"`)
  }

  if (!caughtError) {
    throw new Error('TEST 2 FAILED: Order for 99999 items was improperly approved!')
  }

  const afterRollbackProdRes = await query('SELECT stock_quantity FROM products WHERE id = 1')
  const stockAfterRollback = afterRollbackProdRes.rows[0].stock_quantity
  console.log(`Stock after rolled-back order: ${stockAfterRollback}`)

  if (stockAfterRollback === stockAfterOrder1) {
    console.log('✓ TEST 2 PASSED: Stock remained completely untouched after failed transaction rollback.')
  } else {
    throw new Error(`TEST 2 FAILED: Stock corrupted! Expected ${stockAfterOrder1}, got ${stockAfterRollback}`)
  }

  // --------------------------------------------------------------------------
  // TEST 3: MULTI-ITEM ORDER WITH ONE DEFECTIVE ITEM (TRANSACTION ATOMICITY)
  // --------------------------------------------------------------------------
  console.log('\n--- TEST 3: MULTI-ITEM TRANSACTION ATOMICITY ---')
  const prod2Res = await query('SELECT id, stock_quantity FROM products WHERE id = 2')
  const stockProd2Initial = prod2Res.rows[0].stock_quantity

  let multiItemError = null
  try {
    await processCheckout({
      customer: {
        name: 'Multi Item Tester',
        mobile: '03112223334',
        city: 'Islamabad',
        address: 'F-7/2',
      },
      items: [
        { productId: 2, qty: 1 }, // Valid item
        { productId: 1, qty: 99999 }, // Invalid item
      ],
    })
  } catch (err) {
    multiItemError = err
    console.log(`Multi-item transaction failed as expected: "${err.message}"`)
  }

  if (!multiItemError) {
    throw new Error('TEST 3 FAILED: Transaction should have aborted!')
  }

  const prod2AfterRes = await query('SELECT stock_quantity FROM products WHERE id = 2')
  const prod1AfterRes = await query('SELECT stock_quantity FROM products WHERE id = 1')

  if (prod2AfterRes.rows[0].stock_quantity === stockProd2Initial &&
      prod1AfterRes.rows[0].stock_quantity === stockAfterOrder1) {
    console.log('✓ TEST 3 PASSED: Neither product 1 nor product 2 was decremented because transaction rolled back atomically.')
  } else {
    throw new Error('TEST 3 FAILED: Partial decrement occurred! Transaction is not atomic.')
  }

  // --------------------------------------------------------------------------
  // TEST 4: IDEMPOTENCY KEY DEDUPLICATION
  // --------------------------------------------------------------------------
  console.log('\n--- TEST 4: IDEMPOTENCY KEY DEDUPLICATION ---')
  const testIdempotencyKey = 'idem-req-' + Date.now()
  const currentProd1Stock = prod1AfterRes.rows[0].stock_quantity

  console.log(`Submitting first checkout request with Idempotency-Key: ${testIdempotencyKey}`)
  const req1 = await processCheckout({
    customer: {
      name: 'Idempotency Tester',
      mobile: '03215556677',
      city: 'Karachi',
      address: 'Clifton Block 2',
    },
    items: [
      { productId: 1, qty: 1 },
    ],
    idempotencyKey: testIdempotencyKey,
  })

  console.log(`First request returned Order ID: ${req1.order.id}`)

  console.log(`Submitting identical retry request with same Idempotency-Key...`)
  const req2 = await processCheckout({
    customer: {
      name: 'Idempotency Tester',
      mobile: '03215556677',
      city: 'Karachi',
      address: 'Clifton Block 2',
    },
    items: [
      { productId: 1, qty: 1 },
    ],
    idempotencyKey: testIdempotencyKey,
  })

  console.log(`Second request returned Order ID: ${req2.order.id}`)

  if (req1.order.id === req2.order.id) {
    console.log('✓ Idempotent response matched original order ID.')
  } else {
    throw new Error(`TEST 4 FAILED: Different order IDs returned! ${req1.order.id} vs ${req2.order.id}`)
  }

  const stockAfterIdem = (await query('SELECT stock_quantity FROM products WHERE id = 1')).rows[0].stock_quantity
  console.log(`Stock after original + retry request: ${stockAfterIdem} (Expected: ${currentProd1Stock - 1})`)

  if (stockAfterIdem === currentProd1Stock - 1) {
    console.log('✓ TEST 4 PASSED: Stock was only decremented ONCE despite multiple duplicate requests.')
  } else {
    throw new Error(`TEST 4 FAILED: Stock decremented more than once: ${stockAfterIdem}`)
  }

  // --------------------------------------------------------------------------
  // TEST 5: SIMULTANEOUS CONCURRENT PURCHASES (PREVENT OVERSELLING)
  // --------------------------------------------------------------------------
  console.log('\n--- TEST 5: CONCURRENT OVERSELLING PREVENTION ---')
  // Set product 3 stock to exactly 5 units
  await query('UPDATE products SET stock_quantity = 5 WHERE id = 3')
  console.log('Set Product #3 stock to exactly 5 units.')

  // Launch 10 simultaneous checkout promises for 1 unit each
  console.log('Simulating 10 simultaneous concurrent checkout requests for 1 unit each...')
  const concurrentPromises = Array.from({ length: 10 }, (_, i) => {
    return processCheckout({
      customer: {
        name: `Concurrent User ${i + 1}`,
        mobile: `0345000000${i}`,
        city: 'Karachi',
        address: `Street ${i + 1}`,
      },
      items: [{ productId: 3, qty: 1 }],
    })
      .then(res => ({ success: true, orderId: res.order.id }))
      .catch(err => ({ success: false, error: err.message }))
  })

  const results = await Promise.all(concurrentPromises)
  const successfulOrders = results.filter(r => r.success)
  const rejectedOrders = results.filter(r => !r.success)

  console.log(`Results: ${successfulOrders.length} succeeded, ${rejectedOrders.length} rejected.`)
  if (rejectedOrders.length > 0) {
    console.log('Sample error:', rejectedOrders[0].error)
  }

  const finalProd3Stock = (await query('SELECT stock_quantity FROM products WHERE id = 3')).rows[0].stock_quantity
  console.log(`Final Product #3 Stock: ${finalProd3Stock}`)

  if (successfulOrders.length === 5 && rejectedOrders.length === 5 && finalProd3Stock === 0) {
    console.log('✓ TEST 5 PASSED: Exactly 5 orders succeeded, 5 were safely rejected, and stock reached exactly 0 without negative inventory or overselling!')
  } else {
    throw new Error(`TEST 5 FAILED: Expected 5 successes and stock 0, but got ${successfulOrders.length} successes and stock ${finalProd3Stock}`)
  }

  console.log('\n===============================================================')
  console.log('   ALL INVENTORY & ORDER INTEGRITY TESTS PASSED SUCCESSFULLY!  ')
  console.log('===============================================================')
}

runTestSuite()
  .then(() => process.exit(0))
  .catch(err => {
    console.error('\n[TEST FATAL]:', err)
    process.exit(1)
  })
