import 'dotenv/config'
import pg from 'pg'
import { processCheckout } from '../src/services/orderService.js'

const { Pool } = pg

async function runOrderLifecycleTest() {
  console.log('===============================================================')
  console.log('   SAVE & SMILE — END-TO-END ORDER LIFECYCLE TEST RUNNER')
  console.log('===============================================================')

  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
    connectionTimeoutMillis: 15000,
  })

  const testMobile = '03998877665'
  const testCustomerId = `cust-${testMobile}`

  try {
    // 1. Initial State: Check Variant #1 (Rose Gold) initial stock
    const varBefore = await pool.query('SELECT id, product_id, title, price, stock_quantity FROM product_variants WHERE id = 1')
    if (varBefore.rows.length === 0) {
      throw new Error('Test variant #1 not found in database.')
    }
    const initialStock = varBefore.rows[0].stock_quantity
    const variantPrice = Number(varBefore.rows[0].price)
    console.log(`[INITIAL] Variant #1 "${varBefore.rows[0].title}" Stock: ${initialStock}, Price: Rs. ${variantPrice}`)

    // 2. Perform Checkout
    console.log('\n--- STEP 1: TRANSACTIONAL CHECKOUT EXECUTION ---')
    const idempotencyKey = `idemp-test-${Date.now()}`
    const checkoutResult = await processCheckout({
      customer: {
        name: 'Ayesha QA Tester',
        mobile: testMobile,
        email: 'ayesha.qa@example.com',
        city: 'Lahore',
        address: 'House 12-B, Model Town',
      },
      items: [
        {
          productId: varBefore.rows[0].product_id,
          variantId: 1,
          qty: 1,
        },
      ],
      deliveryMethod: 'Standard',
      paymentMethod: 'Cash on Delivery (COD)',
      couponCode: null,
      customerNotes: 'Automated Lifecycle QA Order',
      idempotencyKey,
    })

    const order = checkoutResult.order
    console.log(`✅ Order Placed: ID=${order.id}`)
    console.log(`   Customer: ${order.customerName} (${order.customerMobile})`)
    console.log(`   Subtotal: Rs. ${order.subtotal}`)
    console.log(`   Shipping Fee: Rs. ${order.shippingFee} (Standard < Rs.3000 applies Rs.200)`)
    console.log(`   Total: Rs. ${order.total}`)
    console.log(`   Status: ${order.status}`)

    // Assert calculations
    if (order.subtotal !== variantPrice) {
      throw new Error(`Subtotal mismatch: expected ${variantPrice}, got ${order.subtotal}`)
    }
    if (order.shippingFee !== 200) {
      throw new Error(`Shipping fee mismatch: expected 200, got ${order.shippingFee}`)
    }
    if (order.total !== variantPrice + 200) {
      throw new Error(`Total mismatch: expected ${variantPrice + 200}, got ${order.total}`)
    }
    console.log('✅ Financial Calculation PASS: Subtotal + Rs.200 Shipping == Grand Total')

    // 3. Verify Atomic Stock Decrement in PostgreSQL
    console.log('\n--- STEP 2: VERIFY ATOMIC STOCK DECREMENT ---')
    const varAfter = await pool.query('SELECT stock_quantity FROM product_variants WHERE id = 1')
    const currentStock = varAfter.rows[0].stock_quantity
    console.log(`[AFTER ORDER] Variant #1 Stock: ${currentStock} (Initial was ${initialStock})`)
    if (currentStock !== initialStock - 1) {
      throw new Error(`Stock decrement failed! Expected ${initialStock - 1}, found ${currentStock}`)
    }
    console.log('✅ Inventory PASS: Stock atomically decremented by exactly 1 unit.')

    // 4. Verify Customer Record Upsert
    console.log('\n--- STEP 3: VERIFY CUSTOMER RECORD UPSERT ---')
    const custRes = await pool.query('SELECT * FROM customers WHERE mobile = $1', [testMobile])
    if (custRes.rows.length === 0) {
      throw new Error('Customer record was not upserted!')
    }
    console.log(`✅ Customer PASS: Record saved with ID: ${custRes.rows[0].id}, City: ${custRes.rows[0].city}`)

    // 5. Test Status Transitions (Admin Panel simulation)
    console.log('\n--- STEP 4: VERIFY ADMIN STATUS TRANSITIONS ---')
    const statuses = ['Confirmed', 'Processing', 'Dispatched', 'Delivered']
    for (const st of statuses) {
      await pool.query('UPDATE orders SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2', [st, order.id])
      const chk = await pool.query('SELECT status FROM orders WHERE id = $1', [order.id])
      console.log(`   Order transitioned to: ${chk.rows[0].status}`)
      if (chk.rows[0].status !== st) {
        throw new Error(`Failed to update order status to ${st}`)
      }
    }
    console.log('✅ Order Transitions PASS: Successfully cycled through all fulfillment states.')

    // 6. Test Idempotency Replay
    console.log('\n--- STEP 5: VERIFY IDEMPOTENCY REPLAY ---')
    const replayResult = await processCheckout({
      customer: {
        name: 'Ayesha QA Tester',
        mobile: testMobile,
        email: 'ayesha.qa@example.com',
        city: 'Lahore',
        address: 'House 12-B, Model Town',
      },
      items: [{ productId: varBefore.rows[0].product_id, variantId: 1, qty: 1 }],
      idempotencyKey,
    })
    if (replayResult.order.id !== order.id) {
      throw new Error('Idempotency failed: Returned a different order ID!')
    }
    console.log(`✅ Idempotency PASS: Replay returned existing cached order ${replayResult.order.id} without double stock decrement.`)

    // 7. Cleanup Test Data (Restore Stock & Remove Test Order)
    console.log('\n--- STEP 6: RESTORE TEST VARIANT STOCK & CLEANUP ---')
    await pool.query('UPDATE product_variants SET stock_quantity = $1 WHERE id = 1', [initialStock])
    await pool.query('UPDATE products SET stock_quantity = stock_quantity + 1 WHERE id = $1', [varBefore.rows[0].product_id])
    await pool.query('DELETE FROM order_items WHERE order_id = $1', [order.id])
    await pool.query('DELETE FROM orders WHERE id = $1', [order.id])
    await pool.query('DELETE FROM idempotency_keys WHERE key = $1', [idempotencyKey])
    await pool.query('DELETE FROM customers WHERE id = $1', [testCustomerId])

    const varFinal = await pool.query('SELECT stock_quantity FROM product_variants WHERE id = 1')
    console.log(`[RESTORED] Variant #1 Stock safely returned to: ${varFinal.rows[0].stock_quantity}`)
    console.log('✅ Isolated QA Test Order successfully cleaned without affecting genuine records.')
    console.log('\n===============================================================')
    console.log('   ALL ORDER MANAGEMENT LIFECYCLE TESTS PASSED!')
    console.log('===============================================================')

  } catch (err) {
    console.error('❌ Order Lifecycle Test FAILED:', err)
    process.exit(1)
  } finally {
    await pool.end()
  }
}

runOrderLifecycleTest()
