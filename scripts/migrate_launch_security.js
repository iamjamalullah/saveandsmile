import dotenv from 'dotenv'
import pg from 'pg'

dotenv.config()
const { Client } = pg

async function run() {
  const client = new Client({ connectionString: process.env.DATABASE_URL })
  await client.connect()
  console.log('[MIGRATION] Connected to PostgreSQL. Applying launch readiness schema updates...')

  await client.query('BEGIN')

  try {
    // 1. Ensure revoked_tokens table exists
    await client.query(`
      CREATE TABLE IF NOT EXISTS revoked_tokens (
        token_hash VARCHAR(120) PRIMARY KEY,
        expires_at TIMESTAMPTZ NOT NULL,
        revoked_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
      )
    `)
    await client.query('CREATE INDEX IF NOT EXISTS idx_revoked_tokens_expires ON revoked_tokens(expires_at)')

    // 2. Enhance orders table with tax, invoice, and cancellation tracking
    await client.query(`
      ALTER TABLE orders
        ADD COLUMN IF NOT EXISTS tax_rate NUMERIC(5, 2) NOT NULL DEFAULT 0,
        ADD COLUMN IF NOT EXISTS tax_amount NUMERIC(12, 2) NOT NULL DEFAULT 0,
        ADD COLUMN IF NOT EXISTS invoice_number VARCHAR(60),
        ADD COLUMN IF NOT EXISTS cancellation_reason TEXT,
        ADD COLUMN IF NOT EXISTS status_history JSONB DEFAULT '[]'::jsonb
    `)
    await client.query('CREATE INDEX IF NOT EXISTS idx_orders_invoice ON orders(invoice_number)')

    // Backfill invoice_number on existing orders if empty
    await client.query(`
      UPDATE orders
      SET invoice_number = 'INV-' || TO_CHAR(created_at, 'YYYYMMDD') || '-' || SUBSTRING(id FROM 8)
      WHERE invoice_number IS NULL
    `)

    // 3. Update store_settings defaults to Save & Smile
    await client.query(`
      UPDATE store_settings
      SET store_name = 'Save & Smile',
          email = 'info@saveandsmile.pk',
          phone = '03302760775',
          whatsapp = '923302760775',
          tagline = 'Pakistan Wholesale & Retail Store',
          address = 'Shop # G-40 - 41 Central Mall ground Floor Near Gul Plaza Saddar Karachi'
      WHERE id = 1 AND (email LIKE '%qadri%' OR store_name LIKE '%Qadri%')
    `)

    // 4. Update staff_accounts emails to Save & Smile domain
    await client.query(`
      UPDATE staff_accounts
      SET email = 'admin@saveandsmile.pk', updated_at = CURRENT_TIMESTAMP
      WHERE email = 'admin@qadrigadgets.pk'
    `)
    await client.query(`
      UPDATE staff_accounts
      SET email = 'manager@saveandsmile.pk', updated_at = CURRENT_TIMESTAMP
      WHERE email = 'manager@qadrigadgets.pk'
    `)

    // 5. Update brand in products from 'Qadri Select' to 'Save & Smile'
    const brandUpdateRes = await client.query(`
      UPDATE products
      SET brand = 'Save & Smile', updated_at = CURRENT_TIMESTAMP
      WHERE brand ILIKE '%qadri%'
    `)
    console.log(`[MIGRATION] Updated ${brandUpdateRes.rowCount} product(s) to brand 'Save & Smile'`)

    // 6. Clean sections content_json from obsolete competitor URLs
    const sectionsRes = await client.query("SELECT id, content_json FROM sections WHERE content_json LIKE '%qadrigadgets%'")
    for (const sec of sectionsRes.rows) {
      let content = typeof sec.content_json === 'string' ? JSON.parse(sec.content_json) : sec.content_json
      let jsonStr = JSON.stringify(content)
      // Replace image_text competitor banner with local placeholder
      jsonStr = jsonStr.replace(/https?:\/\/(?:www\.)?qadrigadgets\.pk\/images\/banners\/[a-zA-Z0-9._-]+\.webp/g, '/images/banner-placeholder.webp')
      // Replace builder backgrounds with empty string
      jsonStr = jsonStr.replace(/https?:\/\/(?:www\.)?qadrigadgets\.pk\/images\/builder_background\/[a-zA-Z0-9._-]+\.(?:png|jpg|webp)/g, '')
      // Replace any other competitor domain occurrences
      jsonStr = jsonStr.replace(/qadrigadgets\.pk/g, 'saveandsmile.pk')
      jsonStr = jsonStr.replace(/Qadri Gadgets/g, 'Save & Smile')
      jsonStr = jsonStr.replace(/Qadri Select/g, 'Save & Smile')

      await client.query('UPDATE sections SET content_json = $1 WHERE id = $2', [jsonStr, sec.id])
    }
    console.log(`[MIGRATION] Sanitized ${sectionsRes.rows.length} sections in PostgreSQL`)

    // 7. Clean up test customer records and test orders from PostgreSQL
    const delOrderItems = await client.query(`
      DELETE FROM order_items
      WHERE order_id IN (
        SELECT id FROM orders
        WHERE customer_name IN ('Price Tamperer', 'Double Clicker', 'E2E Test Customer', 'dsfdsfs', 'Single Test')
           OR customer_mobile IN ('03450000001', '03459999999', '5454545454', '03112233445')
      )
    `)
    const delOrders = await client.query(`
      DELETE FROM orders
      WHERE customer_name IN ('Price Tamperer', 'Double Clicker', 'E2E Test Customer', 'dsfdsfs', 'Single Test')
         OR customer_mobile IN ('03450000001', '03459999999', '5454545454', '03112233445')
    `)
    const delCustomers = await client.query(`
      DELETE FROM customers
      WHERE name IN ('Price Tamperer', 'Double Clicker', 'E2E Test Customer', 'dsfdsfs', 'Single Test')
         OR mobile IN ('03450000001', '03459999999', '5454545454', '03112233445')
    `)
    console.log(`[MIGRATION] Cleaned ${delOrders.rowCount} test order(s) and ${delCustomers.rowCount} test customer(s) from PostgreSQL`)

    await client.query('COMMIT')
    console.log('[MIGRATION] Launch readiness migrations committed successfully!')
  } catch (err) {
    await client.query('ROLLBACK')
    console.error('[MIGRATION FAILED - ROLLED BACK]:', err)
    process.exit(1)
  } finally {
    await client.end()
  }
}

run().catch(console.error)
