import 'dotenv/config'
import { query } from '../src/db/index.js'

async function clean() {
  await query("DELETE FROM order_items WHERE order_id LIKE 'GS-ORD-%' AND order_id NOT IN (SELECT id FROM orders WHERE customer_notes != '[SINGLE_TEST]' AND customer_notes != '[STAGING_LOAD_TEST]')")
  await query("DELETE FROM orders WHERE customer_notes IN ('[SINGLE_TEST]', '[STAGING_LOAD_TEST]') OR customer_name = 'Single Test'")
  await query("DELETE FROM customers WHERE mobile IN ('03112233445') OR email LIKE '%@staging-%'")
  await query("DELETE FROM products WHERE sku LIKE 'PERF-TEST-%' OR name LIKE '%[STAGING_LOAD_TEST]%'")
  console.log('Test orders cleaned up completely.')
  process.exit(0)
}

clean().catch(console.error)
