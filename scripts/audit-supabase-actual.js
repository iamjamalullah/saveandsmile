import 'dotenv/config'
import pg from 'pg'

const { Pool } = pg

async function auditActualSupabaseTables() {
  console.log('=== AUDITING ACTUAL SUPABASE DATABASE AFTER TRANSACTION COMMIT ===\n')

  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
    connectionTimeoutMillis: 15000,
  })

  const tables = [
    'categories',
    'products',
    'product_options',
    'product_option_values',
    'product_variants',
    'product_variant_images',
    'customers',
    'orders',
    'order_items',
    'coupons',
    'reviews',
    'contact_inquiries',
    'store_settings',
    'hero_slides',
    'sections',
    'homepage_draft',
    'homepage_section_versions',
    'watch_shop',
    'staff_accounts',
    'idempotency_keys',
    'revoked_tokens',
  ]

  const results = []
  let total = 0

  for (const t of tables) {
    try {
      const res = await pool.query(`SELECT COUNT(*) as cnt FROM ${t}`)
      const cnt = parseInt(res.rows[0].cnt)
      total += cnt
      results.push({ Table: t, 'Actual In Supabase': cnt })
    } catch (err) {
      results.push({ Table: t, 'Actual In Supabase': `ERROR: ${err.message}` })
    }
  }

  console.table(results)
  console.log(`TOTAL RECORDS IN SUPABASE: ${total}`)

  // Verify Product 907
  console.log('\n--- VERIFYING PRODUCT 907 VARIANTS IN SUPABASE ---')
  try {
    const vRes = await pool.query('SELECT * FROM product_variants WHERE product_id = 907')
    vRes.rows.forEach(r => console.log(`Variant ID ${r.id}: SKU=${r.sku} | Title=${r.title} | Price=${r.price} | Stock=${r.stock_quantity}`))
  } catch (err) {
    console.error('Variant query error:', err.message)
  }

  // Verify Order totals
  console.log('\n--- VERIFYING ORDERS GRAND TOTAL IN SUPABASE ---')
  try {
    const oRes = await pool.query('SELECT SUM(total) as grand_total FROM orders')
    console.log(`Grand Total: Rs. ${oRes.rows[0].grand_total}`)
  } catch (err) {
    console.error('Order total error:', err.message)
  }

  // Verify Reviews
  console.log('\n--- VERIFYING REVIEWS IN SUPABASE ---')
  try {
    const appRes = await pool.query("SELECT COUNT(*) as cnt FROM reviews WHERE status = 'approved'")
    const pendRes = await pool.query("SELECT COUNT(*) as cnt FROM reviews WHERE status = 'pending'")
    console.log(`Approved: ${appRes.rows[0].cnt} | Pending: ${pendRes.rows[0].cnt}`)
  } catch (err) {
    console.error('Review error:', err.message)
  }

  await pool.end()
}

auditActualSupabaseTables().catch(console.error)
