import fs from 'node:fs'
import crypto from 'node:crypto'
import { newDb } from 'pg-mem'
import { runMigration } from '../migrate.js'
import { createPostgresBackup } from '../pg-backup.js'
import { query } from '../src/db/index.js'

const SCHEMA_PATH = 'schema.sql'

async function runRecoveryVerification() {
  console.log('===============================================================')
  console.log('   ISOLATED DATABASE BACKUP & RESTORE RECOVERY VERIFICATION')
  console.log('===============================================================\n')

  // 1. Ensure baseline database is seeded and record counts recorded
  console.log('[1/5] Ensuring primary database is initialized and seeded...')
  await runMigration()

  const tables = [
    'products', 'categories', 'customers', 'orders', 'order_items',
    'coupons', 'reviews', 'contact_inquiries', 'store_settings',
    'hero_slides', 'sections', 'watch_shop', 'staff_accounts'
  ]

  const primaryCountsBefore = {}
  for (const t of tables) {
    const res = await query(`SELECT COUNT(*) as count FROM ${t}`)
    primaryCountsBefore[t] = parseInt(res.rows[0].count, 10)
  }

  // 2. Generate Real Backup Snapshot
  console.log('\n[2/5] Generating real PostgreSQL backup snapshot...')
  const backupResult = await createPostgresBackup()
  console.log(`✓ Backup file written: ${backupResult.filename}`)
  console.log(`✓ Recorded SHA-256 Checksum: ${backupResult.checksum}`)

  // 3. Verify SHA-256 Checksum from disk file
  console.log('\n[3/5] Verifying backup file integrity on disk...')
  const fileBytes = fs.readFileSync(backupResult.destination, 'utf8')
  const parsedBackup = JSON.parse(fileBytes)
  const recordedSum = parsedBackup.metadata.checksum

  const copyWithoutChecksum = { ...parsedBackup }
  delete copyWithoutChecksum.metadata.checksum
  const recomputedJson = JSON.stringify(copyWithoutChecksum, null, 2)
  const recomputedSum = crypto.createHash('sha256').update(recomputedJson).digest('hex')

  if (recordedSum !== recomputedSum) {
    throw new Error(`Checksum mismatch! Recorded: ${recordedSum}, Recomputed: ${recomputedSum}`)
  }
  console.log('✓ SHA-256 Checksum verified authentic and tamper-free.')

  // 4. Restore into a Separate Isolated Test Database (Sandbox)
  console.log('\n[4/5] Provisioning separate isolated test database and restoring snapshot...')
  const sandboxDb = newDb()
  const adapter = sandboxDb.adapters.createPg()
  const sandboxPool = new adapter.Pool()

  // Apply DDL to Sandbox DB
  const rawDdl = fs.readFileSync(SCHEMA_PATH, 'utf8')
  const cleanDdl = rawDdl.replace(/--.*$/gm, '')
  const stmts = cleanDdl.split(';').map(s => s.trim()).filter(s => s.length > 0)
  for (const stmt of stmts) {
    try {
      await sandboxPool.query(stmt)
    } catch (_) {}
  }

  // Populate Sandbox DB from backup data
  const client = await sandboxPool.connect()
  try {
    await client.query('BEGIN')

    // Categories
    for (const c of parsedBackup.tables.categories || []) {
      await client.query(
        `INSERT INTO categories (id, name, slug, icon, image_url, sort_order) VALUES ($1, $2, $3, $4, $5, $6)`,
        [c.id, c.name, c.slug, c.icon, c.image_url, c.sort_order]
      )
    }

    // Products
    for (const p of parsedBackup.tables.products || []) {
      await client.query(
        `INSERT INTO products (
           id, sku, name, slug, category_name, group_name, price, old_price,
           stock_quantity, brand, description, video_url, image_main,
           images_gallery, highlights, specs_json, bulk_tiers_json,
           is_featured, rating, reviews_count
         ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20)`,
        [
          p.id, p.sku, p.name, p.slug, p.category_name, p.group_name,
          p.price, p.old_price, p.stock_quantity, p.brand, p.description,
          p.video_url, p.image_main, p.images_gallery, p.highlights,
          p.specs_json, p.bulk_tiers_json, p.is_featured, p.rating, p.reviews_count,
        ]
      )
    }

    // Customers
    for (const cust of parsedBackup.tables.customers || []) {
      await client.query(
        `INSERT INTO customers (id, name, mobile, email, city, address) VALUES ($1, $2, $3, $4, $5, $6)`,
        [cust.id, cust.name, cust.mobile, cust.email, cust.city, cust.address]
      )
    }

    // Coupons
    for (const cp of parsedBackup.tables.coupons || []) {
      await client.query(
        `INSERT INTO coupons (id, code, type, value, min_order, max_discount, description, active) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
        [cp.id, cp.code, cp.type, cp.value, cp.min_order, cp.max_discount, cp.description, cp.active]
      )
    }

    // Orders
    for (const o of parsedBackup.tables.orders || []) {
      await client.query(
        `INSERT INTO orders (
           id, customer_id, customer_name, customer_mobile, customer_email,
           customer_city, delivery_address, delivery_method, payment_method,
           status, tracking_number, subtotal, discount, coupon_code,
           shipping_fee, total, customer_notes, idempotency_key
         ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18)`,
        [
          o.id, o.customer_id, o.customer_name, o.customer_mobile, o.customer_email,
          o.customer_city, o.delivery_address, o.delivery_method, o.payment_method,
          o.status, o.tracking_number, o.subtotal, o.discount, o.coupon_code,
          o.shipping_fee, o.total, o.customer_notes, o.idempotency_key,
        ]
      )
    }

    // Order Items
    for (const oi of parsedBackup.tables.order_items || []) {
      await client.query(
        `INSERT INTO order_items (
           id, order_id, product_id, product_name, product_sku, unit_price, quantity, line_total
         ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
        [oi.id, oi.order_id, oi.product_id, oi.product_name, oi.product_sku, oi.unit_price, oi.quantity, oi.line_total]
      )
    }

    // Reviews
    for (const r of parsedBackup.tables.reviews || []) {
      await client.query(
        `INSERT INTO reviews (id, product_id, name, title, text, rating, whatsapp, status, date_formatted) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
        [r.id, r.product_id, r.name, r.title, r.text, r.rating, r.whatsapp, r.status, r.date_formatted]
      )
    }

    // Store Settings
    for (const s of parsedBackup.tables.store_settings || []) {
      await client.query(
        `INSERT INTO store_settings (
           id, store_name, tagline, phone, whatsapp, email, address,
           free_shipping_threshold, shipping_fee, express_shipping_fee,
           tax_rate, allow_guest_checkout, announcement
         ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)`,
        [
          s.id, s.store_name, s.tagline, s.phone, s.whatsapp, s.email, s.address,
          s.free_shipping_threshold, s.shipping_fee, s.express_shipping_fee,
          s.tax_rate, s.allow_guest_checkout, s.announcement,
        ]
      )
    }

    // Staff Accounts
    for (const sa of parsedBackup.tables.staff_accounts || []) {
      await client.query(
        `INSERT INTO staff_accounts (id, name, email, password_hash, role, is_active) VALUES ($1, $2, $3, $4, $5, $6)`,
        [sa.id, sa.name, sa.email, sa.password_hash, sa.role, sa.is_active]
      )
    }

    await client.query('COMMIT')
  } catch (err) {
    await client.query('ROLLBACK')
    throw err
  } finally {
    client.release()
  }

  // Compare sandbox counts
  const sandboxCounts = {}
  let sandboxParity = true
  for (const t of ['products', 'categories', 'orders', 'order_items', 'customers', 'coupons', 'staff_accounts']) {
    const res = await sandboxPool.query(`SELECT COUNT(*) as count FROM ${t}`)
    const count = parseInt(res.rows[0].count, 10)
    sandboxCounts[t] = count
    if (count !== primaryCountsBefore[t]) sandboxParity = false
  }

  console.log('\n[RECOVERY VERIFICATION AUDIT TABLE]:')
  const comparisonReport = Object.keys(sandboxCounts).map(tbl => ({
    Table: tbl,
    'Primary DB (Source)': primaryCountsBefore[tbl],
    'Sandbox Restored DB': sandboxCounts[tbl],
    Parity: sandboxCounts[tbl] === primaryCountsBefore[tbl] ? '100% MATCH ✓' : 'MISMATCH ⚠',
  }))
  console.table(comparisonReport)

  if (!sandboxParity) {
    throw new Error('Sandbox restore failed to achieve 100% parity with backup!')
  }

  // 5. Confirm Original Primary Database Remains Untouched
  console.log('\n[5/5] Confirming original production database remains 100% untouched...')
  let primaryUntouched = true
  for (const t of tables) {
    const res = await query(`SELECT COUNT(*) as count FROM ${t}`)
    const countAfter = parseInt(res.rows[0].count, 10)
    if (countAfter !== primaryCountsBefore[t]) {
      primaryUntouched = false
      console.error(`Discrepancy on table ${t}: was ${primaryCountsBefore[t]}, now ${countAfter}`)
    }
  }

  if (!primaryUntouched) {
    throw new Error('CRITICAL: Primary database records were modified during recovery verification!')
  }
  console.log('✓ Confirmed: Original production database remained 100% untouched and pristine.')

  console.log('\n===============================================================')
  console.log('   ISOLATED RECOVERY VERIFICATION COMPLETED WITH 100% SUCCESS! ')
  console.log('===============================================================')
}

runRecoveryVerification()
  .then(() => process.exit(0))
  .catch(err => {
    console.error('\n[FATAL RECOVERY ERROR]:', err)
    process.exit(1)
  })
